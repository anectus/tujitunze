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

// Principle 1 webhook payload — a telecom operator's own bundle-
// provisioning system reporting a member converting airtime into a
// voice/data/SMS bundle, BEFORE granting it. The response to this call
// (TelecomService.handleResourceConversionWebhook) carries
// netUnitsToCustomer — the operator provisions that, not grossUnits —
// which is what keeps the saving invisible to the member. See
// telecom-resource-conversion.types.ts for the full model.
//
// providerUnitValueTzs is REQUIRED: the operator must supply the
// authorized TZS value per unit in the same call, so Tujitunze never
// has to invent one. The DB column stays NOT NULL (unlike the removed
// feature's nullable equivalent) because this flow is synchronous —
// there is no legitimate two-phase case here the way there was for a
// fire-and-forget usage event.
export class WebhookResourceConversionDto extends BaseWebhookEventDto {
  @IsIn(['VOICE', 'DATA', 'SMS'])
  resourceType!: 'VOICE' | 'DATA' | 'SMS';

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  grossUnits!: number;

  @IsIn(['MINUTES', 'MB', 'SMS'])
  unit!: 'MINUTES' | 'MB' | 'SMS';

  @IsISO8601()
  conversionTimestamp!: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  providerReference?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  providerUnitValueTzs!: number;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
