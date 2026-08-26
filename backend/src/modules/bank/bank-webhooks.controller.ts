import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { Throttle } from '@nestjs/throttler';

import { BankService } from './bank.service';
import { WebhookTransactionDto } from './dto/webhook-transaction.dto';
import { BankApiKeyGuard } from './guards/bank-api-key.guard';
import { BankWebhookSignatureGuard } from './guards/bank-webhook-signature.guard';

// Separate from BankController for the same reason as
// TelecomWebhooksController — BankController's class-level
// JwtAuthGuard/RolesGuard would reject a machine-to-machine call before
// BankApiKeyGuard ever ran.
//
// SANDBOX ADAPTER NOTE: this is TUJITUNZE's real intake boundary for the
// BANK TRANSFER contribution channel — authentication, signature
// verification, replay protection, idempotency, member identification,
// contribution creation, and insurance allocation all run for real (see
// BankService.handleTransactionWebhook and BankWebhookSignatureGuard).
// What is NOT real: there is no live connection to an actual bank's
// payment rail behind it, because no real bank API credentials exist in
// this environment (same caveat CLAUDE.md's Known Security Gap #8
// already documents). Until a specific bank is contracted and this
// endpoint is pointed at their real webhook delivery, every call here is
// necessarily a simulated/sandbox event — authenticated and recorded
// exactly like a real one, but asserting a transfer the actual bank
// never processed. Do not represent this as production money movement.
@Controller('bank/webhooks')
@UseGuards(BankApiKeyGuard)
export class BankWebhooksController {
  constructor(private readonly bankService: BankService) {}

  // BankWebhookSignatureGuard runs after the class-level API-key guard
  // (Nest executes class guards before method guards), matching
  // AUTHENTICATION -> SIGNATURE VERIFICATION -> REPLAY PROTECTION.
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  @UseGuards(BankWebhookSignatureGuard)
  @Post('transaction')
  async transaction(
    @Body() body: WebhookTransactionDto,
    @Req()
    request: Request & {
      bankId: number;
      bankWebhookSignatureVerified?: boolean;
    },
  ) {
    return this.bankService.handleTransactionWebhook(
      request.bankId,
      body,
      request.ip,
      request.bankWebhookSignatureVerified ?? false,
    );
  }
}
