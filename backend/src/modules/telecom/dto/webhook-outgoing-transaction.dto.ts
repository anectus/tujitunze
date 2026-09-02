import {
  IsIn,
  IsISO8601,
  IsNumber,
  IsObject,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';

import { BaseWebhookEventDto } from './base-webhook-event.dto';

// Principle 2 webhook payload — a telecom operator reporting one of
// its own mobile-money rail's OUTGOING transactions (Tuma/Lipa Namba/
// Toa/Bill Payment) after it has already settled. Fire-and-forget,
// unlike WebhookResourceConversionDto: Tujitunze must never delay or
// place a real payment at risk, so this call happens strictly
// post-settlement and the diversion is credited on top, not withheld.
// See outgoing-transaction-diversion.types.ts for the full model.
//
// operatorId (on the base class) is deliberately the only provider
// identity accepted right now — bank_id/switch_provider exist on the
// DB row for a future, separately-authenticated intake path, not this
// one.
export class WebhookOutgoingTransactionDto extends BaseWebhookEventDto {
  @IsIn(['TUMA', 'LIPA_NAMBA', 'TOA', 'BILL_PAYMENT'])
  transactionType!: 'TUMA' | 'LIPA_NAMBA' | 'TOA' | 'BILL_PAYMENT';

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  grossAmountTzs!: number;

  @IsISO8601()
  transactionTimestamp!: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  providerReference?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
