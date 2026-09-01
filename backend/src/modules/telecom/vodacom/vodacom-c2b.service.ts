import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import * as crypto from 'crypto';

import {
  VODACOM_MPESA_C2B_COUNTRY,
  VODACOM_MPESA_C2B_CURRENCY,
  buildC2BSingleStagePath,
  buildQueryTransactionStatusPath,
  buildReversalPath,
  isVodacomMpesaC2BConfigured,
  loadVodacomMpesaConnectionConfig,
} from './vodacom-mpesa-connection.config';
import { encryptApiKeyForVodacom } from './vodacom-rsa-encryption.util';
import { VodacomSessionCacheService } from './vodacom-session-cache.service';
import {
  VodacomApiError,
  VodacomMpesaHttpService,
} from './vodacom-mpesa-http.service';
import {
  RecordOutcomeInput,
  VodacomTransactionRecorder,
} from './vodacom-transaction-recorder.service';
import { AuditLogsService } from '../../audit-logs/audit-logs.service';
import { WalletsService } from '../../wallets/wallets.service';
import { PaymentTransaction } from './payment-transaction.types';
import { ReverseMpesaTransactionDto } from '../dto/reverse-mpesa-transaction.dto';

// Verified synchronous C2B Single Stage response shape, per the official
// documentation for this integration. No other fields are assumed
// present.
interface VodacomC2BResponseBody {
  output_ResponseCode?: string;
  output_ResponseDesc?: string;
  output_TransactionID?: string;
  output_ConversationID?: string;
  output_ThirdPartyConversationID?: string;
  output_TransactionStatus?: string;
}

export type C2BContributionOutcome =
  | {
      success: true;
      status: 'SUCCESSFUL';
      internalReference: string;
      providerTransactionId: string;
      walletTransactionId: number;
    }
  | {
      success: false;
      status: 'FAILED' | 'PENDING';
      internalReference: string;
      responseCode: string | null;
      message: string;
    };

export interface VodacomC2BContributionOptions {
  contributionId?: number;
  contributionSource?: string;
  internalReference?: string;
}

type ReversalOutcome =
  | {
      success: true;
      status: 'REVERSED';
      originalPaymentTransactionId: number;
      reversalPaymentTransactionId: number;
      providerTransactionId: string;
    }
  | {
      success: false;
      status: 'FAILED' | 'PENDING';
      originalPaymentTransactionId: number;
      reversalPaymentTransactionId: number;
      message: string;
    };

const SUCCESS_CODE = 'INS-0';
const DUPLICATE_TRANSACTION_CODE = 'INS-10';
// Genuinely ambiguous per the documented code table (Internal Error /
// Request timeout) — Vodacom may or may not have actually processed the
// transaction. Must never be recorded as FAILED (that would foreclose a
// real success discovered later by reconciliation) nor as SUCCESSFUL
// (that would credit the wallet on an unconfirmed result).
const AMBIGUOUS_CODES = new Set(['INS-1', 'INS-9']);
const QUERY_SUCCESS_STATUS = new Set([
  'SUCCESS',
  'SUCCESSFUL',
  'COMPLETED',
  'COMPLETE',
]);
const QUERY_FAILURE_STATUS = new Set([
  'FAILED',
  'FAILURE',
  'REJECTED',
  'CANCELLED',
]);

function classifyResponseCode(
  responseCode: string | null,
  hasTransactionId: boolean,
  transactionStatus?: string | null,
): 'SUCCESSFUL' | 'FAILED' | 'PENDING' {
  const normalizedStatus = transactionStatus?.trim().toUpperCase();
  if (
    responseCode === SUCCESS_CODE &&
    hasTransactionId &&
    (!normalizedStatus || QUERY_SUCCESS_STATUS.has(normalizedStatus))
  ) {
    return 'SUCCESSFUL';
  }
  if (
    responseCode === SUCCESS_CODE &&
    normalizedStatus &&
    !QUERY_FAILURE_STATUS.has(normalizedStatus)
  ) {
    return 'PENDING';
  }
  if (responseCode !== null && AMBIGUOUS_CODES.has(responseCode)) {
    return 'PENDING';
  }
  // Includes INS-10 (Duplicate Transaction), every documented
  // FAILED-category code (INS-6, INS-13, INS-15/17/20/21/26/28/30,
  // INS-990..998, INS-2006, INS-2051), an HTTP 200 with INS-0 but no
  // output_TransactionID (never trust HTTP/business-code success alone
  // without a real provider transaction id), and any unrecognized code.
  return 'FAILED';
}

// Real Vodacom M-Pesa Tanzania C2B Single Stage —
// POST /sandbox/ipg/v2/vodacomTZN/c2bPayment/singleStage/, per the
// official documentation provided for this integration. Not a mock:
// when configured, this issues a genuine HTTPS request to Vodacom's
// sandbox and only credits the Health Wallet on a confirmed business
// success (INS-0 with a real output_TransactionID) — never on HTTP
// success alone.
@Injectable()
export class VodacomC2BService {
  private readonly logger = new Logger(VodacomC2BService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
    private readonly httpService: VodacomMpesaHttpService,
    private readonly sessionCache: VodacomSessionCacheService,
    private readonly recorder: VodacomTransactionRecorder,
    private readonly auditLogsService: AuditLogsService,
    private readonly walletsService: WalletsService,
  ) {}

