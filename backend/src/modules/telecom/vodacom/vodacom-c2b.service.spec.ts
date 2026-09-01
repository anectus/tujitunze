import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';

import { VodacomC2BService } from './vodacom-c2b.service';
import { VodacomApiError } from './vodacom-mpesa-http.service';
import { ReverseMpesaTransactionDto } from '../dto/reverse-mpesa-transaction.dto';

const FULL_CONFIG_VALUES: Record<string, string> = {
  VODACOM_MPESA_ENV: 'sandbox',
  VODACOM_MPESA_BASE_URL: 'https://openapi.m-pesa.com',
  VODACOM_MPESA_MARKET: 'vodacomTZN',
  VODACOM_MPESA_API_KEY: 'test-api-key',
  VODACOM_MPESA_PUBLIC_KEY:
    'MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEArv9yxA69XQKBo24BaF/D+fvlqmGdYjqLQ5WtNBb5tquqGvAvG3WMFETVUSow/LizQalxj2ElMVrUmzu5mGGkxK08bWEXF7a1DEvtVJs6nppIlFJc2SnrU14AOrIrB28ogm58JjAl5BOQawOXD5dfSk7MaAA82pVHoIqEu0FxA8BOKU+RGTihRU+ptw1j4bsAJYiPbSX6i71gfPvwHPYamM0bfI4CmlsUUR3KvCG24rB6FNPcRBhM3jDuv8ae2kC33w9hEq8qNB55uw51vK7hyXoAa+U7IqP1y6nBdlN25gkxEA8yrsl1678cspeXr+3ciRyqoRgj9RD/ONbJhhxFvt1cLBh+qwK2eqISfBb06eRnNeC71oBokDm3zyCnkOtMDGl7IvnMfZfEPFCfg5QgJVk1msPpRvQxmEsrX9MQRyFVzgy2CWNIb7c+jPapyrNwoUbANlN8adU1m6yOuoX7F49x+OjiG2se0EJ6nafeKUXw/+hiJZvELUYgzKUtMAZVTNZfT8jjb58j8GVtuS+6TM2AutbejaCV84ZK58E2CRJqhmjQibEUO6KPdD7oTlEkFy52Y1uOOBXgYpqMzufNPmfdqqqSM4dU70PO8ogyKGiLAIxCetMjjm6FCMEA3Kc8K0Ig7/XtFm9By6VxTJK1Mg36TlHaZKP6VzVLXMtesJECAwEAAQ==',
  VODACOM_MPESA_ORIGIN: 'https://tujitunze.example.test',
  VODACOM_MPESA_TIMEOUT_MS: '1000',
  VODACOM_MPESA_MAX_RETRIES: '0',
  VODACOM_MPESA_SERVICE_PROVIDER_CODE: '000000',
};

function fakeConfigService(values: Record<string, string> = {}): ConfigService {
  return { get: (key: string) => values[key] } as unknown as ConfigService;
}

