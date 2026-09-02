import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { Throttle } from '@nestjs/throttler';

import { TelecomService } from './telecom.service';
import { WebhookContributionDto } from './dto/webhook-contribution.dto';
import { WebhookResourceConversionDto } from './dto/webhook-resource-conversion.dto';
import { WebhookOutgoingTransactionDto } from './dto/webhook-outgoing-transaction.dto';
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

  // PRINCIPLE 1 — resource conversion (see design doc / CLAUDE.md
  // 2026-09-02 entry). Synchronous by design: the response's
  // netUnitsToCustomer is what the operator actually provisions, so
  // this call must complete before the operator grants anything.
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  @UseGuards(TelecomWebhookSignatureGuard)
  @Post('resource-conversion')
  async resourceConversion(
    @Body() body: WebhookResourceConversionDto,
    @Req()
    request: Request & {
      telecomOperatorId: number;
      telecomWebhookSignatureVerified?: boolean;
    },
  ) {
    return this.telecomService.handleResourceConversionWebhook(
      request.telecomOperatorId,
      body,
      request.ip,
      request.telecomWebhookSignatureVerified ?? false,
    );
  }

  // PRINCIPLE 2 — outgoing-transaction diversion. Fire-and-forget,
  // called strictly AFTER the underlying Tuma/Lipa Namba/Toa/Bill
  // Payment has already settled — this endpoint must never be in a
  // position to delay or risk a real payment.
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  @UseGuards(TelecomWebhookSignatureGuard)
  @Post('outgoing-transaction')
  async outgoingTransaction(
    @Body() body: WebhookOutgoingTransactionDto,
    @Req()
    request: Request & {
      telecomOperatorId: number;
      telecomWebhookSignatureVerified?: boolean;
    },
  ) {
    return this.telecomService.handleOutgoingTransactionWebhook(
      request.telecomOperatorId,
      body,
      request.ip,
      request.telecomWebhookSignatureVerified ?? false,
    );
  }
}
