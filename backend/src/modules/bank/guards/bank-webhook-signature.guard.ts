import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as crypto from 'crypto';
import type { Request } from 'express';

// Bank's mirror of TelecomWebhookSignatureGuard — second boundary layer
// behind BankApiKeyGuard (class-level guards run before method-level
// ones, so bankId is already set on the request by the time this runs):
// AUTHENTICATION -> SIGNATURE VERIFICATION -> REPLAY PROTECTION.
//
// Reuses banks.webhook_secret exactly as already stored by
// BankService.configureWebhook() — no new secret column, no hardcoded
// credential, same "shared secret works both signing directions" reuse
// TelecomWebhookSignatureGuard already established.
//
// Signature is verified "where supported": a bank that has never called
// POST /bank/operator/webhook (BankController's configureWebhook route)
// has no secret on file, so it authenticates on the API key alone,
// exactly as before this guard existed. Once a secret IS on file, every
// call must carry a valid, fresh one.
//
// Same Stripe-style scheme as Telecom's, deliberately kept identical
// rather than bank-specific, so both channels are one predictable
// integration pattern for a partner to implement:
//   X-Bank-Signature: t=<unix_ms>,v1=<hex hmac-sha256>
// where v1 = HMAC-SHA256(webhook_secret, `${t}.${rawBody}`).
@Injectable()
export class BankWebhookSignatureGuard implements CanActivate {
  constructor(private readonly dataSource: DataSource) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<
      Request & {
        bankId: number;
        bankWebhookSignatureVerified?: boolean;
        rawBody?: Buffer;
      }
    >();

    const bankId = request.bankId;

    const [bank] = await this.dataSource.query<
      { webhook_secret: string | null }[]
    >(`SELECT webhook_secret FROM banks WHERE bank_id = $1`, [bankId]);

    if (!bank?.webhook_secret) {
      request.bankWebhookSignatureVerified = false;
      return true;
    }

    const header = request.header('x-bank-signature');
    if (!header) {
      throw new UnauthorizedException(
        'Missing X-Bank-Signature header (required once a webhook secret is configured)',
      );
    }

    const parts = Object.fromEntries(
      header
        .split(',')
        .map((pair) => pair.trim().split('='))
        .filter((pair): pair is [string, string] => pair.length === 2),
    );

    const timestampRaw = parts.t;
    const signature = parts.v1;
    if (!timestampRaw || !signature) {
      throw new UnauthorizedException('Malformed X-Bank-Signature header');
    }

    const timestampMs = Number(timestampRaw);
    if (!Number.isFinite(timestampMs)) {
      throw new UnauthorizedException('Malformed X-Bank-Signature header');
    }

    const toleranceMs = Number(
      process.env.BANK_WEBHOOK_REPLAY_TOLERANCE_MS ?? 300_000,
    );
    if (Math.abs(Date.now() - timestampMs) > toleranceMs) {
      throw new UnauthorizedException(
        'Webhook signature timestamp is outside the allowed window — request rejected as a possible replay',
      );
    }

    const rawBody = request.rawBody
      ? request.rawBody.toString('utf8')
      : JSON.stringify(request.body ?? {});

    const expected = crypto
      .createHmac('sha256', bank.webhook_secret)
      .update(`${timestampRaw}.${rawBody}`)
      .digest('hex');

    const expectedBuffer = Buffer.from(expected, 'utf8');
    const providedBuffer = Buffer.from(signature, 'utf8');

    const valid =
      expectedBuffer.length === providedBuffer.length &&
      crypto.timingSafeEqual(expectedBuffer, providedBuffer);

    if (!valid) {
      throw new UnauthorizedException('Invalid webhook signature');
    }

    request.bankWebhookSignatureVerified = true;
    return true;
  }
}
