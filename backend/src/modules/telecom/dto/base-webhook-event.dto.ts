import {
  IsInt,
  IsNotEmpty,
  IsPositive,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

// Normalization layer: the fields every inbound telecom webhook shares
// (operator identity, which member's phone the event is about, and the
// operator's own idempotency key for it), factored out once so
// WebhookContributionDto / WebhookResourceConversionDto /
// WebhookOutgoingTransactionDto don't each redeclare it with subtly
// different constraints. Pure refactor — no wire-format change: these
// three DTOs are not yet called by any real telecom partner (see
// CLAUDE.md), so there was no external contract to preserve, but the
// field names/validators below are exactly what each DTO already had.
export abstract class BaseWebhookEventDto {
  @IsInt()
  @IsPositive()
  operatorId!: number;

  @IsString()
  @Matches(/^0[67]\d{8}$/, {
    message: "Enter the member's registered Tanzanian phone number",
  })
  phoneNumber!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  externalTransactionId!: string;
}
