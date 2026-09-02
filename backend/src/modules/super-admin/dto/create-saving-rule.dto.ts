import {
  IsBoolean,
  IsIn,
  IsISO8601,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  Min,
  MaxLength,
} from 'class-validator';

// Configures a row in `contribution_rules` for the dual-mode
// micro-saving feature (see CLAUDE.md 2026-09-02 entry / design doc).
// ruleType's allowed values depend on principle (VOICE/DATA/SMS for
// RESOURCE_CONVERSION, TUMA/LIPA_NAMBA/TOA/BILL_PAYMENT for
// TRANSACTION_DIVERSION) — enforced in SuperAdminSavingRulesService
// rather than here, the same split this codebase already uses for
// CORE_ROLE_NAMES-style business rules.
export class CreateSavingRuleDto {
  @IsIn(['RESOURCE_CONVERSION', 'TRANSACTION_DIVERSION'])
  principle!: 'RESOURCE_CONVERSION' | 'TRANSACTION_DIVERSION';

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  ruleType!: string;

  // A percentage (10 means 10%), not a fraction — the service derives
  // the fraction-convention `rate` column from this so the two stay
  // consistent by construction rather than trusting two client-
  // supplied values to agree.
  @IsNumber({ maxDecimalPlaces: 4 })
  @IsPositive()
  @Max(100)
  ratePercent!: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  minimumAmount?: number;

  @IsOptional()
  @IsISO8601()
  effectiveDate?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
