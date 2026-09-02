import { IsIn, IsNumber, IsPositive } from 'class-validator';

import { BaseWebhookEventDto } from './base-webhook-event.dto';

// operatorId/phoneNumber/externalTransactionId are validated on the
// base class (not just consumed by TelecomApiKeyGuard) so a
// malformed/missing value 400s before the guard ever runs a DB lookup
// against it.
export class WebhookContributionDto extends BaseWebhookEventDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  transactionAmount!: number;

  @IsIn(['Airtime', 'Data Bundle', 'Mobile Money Transfer'])
  transactionType!: string;
}
