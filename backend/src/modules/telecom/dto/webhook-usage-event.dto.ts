import {
  IsIn,
  IsInt,
  IsISO8601,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsPositive,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

// Model B usage-contribution webhook payload — a telecom operator's own
// system reporting one qualifying VOICE/SMS/DATA usage event for a
// registered member. Mirrors WebhookContributionDto's shape/conventions
// (operatorId validated here too so a malformed/missing value 400s
// before TelecomApiKeyGuard ever runs a DB lookup against it).
//
// providerValuationTzs is REQUIRED, not optional: Model B's core rule is
// that TUJITUNZE never invents a per-minute/per-SMS/per-MB price (see
// telecom-usage-event.types.ts) — the operator must supply the
// authorized TZS value for the contribution quantity in the same call
// that reports the usage, exactly as the business requirement's single
// "usage event -> ... -> insurance allocation" flow describes. The
// schema column itself (telecom_usage_events.provider_valuation_tzs)
// remains nullable at the DB layer to accommodate a future two-phase
// flow; this DTO's requirement is an application-layer decision, not a
// schema one.
export class WebhookUsageEventDto {
  @IsInt()
  @IsPositive()
  operatorId!: number;

  @IsString()
  @Matches(/^0[67]\d{8}$/, {
    message: "Enter the member's registered Tanzanian phone number",
  })
  phoneNumber!: string;

  @IsIn(['VOICE', 'SMS', 'DATA'])
  usageType!: 'VOICE' | 'SMS' | 'DATA';

  // Voice minutes can be fractional (e.g. a 10.5-minute call) depending
  // on what the operator reports — matches telecom_usage_events.quantity
  // NUMERIC(12,2).
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  quantity!: number;

  @IsIn(['MINUTES', 'SMS', 'MB'])
  unit!: 'MINUTES' | 'SMS' | 'MB';

  @IsISO8601()
  usageTimestamp!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  externalTransactionId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  providerReference?: string;

  // The provider-authorized TZS value for the CONTRIBUTION QUANTITY
  // (6% of the usage) — never TUJITUNZE-computed. See class doc above.
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  providerValuationTzs!: number;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