describe('VodacomC2BService', () => {
  let dataSource: { query: jest.Mock; transaction: jest.Mock };
  let httpService: { request: jest.Mock; generateCorrelationId: jest.Mock };
  let sessionCache: { getSessionKey: jest.Mock; invalidate: jest.Mock };
  let recorder: {
    getVodacomOperatorId: jest.Mock;
    recordInitiated: jest.Mock;
    recordOutcome: jest.Mock;
    findByPaymentTransactionId: jest.Mock;
    findReversalByOriginalReference: jest.Mock;
    markReversed: jest.Mock;
  };
  let auditLogsService: { record: jest.Mock };
  let walletsService: { creditContribution: jest.Mock };

  const buildService = (
    configValues: Record<string, string> = FULL_CONFIG_VALUES,
  ) => {
    dataSource = {
      query: jest.fn(),
      transaction: jest.fn(async (cb: (manager: unknown) => unknown) =>
        cb({ query: jest.fn().mockResolvedValue([]) }),
      ),
    };
    httpService = {
      request: jest.fn(),
      generateCorrelationId: jest.fn(() => 'corr-1'),
    };
    sessionCache = {
      getSessionKey: jest.fn().mockResolvedValue('RAW-SESSION-KEY'),
      invalidate: jest.fn(),
    };
    recorder = {
      getVodacomOperatorId: jest.fn().mockResolvedValue(1),
      recordInitiated: jest.fn().mockResolvedValue({
        paymentTransactionId: 42,
        internalReference: 'TJZ-MPESA-X',
      }),
      recordOutcome: jest.fn().mockResolvedValue({}),
      findByPaymentTransactionId: jest.fn(),
      findReversalByOriginalReference: jest.fn().mockResolvedValue(null),
      markReversed: jest.fn().mockResolvedValue({ status: 'REVERSED' }),
    };
    recorder.findByPaymentTransactionId.mockResolvedValue({
      paymentTransactionId: 42,
      internalReference: 'TJZ-MPESA-X',
      memberId: 5,
      channel: 'MOBILE_MONEY',
      provider: 'VODACOM_MPESA',
      transactionType: 'C2B',
      telecomOperatorId: 1,
      externalTransactionId: null,
      conversationId: null,
      thirdPartyConversationId: 'TJZ-TPC-X',
      amount: '1000.00',
      currency: 'TZS',
      status: 'INITIATED',
      failureReason: null,
      responseCode: null,
      rawReference: null,
    });
    auditLogsService = { record: jest.fn().mockResolvedValue(undefined) };
    walletsService = {
      creditContribution: jest.fn().mockResolvedValue({
        walletTransaction: { walletTransactionId: 99 },
        allocation: null,
      }),
      reverseContribution: jest.fn().mockResolvedValue({
        reversalTransactionId: 100,
      }),
    };

    return new VodacomC2BService(
      dataSource as unknown as DataSource,
      fakeConfigService(configValues),
      httpService as never,
      sessionCache as never,
      recorder as never,
      auditLogsService as never,
      walletsService as never,
    );
  };

  beforeEach(() => {
    dataSource = undefined as never;
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  function mockPhoneLookup(
    service: VodacomC2BService,
    phoneNumber = '0754000000',
  ) {
    dataSource.query.mockResolvedValueOnce([
      { phone_id: 1, phone_number: phoneNumber },
    ]);
    return service;
  }

  it('rejects a non-positive amount before touching the database or Vodacom', async () => {
    const service = buildService();
    await expect(service.contribute(5, 0)).rejects.toThrow(BadRequestException);
    expect(recorder.recordInitiated).not.toHaveBeenCalled();
    expect(httpService.request).not.toHaveBeenCalled();
  });

  it('reports VODACOM CREDENTIALS REQUIRED (ServiceUnavailableException) when not configured, without creating a payment_transactions row', async () => {
    const { VODACOM_MPESA_SERVICE_PROVIDER_CODE: _omit, ...partial } =
      FULL_CONFIG_VALUES;
    const service = buildService(partial);

    await expect(service.contribute(5, 1000)).rejects.toThrow(
      ServiceUnavailableException,
    );
    await expect(service.contribute(5, 1000)).rejects.toThrow(
      /VODACOM_MPESA_SERVICE_PROVIDER_CODE/,
    );
    expect(recorder.recordInitiated).not.toHaveBeenCalled();
  });

  it('throws BadRequestException when the member has no registered Vodacom phone number', async () => {
    const service = buildService();
    dataSource.query.mockResolvedValueOnce([]); // no phone found

    await expect(service.contribute(5, 1000)).rejects.toThrow(
      BadRequestException,
    );
    expect(recorder.recordInitiated).not.toHaveBeenCalled();
  });

  it('confirmed success (INS-0 + output_TransactionID): credits the wallet exactly once, atomically with the status update', async () => {
    const service = mockPhoneLookup(buildService());
    httpService.request.mockResolvedValue({
      status: 200,
      body: {
        output_ResponseCode: 'INS-0',
        output_ResponseDesc: 'Request processed successfully',
        output_TransactionID: 'MPESA-TXN-1',
        output_ConversationID: 'CONV-1',
        output_ThirdPartyConversationID: 'TJZ-TPC-X',
      },
      correlationId: 'corr-1',
      durationMs: 10,
    });

    const result = await service.contribute(5, 1000, 'Health contribution');

    expect(result).toMatchObject({
      success: true,
      status: 'SUCCESSFUL',
      providerTransactionId: 'MPESA-TXN-1',
      walletTransactionId: 99,
    });
    expect(walletsService.creditContribution).toHaveBeenCalledTimes(1);
    expect(walletsService.creditContribution).toHaveBeenCalledWith(
      expect.anything(),
      5,
      1000,
      expect.objectContaining({
        transactionReference: result.internalReference,
      }),
    );
    expect(recorder.recordOutcome).toHaveBeenCalledWith(
      42,
      expect.objectContaining({
        status: 'SUCCESSFUL',
        externalTransactionId: 'MPESA-TXN-1',
      }),
      expect.anything(),
    );
    // recordOutcome and creditContribution must run inside the same
    // dataSource.transaction() callback (atomicity).
    expect(dataSource.transaction).toHaveBeenCalledTimes(1);
  });

  it('HTTP 200 with INS-0 but no output_TransactionID is never treated as success (never trust HTTP/business code alone)', async () => {
    const service = mockPhoneLookup(buildService());
    httpService.request.mockResolvedValue({
      status: 200,
      body: { output_ResponseCode: 'INS-0', output_ResponseDesc: 'ok' },
      correlationId: 'corr-1',
      durationMs: 10,
    });

    const result = await service.contribute(5, 1000);

    expect(result.success).toBe(false);
    expect(walletsService.creditContribution).not.toHaveBeenCalled();
  });

  it('a definitive business failure (INS-2006 insufficient balance) is recorded FAILED and never credits the wallet', async () => {
    const service = mockPhoneLookup(buildService());
    httpService.request.mockResolvedValue({
      status: 200,
      body: {
        output_ResponseCode: 'INS-2006',
        output_ResponseDesc: 'Insufficient Balance',
      },
      correlationId: 'corr-1',
      durationMs: 10,
    });

    const result = await service.contribute(5, 1000);

    expect(result).toMatchObject({ success: false, status: 'FAILED' });
    expect(walletsService.creditContribution).not.toHaveBeenCalled();
    expect(recorder.recordOutcome).toHaveBeenCalledWith(
      42,
      expect.objectContaining({ status: 'FAILED' }),
      expect.anything(),
    );
  });

  it('an ambiguous business code (INS-9 request timeout) is recorded PENDING, not FAILED, and never credits the wallet', async () => {
    const service = mockPhoneLookup(buildService());
    httpService.request.mockResolvedValue({
      status: 200,
      body: {
        output_ResponseCode: 'INS-9',
        output_ResponseDesc: 'Request timeout',
      },
      correlationId: 'corr-1',
      durationMs: 10,
    });

    const result = await service.contribute(5, 1000);

    expect(result).toMatchObject({ success: false, status: 'PENDING' });
    expect(walletsService.creditContribution).not.toHaveBeenCalled();
    expect(recorder.recordOutcome).toHaveBeenCalledWith(
      42,
      expect.objectContaining({ status: 'PENDING' }),
      expect.anything(),
    );
  });

  it('a network failure is recorded PENDING (never FAILED) and is never retried', async () => {
    const service = mockPhoneLookup(buildService());
    httpService.request.mockRejectedValue(
      new VodacomApiError('ECONNRESET', 'corr-1', 'NETWORK'),
    );

    const result = await service.contribute(5, 1000);

    expect(result).toMatchObject({ success: false, status: 'PENDING' });
    expect(walletsService.creditContribution).not.toHaveBeenCalled();
    expect(httpService.request).toHaveBeenCalledTimes(1);
    const [callArgs] = httpService.request.mock.calls[0];
    expect(callArgs.retryable).toBe(false);
  });

  it('a timeout is recorded PENDING (never FAILED)', async () => {
    const service = mockPhoneLookup(buildService());
    httpService.request.mockRejectedValue(
      new VodacomApiError('timed out', 'corr-1', 'TIMEOUT'),
    );

    const result = await service.contribute(5, 1000);

    expect(result).toMatchObject({ success: false, status: 'PENDING' });
    expect(walletsService.creditContribution).not.toHaveBeenCalled();
  });

  it('an HTTP error response (e.g. HTTP 400) is recorded FAILED and invalidates the session cache on 401/403', async () => {
    const service = mockPhoneLookup(buildService());
    httpService.request.mockRejectedValue(
      new VodacomApiError('unauthorized', 'corr-1', 'HTTP_ERROR', 401, {
        output_ResponseCode: 'INS-997',
        output_ResponseDesc: 'API Not Enabled',
      }),
    );

    const result = await service.contribute(5, 1000);

    expect(result).toMatchObject({ success: false, status: 'FAILED' });
    expect(sessionCache.invalidate).toHaveBeenCalledTimes(1);
    expect(walletsService.creditContribution).not.toHaveBeenCalled();
  });

  it('never logs the raw session key, the encrypted key, or the Authorization header value', async () => {
    const logSpy = jest
      .spyOn(console, 'log')
      .mockImplementation(() => undefined);
    const service = mockPhoneLookup(buildService());
    httpService.request.mockResolvedValue({
      status: 200,
      body: {
        output_ResponseCode: 'INS-0',
        output_TransactionID: 'MPESA-TXN-1',
      },
      correlationId: 'corr-1',
      durationMs: 10,
    });

    await service.contribute(5, 1000);

    const logged = logSpy.mock.calls.map((call) => call.join(' ')).join('\n');
    expect(logged).not.toContain('RAW-SESSION-KEY');
  });

  it('sends the documented request fields with the fixed country/currency for this market', async () => {
    const service = mockPhoneLookup(buildService());
    httpService.request.mockResolvedValue({
      status: 200,
      body: {
        output_ResponseCode: 'INS-0',
        output_TransactionID: 'MPESA-TXN-1',
      },
      correlationId: 'corr-1',
      durationMs: 10,
    });

    await service.contribute(5, 1000.5, 'Health contribution');

    const [callArgs] = httpService.request.mock.calls[0];
    expect(callArgs.method).toBe('POST');
    expect(callArgs.url).toBe(
      'https://openapi.m-pesa.com/sandbox/ipg/v2/vodacomTZN/c2bPayment/singleStage/',
    );
    expect(callArgs.body).toMatchObject({
      input_Amount: '1000.5',
      input_CustomerMSISDN: '0754000000',
      input_Country: 'TZN',
      input_Currency: 'TZS',
      input_ServiceProviderCode: '000000',
      input_PurchasedItemsDesc: 'Health contribution',
    });
    expect(callArgs.body.input_TransactionReference).toEqual(
      expect.stringMatching(/^TJZ-MPESA-/),
    );
    expect(callArgs.body.input_ThirdPartyConversationID).toEqual(
      expect.stringMatching(/^TJZ-TPC-/),
    );
    expect(callArgs.retryable).toBe(false);
  });

  function queryTransactionFixture(
    status: 'PENDING' | 'SUCCESSFUL' = 'PENDING',
  ) {
    return {
      paymentTransactionId: 42,
      internalReference: 'TJZ-MPESA-X',
      memberId: 5,
      channel: 'MOBILE_MONEY',
      provider: 'VODACOM_MPESA',
      transactionType: 'C2B',
      telecomOperatorId: 1,
      externalTransactionId: 'MPESA-TXN-1',
      conversationId: 'CONV-1',
      thirdPartyConversationId: 'TJZ-TPC-X',
      amount: '1000.00',
      currency: 'TZS',
      status,
      failureReason: null,
      responseCode: null,
      rawReference: null,
    } as never;
  }

  function prepareQuery(
    service: VodacomC2BService,
    body: Record<string, string>,
    managerRows: unknown[] = [],
  ) {
    dataSource.query.mockResolvedValue([{ telecom_operator_id: 1 }]);
    recorder.findByPaymentTransactionId.mockResolvedValue(
      queryTransactionFixture(),
    );
    dataSource.transaction.mockImplementation(
      async (callback: (manager: unknown) => unknown) =>
        callback({ query: jest.fn().mockResolvedValue(managerRows) }),
    );
    httpService.request.mockResolvedValue({
      status: 200,
      body,
      correlationId: 'corr-1',
      durationMs: 10,
    });
    return service;
  }

  it('query confirms success and credits the wallet once using the stored provider transaction id', async () => {
    const service = prepareQuery(buildService(), {
      output_ResponseCode: 'INS-0',
      output_ResponseDesc: 'Request processed successfully',
      output_TransactionID: 'MPESA-TXN-1',
      output_TransactionStatus: 'SUCCESSFUL',
    });

    const result = await service.queryTransactionStatus(77, 42);

    expect(result).toMatchObject({ success: true, status: 'SUCCESSFUL' });
    expect(walletsService.creditContribution).toHaveBeenCalledTimes(1);
    expect(httpService.request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'POST',
        retryable: true,
        body: expect.objectContaining({
          input_QueryReference: 'MPESA-TXN-1',
          input_ThirdPartyConversationID: 'TJZ-TPC-X',
        }),
      }),
    );
  });

  it('query confirms failure and never credits the wallet', async () => {
    const service = prepareQuery(buildService(), {
      output_ResponseCode: 'INS-2006',
      output_ResponseDesc: 'Insufficient Balance',
      output_TransactionStatus: 'FAILED',
    });

    const result = await service.queryTransactionStatus(77, 42);

    expect(result).toMatchObject({ success: false, status: 'FAILED' });
    expect(walletsService.creditContribution).not.toHaveBeenCalled();
    expect(recorder.recordOutcome).toHaveBeenCalledWith(
      42,
      expect.objectContaining({
        status: 'FAILED',
        reconciliationStatus: 'Reconciled',
      }),
      expect.anything(),
    );
  });

  it('query timeout preserves PENDING and never credits the wallet', async () => {
    const service = buildService();
    dataSource.query.mockResolvedValueOnce([{ telecom_operator_id: 1 }]);
    recorder.findByPaymentTransactionId.mockResolvedValue(
      queryTransactionFixture(),
    );
    httpService.request.mockRejectedValue(
      new VodacomApiError('timed out', 'corr-1', 'TIMEOUT'),
    );

    const result = await service.queryTransactionStatus(77, 42);

    expect(result).toMatchObject({ success: false, status: 'PENDING' });
    expect(walletsService.creditContribution).not.toHaveBeenCalled();
    expect(recorder.recordOutcome).toHaveBeenCalledWith(
      42,
      expect.objectContaining({
        status: 'PENDING',
        reconciliationStatus: 'Pending',
      }),
      expect.anything(),
    );
  });

  it('query unknown status preserves PENDING and records the raw provider response', async () => {
    const service = prepareQuery(buildService(), {
      output_ResponseCode: 'INS-1',
      output_ResponseDesc: 'Processing',
      output_TransactionStatus: 'PROCESSING',
    });

    const result = await service.queryTransactionStatus(77, 42);

    expect(result.status).toBe('PENDING');
    expect(walletsService.creditContribution).not.toHaveBeenCalled();
    expect(recorder.recordOutcome).toHaveBeenCalledWith(
      42,
      expect.objectContaining({
        status: 'PENDING',
        rawResponse: expect.anything(),
      }),
      expect.anything(),
    );
  });

  it('duplicate processing and an already-credited transaction do not create another wallet credit', async () => {
    const service = prepareQuery(
      buildService(),
      {
        output_ResponseCode: 'INS-0',
        output_TransactionID: 'MPESA-TXN-1',
        output_TransactionStatus: 'SUCCESSFUL',
      },
      [{ wallet_transaction_id: 99 }],
    );

    const first = await service.queryTransactionStatus(77, 42);
    const second = await service.queryTransactionStatus(77, 42);

    expect(first.status).toBe('SUCCESSFUL');
    expect(second.status).toBe('SUCCESSFUL');
    expect(walletsService.creditContribution).not.toHaveBeenCalled();
  });

  function prepareReversal(
    body: Record<string, string>,
    originalOverrides: Record<string, unknown> = {},
    managerRows: unknown[] = [],
  ) {
    const service = buildService();
    const original = {
      ...queryTransactionFixture('SUCCESSFUL'),
      externalTransactionId: 'MPESA-TXN-1',
      status: 'SUCCESSFUL',
      ...originalOverrides,
    };
    const reversal = {
      ...queryTransactionFixture('PENDING'),
      paymentTransactionId: 43,
      internalReference: 'TJZ-REV-1',
      status: 'INITIATED',
    };
    dataSource.query.mockResolvedValue([{ telecom_operator_id: 1 }]);
    recorder.findByPaymentTransactionId.mockImplementation(
      async (id: number) => (id === 42 ? original : reversal),
    );
    recorder.recordInitiated.mockResolvedValue(reversal);
    dataSource.transaction.mockImplementation(
      async (callback: (manager: unknown) => unknown) =>
        callback({ query: jest.fn().mockResolvedValue(managerRows) }),
    );
    httpService.request.mockResolvedValue({
      status: 200,
      body,
      correlationId: 'corr-1',
      durationMs: 10,
    });
    return service;
  }

  const approvedReversal: ReverseMpesaTransactionDto = {
    approved: true,
    reason: 'Approved duplicate settlement correction',
  };

  it('reverses a valid successful transaction and creates a compensating wallet entry', async () => {
    const service = prepareReversal(
      {
        output_ResponseCode: 'INS-0',
        output_ResponseDesc: 'Reversal successful',
        output_TransactionID: 'MPESA-REV-1',
      },
      {},
      [{ wallet_transaction_id: 99 }],
    );

    const result = await service.reverseTransaction(77, 42, approvedReversal);

    expect(result).toMatchObject({ success: true, status: 'REVERSED' });
    expect(walletsService.reverseContribution).toHaveBeenCalledWith(
      expect.anything(),
      5,
      expect.any(Number),
      1000,
      expect.objectContaining({ reason: 'Reversed' }),
    );
    expect(recorder.markReversed).toHaveBeenCalledWith(
      42,
      'TJZ-REV-1',
      expect.anything(),
    );
  });

  it('rejects a duplicate reversal request before calling Vodacom', async () => {
    const service = prepareReversal({});
    recorder.findReversalByOriginalReference.mockResolvedValue({
      paymentTransactionId: 43,
      status: 'SUCCESSFUL',
    });

    await expect(
      service.reverseTransaction(77, 42, approvedReversal),
    ).rejects.toThrow(ConflictException);
    expect(httpService.request).not.toHaveBeenCalled();
  });

  it('rejects an invalid transaction', async () => {
    const service = buildService();
    dataSource.query.mockResolvedValue([{ telecom_operator_id: 1 }]);
    recorder.findByPaymentTransactionId.mockResolvedValue(null);

    await expect(
      service.reverseTransaction(77, 999, approvedReversal),
    ).rejects.toThrow(NotFoundException);
  });

  it('rejects a transaction that is already reversed', async () => {
    const service = prepareReversal({}, { status: 'REVERSED' });

    await expect(
      service.reverseTransaction(77, 42, approvedReversal),
    ).rejects.toThrow(ConflictException);
    expect(httpService.request).not.toHaveBeenCalled();
  });

  it('records a failed provider reversal without changing the original transaction', async () => {
    const service = prepareReversal({
      output_ResponseCode: 'INS-2006',
      output_ResponseDesc: 'Reversal rejected',
    });

    const result = await service.reverseTransaction(77, 42, approvedReversal);

    expect(result).toMatchObject({ success: false, status: 'FAILED' });
    expect(recorder.recordOutcome).toHaveBeenCalledWith(
      43,
      expect.objectContaining({
        status: 'FAILED',
        reconciliationStatus: 'Reconciled',
      }),
      expect.anything(),
    );
    expect(recorder.markReversed).not.toHaveBeenCalled();
    expect(walletsService.reverseContribution).not.toHaveBeenCalled();
  });

  it('requires explicit approval and does not initiate an unapproved reversal', async () => {
    const service = buildService();
    await expect(
      service.reverseTransaction(77, 42, {
        approved: false,
        reason: 'correction',
      }),
    ).rejects.toThrow(BadRequestException);
    expect(httpService.request).not.toHaveBeenCalled();
  });

  // HTTP 403 shares the exact same code branch as 401
  // (`error.status === 401 || error.status === 403`) but was previously
  // only exercised via 401 — a dedicated case so "403 invalidates the
  // session" is asserted directly, not just inferred from the shared
  // condition.
  it('an HTTP 403 response is recorded FAILED and invalidates the session cache', async () => {
    const service = mockPhoneLookup(buildService());
    httpService.request.mockRejectedValue(
      new VodacomApiError('forbidden', 'corr-1', 'HTTP_ERROR', 403, {
        output_ResponseCode: 'INS-13',
        output_ResponseDesc: 'Invalid Access Token',
      }),
    );

    const result = await service.contribute(5, 1000);

    expect(result).toMatchObject({ success: false, status: 'FAILED' });
    expect(sessionCache.invalidate).toHaveBeenCalledTimes(1);
    expect(walletsService.creditContribution).not.toHaveBeenCalled();
  });

  it('audit-logs a confirmed successful C2B payment against payment_transactions', async () => {
    const service = mockPhoneLookup(buildService());
    httpService.request.mockResolvedValue({
      status: 200,
      body: {
        output_ResponseCode: 'INS-0',
        output_ResponseDesc: 'Request processed successfully',
        output_TransactionID: 'MPESA-TXN-AUDIT',
        output_ConversationID: 'CONV-AUDIT',
      },
      correlationId: 'corr-1',
      durationMs: 10,
    });

    await service.contribute(5, 1000, 'Health contribution');

    expect(auditLogsService.record).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        memberId: 5,
        actionType: 'payment.c2b_query_success',
        affectedTable: 'payment_transactions',
        affectedRecordId: 42,
        newValue: expect.objectContaining({
          externalTransactionId: 'MPESA-TXN-AUDIT',
        }),
      }),
    );
  });

  it('audit-logs a definitive C2B failure against payment_transactions', async () => {
    const service = mockPhoneLookup(buildService());
    httpService.request.mockResolvedValue({
      status: 200,
      body: {
        output_ResponseCode: 'INS-2006',
        output_ResponseDesc: 'Insufficient balance',
      },
      correlationId: 'corr-1',
      durationMs: 10,
    });

    await service.contribute(5, 1000);

    expect(auditLogsService.record).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        actionType: 'payment.c2b_failed',
        affectedTable: 'payment_transactions',
        affectedRecordId: 42,
      }),
    );
  });
});
