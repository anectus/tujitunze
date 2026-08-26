import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { Throttle } from '@nestjs/throttler';

import { TelecomService } from './telecom.service';
import { WebhookContributionDto } from './dto/webhook-contribution.dto';
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
// SANDBOX ADAPTER NOTE: this is TUJITUNZE's real intake boundary for the
// AIRTIME/TELECOM contribution channel — full authentication, signature
// verification, replay protection, idempotency, member identification,
// contribution creation, and insurance allocation all run for real (see
// TelecomService.handleContributionWebhook and
// TelecomWebhookSignatureGuard). What is NOT real: there is no live
// connection to an actual telecom operator's billing/payment rail behind
// it, because no real operator API credentials exist in this
// environment (same caveat CLAUDE.md's Known Security Gap #8 already
// documents for the wallet ledger generally). Until a specific operator
// is contracted and this endpoint is pointed at their real webhook
// delivery, every call here is necessarily a simulated/sandbox event —
// authenticated and recorded exactly like a real one, but asserting a
// transaction the actual telecom network never processed. Do not
// represent this as production money movement.
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
}
