import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { Throttle } from '@nestjs/throttler';

import { TelecomService } from './telecom.service';
import { WebhookContributionDto } from './dto/webhook-contribution.dto';
import { WebhookUsageEventDto } from './dto/webhook-usage-event.dto';
import { TelecomApiKeyGuard } from './guards/telecom-api-key.guard';
import { TelecomWebhookSignatureGuard } from './guards/telecom-webhook-signature.guard';

// Deliberately a SEPARATE controller from TelecomController, not an
// extra route on it: TelecomController carries class-level
// @UseGuards(JwtAuthGuard, RolesGuard) for HSIMS staff sessions, and
// guards accumulate rather than override in Nest — a webhook call (no
// JWT at all) would be rejected by those before TelecomApiKeyGuard ever
// ran. This controller carries ONLY the API-key guard, matching what an
// operator's own backend actually sends.
//
// SANDBOX ADAPTER NOTE: this is TUJITUNZE's authenticated intake boundary
// for an operator AIRTIME/TELECOM event. It records the event and starts a
// separate M-Pesa collection; the event itself is never treated as proof
// of money movement. Wallet credit and insurance allocation happen only
// after Vodacom confirms the linked C2B payment.
@Controller('telecom/webhooks')
@UseGuards(TelecomApiKeyGuard)
export class TelecomWebhooksController {
  constructor(private readonly telecomService: TelecomService) {}

  // 60/min per IP — a real integration may deliver in bursts; tighter
  // than that risks dropping legitimate traffic, looser risks abuse of
  // an endpoint that (once authenticated) writes financial records.
  //
  // TelecomWebhookSignatureGuard runs after the class-level API-key
  // guard (Nest executes class guards before method guards), matching
  // AUTHENTICATION -> SIGNATURE VERIFICATION -> REPLAY PROTECTION.
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  @UseGuards(TelecomWebhookSignatureGuard)
  @Post('contribution')
  async contribution(
    @Body() body: WebhookContributionDto,
    @Req()
    request: Request & {
      telecomOperatorId: number;
      telecomWebhookSignatureVerified?: boolean;
    },
  ) {
    return this.telecomService.handleContributionWebhook(
      request.telecomOperatorId,
      body,
      request.ip,
      request.telecomWebhookSignatureVerified ?? false,
    );
  }

  // Model B usage-contribution intake (6% of qualifying VOICE/SMS/DATA
  // usage) — same guard chain, throttle, and idempotent/replay-safe
  // shape as the contribution endpoint above, just a distinct payload
  // and a direct-credit processing path (see
  // TelecomService.handleUsageEventWebhook).
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  @UseGuards(TelecomWebhookSignatureGuard)
  @Post('usage')
  async usage(
    @Body() body: WebhookUsageEventDto,
    @Req()
    request: Request & {
      telecomOperatorId: number;
      telecomWebhookSignatureVerified?: boolean;
    },
  ) {
    return this.telecomService.handleUsageEventWebhook(
      request.telecomOperatorId,
      body,
      request.ip,
      request.telecomWebhookSignatureVerified ?? false,
    );
  }
}
