import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource, EntityManager } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

import { encryptWebhookSecret } from '../../common/webhook-secret-crypto';
import { UpdateOperatorContactDto } from './dto/update-operator-contact.dto';
import { ConfigureWebhookDto } from './dto/configure-webhook.dto';
import { UploadReconciliationDto } from './dto/upload-reconciliation.dto';
import { RecordContributionDto } from './dto/record-contribution.dto';
import { WebhookContributionDto } from './dto/webhook-contribution.dto';
import { WebhookResourceConversionDto } from './dto/webhook-resource-conversion.dto';
import { WebhookOutgoingTransactionDto } from './dto/webhook-outgoing-transaction.dto';
import {
  buildResourceConversionReference,
  calculateResourceConversion,
  mapTelecomResourceConversionRow,
  RESOURCE_TYPE_UNIT,
  TelecomResourceConversionRow,
} from './telecom-resource-conversion.types';
import {
  buildDiversionReference,
  calculateDivertedAmount,
  mapOutgoingTransactionDiversionRow,
  OutgoingTransactionDiversionRow,
} from './outgoing-transaction-diversion.types';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { WalletsService } from '../wallets/wallets.service';
import { VodacomC2BService } from './vodacom/vodacom-c2b.service';
import {
  SESSION_CREATION_FAILED_CODE,
  VodacomSessionKeyService,
} from './vodacom/vodacom-session-key.service';
import {
  buildGetSessionPath,
  isVodacomMpesaConnectionConfigured,
  isVodacomMpesaPublicKeyConfigured,
  loadVodacomMpesaConnectionConfig,
} from './vodacom/vodacom-mpesa-connection.config';

interface ContributionRow {
  contribution_id: number;
  member_id?: number;
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

// Normalized result of testing one operator's real integration —
// independent of which provider produced it, so testConnection() can
// log and respond the same way regardless of operator.
type ConnectionTestState =
  | 'connected'
  | 'connection_failed'
  | 'credentials_missing'
  | 'integration_not_configured'
  | 'timeout'
  | 'authentication_failed';

interface ConnectionTestOutcome {
  state: ConnectionTestState;
  success: boolean;
  responseStatus: number | null;
  endpoint: string | null;
  message: string;
  environment?: string;
  // Structured, machine-readable env-var names for a credentials_missing
  // outcome — the message string already says this in prose, but a
  // caller (frontend, future automation) shouldn't have to parse it.
  missing?: string[];
}

@Injectable()
export class TelecomService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly auditLogsService: AuditLogsService,
    private readonly walletsService: WalletsService,
    private readonly vodacomC2BService: VodacomC2BService,
    private readonly vodacomSessionKeyService: VodacomSessionKeyService,
    private readonly configService: ConfigService,
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

    // This block only matters for Vodacom: it's the one operator with a
    // real payment-collection rail (VodacomC2BService) a staff member
    // could otherwise bypass by hand-typing "yes, Vodacom confirmed
    // this" without any genuine M-Pesa confirmation. Every other
    // operator's purchase-type contribution carries the same trust level
    // through either path (staff entry or webhook — neither is backed by
    // a real payment rail for them yet), so gating only Vodacom here
    // preserves their pre-existing direct staff-entry option instead of
    // silently blocking it for no real integrity gain.
    if (
      (await this.vodacomC2BService.isVodacomOperator(operatorId)) &&
      ['Airtime', 'Data Bundle', 'Mobile Money Transfer'].includes(
        dto.contributionSource ?? 'Airtime',
      )
    ) {
      throw new BadRequestException(
        'Telecom purchase contributions must arrive through the operator event flow and confirmed M-Pesa collection.',
      );
    }

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

