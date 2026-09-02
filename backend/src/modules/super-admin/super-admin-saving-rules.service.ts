import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';

import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { CreateSavingRuleDto } from './dto/create-saving-rule.dto';
import { UpdateSavingRuleDto } from './dto/update-saving-rule.dto';

// The valid ruleType values per principle, and the fixed `channel`
// each principle's rows carry — see migration
// 0025_dual_mode_micro_savings.sql and the design document. Kept here
// (not in the DTO) so the 400 for an invalid combination names both
// the value AND the principle it was rejected for.
const RULE_TYPES_BY_PRINCIPLE: Record<
  'RESOURCE_CONVERSION' | 'TRANSACTION_DIVERSION',
  { ruleTypes: readonly string[]; channel: string }
> = {
  RESOURCE_CONVERSION: {
    ruleTypes: ['VOICE', 'DATA', 'SMS'],
    channel: 'TELECOM_RESOURCE',
  },
  TRANSACTION_DIVERSION: {
    ruleTypes: ['TUMA', 'LIPA_NAMBA', 'TOA', 'BILL_PAYMENT'],
    channel: 'MOBILE_MONEY_OUT',
  },
};

interface SavingRuleRow {
  rule_id: number;
  rule_type: string;
  principle: string;
  transaction_type: string | null;
  channel: string | null;
  rate_percent: string;
  rate: string;
  minimum_amount: string;
  effective_date: Date;
  effective_to: Date | null;
  is_active: boolean;
  created_at: Date;
}

function mapSavingRuleRow(row: SavingRuleRow) {
  return {
    ruleId: row.rule_id,
    ruleType: row.rule_type,
    principle: row.principle,
    transactionType: row.transaction_type,
    channel: row.channel,
    ratePercent: row.rate_percent,
    rate: row.rate,
    minimumAmount: row.minimum_amount,
    effectiveDate: row.effective_date,
    effectiveTo: row.effective_to,
    isActive: row.is_active,
    createdAt: row.created_at,
  };
}

// Closes the gap flagged since migration 0005/0019: contribution_rules
// has always been readable (GET /telecom/contribution-rules) but never
// writable through the application — "editing is a deliberately
// deferred Admin/Super-admin decision" (CLAUDE.md). This is that
// decision, scoped specifically to the two principle="..." rule
// families this feature introduces, not a general contribution_rules
// editor — the four pre-existing purchase-based rows (Airtime/Data
// Bundle/Mobile Money Transfer/Bank Transfer, principle IS NULL) are
// out of scope here and still have no write path.
@Injectable()
export class SuperAdminSavingRulesService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async listSavingRules() {
    const rows = await this.dataSource.query<SavingRuleRow[]>(
      `SELECT rule_id, rule_type, principle, transaction_type, channel,
              rate_percent, rate, minimum_amount, effective_date, effective_to,
              is_active, created_at
       FROM contribution_rules
       WHERE principle IS NOT NULL
       ORDER BY principle, rule_type, effective_date DESC`,
    );

    return rows.map(mapSavingRuleRow);
  }

  async createSavingRule(
    dto: CreateSavingRuleDto,
    actorId: number,
    ipAddress: string | null = null,
  ) {
    const spec = RULE_TYPES_BY_PRINCIPLE[dto.principle];
    const ruleType = dto.ruleType.trim().toUpperCase();

    if (!spec.ruleTypes.includes(ruleType)) {
      throw new BadRequestException(
        `"${ruleType}" is not a valid ruleType for principle ${dto.principle} — expected one of ${spec.ruleTypes.join(', ')}`,
      );
    }

    return this.dataSource.transaction(async (manager) => {
      const [existing] = await manager.query<{ rule_id: number }[]>(
        `SELECT rule_id FROM contribution_rules WHERE rule_type = $1 AND principle = $2`,
        [ruleType, dto.principle],
      );

      if (existing) {
        throw new ConflictException(
          `A ${dto.principle} rule for "${ruleType}" already exists — use PATCH to update it`,
        );
      }

      const ratePercent = dto.ratePercent;
      const rate = Math.round((ratePercent / 100) * 10000) / 10000;
      const transactionType =
        dto.principle === 'TRANSACTION_DIVERSION' ? ruleType : null;

      const [created] = await manager.query<SavingRuleRow[]>(
        `INSERT INTO contribution_rules
           (rule_type, rate_percent, rate, minimum_amount, effective_date, is_active,
            channel, principle, transaction_type)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING rule_id, rule_type, principle, transaction_type, channel,
                   rate_percent, rate, minimum_amount, effective_date, effective_to,
                   is_active, created_at`,
        [
          ruleType,
          ratePercent,
          rate,
          dto.minimumAmount ?? 0,
          dto.effectiveDate ?? new Date().toISOString().slice(0, 10),
          dto.isActive ?? true,
          spec.channel,
          dto.principle,
          transactionType,
        ],
      );

      await this.auditLogsService.record(manager, {
        memberId: actorId,
        actionType: 'saving_rule.create',
        affectedTable: 'contribution_rules',
        affectedRecordId: created.rule_id,
        newValue: mapSavingRuleRow(created),
        ipAddress,
      });

      return mapSavingRuleRow(created);
    });
  }

  async updateSavingRule(
    ruleId: number,
    dto: UpdateSavingRuleDto,
    actorId: number,
    ipAddress: string | null = null,
  ) {
    return this.dataSource.transaction(async (manager) => {
      const [existing] = await manager.query<SavingRuleRow[]>(
        `SELECT rule_id, rule_type, principle, transaction_type, channel,
                rate_percent, rate, minimum_amount, effective_date, effective_to,
                is_active, created_at
         FROM contribution_rules WHERE rule_id = $1`,
        [ruleId],
      );

      if (!existing || existing.principle === null) {
        throw new NotFoundException('Saving rule not found');
      }

      const ratePercent = dto.ratePercent ?? Number(existing.rate_percent);
      const rate =
        dto.ratePercent !== undefined
          ? Math.round((dto.ratePercent / 100) * 10000) / 10000
          : Number(existing.rate);

      const [updated] = await manager.query<SavingRuleRow[]>(
        `UPDATE contribution_rules
         SET rate_percent = $2, rate = $3, minimum_amount = $4,
             effective_date = $5, effective_to = $6, is_active = $7
         WHERE rule_id = $1
         RETURNING rule_id, rule_type, principle, transaction_type, channel,
                   rate_percent, rate, minimum_amount, effective_date, effective_to,
                   is_active, created_at`,
        [
          ruleId,
          ratePercent,
          rate,
          dto.minimumAmount ?? existing.minimum_amount,
          dto.effectiveDate ?? existing.effective_date,
          dto.effectiveTo ?? existing.effective_to,
          dto.isActive ?? existing.is_active,
        ],
      );

      await this.auditLogsService.record(manager, {
        memberId: actorId,
        actionType: 'saving_rule.update',
        affectedTable: 'contribution_rules',
        affectedRecordId: ruleId,
        oldValue: mapSavingRuleRow(existing),
        newValue: mapSavingRuleRow(updated),
        ipAddress,
      });

      return mapSavingRuleRow(updated);
    });
  }
}
