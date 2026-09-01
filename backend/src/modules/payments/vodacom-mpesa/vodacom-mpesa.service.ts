import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  isVodacomMpesaConfigured,
  loadVodacomMpesaConfig,
} from './vodacom-mpesa.config';
import { VodacomMpesaHttpService } from './vodacom-mpesa-http.service';
import { VodacomTransactionRecorder } from './vodacom-transaction-recorder.service';
import {
  B2BPaymentRequest,
  B2CPaymentRequest,
  C2BPaymentRequest,
  GenerateSessionResult,
  MpesaApiClient,
  MpesaTransactionResult,
  MpesaTransactionStatus,
  ReversalRequest,
  TransactionStatusQuery,
  VodacomEndpointNotDocumentedError,
} from './vodacom-mpesa.types';
import { PaymentTransaction } from '../payment-transaction.types';

// Concrete Vodacom M-Pesa adapter — implements the provider-agnostic
// MpesaApiClient interface. Real, tested behavior: config validation
// (fails closed with ServiceUnavailableException exactly like this
// project's existing SmsService does for an unconfigured provider —
// see backend/src/modules/auth/sms.service.ts), idempotency-checked
// transaction persistence via VodacomTransactionRecorder, and
// structured logging with a correlation ID. NOT implemented: the
// actual Vodacom wire call for any operation, because no verified
// endpoint path, header/signing scheme, or request/response field
// mapping exists in this repository (see the config file's header
// note and VodacomEndpointNotDocumentedError). Each method reaches
// that boundary only after everything genuinely knowable today
// (config, idempotency, persistence) has run for real.
@Injectable()
export class VodacomMpesaService implements MpesaApiClient {
  private readonly logger = new Logger(VodacomMpesaService.name);

  constructor(
    private readonly httpService: VodacomMpesaHttpService,
    private readonly configService: ConfigService,
    private readonly recorder: VodacomTransactionRecorder,
  ) {}

  private assertConfigured(): void {
    const config = loadVodacomMpesaConfig(this.configService);
    if (!isVodacomMpesaConfigured(config)) {
      throw new ServiceUnavailableException(
        'Vodacom M-Pesa integration is not configured.',
      );
    }
  }

  // Idempotent-replay mapping: an existing payment_transactions row's
  // full PaymentStatus (which includes states like REVERSED/
  // PENDING_REVIEW that no code path in this module writes yet, but
  // that other future writers to this shared table might) collapsed
  // into the narrower MpesaTransactionResult contract. Only INITIATED/
  // PENDING/SUCCESSFUL map to themselves; anything else is reported as
  // FAILED from this client's point of view — safe by construction,
  // since this method's caller only cares "did my payment succeed",
  // and every non-success state here has already been recorded in
  // full, unlossy detail on the payment_transactions row itself.
  private toIdempotentResult(
    transaction: PaymentTransaction,
  ): MpesaTransactionResult {
    const status: MpesaTransactionStatus =
      transaction.status === 'INITIATED' ||
      transaction.status === 'PENDING' ||
      transaction.status === 'SUCCESSFUL'
        ? transaction.status
        : 'FAILED';

    return {
      internalReference: transaction.internalReference,
      providerTransactionId: transaction.externalTransactionId,
      status,
      failureReason: transaction.failureReason,
      rawResponse: transaction.rawReference,
    };
  }

  // `async` is deliberate here despite no `await`: it makes
  // assertConfigured()'s synchronous throw surface as a rejected
  // Promise (matching this method's declared Promise-returning
  // interface and what callers using `await`/`.rejects` correctly
  // expect), not an immediate synchronous exception at the call site.
  // Will gain a real `await` once generateSession() is implemented.
  // eslint-disable-next-line @typescript-eslint/require-await
  async generateSession(): Promise<GenerateSessionResult> {
    this.assertConfigured();
    throw new VodacomEndpointNotDocumentedError('generateSession');
  }

