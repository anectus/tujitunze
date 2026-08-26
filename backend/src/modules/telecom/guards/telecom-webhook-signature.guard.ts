import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as crypto from 'crypto';
import type { Request } from 'express';

// Second boundary layer behind TelecomApiKeyGuard (class-level guards run
// before method-level ones, so telecomOperatorId is already set on the
// request by the time this runs): AUTHENTICATION -> SIGNATURE
// VERIFICATION -> REPLAY PROTECTION from the CLAUDE.md-specified pipeline.
//
// Reuses telecom_operators.webhook_secret exactly as already stored by
// TelecomService.configureWebhook() — no new secret column, no
// hardcoded credential. That column was originally described (migration
// 0005) as "what HSIMS signs OUTGOING deliveries with", but a shared
// HMAC secret works both directions: the same value that would sign an
// outgoing call is exactly what an operator's own system would use to
// sign an inbound one, so this is a genuine reuse of existing
// infrastructure, not a new secret type.
//
// Signature is verified "where supported": an operator that has never
// called POST /telecom/operator/webhook has no secret on file, so no
// signature can be required of it yet — that operator authenticates on
// the API key alone, exactly as before this guard existed. Once a
// secret IS on file, every call must carry a valid, fresh one.
//
// Scheme (Stripe-style, deliberately — well-understood, easy for a real
// operator integration to implement): header
//   X-Telecom-Signature: t=<unix_ms>,v1=<hex hmac-sha256>
// where v1 = HMAC-SHA256(webhook_secret, `${t}.${rawBody}`). Binding the
// timestamp into the signed payload is what makes the timestamp
// trustworthy for replay-window enforcement below — an attacker can't
// forge a fresher `t` without also forging v1.
@Injectable()
export class TelecomWebhookSignatureGuard implements CanActivate {
  constructor(private readonly dataSource: DataSource) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<
      Request & {
        telecomOperatorId: number;
        telecomWebhookSignatureVerified?: boolean;
        rawBody?: Buffer;
      }
    >();

    const operatorId = request.telecomOperatorId;

    const [operator] = await this.dataSource.query<
      { webhook_secret: string | null }[]
    >(
      `SELECT webhook_secret FROM telecom_operators WHERE operator_id = $1`,
      [operatorId],
    );

    if (!operator?.webhook_secret) {
      request.telecomWebhookSignatureVerified = false;
      return true;
    }

    const header = request.header('x-telecom-signature');
    if (!header) {
      throw new UnauthorizedException(
        'Missing X-Telecom-Signature header (required once a webhook secret is configured)',
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
      throw new UnauthorizedException('Malformed X-Telecom-Signature header');
    }

    const timestampMs = Number(timestampRaw);
    if (!Number.isFinite(timestampMs)) {
      throw new UnauthorizedException('Malformed X-Telecom-Signature header');
    }

    const toleranceMs = Number(
      process.env.TELECOM_WEBHOOK_REPLAY_TOLERANCE_MS ?? 300_000,
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
      .createHmac('sha256', operator.webhook_secret)
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

    request.telecomWebhookSignatureVerified = true;
    return true;
  }
}
