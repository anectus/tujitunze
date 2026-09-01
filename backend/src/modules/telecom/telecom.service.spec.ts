import { DataSource } from 'typeorm';
import { ServiceUnavailableException } from '@nestjs/common';

import { TelecomService } from './telecom.service';
import { WebhookContributionDto } from './dto/webhook-contribution.dto';

describe('TelecomService airtime contribution integration', () => {
  let dataSource: {
    query: jest.Mock;
    transaction: jest.Mock;
  };
  let auditLogsService: { record: jest.Mock };
  let walletsService: { creditContribution: jest.Mock };
  let vodacomC2BService: {
    assertOperatorSupported: jest.Mock;
    isVodacomOperator: jest.Mock;
    contribute: jest.Mock;
  };
  let vodacomSessionKeyService: { generateSession: jest.Mock };
  let configService: { get: jest.Mock };
  let service: TelecomService;

  const dto: WebhookContributionDto = {
    operatorId: 1,
    phoneNumber: '0754000000',
    transactionAmount: 1000,
    transactionType: 'Airtime',
    externalTransactionId: 'AIRTIME-1',
  };

  beforeEach(() => {
    dataSource = {
      query: jest.fn(),
      transaction: jest.fn(),
    };
    auditLogsService = { record: jest.fn().mockResolvedValue(undefined) };
    walletsService = { creditContribution: jest.fn() };
    vodacomC2BService = {
      assertOperatorSupported: jest.fn().mockResolvedValue(undefined),
      isVodacomOperator: jest.fn().mockResolvedValue(true),
      contribute: jest.fn(),
    };
    vodacomSessionKeyService = { generateSession: jest.fn() };
    configService = { get: jest.fn() };
    service = new TelecomService(
      dataSource as unknown as DataSource,
      auditLogsService as never,
      walletsService as never,
      vodacomC2BService as never,
      vodacomSessionKeyService as never,
      configService as never,
    );
  });

  function prepareNewEvent() {
    dataSource.query
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        { rule_id: 1, rate_percent: '6.0000', minimum_amount: '1.00' },
      ]);
    dataSource.transaction.mockImplementation(
      async (callback: (manager: unknown) => unknown) =>
        callback({
          query: jest
            .fn()
            .mockResolvedValueOnce([{ phone_id: 10, user_id: 5 }])
            .mockResolvedValueOnce([
              {
                contribution_id: 20,
                reference_number: dto.externalTransactionId,
                internal_reference: 'TJZ-AIR-1',
                contribution_amount: '60.00',
                contribution_source: 'Airtime',
                processing_status: 'Pending',
                contribution_date: new Date('2026-08-27T07:00:00Z'),
              },
            ]),
        }),
    );
  }

  it('records the event as pending, calculates 6%, and delegates collection to M-Pesa', async () => {
    prepareNewEvent();
    vodacomC2BService.contribute.mockResolvedValue({
      success: true,
      status: 'SUCCESSFUL',
      internalReference: 'TJZ-MPESA-1',
      providerTransactionId: 'MPESA-1',
      walletTransactionId: 99,
    });

    const result = await service.handleContributionWebhook(1, dto);

    expect(result).toMatchObject({
      contributionId: 20,
      contributionAmount: 60,
      processingStatus: 'Allocated',
      payment: { status: 'SUCCESSFUL' },
    });
    expect(vodacomC2BService.contribute).toHaveBeenCalledWith(
      5,
      60,
      'Airtime contribution via 0754000000.',
      { contributionId: 20, contributionSource: 'Airtime' },
    );
    expect(walletsService.creditContribution).not.toHaveBeenCalled();
  });

  it('keeps the contribution pending when M-Pesa is unresolved', async () => {
    prepareNewEvent();
    vodacomC2BService.contribute.mockResolvedValue({
      success: false,
      status: 'PENDING',
      internalReference: 'TJZ-MPESA-1',
      responseCode: null,
      message: 'Outcome unresolved',
    });

    const result = await service.handleContributionWebhook(1, dto);

    expect(result.processingStatus).toBe('Pending');
    expect(walletsService.creditContribution).not.toHaveBeenCalled();
  });

  it('does not credit the wallet when M-Pesa confirms failure', async () => {
    prepareNewEvent();
    vodacomC2BService.contribute.mockResolvedValue({
      success: false,
      status: 'FAILED',
      internalReference: 'TJZ-MPESA-1',
      responseCode: 'INS-2006',
      message: 'Rejected',
    });

    const result = await service.handleContributionWebhook(1, dto);

    expect(result.processingStatus).toBe('Failed');
    expect(walletsService.creditContribution).not.toHaveBeenCalled();
  });

  it('returns a duplicate event without initiating M-Pesa or crediting the wallet', async () => {
    dataSource.query.mockResolvedValueOnce([
      {
        contribution_id: 20,
        reference_number: dto.externalTransactionId,
        internal_reference: 'TJZ-AIR-1',
        contribution_amount: '60.00',
        contribution_source: 'Airtime',
        processing_status: 'Pending',
        contribution_date: new Date('2026-08-27T07:00:00Z'),
      },
    ]);

    const result = await service.handleContributionWebhook(1, dto);

    expect(result).toMatchObject({ duplicate: true, contributionId: 20 });
    expect(vodacomC2BService.contribute).not.toHaveBeenCalled();
    expect(walletsService.creditContribution).not.toHaveBeenCalled();
  });

  it('rejects the direct staff contribution path for telecom purchase sources when the staff member is assigned to Vodacom', async () => {
    dataSource.query.mockResolvedValueOnce([{ telecom_operator_id: 1 }]);
    vodacomC2BService.isVodacomOperator.mockResolvedValue(true);

    await expect(
      service.recordContribution(77, {
        phoneNumber: dto.phoneNumber,
        amount: 60,
        referenceNumber: dto.externalTransactionId,
        contributionSource: 'Airtime',
      }),
    ).rejects.toThrow(
      'Telecom purchase contributions must arrive through the operator event flow and confirmed M-Pesa collection.',
    );
    expect(walletsService.creditContribution).not.toHaveBeenCalled();
    expect(vodacomC2BService.contribute).not.toHaveBeenCalled();
  });

  it('still allows the direct staff contribution path for an operator with no real payment rail', async () => {
    dataSource.query.mockResolvedValueOnce([{ telecom_operator_id: 2 }]);
    vodacomC2BService.isVodacomOperator.mockResolvedValue(false);
    dataSource.transaction.mockImplementation(
      async (callback: (manager: unknown) => unknown) =>
        callback({
          query: jest
            .fn()
            .mockResolvedValueOnce([{ phone_id: 10, user_id: 5 }])
            .mockResolvedValueOnce([
              {
                contribution_id: 30,
                reference_number: dto.externalTransactionId,
                internal_reference: 'TJZ-AIR-3',
                contribution_amount: '60.00',
                contribution_source: 'Airtime',
                processing_status: 'Received',
                contribution_date: new Date('2026-08-27T07:00:00Z'),
              },
            ]),
        }),
    );
    walletsService.creditContribution.mockResolvedValue({
      walletTransaction: { walletTransactionId: 55 },
      allocation: null,
    });

    const result = await service.recordContribution(78, {
      phoneNumber: dto.phoneNumber,
      amount: 60,
      referenceNumber: dto.externalTransactionId,
      contributionSource: 'Airtime',
    });

    expect(result).toMatchObject({ contributionId: 30 });
    expect(vodacomC2BService.contribute).not.toHaveBeenCalled();
  });

  describe('non-Vodacom operator (no real collection rail — pre-existing direct-credit path)', () => {
    beforeEach(() => {
      vodacomC2BService.isVodacomOperator.mockResolvedValue(false);
    });

    function prepareNonVodacomEvent() {
      dataSource.query
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([
          { rule_id: 1, rate_percent: '6.0000', minimum_amount: '1.00' },
        ]);
      const manager = {
        query: jest
          .fn()
          .mockResolvedValueOnce([{ phone_id: 10, user_id: 5 }])
          .mockResolvedValueOnce([
            {
              contribution_id: 21,
              reference_number: dto.externalTransactionId,
              internal_reference: 'TJZ-AIR-2',
              contribution_amount: '60.00',
              contribution_source: 'Airtime',
              processing_status: 'Received',
              contribution_date: new Date('2026-08-27T07:00:00Z'),
            },
          ])
          .mockResolvedValueOnce(undefined) // UPDATE ... 'Validated'
          .mockResolvedValueOnce(undefined), // UPDATE ... 'Allocated' (if reached)
      };
      dataSource.transaction.mockImplementation(
        async (callback: (manager: unknown) => unknown) => callback(manager),
      );
      return manager;
    }

    it('credits the wallet directly and never calls Vodacom for an operator with no real payment rail', async () => {
      prepareNonVodacomEvent();
      walletsService.creditContribution.mockResolvedValue({
        walletTransaction: { walletTransactionId: 42 },
        allocation: null,
      });

      const result = await service.handleContributionWebhook(2, dto);

      expect(vodacomC2BService.contribute).not.toHaveBeenCalled();
      expect(walletsService.creditContribution).toHaveBeenCalledWith(
        expect.anything(),
        5,
        60,
        expect.objectContaining({
          contributionId: 21,
          transactionReference: dto.externalTransactionId,
        }),
      );
      expect(result).toMatchObject({
        contributionCreated: true,
        contributionId: 21,
        processingStatus: 'Validated',
        walletTransactionId: 42,
      });
    });

    it('marks the contribution Allocated when the direct credit also allocates to an active policy', async () => {
      prepareNonVodacomEvent();
      walletsService.creditContribution.mockResolvedValue({
        walletTransaction: { walletTransactionId: 43 },
        allocation: { status: 'Allocated' },
      });

      const result = await service.handleContributionWebhook(2, dto);

      expect(result).toMatchObject({ processingStatus: 'Allocated' });
    });
  });

  describe('testConnection — dispatched per assigned operator, never touches money', () => {
    const configValues: Record<string, string> = {
      VODACOM_MPESA_ENV: 'sandbox',
      VODACOM_MPESA_BASE_URL: 'https://openapi.m-pesa.com',
      VODACOM_MPESA_MARKET: 'vodacomTZN',
    };

    beforeEach(() => {
      configService.get.mockImplementation(
        (key: string) => configValues[key],
      );
    });

    function prepareOperator(operatorId: number, operatorName: string) {
      dataSource.query
        .mockResolvedValueOnce([{ telecom_operator_id: operatorId }])
        .mockResolvedValueOnce([{ operator_name: operatorName }])
        .mockResolvedValueOnce(undefined); // INSERT INTO api_access_logs
    }

    it('a non-Vodacom operator reports integration_not_configured and still writes an api_access_logs row', async () => {
      prepareOperator(2, 'Airtel');

      const result = await service.testConnection(1239);

      expect(result).toMatchObject({
        success: false,
        state: 'integration_not_configured',
        provider: 'Airtel',
      });
      expect(dataSource.query).toHaveBeenNthCalledWith(
        3,
        expect.stringContaining('INSERT INTO api_access_logs'),
        expect.arrayContaining([2, 1239]),
      );
      expect(vodacomC2BService.contribute).not.toHaveBeenCalled();
      expect(walletsService.creditContribution).not.toHaveBeenCalled();
    });

    it('Vodacom + real session success -> state "connected"', async () => {
      prepareOperator(1, 'Vodacom');
      vodacomSessionKeyService.generateSession.mockResolvedValue({
        success: true,
        sessionKey: 'irrelevant-never-returned',
        httpStatus: 200,
        responseCode: 'INS-0',
        responseDesc: 'Success',
      });

      const result = await service.testConnection(1239);

      expect(result).toMatchObject({ success: true, state: 'connected' });
      expect(JSON.stringify(result)).not.toContain('irrelevant-never-returned');
    });

    it('Vodacom + missing credentials (ServiceUnavailableException) -> state "credentials_missing", never a fabricated success', async () => {
      prepareOperator(1, 'Vodacom');
      vodacomSessionKeyService.generateSession.mockRejectedValue(
        new ServiceUnavailableException(
          'Vodacom M-Pesa is not configured. Missing: VODACOM_MPESA_API_KEY, VODACOM_MPESA_ORIGIN.',
        ),
      );

      const result = await service.testConnection(1239);

      expect(result).toMatchObject({
        success: false,
        state: 'credentials_missing',
      });
    });

    it('Vodacom + INS-989 (documented session-creation failure) -> state "authentication_failed"', async () => {
      prepareOperator(1, 'Vodacom');
      vodacomSessionKeyService.generateSession.mockResolvedValue({
        success: false,
        httpStatus: 400,
        responseCode: 'INS-989',
        responseDesc: 'Session creation failed',
        errorKind: 'HTTP_ERROR',
        message: 'Vodacom M-Pesa reported session creation failed (INS-989).',
      });

      const result = await service.testConnection(1239);

      expect(result).toMatchObject({
        success: false,
        state: 'authentication_failed',
      });
    });

    it('Vodacom + network failure (not auth, not timeout) -> state "connection_failed"', async () => {
      prepareOperator(1, 'Vodacom');
      vodacomSessionKeyService.generateSession.mockResolvedValue({
        success: false,
        httpStatus: null,
        responseCode: null,
        responseDesc: null,
        errorKind: 'NETWORK',
        message: 'Vodacom M-Pesa is unavailable (network error).',
      });

      const result = await service.testConnection(1239);

      expect(result).toMatchObject({
        success: false,
        state: 'connection_failed',
      });
    });

    it('Vodacom + timeout -> state "timeout"', async () => {
      prepareOperator(1, 'Vodacom');
      vodacomSessionKeyService.generateSession.mockResolvedValue({
        success: false,
        httpStatus: null,
        responseCode: null,
        responseDesc: null,
        errorKind: 'TIMEOUT',
        message: 'Vodacom M-Pesa session request timed out.',
      });

      const result = await service.testConnection(1239);

      expect(result).toMatchObject({ success: false, state: 'timeout' });
    });

    it('uses the caller\'s OWN assigned operator (users.telecom_operator_id), never a caller-supplied id', async () => {
      prepareOperator(1, 'Vodacom');
      vodacomSessionKeyService.generateSession.mockResolvedValue({
        success: true,
        sessionKey: 'x',
        httpStatus: 200,
        responseCode: 'INS-0',
        responseDesc: 'Success',
      });

      await service.testConnection(1239);

      expect(dataSource.query).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining('telecom_operator_id FROM users'),
        [1239],
      );
    });
  });
});