  async createC2BPayment(
    request: C2BPaymentRequest,
  ): Promise<MpesaTransactionResult> {
    const existing = await this.recorder.findByInternalReference(
      request.internalReference,
    );
    if (existing) {
      this.logger.log(
        `Idempotent replay: internalReference=${request.internalReference} already recorded as ${existing.status} — returning existing result, not reprocessing.`,
      );
      return this.toIdempotentResult(existing);
    }

    this.assertConfigured();

    const operatorId = await this.recorder.getVodacomOperatorId();
    const transaction = await this.recorder.recordInitiated({
      internalReference: request.internalReference,
      memberId: request.memberId,
      telecomOperatorId: operatorId,
      amount: request.amount,
      currency: request.currency,
      transactionType: 'C2B',
    });

    const correlationId = this.httpService.generateCorrelationId();
    this.logger.log(
      `C2B payment initiation attempted: correlationId=${correlationId} internalReference=${request.internalReference} amount=${request.amount} ${request.currency}`,
    );

    try {
      throw new VodacomEndpointNotDocumentedError('C2B');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      await this.recorder.recordFailure(
        transaction.paymentTransactionId,
        message,
        null,
      );
      throw error;
    }
  }

  async createB2CPayment(
    request: B2CPaymentRequest,
  ): Promise<MpesaTransactionResult> {
    const existing = await this.recorder.findByInternalReference(
      request.internalReference,
    );
    if (existing) {
      return this.toIdempotentResult(existing);
    }

    this.assertConfigured();

    const operatorId = await this.recorder.getVodacomOperatorId();
    const transaction = await this.recorder.recordInitiated({
      internalReference: request.internalReference,
      memberId: request.memberId,
      telecomOperatorId: operatorId,
      amount: request.amount,
      currency: request.currency,
      transactionType: 'B2C',
    });

    try {
      throw new VodacomEndpointNotDocumentedError('B2C');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      await this.recorder.recordFailure(
        transaction.paymentTransactionId,
        message,
        null,
      );
      throw error;
    }
  }

  async createB2BPayment(
    request: B2BPaymentRequest,
  ): Promise<MpesaTransactionResult> {
    const existing = await this.recorder.findByInternalReference(
      request.internalReference,
    );
    if (existing) {
      return this.toIdempotentResult(existing);
    }

    this.assertConfigured();

    const operatorId = await this.recorder.getVodacomOperatorId();
    const transaction = await this.recorder.recordInitiated({
      internalReference: request.internalReference,
      memberId: null,
      telecomOperatorId: operatorId,
      amount: request.amount,
      currency: request.currency,
      transactionType: 'B2B',
    });

    try {
      throw new VodacomEndpointNotDocumentedError('B2B');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      await this.recorder.recordFailure(
        transaction.paymentTransactionId,
        message,
        null,
      );
      throw error;
    }
  }

  // Read-only/idempotent — safe to implement without a persistence
  // side-effect of its own (it reports on an EXISTING transaction, it
  // doesn't create one). `async` with no `await` is deliberate here —
  // see generateSession()'s note above.
  // eslint-disable-next-line @typescript-eslint/require-await
  async queryTransaction(
    query: TransactionStatusQuery,
  ): Promise<MpesaTransactionResult> {
    this.assertConfigured();
    this.logger.log(
      `Transaction status query attempted for providerTransactionId=${query.providerTransactionId}`,
    );
    throw new VodacomEndpointNotDocumentedError('QUERY');
  }

  // `async` with no `await` is deliberate here — see generateSession()'s
  // note above.
  // eslint-disable-next-line @typescript-eslint/require-await
  async reverseTransaction(
    request: ReversalRequest,
  ): Promise<MpesaTransactionResult> {
    this.assertConfigured();
    this.logger.log(
      `Reversal attempted for internalReference=${request.internalReference}`,
    );
    throw new VodacomEndpointNotDocumentedError('REVERSAL');
  }
}