  private generateReference(prefix: string): string {
    return `TJZ-${prefix}-${Date.now().toString(36).toUpperCase()}-${crypto
      .randomBytes(4)
      .toString('hex')}`;
  }

  private isUniqueViolation(error: unknown): boolean {
    const code =
      (error as { code?: string; driverError?: { code?: string } })?.code ??
      (error as { driverError?: { code?: string } })?.driverError?.code;
    return code === '23505';
  }

  // Resolves the MSISDN server-side from the member's OWN registered
  // Vodacom phone number — never accepted as caller-supplied input.
  // Prevents one member's contribution from ever targeting a different
  // person's phone number.
  private async resolveMemberVodacomPhone(
    memberId: number,
    vodacomOperatorId: number,
  ): Promise<{ phoneId: number; phoneNumber: string }> {
    const [phone] = await this.dataSource.query<
      { phone_id: number; phone_number: string }[]
    >(
      `SELECT phone_id, phone_number FROM phone_numbers
       WHERE user_id = $1 AND operator_id = $2 AND phone_status = 'Active'
       ORDER BY is_primary DESC, created_at DESC
       LIMIT 1`,
      [memberId, vodacomOperatorId],
    );

    if (!phone) {
      throw new BadRequestException(
        'No active Vodacom phone number is registered for this member.',
      );
    }

    return { phoneId: phone.phone_id, phoneNumber: phone.phone_number };
  }

  async assertOperatorSupported(operatorId: number): Promise<void> {
    const vodacomOperatorId = await this.recorder.getVodacomOperatorId();
    if (operatorId !== vodacomOperatorId) {
      throw new BadRequestException(
        'This airtime event is not from the configured Vodacom operator.',
      );
    }
  }

  // Non-throwing counterpart to assertOperatorSupported(), for callers
  // that need to BRANCH on whether an operator is Vodacom (real M-Pesa
  // collection rail) rather than reject every non-Vodacom caller
  // outright — e.g. TelecomService.handleContributionWebhook, which
  // still owes Airtel/Yas Money/Halotel/TTCL their existing direct-
  // credit contribution path (no real payment rail exists for them yet;
  // see CLAUDE.md's Telecom section).
  async isVodacomOperator(operatorId: number): Promise<boolean> {
    const vodacomOperatorId = await this.recorder.getVodacomOperatorId();
    return operatorId === vodacomOperatorId;
  }

  async contribute(
    memberId: number,
    amount: number,
    narration?: string,
    options: VodacomC2BContributionOptions = {},
  ): Promise<C2BContributionOutcome> {
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new BadRequestException('Amount must be a positive number.');
    }

    const roundedAmount = Math.round(amount * 100) / 100;

    const config = loadVodacomMpesaConnectionConfig(this.configService);
    if (!isVodacomMpesaC2BConfigured(config)) {
      const missing: string[] = [];
      if (!config.baseUrl) missing.push('VODACOM_MPESA_BASE_URL');
      if (!config.market) missing.push('VODACOM_MPESA_MARKET');
      if (!config.apiKey) missing.push('VODACOM_MPESA_API_KEY');
      if (!config.origin) missing.push('VODACOM_MPESA_ORIGIN');
      if (!config.publicKey) missing.push('VODACOM_MPESA_PUBLIC_KEY');
      if (!config.serviceProviderCode) {
        missing.push('VODACOM_MPESA_SERVICE_PROVIDER_CODE');
      }
      throw new ServiceUnavailableException(
        `Vodacom M-Pesa C2B is not configured. Missing: ${missing.join(', ')}.`,
      );
    }

    const operatorId = await this.recorder.getVodacomOperatorId();
    const { phoneId, phoneNumber } = await this.resolveMemberVodacomPhone(
      memberId,
      operatorId,
    );

    const internalReference =
      options.internalReference ?? this.generateReference('MPESA');
    const thirdPartyConversationId = this.generateReference('TPC');