  // Real inbound airtime event boundary. The event is only evidence that
  // an operator observed a purchase; it is never treated as settled money.
  //
  // Only Vodacom has a real payment-collection rail today
  // (VodacomC2BService — genuine M-Pesa Single Stage sandbox calls): for
  // that operator, the contribution row starts 'Pending' and the wallet
  // is credited only after Vodacom confirms SUCCESSFUL. Every other
  // seeded operator (Airtel, Yas Money, Halotel, TTCL) has no real
  // collection integration yet (see CLAUDE.md's Telecom section), so
  // this preserves their pre-existing direct-credit behavior — the event
  // itself, from an authenticated/signed operator webhook, is treated as
  // sufficient evidence to credit the wallet immediately, same as before
  // Vodacom's real integration was added. Routing every operator through
  // a Vodacom-only rail would silently break contribution recording for
  // the other four operators; this branch is what avoids that.
  async handleContributionWebhook(
    operatorId: number,
    dto: WebhookContributionDto,
    ipAddress: string | null = null,
    signatureVerified: boolean = false,
  ) {
    const isVodacom =
      await this.vodacomC2BService.isVodacomOperator(operatorId);

    const [existing] = await this.dataSource.query<ContributionRow[]>(
      `SELECT contribution_id, member_id, reference_number, internal_reference, contribution_amount, contribution_source, processing_status, contribution_date
       FROM telecom_contributions
       WHERE reference_number = $1 AND operator_id = $2`,
      [dto.externalTransactionId, operatorId],
    );

    if (existing) {
      // Only a Vodacom contribution can still be sitting 'Pending' with
      // no payment_transactions row yet — the direct-credit path below
      // never leaves a contribution in that state.
      if (
        isVodacom &&
        existing.processing_status === 'Pending' &&
        existing.member_id
      ) {
        const [payment] = await this.dataSource.query<
          { payment_transaction_id: number }[]
        >(
          `SELECT payment_transaction_id
           FROM payment_transactions
           WHERE contribution_id = $1
           LIMIT 1`,
          [existing.contribution_id],
        );
        if (!payment) {
          const collection = await this.vodacomC2BService.contribute(
            existing.member_id,
            Number(existing.contribution_amount),
            `${existing.contribution_source} contribution via ${dto.phoneNumber}.`,
            {
              contributionId: existing.contribution_id,
              contributionSource: existing.contribution_source,
              internalReference: existing.internal_reference ?? undefined,
            },
          );
          return {
            duplicate: true,
            contributionId: existing.contribution_id,
            amount: existing.contribution_amount,
            externalReference: existing.reference_number,
            internalReference: existing.internal_reference,
            processingStatus:
              collection.status === 'SUCCESSFUL'
                ? 'Allocated'
                : collection.status === 'FAILED'
                  ? 'Failed'
                  : 'Pending',
            payment: collection,
            contributionDate: existing.contribution_date,
          };
        }
      }
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

    if (!isVodacom) {
      return this.handleNonVodacomContribution(
        operatorId,
        dto,
        rule.rate_percent,
        contributionAmount,
        ipAddress,
        signatureVerified,
      );
    }

    try {
      const contribution = await this.dataSource.transaction(
        async (manager) => {
          const [phone] = await manager.query<
            { phone_id: number; user_id: number }[]
          >(
            `SELECT phone_id, user_id FROM phone_numbers
           WHERE phone_number = $1 AND operator_id = $2 AND phone_status = 'Active'`,
            [dto.phoneNumber, operatorId],
          );

          if (!phone) {
            throw new NotFoundException(
              'No member found with that phone number for your operator',
            );
          }

          const internalReference = this.generateInternalReference('AIR');

          // Pending means the event and rule are valid, but the separate
          // M-Pesa collection has not yet been confirmed.
          const [contribution] = await manager.query<ContributionRow[]>(
            `INSERT INTO telecom_contributions
             (member_id, phone_id, operator_id, contribution_amount, contribution_source, reference_number, internal_reference, processing_status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, 'Pending')
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
              paymentStatus: 'PENDING',
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
            processingStatus: contribution.processing_status,
            contributionDate: contribution.contribution_date,
            signatureVerified,
          };
        },
      );

      const payment = await this.vodacomC2BService.contribute(
        contribution.memberId,
        Number(contribution.contributionAmount),
        `${dto.transactionType} contribution via ${dto.phoneNumber}.`,
        {
          contributionId: contribution.contributionId,
          contributionSource: dto.transactionType,
        },
      );

      return {
        duplicate: false,
        contributionCreated: true,
        contributionId: contribution.contributionId,
        memberId: contribution.memberId,
        transactionAmount: dto.transactionAmount,
        contributionAmount: contribution.contributionAmount,
        currency: 'TZS',
        ratePercentApplied: rule.rate_percent,
        externalReference: contribution.externalReference,
        internalReference: contribution.internalReference,
        processingStatus:
          payment.status === 'SUCCESSFUL'
            ? 'Allocated'
            : payment.status === 'FAILED'
              ? 'Failed'
              : 'Pending',
        payment,
        signatureVerified,
      };
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        return this.fetchRacedDuplicateContribution(
          operatorId,
          dto.externalTransactionId,
        );
      }
      throw error;
    }
  }

  // Pre-existing (pre-Vodacom-integration) direct-credit contribution
  // path, preserved verbatim in behavior for every operator that has no
  // real payment-collection rail: the webhook event itself, once past
  // TelecomApiKeyGuard/TelecomWebhookSignatureGuard, is the same trust
  // boundary this always ran behind — nothing about adding Vodacom's
  // genuine M-Pesa collection changes what these operators are owed.
  private async handleNonVodacomContribution(
    operatorId: number,
    dto: WebhookContributionDto,
    ratePercent: string,
    contributionAmount: number,
    ipAddress: string | null,
    signatureVerified: boolean,
  ) {
    try {
      return await this.dataSource.transaction(async (manager) => {
        const [phone] = await manager.query<
          { phone_id: number; user_id: number }[]
        >(
          `SELECT phone_id, user_id FROM phone_numbers
           WHERE phone_number = $1 AND operator_id = $2 AND phone_status = 'Active'`,
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
            ratePercent,
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
          ratePercentApplied: ratePercent,
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
        return this.fetchRacedDuplicateContribution(
          operatorId,
          dto.externalTransactionId,
        );
      }
      throw error;
    }
  }

  // Shared by both contribution paths' unique-violation recovery: lost a
  // race with a concurrent identical delivery — fetch and return what
  // the other request just committed, so this is still a 200, not an
  // error.
  private async fetchRacedDuplicateContribution(
    operatorId: number,
    externalTransactionId: string,
  ) {
    const [raced] = await this.dataSource.query<ContributionRow[]>(
      `SELECT contribution_id, member_id, reference_number, internal_reference, contribution_amount, contribution_source, processing_status, contribution_date
       FROM telecom_contributions
       WHERE reference_number = $1 AND operator_id = $2`,
      [externalTransactionId, operatorId],
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
    const encryptedSecret = encryptWebhookSecret(webhookSecret);

    await this.dataSource.query(
      `UPDATE telecom_operators
       SET webhook_url = $2, webhook_secret = $3, webhook_secret_generated_at = NOW(), updated_at = NOW()
       WHERE operator_id = $1`,
      [operatorId, data.webhookUrl, encryptedSecret],
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

  // Real connection test, dispatched to whichever integration is
  // actually configured for the calling Telecom user's own assigned
  // operator (users.telecom_operator_id — never a body-supplied id, so
  // a staff account can only ever test its own tenant). Never touches
  // money, a wallet, or a contribution — see testVodacomConnection().
  async testConnection(userId: number) {
    const operatorId = await this.getAssignedOperatorId(userId);

    const [operator] = await this.dataSource.query<{ operator_name: string }[]>(
      `SELECT operator_name FROM telecom_operators WHERE operator_id = $1`,
      [operatorId],
    );

    if (!operator) {
      throw new NotFoundException('Assigned telecom operator not found');
    }

    const outcome = await this.runOperatorConnectionTest(
      operator.operator_name,
    );

    await this.dataSource.query(
      `INSERT INTO api_access_logs
         (operator_id, actor_id, event_type, endpoint, response_status, success, message)
       VALUES ($1, $2, 'connection_test', $3, $4, $5, $6)`,
      [
        operatorId,
        userId,
        outcome.endpoint,
        outcome.responseStatus,
        outcome.success,
        outcome.message,
      ],
    );

    return {
      success: outcome.success,
      state: outcome.state,
      provider: operator.operator_name,
      environment: outcome.environment,
      responseStatus: outcome.responseStatus,
      missing: outcome.missing,
      message: outcome.message,
    };
  }

  // Dispatch table for per-operator connection tests. Only Vodacom has
  // a real, documented integration today (telecom/vodacom/) — every
  // other seeded operator (Airtel, Yas Money, Halotel, TTCL) honestly
  // reports "not configured yet" instead of the previous behaviour of
  // firing an unverifying generic GET at telecom_operators.api_endpoint
  // (which never proved TUJITUNZE could authenticate with anything).
  // Adding a new operator's real integration later means adding one
  // more case here, not touching the dispatch or logging logic.
  private async runOperatorConnectionTest(
    operatorName: string,
  ): Promise<ConnectionTestOutcome> {
    switch (operatorName.trim().toLowerCase()) {
      case 'vodacom':
        return this.testVodacomConnection();
      default:
        return {
          state: 'integration_not_configured',
          success: false,
          responseStatus: null,
          endpoint: null,
          message: 'Operator integration is not configured yet.',
        };
    }
  }

  // Reuses the exact SAME session-key infrastructure VodacomC2BService
  // uses for real payments (VodacomSessionKeyService ->
  // VodacomMpesaHttpService), but calls generateSession() directly
  // rather than through VodacomSessionCacheService — a connection test
  // must prove live connectivity/authentication right now, not report
  // a cached session obtained minutes ago. GET .../getSession/ is
  // read-only: it cannot initiate a payment, credit a wallet, or create
  // a contribution, so this is safe to call as often as the throttle on
  // POST /telecom/operator/connection-test allows.
  private async testVodacomConnection(): Promise<ConnectionTestOutcome> {
    const config = loadVodacomMpesaConnectionConfig(this.configService);
    const endpoint = config.baseUrl
      ? `${config.baseUrl}${this.safeGetSessionPath(config)}`
      : null;

    try {
      const result = await this.vodacomSessionKeyService.generateSession();

      if (result.success) {
        return {
          state: 'connected',
          success: true,
          responseStatus: result.httpStatus,
          endpoint,
          environment: config.environment,
          message: `Vodacom M-Pesa sandbox authentication successful (response ${result.responseCode}).`,
        };
      }

      if (result.errorKind === 'TIMEOUT') {
        return {
          state: 'timeout',
          success: false,
          responseStatus: result.httpStatus,
          endpoint,
          environment: config.environment,
          message: result.message,
        };
      }

      // HTTP 401/403, or Vodacom's own documented "session creation
      // failed" response code, both mean the credential itself was
      // rejected — distinct from a network/connectivity problem.
      const isAuthFailure =
        result.responseCode === SESSION_CREATION_FAILED_CODE ||
        result.httpStatus === 401 ||
        result.httpStatus === 403;

      return {
        state: isAuthFailure ? 'authentication_failed' : 'connection_failed',
        success: false,
        responseStatus: result.httpStatus,
        endpoint,
        environment: config.environment,
        message: result.message,
      };
    } catch (error) {
      // VodacomSessionKeyService fails closed with this exact exception
      // when a required env var is missing — never a fake success.
      if (error instanceof ServiceUnavailableException) {
        const response = error.getResponse();
        const message =
          typeof response === 'string'
            ? response
            : ((response as { message?: string })?.message ??
              'Vodacom M-Pesa credentials are not configured.');

        // Reconstructed independently of the thrown message (never
        // parsed from prose) — the exact same checks
        // VodacomSessionKeyService itself runs before throwing.
        const missing: string[] = [];
        if (!isVodacomMpesaConnectionConfigured(config)) {
          if (!config.baseUrl) missing.push('VODACOM_MPESA_BASE_URL');
          if (!config.market) missing.push('VODACOM_MPESA_MARKET');
          if (!config.apiKey) missing.push('VODACOM_MPESA_API_KEY');
          if (!config.origin) missing.push('VODACOM_MPESA_ORIGIN');
        }
        if (!isVodacomMpesaPublicKeyConfigured(config)) {
          missing.push('VODACOM_MPESA_PUBLIC_KEY');
        }

        return {
          state: 'credentials_missing',
          success: false,
          responseStatus: null,
          endpoint,
          environment: config.environment,
          missing,
          message,
        };
      }
      throw error;
    }
  }

  // buildGetSessionPath() throws for an unsupported (production)
  // environment — the connection test still wants an endpoint value for
  // the audit log in that case, so this degrades to null rather than
  // letting a path-construction error mask the real test outcome.
  private safeGetSessionPath(
    config: ReturnType<typeof loadVodacomMpesaConnectionConfig>,
  ): string {
    try {
      return buildGetSessionPath(config);
    } catch {
      return '';
    }
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
  // Principle 1 — Resource Conversion
  // (telecom_resource_conversion_events + telecom_resource_usage_splits,
  // split from one merged table by migration 0028 — see that file's
  // header and CLAUDE.md for why)
  // =====================================================
  // Synchronous inbound boundary: the operator must receive
  // netUnitsToCustomer back before granting anything — that's what
  // keeps the saving invisible to the member. Idempotency keyed on
  // (telecom_operator_id, external_transaction_id, resource_type),
  // the same shape as every other webhook handler in this file.

  // Reconstructs the flat TelecomResourceConversionRow shape (every
  // existing consumer's expected shape) via a JOIN across the two
  // physically separate tables — every read call site in this class
  // goes through one of these two helpers instead of repeating the
  // JOIN inline.
  private async selectResourceConversionByEventId(
    runner: DataSource | EntityManager,
    eventId: number,
  ): Promise<TelecomResourceConversionRow | undefined> {
    const [row] = await runner.query<TelecomResourceConversionRow[]>(
      `SELECT
         e.event_id AS conversion_id, e.external_transaction_id, e.member_id,
         e.phone_number, e.phone_id, e.telecom_operator_id, e.resource_type,
         e.gross_units, e.unit, s.saving_rate, s.saved_units, s.net_units_to_customer,
         s.provider_unit_value_tzs, s.saved_value_tzs, s.currency, s.status,
         s.contribution_id, e.conversion_timestamp, e.created_at, s.updated_at
       FROM telecom_resource_conversion_events e
       JOIN telecom_resource_usage_splits s ON s.event_id = e.event_id
       WHERE e.event_id = $1`,
      [eventId],
    );
    return row;
  }

  private async selectResourceConversionByIdempotencyKey(
    runner: DataSource | EntityManager,
    operatorId: number,
    externalTransactionId: string,
    resourceType: string,
  ): Promise<TelecomResourceConversionRow | undefined> {
    const [row] = await runner.query<TelecomResourceConversionRow[]>(
      `SELECT
         e.event_id AS conversion_id, e.external_transaction_id, e.member_id,
         e.phone_number, e.phone_id, e.telecom_operator_id, e.resource_type,
         e.gross_units, e.unit, s.saving_rate, s.saved_units, s.net_units_to_customer,
         s.provider_unit_value_tzs, s.saved_value_tzs, s.currency, s.status,
         s.contribution_id, e.conversion_timestamp, e.created_at, s.updated_at
       FROM telecom_resource_conversion_events e
       JOIN telecom_resource_usage_splits s ON s.event_id = e.event_id
       WHERE e.telecom_operator_id = $1 AND e.external_transaction_id = $2 AND e.resource_type = $3`,
      [operatorId, externalTransactionId, resourceType],
    );
    return row;
  }

  async handleResourceConversionWebhook(
    operatorId: number,
    dto: WebhookResourceConversionDto,
    ipAddress: string | null = null,
    signatureVerified: boolean = false,
  ) {
    if (RESOURCE_TYPE_UNIT[dto.resourceType] !== dto.unit) {
      throw new BadRequestException(
        `Resource type "${dto.resourceType}" must be reported in ${RESOURCE_TYPE_UNIT[dto.resourceType]}, not ${dto.unit}.`,
      );
    }

    const existing = await this.selectResourceConversionByIdempotencyKey(
      this.dataSource,
      operatorId,
      dto.externalTransactionId,
      dto.resourceType,
    );

    if (existing) {
      return {
        duplicate: true,
        conversion: mapTelecomResourceConversionRow(existing),
        netUnitsToCustomer: Number(existing.net_units_to_customer),
      };
    }

    // Phone lookup happens once, up front, and is reused by every branch
    // below (including the no-rule/opted-out ones) so each can persist
    // an accurate member_id/phone_id — previously the no-rule branch
    // never looked this up at all because it never persisted anything.
    const [phone] = await this.dataSource.query<
      { phone_id: number; user_id: number }[]
    >(
      `SELECT phone_id, user_id FROM phone_numbers
       WHERE phone_number = $1 AND operator_id = $2 AND phone_status = 'Active'`,
      [dto.phoneNumber, operatorId],
    );

    const [rule] = await this.dataSource.query<
      { rule_id: number; rate: string }[]
    >(
      `SELECT rule_id, rate
       FROM contribution_rules
       WHERE rule_type = $1 AND channel = 'TELECOM_RESOURCE' AND principle = 'RESOURCE_CONVERSION'
         AND is_active = true AND effective_date <= CURRENT_DATE
       ORDER BY effective_date DESC
       LIMIT 1`,
      [dto.resourceType],
    );

    // Previously: threw here with nothing persisted, so a misconfigured
    // rule left no diagnostic trail. Now a row is always written first
    // — full gross amount passed through, nothing withheld — and the
    // operator still gets the same rejection so it never grants a
    // saving that isn't backed by an active rule.
    if (!rule) {
      try {
        await this.dataSource.transaction(async (manager) => {
          const [event] = await manager.query<{ event_id: number }[]>(
            `INSERT INTO telecom_resource_conversion_events
               (external_transaction_id, member_id, phone_number, phone_id, telecom_operator_id,
                resource_type, gross_units, unit, conversion_timestamp)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             RETURNING event_id`,
            [
              dto.externalTransactionId,
              phone?.user_id ?? null,
              dto.phoneNumber,
              phone?.phone_id ?? null,
              operatorId,
              dto.resourceType,
              dto.grossUnits,
              dto.unit,
              new Date(dto.conversionTimestamp),
            ],
          );

          await manager.query(
            `INSERT INTO telecom_resource_usage_splits
               (event_id, saving_rate, saved_units, net_units_to_customer,
                provider_unit_value_tzs, saved_value_tzs, currency, status)
             VALUES ($1, 0, 0, $2, $3, 0, 'TZS', 'NO_ACTIVE_RULE')`,
            [event.event_id, dto.grossUnits, dto.providerUnitValueTzs],
          );

          await this.auditLogsService.record(manager, {
            memberId: phone?.user_id ?? null,
            actionType: 'telecom.resource_conversion_no_active_rule',
            affectedTable: 'telecom_resource_conversion_events',
            affectedRecordId: event.event_id,
            newValue: {
              operatorId,
              resourceType: dto.resourceType,
              phoneNumber: dto.phoneNumber,
              externalTransactionId: dto.externalTransactionId,
              signatureVerified,
            },
            ipAddress,
          });
        });
      } catch (error) {
        if (!this.isUniqueViolation(error)) {
          throw error;
        }
        // Raced with another call for the same idempotency key — fall
        // through to the operator-facing rejection either way, nothing
        // further to persist.
      }

      throw new BadRequestException(
        `No active resource-conversion rule for "${dto.resourceType}"`,
      );
    }

    // A member who has opted out (member_saving_consents.consented =
    // FALSE) keeps the full gross amount — no split, no wallet credit —
    // but the event is still recorded so there's a trail distinct from
    // a normal 0-saving case.
    if (phone) {
      const [consent] = await this.dataSource.query<{ consented: boolean }[]>(
        `SELECT consented FROM member_saving_consents WHERE member_id = $1`,
        [phone.user_id],
      );

      if (consent && consent.consented === false) {
        try {
          const conversion = await this.dataSource.transaction(
            async (manager) => {
              const [event] = await manager.query<{ event_id: number }[]>(
                `INSERT INTO telecom_resource_conversion_events
                   (external_transaction_id, member_id, phone_number, phone_id, telecom_operator_id,
                    resource_type, gross_units, unit, conversion_timestamp)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                 RETURNING event_id`,
                [
                  dto.externalTransactionId,
                  phone.user_id,
                  dto.phoneNumber,
                  phone.phone_id,
                  operatorId,
                  dto.resourceType,
                  dto.grossUnits,
                  dto.unit,
                  new Date(dto.conversionTimestamp),
                ],
              );

              await manager.query(
                `INSERT INTO telecom_resource_usage_splits
                   (event_id, saving_rate, saved_units, net_units_to_customer,
                    provider_unit_value_tzs, saved_value_tzs, currency, status)
                 VALUES ($1, 0, 0, $2, $3, 0, 'TZS', 'OPTED_OUT')`,
                [event.event_id, dto.grossUnits, dto.providerUnitValueTzs],
              );

              await this.auditLogsService.record(manager, {
                memberId: phone.user_id,
                actionType: 'telecom.resource_conversion_opted_out',
                affectedTable: 'telecom_resource_conversion_events',
                affectedRecordId: event.event_id,
                newValue: {
                  operatorId,
                  resourceType: dto.resourceType,
                  grossUnits: dto.grossUnits,
                  externalTransactionId: dto.externalTransactionId,
                  signatureVerified,
                },
                ipAddress,
              });

              return this.selectResourceConversionByEventId(
                manager,
                event.event_id,
              );
            },
          );

          return {
            duplicate: false,
            matched: true,
            status: 'OPTED_OUT' as const,
            conversion: conversion
              ? mapTelecomResourceConversionRow(conversion)
              : null,
            netUnitsToCustomer: dto.grossUnits,
          };
        } catch (error) {
          if (!this.isUniqueViolation(error)) {
            throw error;
          }
          const raced = await this.selectResourceConversionByIdempotencyKey(
            this.dataSource,
            operatorId,
            dto.externalTransactionId,
            dto.resourceType,
          );
          return {
            duplicate: true,
            conversion: raced ? mapTelecomResourceConversionRow(raced) : null,
            netUnitsToCustomer: raced
              ? Number(raced.net_units_to_customer)
              : dto.grossUnits,
          };
        }
      }
    }

    const savingRate = Number(rule.rate);
    const { savedUnits, netUnitsToCustomer } = calculateResourceConversion(
      dto.grossUnits,
      savingRate,
    );
    const savedValueTzs =
      Math.round(savedUnits * dto.providerUnitValueTzs * 100) / 100;

    try {
      return await this.dataSource.transaction(async (manager) => {
        // Mirrors every other webhook handler's PENDING_REVIEW shape:
        // the operator has already committed to this call, but the
        // wallet must never be credited without a confident member
        // match. netUnitsToCustomer is still returned so the operator
        // has one consistent response contract to act on either way.
        if (!phone) {
          const [event] = await manager.query<{ event_id: number }[]>(
            `INSERT INTO telecom_resource_conversion_events
               (external_transaction_id, member_id, phone_number, phone_id, telecom_operator_id,
                resource_type, gross_units, unit, conversion_timestamp)
             VALUES ($1, NULL, $2, NULL, $3, $4, $5, $6, $7)
             RETURNING event_id`,
            [
              dto.externalTransactionId,
              dto.phoneNumber,
              operatorId,
              dto.resourceType,
              dto.grossUnits,
              dto.unit,
              new Date(dto.conversionTimestamp),
            ],
          );

          await manager.query(
            `INSERT INTO telecom_resource_usage_splits
               (event_id, saving_rate, saved_units, net_units_to_customer,
                provider_unit_value_tzs, saved_value_tzs, currency, status)
             VALUES ($1, $2, $3, $4, $5, $6, 'TZS', 'PENDING_REVIEW')`,
            [
              event.event_id,
              savingRate,
              savedUnits,
              netUnitsToCustomer,
              dto.providerUnitValueTzs,
              savedValueTzs,
            ],
          );

          const conversion = await this.selectResourceConversionByEventId(
            manager,
            event.event_id,
          );

          await this.auditLogsService.record(manager, {
            memberId: null,
            actionType: 'telecom.resource_conversion_pending_review',
            affectedTable: 'telecom_resource_conversion_events',
            affectedRecordId: event.event_id,
            newValue: {
              operatorId,
              resourceType: dto.resourceType,
              phoneNumber: dto.phoneNumber,
              externalTransactionId: dto.externalTransactionId,
              reason:
                'No active member found with that phone number for this operator',
              signatureVerified,
            },
            ipAddress,
          });

          return {
            duplicate: false,
            matched: false,
            status: 'PENDING_REVIEW' as const,
            conversion: conversion
              ? mapTelecomResourceConversionRow(conversion)
              : null,
            netUnitsToCustomer,
          };
        }

        const [event] = await manager.query<{ event_id: number }[]>(
          `INSERT INTO telecom_resource_conversion_events
             (external_transaction_id, member_id, phone_number, phone_id, telecom_operator_id,
              resource_type, gross_units, unit, conversion_timestamp)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           RETURNING event_id`,
          [
            dto.externalTransactionId,
            phone.user_id,
            dto.phoneNumber,
            phone.phone_id,
            operatorId,
            dto.resourceType,
            dto.grossUnits,
            dto.unit,
            new Date(dto.conversionTimestamp),
          ],
        );

        await manager.query(
          `INSERT INTO telecom_resource_usage_splits
             (event_id, saving_rate, saved_units, net_units_to_customer,
              provider_unit_value_tzs, saved_value_tzs, currency, status)
           VALUES ($1, $2, $3, $4, $5, $6, 'TZS', 'PENDING')`,
          [
            event.event_id,
            savingRate,
            savedUnits,
            netUnitsToCustomer,
            dto.providerUnitValueTzs,
            savedValueTzs,
          ],
        );

        const conversionId = event.event_id;

        const internalReference = this.generateInternalReference('RSC');
        const referenceNumber = buildResourceConversionReference(
          dto.resourceType,
          dto.externalTransactionId,
        );

        const [contribution] = await manager.query<ContributionRow[]>(
          `INSERT INTO telecom_contributions
             (member_id, phone_id, operator_id, contribution_amount, contribution_source,
              reference_number, internal_reference, processing_status, currency)
           VALUES ($1, $2, $3, $4, $5, $6, $7, 'Received', 'TZS')
           RETURNING contribution_id, reference_number, internal_reference, contribution_amount, contribution_source, processing_status, contribution_date`,
          [
            phone.user_id,
            phone.phone_id,
            operatorId,
            savedValueTzs,
            dto.resourceType,
            referenceNumber,
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
            savedValueTzs,
            {
              contributionId: contribution.contribution_id,
              transactionType: `Saving - ${dto.resourceType} Resource Conversion`,
              transactionReference: referenceNumber,
              remarks: `${dto.resourceType} bundle conversion — ${savedUnits} of ${dto.grossUnits} ${dto.unit} saved via ${dto.phoneNumber} (webhook).`,
            },
          );

        const finalContributionStatus =
          allocation?.status === 'Allocated' ? 'Allocated' : 'Validated';
        if (finalContributionStatus === 'Allocated') {
          await manager.query(
            `UPDATE telecom_contributions SET processing_status = 'Allocated' WHERE contribution_id = $1`,
            [contribution.contribution_id],
          );
        }

        await manager.query(
          `UPDATE telecom_resource_usage_splits
           SET status = 'SUCCESSFUL', contribution_id = $2, updated_at = NOW()
           WHERE event_id = $1`,
          [conversionId, contribution.contribution_id],
        );

        const finalConversion = await this.selectResourceConversionByEventId(
          manager,
          conversionId,
        );

        await manager.query(
          `INSERT INTO saving_ledger
             (member_id, principle, source_table, source_id, contribution_id, wallet_transaction_id, rule_id, saved_value_tzs)
           VALUES ($1, 'RESOURCE_CONVERSION', 'telecom_resource_conversion_events', $2, $3, $4, $5, $6)`,
          [
            phone.user_id,
            conversionId,
            contribution.contribution_id,
            walletTransaction.walletTransactionId,
            rule.rule_id,
            savedValueTzs,
          ],
        );

        await this.auditLogsService.record(manager, {
          memberId: phone.user_id,
          actionType: 'telecom.resource_conversion_process',
          affectedTable: 'telecom_resource_conversion_events',
          affectedRecordId: conversionId,
          newValue: {
            operatorId,
            resourceType: dto.resourceType,
            grossUnits: dto.grossUnits,
            unit: dto.unit,
            savingRate,
            savedUnits,
            netUnitsToCustomer,
            providerUnitValueTzs: dto.providerUnitValueTzs,
            savedValueTzs,
            externalTransactionId: dto.externalTransactionId,
            internalReference,
            contributionId: contribution.contribution_id,
            walletTransactionId: walletTransaction.walletTransactionId,
            allocated: !!allocation,
            processingStatus: finalContributionStatus,
            signatureVerified,
          },
          ipAddress,
        });

        return {
          duplicate: false,
          matched: true,
          status: 'SUCCESSFUL' as const,
          conversion: finalConversion
            ? mapTelecomResourceConversionRow(finalConversion)
            : null,
          netUnitsToCustomer,
          contribution: {
            contributionId: contribution.contribution_id,
            referenceNumber: contribution.reference_number,
            internalReference,
            amount: savedValueTzs,
            currency: 'TZS',
            processingStatus: finalContributionStatus,
          },
          walletTransactionId: walletTransaction.walletTransactionId,
          allocation,
          signatureVerified,
        };
      });
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        const raced = await this.selectResourceConversionByIdempotencyKey(
          this.dataSource,
          operatorId,
          dto.externalTransactionId,
          dto.resourceType,
        );
        return {
          duplicate: true,
          conversion: raced ? mapTelecomResourceConversionRow(raced) : null,
          netUnitsToCustomer: raced
            ? Number(raced.net_units_to_customer)
            : netUnitsToCustomer,
        };
      }
      throw error;
    }
  }

  async listResourceConversions(
    userId: number,
    filters: { status?: string; resourceType?: string },
    page: number,
    pageSize: number,
  ) {
    const operatorId = await this.getAssignedOperatorId(userId);

    const [{ count: total }] = await this.dataSource.query<{ count: number }[]>(
      `SELECT COUNT(*)::int AS count
       FROM telecom_resource_conversion_events e
       JOIN telecom_resource_usage_splits s ON s.event_id = e.event_id
       WHERE e.telecom_operator_id = $1
         AND ($2::text IS NULL OR s.status = $2)
         AND ($3::text IS NULL OR e.resource_type = $3)`,
      [operatorId, filters.status ?? null, filters.resourceType ?? null],
    );

    const rows = await this.dataSource.query<TelecomResourceConversionRow[]>(
      `SELECT
         e.event_id AS conversion_id, e.external_transaction_id, e.member_id,
         e.phone_number, e.phone_id, e.telecom_operator_id, e.resource_type,
         e.gross_units, e.unit, s.saving_rate, s.saved_units, s.net_units_to_customer,
         s.provider_unit_value_tzs, s.saved_value_tzs, s.currency, s.status,
         s.contribution_id, e.conversion_timestamp, e.created_at, s.updated_at
       FROM telecom_resource_conversion_events e
       JOIN telecom_resource_usage_splits s ON s.event_id = e.event_id
       WHERE e.telecom_operator_id = $1
         AND ($2::text IS NULL OR s.status = $2)
         AND ($3::text IS NULL OR e.resource_type = $3)
       ORDER BY e.conversion_timestamp DESC
       LIMIT $4 OFFSET $5`,
      [
        operatorId,
        filters.status ?? null,
        filters.resourceType ?? null,
        pageSize,
        (page - 1) * pageSize,
      ],
    );

    return {
      items: rows.map(mapTelecomResourceConversionRow),
      total,
      page,
      pageSize,
    };
  }

  async getResourceConversion(userId: number, conversionId: number) {
    const operatorId = await this.getAssignedOperatorId(userId);

    const conversion = await this.selectResourceConversionByEventId(
      this.dataSource,
      conversionId,
    );

    if (!conversion || conversion.telecom_operator_id !== operatorId) {
      throw new NotFoundException('Resource conversion not found');
    }

    return mapTelecomResourceConversionRow(conversion);
  }

  async getResourceConversionsSummary(userId: number) {
    const operatorId = await this.getAssignedOperatorId(userId);

    const byType = await this.dataSource.query<
      { resource_type: string; count: number; total_saved_value: string }[]
    >(
      `SELECT e.resource_type, COUNT(*)::int AS count,
              COALESCE(SUM(s.saved_value_tzs) FILTER (WHERE s.status = 'SUCCESSFUL'), 0) AS total_saved_value
       FROM telecom_resource_conversion_events e
       JOIN telecom_resource_usage_splits s ON s.event_id = e.event_id
       WHERE e.telecom_operator_id = $1
       GROUP BY e.resource_type`,
      [operatorId],
    );

    const byStatus = await this.dataSource.query<
      { status: string; count: number }[]
    >(
      `SELECT s.status, COUNT(*)::int AS count
       FROM telecom_resource_conversion_events e
       JOIN telecom_resource_usage_splits s ON s.event_id = e.event_id
       WHERE e.telecom_operator_id = $1
       GROUP BY s.status`,
      [operatorId],
    );

    return {
      byResourceType: Object.fromEntries(
        byType.map((row) => [
          row.resource_type,
          { count: row.count, totalSavedValueTzs: row.total_saved_value },
        ]),
      ),
      byStatus: Object.fromEntries(
        byStatus.map((row) => [row.status, row.count]),
      ),
    };
  }

  // =====================================================
  // Principle 2 — Outgoing Transaction Diversion
  // (telecom_outgoing_transaction_events + outgoing_transaction_savings,
  // split from one merged table by migration 0028 — same pattern as
  // Principle 1 above)
  // =====================================================
  // Fire-and-forget: called strictly AFTER the underlying Tuma/Lipa
  // Namba/Toa/Bill Payment has already settled — this must never be in
  // a position to delay or risk a real payment. Telecom-authenticated
  // intake only in this pass (provider_type = 'TELECOM') — see
  // outgoing-transaction-diversion.types.ts.

  private async selectOutgoingDiversionByEventId(
    runner: DataSource | EntityManager,
    eventId: number,
  ): Promise<OutgoingTransactionDiversionRow | undefined> {
    const [row] = await runner.query<OutgoingTransactionDiversionRow[]>(
      `SELECT
         e.event_id AS diversion_id, e.external_transaction_id, e.member_id,
         e.phone_number, e.phone_id, e.provider_type, e.telecom_operator_id,
         e.bank_id, e.switch_provider, e.transaction_type, e.gross_amount_tzs,
         s.saving_rate, s.saved_amount_tzs, s.funding_source, s.status,
         s.contribution_id, e.transaction_timestamp, e.created_at, s.updated_at
       FROM telecom_outgoing_transaction_events e
       JOIN outgoing_transaction_savings s ON s.event_id = e.event_id
       WHERE e.event_id = $1`,
      [eventId],
    );
    return row;
  }

  private async selectOutgoingDiversionByIdempotencyKey(
    runner: DataSource | EntityManager,
    operatorId: number,
    externalTransactionId: string,
    transactionType: string,
  ): Promise<OutgoingTransactionDiversionRow | undefined> {
    const [row] = await runner.query<OutgoingTransactionDiversionRow[]>(
      `SELECT
         e.event_id AS diversion_id, e.external_transaction_id, e.member_id,
         e.phone_number, e.phone_id, e.provider_type, e.telecom_operator_id,
         e.bank_id, e.switch_provider, e.transaction_type, e.gross_amount_tzs,
         s.saving_rate, s.saved_amount_tzs, s.funding_source, s.status,
         s.contribution_id, e.transaction_timestamp, e.created_at, s.updated_at
       FROM telecom_outgoing_transaction_events e
       JOIN outgoing_transaction_savings s ON s.event_id = e.event_id
       WHERE e.provider_type = 'TELECOM' AND e.telecom_operator_id = $1
         AND e.external_transaction_id = $2 AND e.transaction_type = $3`,
      [operatorId, externalTransactionId, transactionType],
    );
    return row;
  }

  async handleOutgoingTransactionWebhook(
    operatorId: number,
    dto: WebhookOutgoingTransactionDto,
    ipAddress: string | null = null,
    signatureVerified: boolean = false,
  ) {
    const existing = await this.selectOutgoingDiversionByIdempotencyKey(
      this.dataSource,
      operatorId,
      dto.externalTransactionId,
      dto.transactionType,
    );

    if (existing) {
      return {
        duplicate: true,
        diversion: mapOutgoingTransactionDiversionRow(existing),
      };
    }

    const [rule] = await this.dataSource.query<
      { rule_id: number; rate: string; is_active: boolean }[]
    >(
      `SELECT rule_id, rate, is_active
       FROM contribution_rules
       WHERE transaction_type = $1 AND channel = 'MOBILE_MONEY_OUT' AND principle = 'TRANSACTION_DIVERSION'
         AND effective_date <= CURRENT_DATE
       ORDER BY effective_date DESC
       LIMIT 1`,
      [dto.transactionType],
    );

    // Phone lookup happens once, up front, and is reused by every
    // branch below (including SKIPPED/OPTED_OUT) so each can persist an
    // accurate member_id/phone_id.
    const [phone] = await this.dataSource.query<
      { phone_id: number; user_id: number }[]
    >(
      `SELECT phone_id, user_id FROM phone_numbers
       WHERE phone_number = $1 AND operator_id = $2 AND phone_status = 'Active'`,
      [dto.phoneNumber, operatorId],
    );

    // An inactive (or missing) rule is not an error — it means this
    // transaction type isn't commercially live yet (see design doc
    // §09: funding_source assumes a revenue-share agreement that may
    // not exist). The underlying transaction already settled either
    // way; Tujitunze just acknowledges and credits nothing. Previously
    // this returned without persisting anything — every real Tuma/Lipa/
    // Toa/BillPayment call was silently dropped with zero audit trail
    // (all 4 rules seed inactive). Now a SKIPPED row is always written.
    if (!rule || !rule.is_active) {
      const reason = rule
        ? 'Diversion rule for this transaction type is not active yet'
        : 'No diversion rule configured for this transaction type';

      try {
        const diversion = await this.dataSource.transaction(async (manager) => {
          const [event] = await manager.query<{ event_id: number }[]>(
            `INSERT INTO telecom_outgoing_transaction_events
                 (external_transaction_id, member_id, phone_number, phone_id, provider_type,
                  telecom_operator_id, transaction_type, gross_amount_tzs, transaction_timestamp)
               VALUES ($1, $2, $3, $4, 'TELECOM', $5, $6, $7, $8)
               RETURNING event_id`,
            [
              dto.externalTransactionId,
              phone?.user_id ?? null,
              dto.phoneNumber,
              phone?.phone_id ?? null,
              operatorId,
              dto.transactionType,
              dto.grossAmountTzs,
              new Date(dto.transactionTimestamp),
            ],
          );

          await manager.query(
            `INSERT INTO outgoing_transaction_savings
                 (event_id, saving_rate, saved_amount_tzs, status)
               VALUES ($1, 0, 0, 'SKIPPED')`,
            [event.event_id],
          );

          await this.auditLogsService.record(manager, {
            memberId: phone?.user_id ?? null,
            actionType: 'telecom.outgoing_diversion_skipped',
            affectedTable: 'telecom_outgoing_transaction_events',
            affectedRecordId: event.event_id,
            newValue: {
              operatorId,
              transactionType: dto.transactionType,
              phoneNumber: dto.phoneNumber,
              externalTransactionId: dto.externalTransactionId,
              reason,
              signatureVerified,
            },
            ipAddress,
          });

          return this.selectOutgoingDiversionByEventId(manager, event.event_id);
        });

        return {
          duplicate: false,
          matched: null,
          status: 'SKIPPED' as const,
          diversion: diversion
            ? mapOutgoingTransactionDiversionRow(diversion)
            : null,
          reason,
        };
      } catch (error) {
        if (!this.isUniqueViolation(error)) {
          throw error;
        }
        const raced = await this.selectOutgoingDiversionByIdempotencyKey(
          this.dataSource,
          operatorId,
          dto.externalTransactionId,
          dto.transactionType,
        );
        return {
          duplicate: true,
          diversion: raced ? mapOutgoingTransactionDiversionRow(raced) : null,
        };
      }
    }

    // A member who has opted out keeps the diversion rule from applying
    // — the transaction already settled in full regardless, so this is
    // purely "don't credit a saving", recorded distinctly from SKIPPED.
    if (phone) {
      const [consent] = await this.dataSource.query<{ consented: boolean }[]>(
        `SELECT consented FROM member_saving_consents WHERE member_id = $1`,
        [phone.user_id],
      );

      if (consent && consent.consented === false) {
        try {
          const diversion = await this.dataSource.transaction(
            async (manager) => {
              const [event] = await manager.query<{ event_id: number }[]>(
                `INSERT INTO telecom_outgoing_transaction_events
                   (external_transaction_id, member_id, phone_number, phone_id, provider_type,
                    telecom_operator_id, transaction_type, gross_amount_tzs, transaction_timestamp)
                 VALUES ($1, $2, $3, $4, 'TELECOM', $5, $6, $7, $8)
                 RETURNING event_id`,
                [
                  dto.externalTransactionId,
                  phone.user_id,
                  dto.phoneNumber,
                  phone.phone_id,
                  operatorId,
                  dto.transactionType,
                  dto.grossAmountTzs,
                  new Date(dto.transactionTimestamp),
                ],
              );

              await manager.query(
                `INSERT INTO outgoing_transaction_savings
                   (event_id, saving_rate, saved_amount_tzs, status)
                 VALUES ($1, 0, 0, 'OPTED_OUT')`,
                [event.event_id],
              );

              await this.auditLogsService.record(manager, {
                memberId: phone.user_id,
                actionType: 'telecom.outgoing_diversion_opted_out',
                affectedTable: 'telecom_outgoing_transaction_events',
                affectedRecordId: event.event_id,
                newValue: {
                  operatorId,
                  transactionType: dto.transactionType,
                  externalTransactionId: dto.externalTransactionId,
                  signatureVerified,
                },
                ipAddress,
              });

              return this.selectOutgoingDiversionByEventId(
                manager,
                event.event_id,
              );
            },
          );

          return {
            duplicate: false,
            matched: true,
            status: 'OPTED_OUT' as const,
            diversion: diversion
              ? mapOutgoingTransactionDiversionRow(diversion)
              : null,
          };
        } catch (error) {
          if (!this.isUniqueViolation(error)) {
            throw error;
          }
          const raced = await this.selectOutgoingDiversionByIdempotencyKey(
            this.dataSource,
            operatorId,
            dto.externalTransactionId,
            dto.transactionType,
          );
          return {
            duplicate: true,
            diversion: raced ? mapOutgoingTransactionDiversionRow(raced) : null,
          };
        }
      }
    }

    const savingRate = Number(rule.rate);
    const savedAmountTzs = calculateDivertedAmount(
      dto.grossAmountTzs,
      savingRate,
    );

    try {
      return await this.dataSource.transaction(async (manager) => {
        if (!phone) {
          const [event] = await manager.query<{ event_id: number }[]>(
            `INSERT INTO telecom_outgoing_transaction_events
               (external_transaction_id, member_id, phone_number, phone_id, provider_type,
                telecom_operator_id, transaction_type, gross_amount_tzs, transaction_timestamp)
             VALUES ($1, NULL, $2, NULL, 'TELECOM', $3, $4, $5, $6)
             RETURNING event_id`,
            [
              dto.externalTransactionId,
              dto.phoneNumber,
              operatorId,
              dto.transactionType,
              dto.grossAmountTzs,
              new Date(dto.transactionTimestamp),
            ],
          );

          await manager.query(
            `INSERT INTO outgoing_transaction_savings
               (event_id, saving_rate, saved_amount_tzs, status)
             VALUES ($1, $2, $3, 'PENDING_REVIEW')`,
            [event.event_id, savingRate, savedAmountTzs],
          );

          const diversion = await this.selectOutgoingDiversionByEventId(
            manager,
            event.event_id,
          );

          await this.auditLogsService.record(manager, {
            memberId: null,
            actionType: 'telecom.outgoing_diversion_pending_review',
            affectedTable: 'telecom_outgoing_transaction_events',
            affectedRecordId: event.event_id,
            newValue: {
              operatorId,
              transactionType: dto.transactionType,
              phoneNumber: dto.phoneNumber,
              externalTransactionId: dto.externalTransactionId,
              reason:
                'No active member found with that phone number for this operator',
              signatureVerified,
            },
            ipAddress,
          });

          return {
            duplicate: false,
            matched: false,
            status: 'PENDING_REVIEW' as const,
            diversion: diversion
              ? mapOutgoingTransactionDiversionRow(diversion)
              : null,
          };
        }

        const [event] = await manager.query<{ event_id: number }[]>(
          `INSERT INTO telecom_outgoing_transaction_events
             (external_transaction_id, member_id, phone_number, phone_id, provider_type, telecom_operator_id,
              transaction_type, gross_amount_tzs, transaction_timestamp)
           VALUES ($1, $2, $3, $4, 'TELECOM', $5, $6, $7, $8)
           RETURNING event_id`,
          [
            dto.externalTransactionId,
            phone.user_id,
            dto.phoneNumber,
            phone.phone_id,
            operatorId,
            dto.transactionType,
            dto.grossAmountTzs,
            new Date(dto.transactionTimestamp),
          ],
        );

        await manager.query(
          `INSERT INTO outgoing_transaction_savings
             (event_id, saving_rate, saved_amount_tzs, status)
           VALUES ($1, $2, $3, 'PENDING')`,
          [event.event_id, savingRate, savedAmountTzs],
        );

        const diversionId = event.event_id;

        const internalReference = this.generateInternalReference('DIV');
        const referenceNumber = buildDiversionReference(
          dto.transactionType,
          dto.externalTransactionId,
        );

        const [contribution] = await manager.query<ContributionRow[]>(
          `INSERT INTO telecom_contributions
             (member_id, phone_id, operator_id, contribution_amount, contribution_source,
              reference_number, internal_reference, processing_status, currency)
           VALUES ($1, $2, $3, $4, $5, $6, $7, 'Received', 'TZS')
           RETURNING contribution_id, reference_number, internal_reference, contribution_amount, contribution_source, processing_status, contribution_date`,
          [
            phone.user_id,
            phone.phone_id,
            operatorId,
            savedAmountTzs,
            dto.transactionType,
            referenceNumber,
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
            savedAmountTzs,
            {
              contributionId: contribution.contribution_id,
              transactionType: `Saving - ${dto.transactionType} Diversion`,
              transactionReference: referenceNumber,
              remarks: `${dto.transactionType} outgoing transaction — ${(savingRate * 100).toFixed(2)}% of ${dto.grossAmountTzs} TZS diverted via ${dto.phoneNumber} (webhook).`,
            },
          );

        const finalContributionStatus =
          allocation?.status === 'Allocated' ? 'Allocated' : 'Validated';
        if (finalContributionStatus === 'Allocated') {
          await manager.query(
            `UPDATE telecom_contributions SET processing_status = 'Allocated' WHERE contribution_id = $1`,
            [contribution.contribution_id],
          );
        }

        await manager.query(
          `UPDATE outgoing_transaction_savings
           SET status = 'SUCCESSFUL', contribution_id = $2, updated_at = NOW()
           WHERE event_id = $1`,
          [diversionId, contribution.contribution_id],
        );

        const finalDiversion = await this.selectOutgoingDiversionByEventId(
          manager,
          diversionId,
        );

        await manager.query(
          `INSERT INTO saving_ledger
             (member_id, principle, source_table, source_id, contribution_id, wallet_transaction_id, rule_id, saved_value_tzs)
           VALUES ($1, 'TRANSACTION_DIVERSION', 'telecom_outgoing_transaction_events', $2, $3, $4, $5, $6)`,
          [
            phone.user_id,
            diversionId,
            contribution.contribution_id,
            walletTransaction.walletTransactionId,
            rule.rule_id,
            savedAmountTzs,
          ],
        );

        await this.auditLogsService.record(manager, {
          memberId: phone.user_id,
          actionType: 'telecom.outgoing_diversion_process',
          affectedTable: 'telecom_outgoing_transaction_events',
          affectedRecordId: diversionId,
          newValue: {
            operatorId,
            transactionType: dto.transactionType,
            grossAmountTzs: dto.grossAmountTzs,
            savingRate,
            savedAmountTzs,
            externalTransactionId: dto.externalTransactionId,
            internalReference,
            contributionId: contribution.contribution_id,
            walletTransactionId: walletTransaction.walletTransactionId,
            allocated: !!allocation,
            processingStatus: finalContributionStatus,
            signatureVerified,
          },
          ipAddress,
        });

        return {
          duplicate: false,
          matched: true,
          status: 'SUCCESSFUL' as const,
          diversion: finalDiversion
            ? mapOutgoingTransactionDiversionRow(finalDiversion)
            : null,
          contribution: {
            contributionId: contribution.contribution_id,
            referenceNumber: contribution.reference_number,
            internalReference,
            amount: savedAmountTzs,
            currency: 'TZS',
            processingStatus: finalContributionStatus,
          },
          walletTransactionId: walletTransaction.walletTransactionId,
          allocation,
          signatureVerified,
        };
      });
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        const raced = await this.selectOutgoingDiversionByIdempotencyKey(
          this.dataSource,
          operatorId,
          dto.externalTransactionId,
          dto.transactionType,
        );
        return {
          duplicate: true,
          diversion: raced ? mapOutgoingTransactionDiversionRow(raced) : null,
        };
      }
      throw error;
    }
  }

  async listOutgoingDiversions(
    userId: number,
    filters: { status?: string; transactionType?: string },
    page: number,
    pageSize: number,
  ) {
    const operatorId = await this.getAssignedOperatorId(userId);

    const [{ count: total }] = await this.dataSource.query<{ count: number }[]>(
      `SELECT COUNT(*)::int AS count
       FROM telecom_outgoing_transaction_events e
       JOIN outgoing_transaction_savings s ON s.event_id = e.event_id
       WHERE e.provider_type = 'TELECOM' AND e.telecom_operator_id = $1
         AND ($2::text IS NULL OR s.status = $2)
         AND ($3::text IS NULL OR e.transaction_type = $3)`,
      [operatorId, filters.status ?? null, filters.transactionType ?? null],
    );

    const rows = await this.dataSource.query<OutgoingTransactionDiversionRow[]>(
      `SELECT
         e.event_id AS diversion_id, e.external_transaction_id, e.member_id,
         e.phone_number, e.phone_id, e.provider_type, e.telecom_operator_id,
         e.bank_id, e.switch_provider, e.transaction_type, e.gross_amount_tzs,
         s.saving_rate, s.saved_amount_tzs, s.funding_source, s.status,
         s.contribution_id, e.transaction_timestamp, e.created_at, s.updated_at
       FROM telecom_outgoing_transaction_events e
       JOIN outgoing_transaction_savings s ON s.event_id = e.event_id
       WHERE e.provider_type = 'TELECOM' AND e.telecom_operator_id = $1
         AND ($2::text IS NULL OR s.status = $2)
         AND ($3::text IS NULL OR e.transaction_type = $3)
       ORDER BY e.transaction_timestamp DESC
       LIMIT $4 OFFSET $5`,
      [
        operatorId,
        filters.status ?? null,
        filters.transactionType ?? null,
        pageSize,
        (page - 1) * pageSize,
      ],
    );

    return {
      items: rows.map(mapOutgoingTransactionDiversionRow),
      total,
      page,
      pageSize,
    };
  }

  async getOutgoingDiversionsSummary(userId: number) {
    const operatorId = await this.getAssignedOperatorId(userId);

    const byType = await this.dataSource.query<
      { transaction_type: string; count: number; total_saved_amount: string }[]
    >(
      `SELECT e.transaction_type, COUNT(*)::int AS count,
              COALESCE(SUM(s.saved_amount_tzs) FILTER (WHERE s.status = 'SUCCESSFUL'), 0) AS total_saved_amount
       FROM telecom_outgoing_transaction_events e
       JOIN outgoing_transaction_savings s ON s.event_id = e.event_id
       WHERE e.provider_type = 'TELECOM' AND e.telecom_operator_id = $1
       GROUP BY e.transaction_type`,
      [operatorId],
    );

    const byStatus = await this.dataSource.query<
      { status: string; count: number }[]
    >(
      `SELECT s.status, COUNT(*)::int AS count
       FROM telecom_outgoing_transaction_events e
       JOIN outgoing_transaction_savings s ON s.event_id = e.event_id
       WHERE e.provider_type = 'TELECOM' AND e.telecom_operator_id = $1
       GROUP BY s.status`,
      [operatorId],
    );

    return {
      byTransactionType: Object.fromEntries(
        byType.map((row) => [
          row.transaction_type,
          { count: row.count, totalSavedAmountTzs: row.total_saved_amount },
        ]),
      ),
      byStatus: Object.fromEntries(
        byStatus.map((row) => [row.status, row.count]),
      ),
    };
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
