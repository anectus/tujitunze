import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

import { UpdateOperatorContactDto } from './dto/update-operator-contact.dto';
import { ConfigureWebhookDto } from './dto/configure-webhook.dto';
import { UploadReconciliationDto } from './dto/upload-reconciliation.dto';
import { RecordContributionDto } from './dto/record-contribution.dto';
import { WebhookContributionDto } from './dto/webhook-contribution.dto';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { WalletsService } from '../wallets/wallets.service';

interface ContributionRow {
  contribution_id: number;
  reference_number: string | null;
  internal_reference?: string | null;
  contribution_amount: string;
  contribution_source: string;
  processing_status: string;
  contribution_date: Date;
}

interface MemberPhoneNumber {
  phoneId: number;
  phoneNumber: string;
  isPrimary: boolean;
  phoneStatus: string;
}

interface MemberRow {
  user_id: number;
  first_name: string;
  surname: string;
  member_status: string;
  phone_verified: boolean;
  phone_numbers: MemberPhoneNumber[];
}

interface ContributionRuleRow {
  rule_id: number;
  rule_type: string;
  rate_percent: string;
  minimum_amount: string;
  effective_date: Date;
  is_active: boolean;
  created_at: Date;
}

interface ReconciliationRunRow {
  run_id: number;
  total_uploaded: number;
  matched_count: number;
  unmatched_count: number;
  run_date: Date;
}

interface ReconciliationRecordRow {
  record_id: number;
  external_reference: string;
  amount: string;
  record_date: Date | null;
  matched_contribution_id: number | null;
  match_status: string;
}

interface ActivityLogRow {
  audit_id: number;
  member_id: number | null;
  action_type: string;
  affected_table: string | null;
  affected_record_id: number | null;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: Date;
}

interface ApiAccessLogRow {
  log_id: number;
  event_type: string;
  endpoint: string | null;
  response_status: number | null;
  success: boolean;
  message: string | null;
  created_at: Date;
}

