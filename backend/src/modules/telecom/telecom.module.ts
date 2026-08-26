import { Module } from '@nestjs/common';

import { TelecomController } from './telecom.controller';
import { TelecomWebhooksController } from './telecom-webhooks.controller';
import { TelecomService } from './telecom.service';
import { TelecomApiKeyGuard } from './guards/telecom-api-key.guard';
import { TelecomWebhookSignatureGuard } from './guards/telecom-webhook-signature.guard';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { WalletsModule } from '../wallets/wallets.module';

@Module({
  imports: [AuditLogsModule, WalletsModule],
  controllers: [TelecomController, TelecomWebhooksController],
  providers: [TelecomService, TelecomApiKeyGuard, TelecomWebhookSignatureGuard],
})
export class TelecomModule {}
