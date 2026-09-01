// VODACOM M-PESA INTEGRATION FOUNDATION — provider-agnostic contract.
//
// Every type here uses TUJITUNZE's OWN naming, never Vodacom's literal
// field names — those are unverified (no API documentation was found
// in this repository; see vodacom-mpesa.config.ts's header note) and
// deliberately not guessed. The concrete VodacomMpesaService
// (implements MpesaApiClient) is where a real request/response mapping
// would translate between these normalized shapes and Vodacom's actual
// wire format, once that mapping is verified against real
// documentation — see VodacomEndpointNotDocumentedError below for
// exactly where that boundary currently stops.

export const MPESA_API_CLIENT = Symbol('MPESA_API_CLIENT');

export type MpesaTransactionType = 'C2B' | 'B2C' | 'B2B' | 'REVERSAL' | 'QUERY';

// Mirrors payment_transactions.status (migration 0018/0021) exactly —
// the same distinction this whole payment rail already uses:
// internal-ledger concepts (INITIATED/PENDING) vs. a provider-confirmed
// outcome (SUCCESSFUL/FAILED/REVERSED). A transaction is never
// SUCCESSFUL in TUJITUNZE's own records until Vodacom itself has
// confirmed it — this type does not include a "locally assumed
// successful" state, by design.
export type MpesaTransactionStatus =
  'INITIATED' | 'PENDING' | 'SUCCESSFUL' | 'FAILED';

export interface GenerateSessionResult {
  sessionKey: string;
  expiresAt: Date;
}

export interface C2BPaymentRequest {
  // TUJITUNZE's own idempotency/correlation key — generated before
  // Vodacom's transaction ID is known, checked against
  // payment_transactions.internal_reference before ever attempting the
  // call.
  internalReference: string;
  msisdn: string;
  amount: number;
  currency: string;
  memberId: number | null;
  narration: string;
}

export interface B2CPaymentRequest {
  internalReference: string;
  msisdn: string;
  amount: number;
  currency: string;
  memberId: number | null;
  narration: string;
}

export interface B2BPaymentRequest {
  internalReference: string;
  receiverPartyCode: string;
  amount: number;
  currency: string;
  narration: string;
}

export interface TransactionStatusQuery {
  providerTransactionId: string;
}

export interface ReversalRequest {
  originalProviderTransactionId: string;
  internalReference: string;
  amount: number;
  reason: string;
}

export interface MpesaTransactionResult {
  internalReference: string;
  providerTransactionId: string | null;
  status: MpesaTransactionStatus;
  failureReason: string | null;
  // The provider's raw response body, kept verbatim for audit/dispute
  // purposes — maps to payment_transactions.raw_reference.
  rawResponse: unknown;
}

// The internal interface/service boundary the task requires: TUJITUNZE
// business logic depends on THIS, never on VodacomMpesaService's
// concrete HTTP details directly — a future second provider adapter
// (e.g. a different mobile money gateway) would implement the same
// interface without any consuming code changing.
export interface MpesaApiClient {
  generateSession(): Promise<GenerateSessionResult>;
  createC2BPayment(request: C2BPaymentRequest): Promise<MpesaTransactionResult>;
  createB2CPayment(request: B2CPaymentRequest): Promise<MpesaTransactionResult>;
  createB2BPayment(request: B2BPaymentRequest): Promise<MpesaTransactionResult>;
  queryTransaction(
    query: TransactionStatusQuery,
  ): Promise<MpesaTransactionResult>;
  reverseTransaction(request: ReversalRequest): Promise<MpesaTransactionResult>;
}

// Thrown by every VodacomMpesaService operation that would need to
// construct a real Vodacom request body or parse a real Vodacom
// response — i.e. every one of them, today — because no verified
// endpoint path, header/signing scheme, or request/response field
// mapping exists in this repository. This is a deliberate, typed
// refusal to guess, not a bug: implementing the method with invented
// field names could produce a request that Vodacom's sandbox actually
// accepts (or rejects in a misleading way), which is worse than
// failing loudly. See the STEP 1 report for exactly what artifact
// (official OpenAPI spec / Postman collection / integration guide)
// would unblock each operation.
export class VodacomEndpointNotDocumentedError extends Error {
  constructor(operation: MpesaTransactionType | 'generateSession') {
    super(
      `Vodacom M-Pesa ${operation} cannot be executed: no verified endpoint path, request fields, or response fields exist for this operation in the project (no API documentation was found). Supply the official Vodacom M-Pesa OpenAPI specification or Postman collection before this operation can be implemented.`,
    );
    this.name = 'VodacomEndpointNotDocumentedError';
  }
}