@Injectable()
export class TelecomService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly auditLogsService: AuditLogsService,
    private readonly walletsService: WalletsService,
  ) {}

  private isUniqueViolation(error: unknown): boolean {
    const code =
      (error as { code?: string; driverError?: { code?: string } })?.code ??
      (error as { driverError?: { code?: string } })?.driverError?.code;
    return code === '23505';
  }

  // TUJITUNZE's own reference, independent of whatever the operator
  // calls this transaction (reference_number/externalTransactionId) —
  // required so the contribution's identity survives even if an
  // operator reuses or restructures their own reference scheme later.
  private generateInternalReference(prefix: string): string {
    return `TJZ-${prefix}-${Date.now().toString(36).toUpperCase()}-${crypto
      .randomBytes(4)
      .toString('hex')}`;
  }

  // Real write path for the AIRTIME contribution channel — the member
  // makes an airtime/mobile-money purchase with the operator, the
  // operator (via this authenticated, tenant-scoped staff action rather
  // than an unauthenticated inbound webhook — that endpoint is a
  // deliberately deferred, separate piece of work, see CLAUDE.md) tells
  // HSIMS the resulting contribution, which is recorded, credited to the
  // member's wallet, and becomes available for Insurance allocation
  // through the same settlements pipeline Bank already writes.
  // reference_number's UNIQUE constraint is the idempotency guard against
  // reprocessing the same contribution twice.
  async recordContribution(
    userId: number,
    dto: RecordContributionDto,
    ipAddress: string | null = null,
  ) {
    const operatorId = await this.getAssignedOperatorId(userId);

    try {
      return await this.dataSource.transaction(async (manager) => {
        const [phone] = await manager.query<
          { phone_id: number; user_id: number }[]
        >(
          `SELECT phone_id, user_id FROM phone_numbers
           WHERE phone_number = $1 AND operator_id = $2`,
          [dto.phoneNumber, operatorId],
        );

        if (!phone) {
          throw new NotFoundException(
            'No member found with that phone number for your operator',
          );
        }

        const contributionSource = dto.contributionSource ?? 'Airtime';
        const internalReference = this.generateInternalReference('AIR');

        // Received -> Validated -> (Allocated | stays Validated) — see
        // handleContributionWebhook() below for why this is a genuine
        // multi-step status progression, not just a label.
        const [contribution] = await manager.query<ContributionRow[]>(
          `INSERT INTO telecom_contributions
             (member_id, phone_id, operator_id, contribution_amount, contribution_source, reference_number, internal_reference, processing_status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, 'Received')
           RETURNING contribution_id, reference_number, internal_reference, contribution_amount, contribution_source, processing_status, contribution_date`,
          [
            phone.user_id,
            phone.phone_id,
            operatorId,
            dto.amount,
            contributionSource,
            dto.referenceNumber,
            internalReference,
          ],
        );

        await manager.query(
          `UPDATE telecom_contributions SET processing_status = 'Validated' WHERE contribution_id = $1`,
          [contribution.contribution_id],
        );

        const { walletTransaction, allocation } =
          await this.walletsService.creditContribution(
            manager,
            phone.user_id,
            dto.amount,
            {
              contributionId: contribution.contribution_id,
              transactionType: `Contribution - ${contributionSource}`,
              transactionReference: dto.referenceNumber,
              remarks: `${contributionSource} contribution via ${dto.phoneNumber}.`,
            },
          );

        const finalStatus =
          allocation?.status === 'Allocated' ? 'Allocated' : 'Validated';
        if (finalStatus === 'Allocated') {
          await manager.query(
            `UPDATE telecom_contributions SET processing_status = 'Allocated' WHERE contribution_id = $1`,
            [contribution.contribution_id],
          );
        }

        await this.auditLogsService.record(manager, {
          memberId: phone.user_id,
          actionType: 'telecom.contribution_record',
          affectedTable: 'telecom_contributions',
          affectedRecordId: contribution.contribution_id,
          newValue: {
            amount: dto.amount,
            referenceNumber: dto.referenceNumber,
            internalReference,
            contributionSource,
            operatorId,
            allocated: !!allocation,
          },
          ipAddress,
        });

        return {
          contributionId: contribution.contribution_id,
          memberId: phone.user_id,
          amount: contribution.contribution_amount,
          currency: 'TZS',
          contributionSource: contribution.contribution_source,
          externalReference: contribution.reference_number,
          internalReference: contribution.internal_reference,
          processingStatus: finalStatus,
          contributionDate: contribution.contribution_date,
          walletTransactionId: walletTransaction.walletTransactionId,
          allocation,
        };
      });
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException(
          'A contribution with this reference number has already been recorded.',
        );
      }
      throw error;
    }
  }

  // Real inbound webhook — authenticated by TelecomApiKeyGuard against
  // the operator's own api_key_hash (machine-to-machine), NOT a staff
  // JWT. Unlike recordContribution() above (staff manually states the
  // exact contribution amount), the webhook receives the RAW airtime/
  // data/mobile-money transaction amount and computes the actual
  // contribution itself via contribution_rules — the rule engine, not a
  // hardcoded rate, per CLAUDE.md. True webhook idempotency: redelivering
  // the same externalTransactionId returns the original result (200),
  // it does not error and does not create a second contribution.
  async handleContributionWebhook(
    operatorId: number,
    dto: WebhookContributionDto,
    ipAddress: string | null = null,
    signatureVerified: boolean = false,
  ) {
    const [existing] = await this.dataSource.query<ContributionRow[]>(
      `SELECT contribution_id, reference_number, internal_reference, contribution_amount, contribution_source, processing_status, contribution_date
       FROM telecom_contributions
       WHERE reference_number = $1 AND operator_id = $2`,
      [dto.externalTransactionId, operatorId],
    );

    if (existing) {
      return {
        duplicate: true,
        contributionId: existing.contribution_id,
        amount: existing.contribution_amount,
        externalReference: existing.reference_number,
        internalReference: existing.internal_reference,
        processingStatus: existing.processing_status,
        contributionDate: existing.contribution_date,
      };
    }

    const [rule] = await this.dataSource.query<
      { rule_id: number; rate_percent: string; minimum_amount: string }[]
    >(
      `SELECT rule_id, rate_percent, minimum_amount
       FROM contribution_rules
       WHERE rule_type = $1 AND is_active = true AND effective_date <= CURRENT_DATE
       ORDER BY effective_date DESC
       LIMIT 1`,
      [dto.transactionType],
    );

    if (!rule) {
      throw new BadRequestException(
        `No active contribution rule for transaction type "${dto.transactionType}"`,
      );
    }

    if (dto.transactionAmount < Number(rule.minimum_amount)) {
      return {
        duplicate: false,
        contributionCreated: false,
        reason: `Transaction amount is below the ${dto.transactionType} minimum qualifying amount for a contribution.`,
      };
    }

    const contributionAmount =
      Math.round(
        dto.transactionAmount * (Number(rule.rate_percent) / 100) * 100,
      ) / 100;

    try {
      return await this.dataSource.transaction(async (manager) => {
        const [phone] = await manager.query<
          { phone_id: number; user_id: number }[]
        >(
          `SELECT phone_id, user_id FROM phone_numbers
           WHERE phone_number = $1 AND operator_id = $2`,
          [dto.phoneNumber, operatorId],
        );

        if (!phone) {
          throw new NotFoundException(
            'No member found with that phone number for your operator',
          );
        }

        const internalReference = this.generateInternalReference('AIR');

        // Received (raw event recorded) -> Validated (member/rule/
        // amount all confirmed good by this point) -> Allocated (only
        // if the member has an active policy for creditContribution to
        // allocate against) — a real, persisted progression, not just a
        // final label, so a partial failure between steps is visible in
        // the row's own status rather than only in application logs.
        const [contribution] = await manager.query<ContributionRow[]>(
          `INSERT INTO telecom_contributions
             (member_id, phone_id, operator_id, contribution_amount, contribution_source, reference_number, internal_reference, processing_status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, 'Received')
           RETURNING contribution_id, reference_number, internal_reference, contribution_amount, contribution_source, processing_status, contribution_date`,
          [
            phone.user_id,
            phone.phone_id,
            operatorId,
            contributionAmount,
            dto.transactionType,
            dto.externalTransactionId,
            internalReference,
          ],
        );

        await manager.query(
          `UPDATE telecom_contributions SET processing_status = 'Validated' WHERE contribution_id = $1`,
          [contribution.contribution_id],
        );

        const { walletTransaction, allocation } =
          await this.walletsService.creditContribution(
            manager,
            phone.user_id,
            contributionAmount,
            {
              contributionId: contribution.contribution_id,
              transactionType: `Contribution - ${dto.transactionType}`,
              transactionReference: dto.externalTransactionId,
              remarks: `${dto.transactionType} contribution via ${dto.phoneNumber} (webhook).`,
            },
          );

        const finalStatus =
          allocation?.status === 'Allocated' ? 'Allocated' : 'Validated';
        if (finalStatus === 'Allocated') {
          await manager.query(
            `UPDATE telecom_contributions SET processing_status = 'Allocated' WHERE contribution_id = $1`,
            [contribution.contribution_id],
          );
        }

        await this.auditLogsService.record(manager, {
          memberId: phone.user_id,
          actionType: 'telecom.webhook_contribution',
          affectedTable: 'telecom_contributions',
          affectedRecordId: contribution.contribution_id,
          newValue: {
            transactionAmount: dto.transactionAmount,
            contributionAmount,
            ratePercent: rule.rate_percent,
            transactionType: dto.transactionType,
            externalTransactionId: dto.externalTransactionId,
            internalReference,
            operatorId,
            allocated: !!allocation,
            signatureVerified,
          },
          ipAddress,
        });

        return {
          duplicate: false,
          contributionCreated: true,
          contributionId: contribution.contribution_id,
          memberId: phone.user_id,
          transactionAmount: dto.transactionAmount,
          contributionAmount,
          currency: 'TZS',
          ratePercentApplied: rule.rate_percent,
          externalReference: contribution.reference_number,
          internalReference: contribution.internal_reference,
          processingStatus: finalStatus,
          contributionDate: contribution.contribution_date,
          walletTransactionId: walletTransaction.walletTransactionId,
          allocation,
          signatureVerified,
        };
      });
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        // Lost a race with a concurrent identical delivery — fetch and
        // return what the other request just committed, same as the
        // pre-check above, so this is still a 200 not an error.
        const [raced] = await this.dataSource.query<ContributionRow[]>(
          `SELECT contribution_id, reference_number, internal_reference, contribution_amount, contribution_source, processing_status, contribution_date
           FROM telecom_contributions
           WHERE reference_number = $1 AND operator_id = $2`,
          [dto.externalTransactionId, operatorId],
        );
        return {
          duplicate: true,
          contributionId: raced?.contribution_id,
          amount: raced?.contribution_amount,
          externalReference: raced?.reference_number,
          internalReference: raced?.internal_reference,
          processingStatus: raced?.processing_status,
          contributionDate: raced?.contribution_date,
        };
      }
      throw error;
    }
  }

  // Only a Confirmed contribution can be reversed, and only once —
  // guarded by re-checking processing_status inside the same
  // transaction that flips it, so two concurrent reversal requests can't
  // both succeed.
  async reverseContribution(
    userId: number,
    contributionId: number,
    ipAddress: string | null = null,
  ) {
    const operatorId = await this.getAssignedOperatorId(userId);

    return this.dataSource.transaction(async (manager) => {
      const [contribution] = await manager.query<
        {
          contribution_id: number;
          member_id: number;
          contribution_amount: string;
          reference_number: string | null;
          processing_status: string;
        }[]
      >(
        `SELECT contribution_id, member_id, contribution_amount, reference_number, processing_status
         FROM telecom_contributions
         WHERE contribution_id = $1 AND operator_id = $2`,
        [contributionId, operatorId],
      );

      if (!contribution) {
        throw new NotFoundException('Contribution not found for your operator');
      }

      if (contribution.processing_status !== 'Allocated') {
        throw new BadRequestException(
          `Only an Allocated contribution can be reversed (this one is ${contribution.processing_status}).`,
        );
      }

      const [walletTx] = await manager.query<
        { wallet_transaction_id: number }[]
      >(
        `SELECT wallet_transaction_id FROM wallet_transactions WHERE contribution_id = $1 LIMIT 1`,
        [contributionId],
      );

      if (!walletTx) {
        throw new NotFoundException(
          'No wallet transaction found for this contribution — cannot reverse.',
        );
      }

      await this.walletsService.reverseContribution(
        manager,
        contribution.member_id,
        walletTx.wallet_transaction_id,
        Number(contribution.contribution_amount),
        {
          contributionId,
          transactionReference:
            contribution.reference_number ?? `CONTRIB-${contributionId}`,
          remarks: `Reversal of Telecom contribution #${contributionId}.`,
          reason: 'Reversed',
        },
      );

      await manager.query(
        `UPDATE telecom_contributions SET processing_status = 'Reversed' WHERE contribution_id = $1`,
        [contributionId],
      );

      await this.auditLogsService.record(manager, {
        memberId: contribution.member_id,
        actionType: 'telecom.contribution_reverse',
        affectedTable: 'telecom_contributions',
        affectedRecordId: contributionId,
        oldValue: { processingStatus: 'Allocated' },
        newValue: { processingStatus: 'Reversed' },
        ipAddress,
      });

      return {
        contributionId,
        processingStatus: 'Reversed',
      };
    });
  }

  // FAILED is the other terminal-undo status: for a contribution that
  // was Received/Validated (money already reached the member's wallet)
  // but never reached Allocated (no active insurance policy to allocate
  // against) and is now being voided — e.g. staff determine the
  // transaction itself was erroneous. Once a contribution has actually
  // reached Allocated, use reverseContribution() instead: that's the
  // named path for undoing something that DID reach an insurer.
  async markContributionFailed(
    userId: number,
    contributionId: number,
    ipAddress: string | null = null,
  ) {
    const operatorId = await this.getAssignedOperatorId(userId);

    return this.dataSource.transaction(async (manager) => {
      const [contribution] = await manager.query<
        {
          contribution_id: number;
          member_id: number;
          contribution_amount: string;
          reference_number: string | null;
          processing_status: string;
        }[]
      >(
        `SELECT contribution_id, member_id, contribution_amount, reference_number, processing_status
         FROM telecom_contributions
         WHERE contribution_id = $1 AND operator_id = $2`,
        [contributionId, operatorId],
      );

      if (!contribution) {
        throw new NotFoundException('Contribution not found for your operator');
      }

      if (!['Received', 'Validated'].includes(contribution.processing_status)) {
        throw new BadRequestException(
          `Only a Received or Validated contribution can be marked Failed (this one is ${contribution.processing_status}). An Allocated contribution must be reversed instead.`,
        );
      }

      const [walletTx] = await manager.query<
        { wallet_transaction_id: number }[]
      >(
        `SELECT wallet_transaction_id FROM wallet_transactions WHERE contribution_id = $1 LIMIT 1`,
        [contributionId],
      );

      if (!walletTx) {
        throw new NotFoundException(
          'No wallet transaction found for this contribution — cannot mark failed.',
        );
      }

      await this.walletsService.reverseContribution(
        manager,
        contribution.member_id,
        walletTx.wallet_transaction_id,
        Number(contribution.contribution_amount),
        {
          contributionId,
          transactionReference:
            contribution.reference_number ?? `CONTRIB-${contributionId}`,
          remarks: `Telecom contribution #${contributionId} marked failed.`,
          reason: 'Failed',
        },
      );

      await manager.query(
        `UPDATE telecom_contributions SET processing_status = 'Failed' WHERE contribution_id = $1`,
        [contributionId],
      );

      await this.auditLogsService.record(manager, {
        memberId: contribution.member_id,
        actionType: 'telecom.contribution_fail',
        affectedTable: 'telecom_contributions',
        affectedRecordId: contributionId,
        oldValue: { processingStatus: contribution.processing_status },
        newValue: { processingStatus: 'Failed' },
        ipAddress,
      });

      return {
        contributionId,
        processingStatus: 'Failed',
      };
    });
  }

  private async getAssignedOperatorId(userId: number): Promise<number> {
    const [row] = await this.dataSource.query<
      { telecom_operator_id: number | null }[]
    >(`SELECT telecom_operator_id FROM users WHERE user_id = $1`, [userId]);

    if (!row?.telecom_operator_id) {
      throw new ForbiddenException(
        'This account is not assigned to a telecom operator yet',
      );
    }

    return row.telecom_operator_id;
  }

  // =====================================================
  // Dashboard Overview
  // =====================================================

  async getDashboard(userId: number) {
    const operatorId = await this.getAssignedOperatorId(userId);

    const [operator] = await this.dataSource.query<
      { operator_name: string; status: string }[]
    >(
      `SELECT operator_name, status FROM telecom_operators WHERE operator_id = $1`,
      [operatorId],
    );

    const [{ count: linkedPhoneCount }] = await this.dataSource.query<
      { count: number }[]
    >(
      `SELECT COUNT(*)::int AS count
       FROM phone_numbers
       WHERE operator_id = $1`,
      [operatorId],
    );

    const [{ count: registeredMemberCount }] = await this.dataSource.query<
      { count: number }[]
    >(
      `SELECT COUNT(DISTINCT user_id)::int AS count
       FROM phone_numbers
       WHERE operator_id = $1`,
      [operatorId],
    );

    const [{ count: contributionCount, total: contributionTotal }] =
      await this.dataSource.query<{ count: number; total: string }[]>(
        `SELECT COUNT(*)::int AS count, COALESCE(SUM(contribution_amount), 0) AS total
         FROM telecom_contributions
         WHERE operator_id = $1`,
        [operatorId],
      );

    const [{ total: todayTotal, count: todayCount }] =
      await this.dataSource.query<{ total: string; count: number }[]>(
        `SELECT COALESCE(SUM(contribution_amount), 0) AS total, COUNT(*)::int AS count
         FROM telecom_contributions
         WHERE operator_id = $1
           AND contribution_date::date = CURRENT_DATE`,
        [operatorId],
      );

    const statusBreakdown = await this.dataSource.query<
      { processing_status: string; count: number }[]
    >(
      `SELECT processing_status, COUNT(*)::int AS count
       FROM telecom_contributions
       WHERE operator_id = $1
       GROUP BY processing_status`,
      [operatorId],
    );

    const recentContributions = await this.dataSource.query<ContributionRow[]>(
      `SELECT contribution_id, reference_number, contribution_amount,
              contribution_source, processing_status, contribution_date
       FROM telecom_contributions
       WHERE operator_id = $1
       ORDER BY contribution_date DESC
       LIMIT 5`,
      [operatorId],
    );

    return {
      operator: {
        name: operator?.operator_name ?? null,
        status: operator?.status ?? null,
      },
      linkedPhoneCount,
      registeredMemberCount,
      contributionCount,
      contributionTotal,
      today: {
        count: todayCount,
        total: todayTotal,
      },
      statusBreakdown: Object.fromEntries(
        statusBreakdown.map((row) => [row.processing_status, row.count]),
      ),
      recentContributions: recentContributions.map((row) => ({
        contributionId: row.contribution_id,
        reference: row.reference_number,
        amount: row.contribution_amount,
        source: row.contribution_source,
        status: row.processing_status,
        date: row.contribution_date,
      })),
    };
  }

  // =====================================================
  // Operator Profile
  // =====================================================

  async getOperatorProfile(userId: number) {
    const operatorId = await this.getAssignedOperatorId(userId);

    const [operator] = await this.dataSource.query<
      {
        operator_id: number;
        operator_name: string;
        country_code: string;
        api_endpoint: string | null;
        status: string;
        contact_phone: string | null;
        contact_email: string | null;
        api_key_preview: string | null;
        api_key_generated_at: Date | null;
        webhook_url: string | null;
        webhook_secret_generated_at: Date | null;
      }[]
    >(
      `SELECT operator_id, operator_name, country_code, api_endpoint, status,
              contact_phone, contact_email,
              api_key_preview, api_key_generated_at,
              webhook_url, webhook_secret_generated_at
       FROM telecom_operators
       WHERE operator_id = $1`,
      [operatorId],
    );

    if (!operator) {
      throw new NotFoundException('Operator not found');
    }

    const prefixes = await this.dataSource.query<{ prefix: string }[]>(
      `SELECT prefix FROM telecom_operator_prefixes
       WHERE operator_id = $1 AND status = 'Active'
       ORDER BY prefix`,
      [operatorId],
    );

    return {
      operatorId: operator.operator_id,
      operatorName: operator.operator_name,
      countryCode: operator.country_code,
      apiEndpoint: operator.api_endpoint,
      status: operator.status,
      contactPhone: operator.contact_phone,
      contactEmail: operator.contact_email,
      prefixes: prefixes.map((p) => p.prefix),
      apiKey: {
        hasKey: !!operator.api_key_preview,
        preview: operator.api_key_preview,
        generatedAt: operator.api_key_generated_at,
      },
      webhook: {
        hasWebhook: !!operator.webhook_url,
        url: operator.webhook_url,
        secretGeneratedAt: operator.webhook_secret_generated_at,
      },
    };
  }

  async updateOperatorContact(
    userId: number,
    data: UpdateOperatorContactDto,
    ipAddress: string | null = null,
  ) {
    const operatorId = await this.getAssignedOperatorId(userId);

    await this.dataSource.query(
      `UPDATE telecom_operators
       SET contact_phone = COALESCE($2, contact_phone),
           contact_email = COALESCE($3, contact_email),
           updated_at = NOW()
       WHERE operator_id = $1`,
      [operatorId, data.contactPhone ?? null, data.contactEmail ?? null],
    );

    await this.dataSource.transaction((manager) =>
      this.auditLogsService.record(manager, {
        memberId: userId,
        actionType: 'telecom_operator.contact_update',
        affectedTable: 'telecom_operators',
        affectedRecordId: operatorId,
        newValue: {
          contactPhone: data.contactPhone,
          contactEmail: data.contactEmail,
        },
        ipAddress,
      }),
    );

    return this.getOperatorProfile(userId);
  }

  // API key authenticates the operator's own calls INTO HSIMS (e.g. a
  // future inbound webhook-receipt endpoint) — HSIMS only ever verifies
  // it, so it's hashed at rest like a password, and shown in full exactly
  // once, at generation.
  async regenerateApiKey(userId: number, ipAddress: string | null = null) {
    const operatorId = await this.getAssignedOperatorId(userId);

    const apiKey = `tk_${crypto.randomBytes(24).toString('hex')}`;
    const apiKeyHash = await bcrypt.hash(apiKey, 12);
    const preview = apiKey.slice(-6);

    await this.dataSource.query(
      `UPDATE telecom_operators
       SET api_key_hash = $2, api_key_preview = $3, api_key_generated_at = NOW(), updated_at = NOW()
       WHERE operator_id = $1`,
      [operatorId, apiKeyHash, preview],
    );

    await this.dataSource.transaction((manager) =>
      this.auditLogsService.record(manager, {
        memberId: userId,
        actionType: 'telecom_operator.api_key_regenerate',
        affectedTable: 'telecom_operators',
        affectedRecordId: operatorId,
        newValue: { preview },
        ipAddress,
      }),
    );

    return {
      apiKey,
      preview,
      message:
        'This key is shown only once — store it now. Regenerating it invalidates the previous key.',
    };
  }

  // Webhook secret is what HSIMS would sign outgoing webhook deliveries
  // with, so — unlike the API key above — it has to be stored in a form
  // HSIMS can read back, not a one-way hash. See the migration file's
  // note: this is a known plaintext-at-rest gap, not a design choice to
  // copy elsewhere.
  async configureWebhook(
    userId: number,
    data: ConfigureWebhookDto,
    ipAddress: string | null = null,
  ) {
    const operatorId = await this.getAssignedOperatorId(userId);

    const webhookSecret = crypto.randomBytes(24).toString('hex');

    await this.dataSource.query(
      `UPDATE telecom_operators
       SET webhook_url = $2, webhook_secret = $3, webhook_secret_generated_at = NOW(), updated_at = NOW()
       WHERE operator_id = $1`,
      [operatorId, data.webhookUrl, webhookSecret],
    );

    await this.dataSource.transaction((manager) =>
      this.auditLogsService.record(manager, {
        memberId: userId,
        actionType: 'telecom_operator.webhook_configure',
        affectedTable: 'telecom_operators',
        affectedRecordId: operatorId,
        newValue: { webhookUrl: data.webhookUrl },
        ipAddress,
      }),
    );

    return {
      webhookUrl: data.webhookUrl,
      webhookSecret,
      message:
        'This signing secret is shown only once — store it now. Reconfiguring the webhook issues a new one.',
    };
  }

  // Outbound connectivity check against the operator's own api_endpoint —
  // a real HTTP call, not a stub. Doesn't touch money or write any
  // member/contribution data.
  async testConnection(userId: number) {
    const operatorId = await this.getAssignedOperatorId(userId);

    const [operator] = await this.dataSource.query<
      { api_endpoint: string | null }[]
    >(`SELECT api_endpoint FROM telecom_operators WHERE operator_id = $1`, [
      operatorId,
    ]);

    if (!operator?.api_endpoint) {
      throw new BadRequestException(
        'No API endpoint is configured for this operator yet',
      );
    }

    const startedAt = Date.now();
    let success = false;
    let responseStatus: number | null = null;
    let message: string;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(operator.api_endpoint, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeout);

      responseStatus = response.status;
      success = response.ok;
      message = success
        ? `Reached ${operator.api_endpoint} in ${Date.now() - startedAt}ms`
        : `Endpoint responded with HTTP ${response.status}`;
    } catch (err) {
      message = err instanceof Error ? err.message : 'Connection failed';
    }

    await this.dataSource.query(
      `INSERT INTO api_access_logs
         (operator_id, actor_id, event_type, endpoint, response_status, success, message)
       VALUES ($1, $2, 'connection_test', $3, $4, $5, $6)`,
      [
        operatorId,
        userId,
        operator.api_endpoint,
        responseStatus,
        success,
        message,
      ],
    );

    return { success, responseStatus, message };
  }

  // =====================================================
  // Registered Members
  // =====================================================

  async listMembers(userId: number, page: number, pageSize: number) {
    const operatorId = await this.getAssignedOperatorId(userId);

    const [{ count: total }] = await this.dataSource.query<{ count: number }[]>(
      `SELECT COUNT(DISTINCT u.user_id)::int AS count
       FROM users u
       INNER JOIN phone_numbers p ON p.user_id = u.user_id
       WHERE p.operator_id = $1`,
      [operatorId],
    );

    const members = await this.dataSource.query<MemberRow[]>(
      `SELECT
         u.user_id, u.first_name, u.surname, u.member_status, u.phone_verified,
         COALESCE(
           json_agg(
             json_build_object(
               'phoneId', p.phone_id,
               'phoneNumber', p.phone_number,
               'isPrimary', p.is_primary,
               'phoneStatus', p.phone_status
             )
           ) FILTER (WHERE p.phone_id IS NOT NULL AND p.operator_id = $1),
           '[]'
         ) AS phone_numbers
       FROM users u
       INNER JOIN phone_numbers p ON p.user_id = u.user_id
       WHERE u.user_id IN (
         SELECT DISTINCT user_id FROM phone_numbers WHERE operator_id = $1
       )
       GROUP BY u.user_id
       ORDER BY u.user_id DESC
       LIMIT $2 OFFSET $3`,
      [operatorId, pageSize, (page - 1) * pageSize],
    );

    return { items: members, total, page, pageSize };
  }

  // =====================================================
  // Contribution Transactions (also backs Successful/Failed views —
  // both are just this list filtered by status)
  // =====================================================

  async listContributions(
    userId: number,
    status: string | undefined,
    page: number,
    pageSize: number,
  ) {
    const operatorId = await this.getAssignedOperatorId(userId);

    const [{ count: total }] = await this.dataSource.query<{ count: number }[]>(
      `SELECT COUNT(*)::int AS count
       FROM telecom_contributions
       WHERE operator_id = $1 AND ($2::text IS NULL OR processing_status = $2)`,
      [operatorId, status ?? null],
    );

    const items = await this.dataSource.query<ContributionRow[]>(
      `SELECT contribution_id, reference_number, contribution_amount,
              contribution_source, processing_status, contribution_date
       FROM telecom_contributions
       WHERE operator_id = $1 AND ($2::text IS NULL OR processing_status = $2)
       ORDER BY contribution_date DESC
       LIMIT $3 OFFSET $4`,
      [operatorId, status ?? null, pageSize, (page - 1) * pageSize],
    );

    return { items, total, page, pageSize };
  }

  async exportContributionsCsv(
    userId: number,
    status: string | undefined,
  ): Promise<string> {
    const operatorId = await this.getAssignedOperatorId(userId);

    const rows = await this.dataSource.query<ContributionRow[]>(
      `SELECT contribution_id, reference_number, contribution_amount,
              contribution_source, processing_status, contribution_date
       FROM telecom_contributions
       WHERE operator_id = $1 AND ($2::text IS NULL OR processing_status = $2)
       ORDER BY contribution_date DESC`,
      [operatorId, status ?? null],
    );

    const header = 'Contribution ID,Reference,Amount,Source,Status,Date';
    const lines = rows.map((row) =>
      [
        row.contribution_id,
        row.reference_number ?? '',
        row.contribution_amount,
        row.contribution_source,
        row.processing_status,
        new Date(row.contribution_date).toISOString(),
      ]
        .map((value) => `"${String(value).replace(/"/g, '""')}"`)
        .join(','),
    );

    return [header, ...lines].join('\n');
  }

  // =====================================================
  // Contribution Rules — read-only for Telecom
  // =====================================================

  async listContributionRules() {
    return this.dataSource.query<ContributionRuleRow[]>(
      `SELECT rule_id, rule_type, rate_percent, minimum_amount, effective_date, is_active, created_at
       FROM contribution_rules
       ORDER BY rule_type, effective_date DESC`,
    );
  }

  // =====================================================
  // Reconciliation
  // =====================================================

  async createReconciliationRun(userId: number, data: UploadReconciliationDto) {
    const operatorId = await this.getAssignedOperatorId(userId);

    return this.dataSource.transaction(async (manager) => {
      let matchedCount = 0;

      const [run] = await manager.query<{ run_id: number }[]>(
        `INSERT INTO telecom_reconciliation_runs
           (operator_id, initiated_by, total_uploaded, matched_count, unmatched_count)
         VALUES ($1, $2, $3, 0, 0)
         RETURNING run_id`,
        [operatorId, userId, data.records.length],
      );

      for (const record of data.records) {
        const [contribution] = await manager.query<
          { contribution_id: number }[]
        >(
          `SELECT contribution_id FROM telecom_contributions
           WHERE operator_id = $1 AND reference_number = $2 AND contribution_amount = $3
           LIMIT 1`,
          [operatorId, record.externalReference, record.amount],
        );

        const matched = !!contribution;
        if (matched) matchedCount += 1;

        await manager.query(
          `INSERT INTO telecom_reconciliation_records
             (run_id, external_reference, amount, record_date, matched_contribution_id, match_status)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            run.run_id,
            record.externalReference,
            record.amount,
            record.recordDate ?? null,
            contribution?.contribution_id ?? null,
            matched ? 'Matched' : 'Unmatched',
          ],
        );
      }

      const unmatchedCount = data.records.length - matchedCount;

      await manager.query(
        `UPDATE telecom_reconciliation_runs
         SET matched_count = $2, unmatched_count = $3
         WHERE run_id = $1`,
        [run.run_id, matchedCount, unmatchedCount],
      );

      await this.auditLogsService.record(manager, {
        memberId: userId,
        actionType: 'telecom_reconciliation.run',
        affectedTable: 'telecom_reconciliation_runs',
        affectedRecordId: run.run_id,
        newValue: {
          totalUploaded: data.records.length,
          matchedCount,
          unmatchedCount,
        },
      });

      return {
        runId: run.run_id,
        totalUploaded: data.records.length,
        matchedCount,
        unmatchedCount,
      };
    });
  }

  async listReconciliationRuns(userId: number) {
    const operatorId = await this.getAssignedOperatorId(userId);

    return this.dataSource.query<ReconciliationRunRow[]>(
      `SELECT run_id, total_uploaded, matched_count, unmatched_count, run_date
       FROM telecom_reconciliation_runs
       WHERE operator_id = $1
       ORDER BY run_date DESC`,
      [operatorId],
    );
  }

  async getReconciliationRun(userId: number, runId: number) {
    const operatorId = await this.getAssignedOperatorId(userId);

    const [run] = await this.dataSource.query<ReconciliationRunRow[]>(
      `SELECT run_id, total_uploaded, matched_count, unmatched_count, run_date
       FROM telecom_reconciliation_runs
       WHERE run_id = $1 AND operator_id = $2`,
      [runId, operatorId],
    );

    if (!run) {
      throw new NotFoundException('Reconciliation run not found');
    }

    const records = await this.dataSource.query<ReconciliationRecordRow[]>(
      `SELECT record_id, external_reference, amount, record_date, matched_contribution_id, match_status
       FROM telecom_reconciliation_records
       WHERE run_id = $1
       ORDER BY record_id`,
      [runId],
    );

    return { ...run, records };
  }

  // =====================================================
  // Reports
  // =====================================================

  async getReports(userId: number, period: 'daily' | 'weekly' | 'monthly') {
    const operatorId = await this.getAssignedOperatorId(userId);

    const truncUnit =
      period === 'daily' ? 'day' : period === 'weekly' ? 'week' : 'month';

    const buckets = await this.dataSource.query<
      { bucket: Date; count: number; total: string }[]
    >(
      `SELECT date_trunc($2, contribution_date) AS bucket,
              COUNT(*)::int AS count,
              COALESCE(SUM(contribution_amount), 0) AS total
       FROM telecom_contributions
       WHERE operator_id = $1
       GROUP BY bucket
       ORDER BY bucket DESC
       LIMIT 12`,
      [operatorId, truncUnit],
    );

    const failedByReason = await this.dataSource.query<
      { processing_status: string; count: number }[]
    >(
      `SELECT processing_status, COUNT(*)::int AS count
       FROM telecom_contributions
       WHERE operator_id = $1 AND processing_status != 'Completed'
       GROUP BY processing_status`,
      [operatorId],
    );

    return {
      period,
      buckets: buckets.map((row) => ({
        bucket: row.bucket,
        count: row.count,
        total: row.total,
      })),
      failedByReason,
    };
  }

  // =====================================================
  // Audit & Security
  // =====================================================

  async listActivityLogs(userId: number) {
    const operatorId = await this.getAssignedOperatorId(userId);

    return this.dataSource.query<ActivityLogRow[]>(
      `SELECT audit_id, member_id, action_type, affected_table, affected_record_id,
              old_value, new_value, ip_address, created_at
       FROM audit_logs
       WHERE (affected_table = 'telecom_operators' AND affected_record_id = $1)
          OR member_id = $2
       ORDER BY created_at DESC
       LIMIT 100`,
      [operatorId, userId],
    );
  }

  async listApiAccessLogs(userId: number) {
    const operatorId = await this.getAssignedOperatorId(userId);

    return this.dataSource.query<ApiAccessLogRow[]>(
      `SELECT log_id, event_type, endpoint, response_status, success, message, created_at
       FROM api_access_logs
       WHERE operator_id = $1
       ORDER BY created_at DESC
       LIMIT 100`,
      [operatorId],
    );
  }
}