    let transaction: PaymentTransaction;
    try {
      transaction = await this.recorder.recordInitiated({
        internalReference,
        memberId,
        telecomOperatorId: operatorId,
        contributionId: options.contributionId,
        phoneId,
        msisdn: phoneNumber,
        thirdPartyConversationId,
        amount: roundedAmount,
        currency: VODACOM_MPESA_C2B_CURRENCY,
        transactionType: 'C2B',
      });
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        const existing =
          await this.recorder.findByInternalReference(internalReference);
        if (existing) {
          const [walletTransaction] = await this.dataSource.query<
            { wallet_transaction_id: number }[]
          >(
            `SELECT wallet_transaction_id
             FROM wallet_transactions
             WHERE transaction_reference = $1
             LIMIT 1`,
            [existing.internalReference],
          );
          return this.toC2BOutcome(
            existing,
            walletTransaction?.wallet_transaction_id ?? 0,
          );
        }
        throw new ConflictException(
          'A payment transaction with this reference has already been recorded.',
        );
      }
      throw error;
    }

    let sessionKey: string;
    try {
      sessionKey = await this.sessionCache.getSessionKey();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      await this.recordFinalOutcome(
        transaction.paymentTransactionId,
        memberId,
        {
          status: 'FAILED',
          failureReason: `SessionKey unavailable: ${message}`,
          rawResponse: null,
        },
        'payment.c2b_failed',
        internalReference,
      );
      throw error;
    }

    let encryptedSessionKey: string;
    try {
      // ASSUMPTION FLAGGED FOR VERIFICATION: the same encryption function
      // used for the API Key (RSA + Vodacom's public key) is reused here
      // for the SessionKey, per the documented requirement "5. The
      // SessionKey is sent as: Authorization: Bearer [encrypted-
      // SessionKey]." Vodacom's documentation does not separately specify
      // padding for this step; see vodacom-rsa-encryption.util.ts's own
      // flagged assumption for the getSession call.
      encryptedSessionKey = encryptApiKeyForVodacom(
        sessionKey,
        config.publicKey as string,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown encryption error';
      await this.recordFinalOutcome(
        transaction.paymentTransactionId,
        memberId,
        { status: 'FAILED', failureReason: message, rawResponse: null },
        'payment.c2b_failed',
        internalReference,
      );
      return {
        success: false,
        status: 'FAILED',
        internalReference,
        responseCode: null,
        message,
      };
    }

    const correlationId = this.httpService.generateCorrelationId();
    const url = `${config.baseUrl}${buildC2BSingleStagePath(config)}`;

    this.logger.log(
      `C2B payment initiation attempted: correlationId=${correlationId} internalReference=${internalReference} amount=${roundedAmount} ${VODACOM_MPESA_C2B_CURRENCY}`,
    );

    try {
      const response = await this.httpService.request<VodacomC2BResponseBody>({
        method: 'POST',
        url,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${encryptedSessionKey}`,
          Origin: config.origin as string,
        },
        body: {
          // ASSUMPTION FLAGGED FOR VERIFICATION: field names are exactly
          // as documented; the documentation does not show an example
          // payload specifying value TYPES, so numeric fields are sent
          // as strings — the conventional serialization for this API
          // family. If the sandbox rejects the request shape itself
          // (as opposed to a business-level INS code), this is the
          // first thing to revisit.
          input_Amount: String(roundedAmount),
          input_CustomerMSISDN: phoneNumber,
          input_Country: VODACOM_MPESA_C2B_COUNTRY,
          input_Currency: VODACOM_MPESA_C2B_CURRENCY,
          input_ServiceProviderCode: config.serviceProviderCode,
          input_TransactionReference: internalReference,
          input_ThirdPartyConversationID: thirdPartyConversationId,
          input_PurchasedItemsDesc:
            narration ?? 'TUJITUNZE Health Wallet contribution',
        },
        timeoutMs: config.timeoutMs,
        // Never retried — a C2B POST may have already been received and
        // acted on by Vodacom even if TUJITUNZE never sees the response.
        // Recovery from an ambiguous outcome is reconciliation, not a
        // resend of the same request.
        retryable: false,
        maxRetries: 0,
        correlationId,
      });

      return await this.finalizeFromResponse(
        transaction.paymentTransactionId,
        memberId,
        roundedAmount,
        internalReference,
        response.body ?? {},
      );
    } catch (error) {
      return await this.finalizeFromError(
        transaction.paymentTransactionId,
        memberId,
        internalReference,
        error,
      );
    }
  }

  async reverseTransaction(
    userId: number,
    paymentTransactionId: number,
    dto: ReverseMpesaTransactionDto,
    ipAddress: string | null = null,
  ) {
    if (!dto.approved) {
      throw new BadRequestException(
        'An explicit approved business condition is required for reversal.',
      );
    }

    const [staff] = await this.dataSource.query<
      { telecom_operator_id: number | null }[]
    >(`SELECT telecom_operator_id FROM users WHERE user_id = $1`, [userId]);
    if (!staff?.telecom_operator_id) {
      throw new ForbiddenException(
        'Your account is not assigned to a telecom operator.',
      );
    }

    const original =
      await this.recorder.findByPaymentTransactionId(paymentTransactionId);
    if (
      !original ||
      original.provider !== 'VODACOM_MPESA' ||
      original.channel !== 'MOBILE_MONEY' ||
      original.telecomOperatorId !== staff.telecom_operator_id
    ) {
      throw new NotFoundException('Vodacom payment transaction not found.');
    }
    if (original.status === 'REVERSED') {
      throw new ConflictException('This payment has already been reversed.');
    }
    if (original.status !== 'SUCCESSFUL') {
      throw new BadRequestException(
        'Only a provider-confirmed successful payment can be reversed.',
      );
    }
    if (!original.externalTransactionId) {
      throw new BadRequestException(
        'The successful payment has no provider transaction ID.',
      );
    }

    const existingReversal =
      await this.recorder.findReversalByOriginalReference(
        original.internalReference,
      );
    if (existingReversal) {
      throw new ConflictException(
        'A reversal request already exists for this payment.',
      );
    }

    const config = loadVodacomMpesaConnectionConfig(this.configService);
    if (!isVodacomMpesaC2BConfigured(config)) {
      throw new ServiceUnavailableException(
        'Vodacom M-Pesa C2B is not configured.',
      );
    }

    const reversalReference = this.generateReference('REV');
    const thirdPartyConversationId = this.generateReference('TPC');
    let reversal: PaymentTransaction;
    try {
      reversal = await this.recorder.recordInitiated({
        internalReference: reversalReference,
        memberId: original.memberId,
        telecomOperatorId: original.telecomOperatorId as number,
        msisdn: original.msisdn ?? undefined,
        thirdPartyConversationId,
        amount: Number(original.amount),
        currency: original.currency,
        transactionType: 'REVERSAL',
        reversalReference: original.internalReference,
      });
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException(
          'A reversal request already exists for this payment.',
        );
      }
      throw error;
    }

    let sessionKey: string;
    try {
      sessionKey = await this.sessionCache.getSessionKey();
    } catch (error) {
      return this.recordReversalOutcome(
        reversal,
        original,
        dto.reason,
        ipAddress,
        'PENDING',
        'Unable to obtain a Vodacom SessionKey for reversal.',
        null,
      );
    }

    let encryptedSessionKey: string;
    try {
      encryptedSessionKey = encryptApiKeyForVodacom(
        sessionKey,
        config.publicKey as string,
      );
    } catch (error) {
      return this.recordReversalOutcome(
        reversal,
        original,
        dto.reason,
        ipAddress,
        'PENDING',
        'Unable to prepare the Vodacom reversal request.',
        null,
      );
    }

    const correlationId = this.httpService.generateCorrelationId();
    try {
      const response = await this.httpService.request<VodacomC2BResponseBody>({
        method: 'POST',
        url: `${config.baseUrl}${buildReversalPath(config)}`,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${encryptedSessionKey}`,
          Origin: config.origin as string,
        },
        body: {
          input_ReversalAmount: String(Number(original.amount)),
          input_Country: VODACOM_MPESA_C2B_COUNTRY,
          input_Currency: original.currency,
          input_ServiceProviderCode: config.serviceProviderCode,
          input_ThirdPartyConversationID: thirdPartyConversationId,
          input_TransactionID: original.externalTransactionId,
          input_PurchaseItemsReversal: dto.reason,
        },
        timeoutMs: config.timeoutMs,
        retryable: false,
        maxRetries: 0,
        correlationId,
      });

      return this.finalizeReversalResponse(
        reversal,
        original,
        dto.reason,
        ipAddress,
        response.body ?? {},
      );
    } catch (error) {
      const reason =
        error instanceof VodacomApiError && error.kind === 'TIMEOUT'
          ? 'Vodacom reversal timed out; provider outcome requires reconciliation.'
          : 'Vodacom reversal failed before a definitive provider result.';
      return this.recordReversalOutcome(
        reversal,
        original,
        dto.reason,
        ipAddress,
        'PENDING',
        reason,
        null,
      );
    }
  }

  async queryTransactionStatus(
    userId: number,
    paymentTransactionId: number,
  ): Promise<C2BContributionOutcome> {
    const [staff] = await this.dataSource.query<
      { telecom_operator_id: number | null }[]
    >(`SELECT telecom_operator_id FROM users WHERE user_id = $1`, [userId]);
    if (!staff?.telecom_operator_id) {
      throw new ForbiddenException(
        'Your account is not assigned to a telecom operator.',
      );
    }

    const transaction =
      await this.recorder.findByPaymentTransactionId(paymentTransactionId);
    if (
      !transaction ||
      transaction.provider !== 'VODACOM_MPESA' ||
      transaction.channel !== 'MOBILE_MONEY' ||
      transaction.transactionType !== 'C2B' ||
      transaction.status === 'REVERSED' ||
      transaction.telecomOperatorId !== staff.telecom_operator_id
    ) {
      throw new NotFoundException('Vodacom payment transaction not found.');
    }

    if (
      transaction.status === 'SUCCESSFUL' ||
      transaction.status === 'FAILED'
    ) {
      const [walletTransaction] = await this.dataSource.query<
        { wallet_transaction_id: number }[]
      >(
        `SELECT wallet_transaction_id
           FROM wallet_transactions
           WHERE transaction_reference = $1
           LIMIT 1`,
        [transaction.internalReference],
      );
      return this.toC2BOutcome(
        transaction,
        walletTransaction?.wallet_transaction_id ?? 0,
      );
    }

    const queryReference =
      transaction.externalTransactionId ??
      transaction.conversationId ??
      transaction.thirdPartyConversationId;
    if (!queryReference) {
      throw new BadRequestException(
        'This payment has no provider or conversation identifier to query.',
      );
    }

    const config = loadVodacomMpesaConnectionConfig(this.configService);
    if (!isVodacomMpesaC2BConfigured(config)) {
      throw new ServiceUnavailableException(
        'Vodacom M-Pesa C2B is not configured.',
      );
    }

    let sessionKey: string;
    try {
      sessionKey = await this.sessionCache.getSessionKey();
    } catch (error) {
      return this.recordQueryPending(
        transaction,
        `Unable to obtain a Vodacom SessionKey while querying status: ${
          error instanceof Error ? error.message : 'unknown error'
        }`,
      );
    }

    let encryptedSessionKey: string;
    try {
      encryptedSessionKey = encryptApiKeyForVodacom(
        sessionKey,
        config.publicKey as string,
      );
    } catch (error) {
      return this.recordQueryPending(
        transaction,
        `Unable to prepare the Vodacom status query: ${
          error instanceof Error ? error.message : 'unknown error'
        }`,
      );
    }

    const correlationId = this.httpService.generateCorrelationId();
    try {
      const response = await this.httpService.request<VodacomC2BResponseBody>({
        method: 'POST',
        url: `${config.baseUrl}${buildQueryTransactionStatusPath(config)}`,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${encryptedSessionKey}`,
          Origin: config.origin as string,
        },
        body: {
          input_QueryReference: queryReference,
          input_ServiceProviderCode: config.serviceProviderCode,
          input_ThirdPartyConversationID:
            transaction.thirdPartyConversationId ?? correlationId,
          input_Country: VODACOM_MPESA_C2B_COUNTRY,
        },
        timeoutMs: config.timeoutMs,
        retryable: true,
        maxRetries: config.maxRetries,
        correlationId,
      });

      return this.finalizeQueryResponse(
        transaction,
        queryReference,
        response.body ?? {},
      );
    } catch (error) {
      if (
        error instanceof VodacomApiError &&
        error.kind === 'HTTP_ERROR' &&
        (error.status === 401 || error.status === 403)
      ) {
        this.sessionCache.invalidate();
      }
      return this.recordQueryPending(
        transaction,
        error instanceof VodacomApiError && error.kind === 'TIMEOUT'
          ? 'Vodacom transaction status query timed out; outcome remains unresolved.'
          : 'Vodacom transaction status query failed before a definitive result; outcome remains unresolved.',
      );
    }
  }

  private async finalizeReversalResponse(
    reversal: PaymentTransaction,
    original: PaymentTransaction,
    reason: string,
    ipAddress: string | null,
    body: VodacomC2BResponseBody,
  ): Promise<ReversalOutcome> {
    const responseCode = body.output_ResponseCode ?? null;
    const providerTransactionId = body.output_TransactionID ?? null;
    const successful = responseCode === SUCCESS_CODE && !!providerTransactionId;
    const pending = responseCode === null || AMBIGUOUS_CODES.has(responseCode);

    if (!successful) {
      return this.recordReversalOutcome(
        reversal,
        original,
        reason,
        ipAddress,
        pending ? 'PENDING' : 'FAILED',
        pending
          ? 'Vodacom returned an unresolved reversal result.'
          : (body.output_ResponseDesc ?? 'Vodacom rejected the reversal.'),
        body,
      );
    }

    try {
      await this.dataSource.transaction(async (manager) => {
        const lockedOriginal = await this.recorder.findByPaymentTransactionId(
          original.paymentTransactionId,
          manager,
          true,
        );
        const lockedReversal = await this.recorder.findByPaymentTransactionId(
          reversal.paymentTransactionId,
          manager,
          true,
        );
        if (!lockedOriginal || !lockedReversal) {
          throw new NotFoundException('Reversal transaction no longer exists.');
        }
        if (lockedOriginal.status !== 'SUCCESSFUL') {
          throw new ConflictException(
            'The original payment is no longer eligible for reversal.',
          );
        }

        await this.recorder.recordOutcome(
          lockedReversal.paymentTransactionId,
          {
            status: 'SUCCESSFUL',
            externalTransactionId: providerTransactionId,
            conversationId: body.output_ConversationID,
            responseCode,
            responseDescription: body.output_ResponseDesc,
            reconciliationStatus: 'Reconciled',
            rawResponse: body,
          },
          manager,
        );

        const [walletCredit] = await manager.query<
          { wallet_transaction_id: number }[]
        >(
          `SELECT wallet_transaction_id
           FROM wallet_transactions
           WHERE transaction_reference = $1
           LIMIT 1`,
          [lockedOriginal.internalReference],
        );
        if (!walletCredit || !lockedOriginal.memberId) {
          throw new ConflictException(
            'The original payment has no wallet credit to compensate; reconciliation is required.',
          );
        }
        await this.walletsService.reverseContribution(
          manager,
          lockedOriginal.memberId,
          walletCredit.wallet_transaction_id,
          Number(lockedOriginal.amount),
          {
            transactionReference: lockedOriginal.internalReference,
            remarks: `Approved M-Pesa reversal: ${reason}`,
            reason: 'Reversed',
          },
        );

        await this.recorder.markReversed(
          lockedOriginal.paymentTransactionId,
          lockedReversal.internalReference,
          manager,
        );
        await this.auditLogsService.record(manager, {
          memberId: lockedOriginal.memberId,
          actionType: 'payment.c2b_reversed',
          affectedTable: 'payment_transactions',
          affectedRecordId: lockedOriginal.paymentTransactionId,
          ipAddress,
          oldValue: {
            status: lockedOriginal.status,
            externalTransactionId: lockedOriginal.externalTransactionId,
          },
          newValue: {
            status: 'REVERSED',
            reversalReference: lockedReversal.internalReference,
            providerTransactionId: lockedOriginal.externalTransactionId,
            reversalProviderTransactionId: providerTransactionId,
          },
        });
      });
    } catch {
      return this.recordReversalOutcome(
        reversal,
        original,
        reason,
        ipAddress,
        'PENDING',
        'Vodacom confirmed the reversal, but TUJITUNZE could not complete wallet compensation; manual reconciliation is required.',
        body,
      );
    }

    return {
      success: true,
      status: 'REVERSED',
      originalPaymentTransactionId: original.paymentTransactionId,
      reversalPaymentTransactionId: reversal.paymentTransactionId,
      providerTransactionId: providerTransactionId as string,
    };
  }

  private async recordReversalOutcome(
    reversal: PaymentTransaction,
    original: PaymentTransaction,
    reason: string,
    ipAddress: string | null,
    status: 'FAILED' | 'PENDING',
    message: string,
    rawResponse: unknown,
  ): Promise<ReversalOutcome> {
    await this.dataSource.transaction(async (manager) => {
      await this.recorder.recordOutcome(
        reversal.paymentTransactionId,
        {
          status,
          responseCode:
            rawResponse &&
            typeof rawResponse === 'object' &&
            'output_ResponseCode' in rawResponse
              ? String(
                  (rawResponse as { output_ResponseCode?: string })
                    .output_ResponseCode ?? '',
                )
              : null,
          responseDescription:
            rawResponse &&
            typeof rawResponse === 'object' &&
            'output_ResponseDesc' in rawResponse
              ? String(
                  (rawResponse as { output_ResponseDesc?: string })
                    .output_ResponseDesc ?? '',
                )
              : null,
          failureReason: message,
          reconciliationStatus: status === 'FAILED' ? 'Reconciled' : 'Pending',
          rawResponse,
        },
        manager,
      );
      await this.auditLogsService.record(manager, {
        memberId: original.memberId,
        actionType:
          status === 'FAILED'
            ? 'payment.c2b_reversal_failed'
            : 'payment.c2b_reversal_pending',
        affectedTable: 'payment_transactions',
        affectedRecordId: reversal.paymentTransactionId,
        ipAddress,
        newValue: {
          originalPaymentTransactionId: original.paymentTransactionId,
          originalProviderTransactionId: original.externalTransactionId,
          reversalReference: reversal.internalReference,
          reason,
          status,
        },
      });
    });
    return {
      success: false,
      status,
      originalPaymentTransactionId: original.paymentTransactionId,
      reversalPaymentTransactionId: reversal.paymentTransactionId,
      message,
    };
  }

  private toC2BOutcome(
    transaction: PaymentTransaction,
    walletTransactionId = 0,
  ): C2BContributionOutcome {
    if (transaction.status === 'SUCCESSFUL') {
      return {
        success: true,
        status: 'SUCCESSFUL',
        internalReference: transaction.internalReference,
        providerTransactionId: transaction.externalTransactionId as string,
        walletTransactionId,
      };
    }
    return {
      success: false,
      status: transaction.status === 'FAILED' ? 'FAILED' : 'PENDING',
      internalReference: transaction.internalReference,
      responseCode: transaction.responseCode,
      message: transaction.failureReason ?? 'Transaction remains unresolved.',
    };
  }

  private async finalizeQueryResponse(
    transaction: PaymentTransaction,
    queryReference: string,
    body: VodacomC2BResponseBody,
  ): Promise<C2BContributionOutcome> {
    const responseCode = body.output_ResponseCode ?? null;
    const responseDescription = body.output_ResponseDesc ?? null;
    const providerTransactionId =
      body.output_TransactionID ?? transaction.externalTransactionId;
    const statusText = body.output_TransactionStatus?.trim().toUpperCase();
    const successful =
      responseCode === SUCCESS_CODE &&
      !!providerTransactionId &&
      (!statusText || QUERY_SUCCESS_STATUS.has(statusText));
    const failed =
      responseCode !== null &&
      responseCode !== SUCCESS_CODE &&
      !AMBIGUOUS_CODES.has(responseCode) &&
      (!statusText || QUERY_FAILURE_STATUS.has(statusText));

    if (successful) {
      return this.applyConfirmedQuerySuccess(
        transaction,
        providerTransactionId as string,
        body,
      );
    }
    if (failed) {
      await this.recordFinalOutcome(
        transaction.paymentTransactionId,
        transaction.memberId,
        {
          status: 'FAILED',
          externalTransactionId: providerTransactionId,
          conversationId: body.output_ConversationID,
          responseCode,
          responseDescription,
          failureReason:
            responseDescription ?? 'Vodacom confirmed payment failure.',
          reconciliationStatus: 'Reconciled',
          rawResponse: body,
        },
        'payment.c2b_query_failed',
        transaction.internalReference,
      );
      return {
        success: false,
        status: 'FAILED',
        internalReference: transaction.internalReference,
        responseCode,
        message: responseDescription ?? 'Vodacom confirmed payment failure.',
      };
    }

    return this.recordQueryPending(
      transaction,
      `Vodacom returned an unresolved transaction status for ${queryReference}.`,
      body,
    );
  }

  private async applyConfirmedQuerySuccess(
    transaction: PaymentTransaction,
    providerTransactionId: string,
    body: VodacomC2BResponseBody,
  ): Promise<C2BContributionOutcome> {
    if (!transaction.memberId) {
      return this.recordQueryPending(
        transaction,
        'Vodacom confirmed payment, but no member is linked; manual reconciliation is required.',
        body,
      );
    }

    const result = await this.dataSource.transaction(async (manager) => {
      const locked = await this.recorder.findByPaymentTransactionId(
        transaction.paymentTransactionId,
        manager,
        true,
      );
      if (!locked)
        throw new NotFoundException('Payment transaction not found.');
      if (locked.status === 'SUCCESSFUL') {
        const existingCredit = await manager.query<
          { wallet_transaction_id: number }[]
        >(
          `SELECT wallet_transaction_id
             FROM wallet_transactions
             WHERE transaction_reference = $1
             LIMIT 1`,
          [locked.internalReference],
        );
        return {
          walletTransactionId: existingCredit[0]?.wallet_transaction_id ?? 0,
          alreadyCredited: true,
        };
      }

      await this.recorder.recordOutcome(
        locked.paymentTransactionId,
        {
          status: 'SUCCESSFUL',
          externalTransactionId: providerTransactionId,
          conversationId: body.output_ConversationID,
          responseCode: body.output_ResponseCode,
          responseDescription: body.output_ResponseDesc,
          reconciliationStatus: 'Reconciled',
          rawResponse: body,
        },
        manager,
      );

      const existingCredit = await manager.query<
        { wallet_transaction_id: number }[]
      >(
        `SELECT wallet_transaction_id
           FROM wallet_transactions
           WHERE transaction_reference = $1
           LIMIT 1`,
        [locked.internalReference],
      );
      if (existingCredit[0]) {
        return {
          walletTransactionId: existingCredit[0].wallet_transaction_id,
          alreadyCredited: true,
        };
      }

      const { walletTransaction, allocation } =
        await this.walletsService.creditContribution(
          manager,
          locked.memberId as number,
          Number(locked.amount),
          {
            contributionId: locked.contributionId ?? undefined,
            transactionType: 'Contribution - Mobile Money (Vodacom M-Pesa)',
            transactionReference: locked.internalReference,
            remarks: `M-Pesa contribution via Vodacom. Reference: ${locked.internalReference}.`,
          },
        );
      if (locked.contributionId) {
        await manager.query(
          `UPDATE telecom_contributions
           SET processing_status = $2
           WHERE contribution_id = $1`,
          [
            locked.contributionId,
            allocation?.status === 'Allocated' ? 'Allocated' : 'Validated',
          ],
        );
      }
      await this.auditLogsService.record(manager, {
        memberId: locked.memberId,
        actionType: 'payment.c2b_query_success',
        affectedTable: 'payment_transactions',
        affectedRecordId: locked.paymentTransactionId,
        newValue: {
          internalReference: locked.internalReference,
          externalTransactionId: providerTransactionId,
          responseCode: body.output_ResponseCode ?? null,
        },
      });
      return {
        walletTransactionId: walletTransaction.walletTransactionId,
        alreadyCredited: false,
      };
    });

    if (result.alreadyCredited) {
      await this.dataSource.transaction(async (manager) => {
        await this.auditLogsService.record(manager, {
          memberId: transaction.memberId,
          actionType: 'payment.c2b_query_already_credited',
          affectedTable: 'payment_transactions',
          affectedRecordId: transaction.paymentTransactionId,
          newValue: {
            internalReference: transaction.internalReference,
            externalTransactionId: providerTransactionId,
            responseCode: body.output_ResponseCode ?? null,
          },
        });
      });
    }

    return {
      success: true,
      status: 'SUCCESSFUL',
      internalReference: transaction.internalReference,
      providerTransactionId,
      walletTransactionId: result.walletTransactionId,
    };
  }

  private async recordQueryPending(
    transaction: PaymentTransaction,
    reason: string,
    rawResponse: unknown = null,
  ): Promise<C2BContributionOutcome> {
    await this.recordFinalOutcome(
      transaction.paymentTransactionId,
      transaction.memberId,
      {
        status: 'PENDING',
        failureReason: reason,
        reconciliationStatus: 'Pending',
        rawResponse,
      },
      'payment.c2b_query_pending',
      transaction.internalReference,
    );
    return {
      success: false,
      status: 'PENDING',
      internalReference: transaction.internalReference,
      responseCode: null,
      message: reason,
    };
  }

  private async finalizeFromResponse(
    paymentTransactionId: number,
    memberId: number,
    amount: number,
    internalReference: string,
    body: VodacomC2BResponseBody,
  ): Promise<C2BContributionOutcome> {
    const responseCode = body.output_ResponseCode ?? null;
    const responseDescription = body.output_ResponseDesc ?? null;
    const providerTransactionId = body.output_TransactionID ?? null;
    const conversationId = body.output_ConversationID ?? null;

    const classification = classifyResponseCode(
      responseCode,
      !!providerTransactionId,
      body.output_TransactionStatus,
    );

    if (classification === 'SUCCESSFUL') {
      const transaction =
        await this.recorder.findByPaymentTransactionId(paymentTransactionId);
      if (!transaction) {
        throw new NotFoundException('Payment transaction not found.');
      }
      return this.applyConfirmedQuerySuccess(
        transaction,
        providerTransactionId as string,
        {
          ...body,
          output_ConversationID: conversationId ?? body.output_ConversationID,
          output_ResponseCode: responseCode ?? body.output_ResponseCode,
          output_ResponseDesc: responseDescription ?? body.output_ResponseDesc,
        },
      );
    }

    const failureReason =
      classification === 'PENDING'
        ? 'Vodacom returned an ambiguous result; awaiting reconciliation.'
        : `Vodacom did not confirm the transaction (${responseCode ?? 'no response code'}).`;

    await this.recordFinalOutcome(
      paymentTransactionId,
      memberId,
      {
        status: classification,
        externalTransactionId: body.output_TransactionID,
        conversationId,
        responseCode,
        responseDescription,
        failureReason,
        rawResponse: body,
      },
      classification === 'PENDING'
        ? 'payment.c2b_pending'
        : 'payment.c2b_failed',
      internalReference,
    );

    return {
      success: false,
      status: classification,
      internalReference,
      responseCode,
      message: responseDescription ?? failureReason,
    };
  }

  private async finalizeFromError(
    paymentTransactionId: number,
    memberId: number,
    internalReference: string,
    error: unknown,
  ): Promise<C2BContributionOutcome> {
    if (error instanceof VodacomApiError && error.kind === 'HTTP_ERROR') {
      const body = error.responseBody as VodacomC2BResponseBody | undefined;
      const responseCode = body?.output_ResponseCode ?? null;
      const responseDescription = body?.output_ResponseDesc ?? null;

      // An unambiguous "your credential was rejected" HTTP status —
      // invalidate the cached session so the NEXT attempt fetches a
      // fresh one. This is a generic HTTP-semantics rule, not a guess
      // at an undocumented Vodacom business code.
      if (error.status === 401 || error.status === 403) {
        this.sessionCache.invalidate();
      }

      // A non-2xx HTTP response is never a business success regardless
      // of what the body claims — classify as FAILED unless it falls in
      // the documented ambiguous set.
      const classification: 'FAILED' | 'PENDING' =
        responseCode !== null && AMBIGUOUS_CODES.has(responseCode)
          ? 'PENDING'
          : 'FAILED';

      const failureReason =
        classification === 'PENDING'
          ? 'Vodacom returned an ambiguous result; awaiting reconciliation.'
          : `Vodacom rejected the transaction (HTTP ${error.status}${responseCode ? `, ${responseCode}` : ''}).`;

      await this.recordFinalOutcome(
        paymentTransactionId,
        memberId,
        {
          status: classification,
          externalTransactionId: body?.output_TransactionID,
          responseCode,
          responseDescription,
          failureReason,
          rawResponse: body ?? null,
        },
        classification === 'PENDING'
          ? 'payment.c2b_pending'
          : 'payment.c2b_failed',
        internalReference,
      );

      return {
        success: false,
        status: classification,
        internalReference,
        responseCode,
        message: responseDescription ?? failureReason,
      };
    }

    // NETWORK or TIMEOUT (or any unexpected error type): genuinely
    // ambiguous — Vodacom may have already processed this transaction.
    // Must be PENDING, never FAILED, and never retried automatically.
    const isKnownKind = error instanceof VodacomApiError;
    const failureReason = isKnownKind
      ? `Vodacom M-Pesa request ${error.kind === 'TIMEOUT' ? 'timed out' : 'failed (network error)'} before a response was received; outcome unknown, pending reconciliation.`
      : 'An unexpected error occurred before a Vodacom M-Pesa response was received; outcome unknown, pending reconciliation.';

    await this.recordFinalOutcome(
      paymentTransactionId,
      memberId,
      { status: 'PENDING', failureReason, rawResponse: null },
      'payment.c2b_pending',
      internalReference,
    );

    return {
      success: false,
      status: 'PENDING',
      internalReference,
      responseCode: null,
      message: failureReason,
    };
  }

  private async recordFinalOutcome(
    paymentTransactionId: number,
    memberId: number | null,
    input: RecordOutcomeInput,
    actionType: string,
    internalReference: string,
  ) {
    await this.dataSource.transaction(async (manager) => {
      const recorded = await this.recorder.recordOutcome(
        paymentTransactionId,
        input,
        manager,
      );
      if (
        recorded.contributionId &&
        (input.status === 'FAILED' || input.status === 'PENDING')
      ) {
        await manager.query(
          `UPDATE telecom_contributions
           SET processing_status = $2
           WHERE contribution_id = $1`,
          [
            recorded.contributionId,
            input.status === 'FAILED' ? 'Failed' : 'Pending',
          ],
        );
      }
      await this.auditLogsService.record(manager, {
        memberId,
        actionType,
        affectedTable: 'payment_transactions',
        affectedRecordId: paymentTransactionId,
        newValue: {
          internalReference,
          status: recorded.status,
          responseCode: input.responseCode ?? null,
        },
      });
    });
  }
}
