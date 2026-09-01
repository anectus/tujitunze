import { ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { VodacomMpesaService } from './vodacom-mpesa.service';
import { VodacomMpesaHttpService } from './vodacom-mpesa-http.service';
import { VodacomTransactionRecorder } from './vodacom-transaction-recorder.service';
import { VodacomEndpointNotDocumentedError } from './vodacom-mpesa.types';

function fakeConfigService(values: Record<string, string> = {}): ConfigService {
  return { get: (key: string) => values[key] } as unknown as ConfigService;
}

const FULLY_CONFIGURED = {
  VODACOM_MPESA_API_BASE_URL: 'https://sandbox.example.test',
  VODACOM_MPESA_API_KEY: 'test-key',
  VODACOM_MPESA_APPLICATION_ID: 'app-1',
  VODACOM_MPESA_SESSION_PATH: '/session',
};

describe('VodacomMpesaService', () => {
  let httpService: VodacomMpesaHttpService;
  let recorder: {
    findByInternalReference: jest.Mock;
    recordInitiated: jest.Mock;
    recordFailure: jest.Mock;
    recordSuccess: jest.Mock;
    getVodacomOperatorId: jest.Mock;
  };

  const buildService = (configValues: Record<string, string> = {}) => {
    httpService = new VodacomMpesaHttpService();
    recorder = {
      findByInternalReference: jest.fn(),
      recordInitiated: jest.fn(),
      recordFailure: jest.fn(),
      recordSuccess: jest.fn(),
      getVodacomOperatorId: jest.fn(),
    };
    return new VodacomMpesaService(
      httpService,
      fakeConfigService(configValues),
      recorder as unknown as VodacomTransactionRecorder,
    );
  };

  it('createC2BPayment: rejects when not configured, before touching the database at all', async () => {
    const service = buildService({});
    recorder.findByInternalReference.mockResolvedValue(null);

    await expect(
      service.createC2BPayment({
        internalReference: 'TJZ-C2B-1',
        msisdn: '0712345678',
        amount: 1000,
        currency: 'TZS',
        memberId: 1,
        narration: 'Health contribution',
      }),
    ).rejects.toThrow(ServiceUnavailableException);

    expect(recorder.recordInitiated).not.toHaveBeenCalled();
  });

  it('createC2BPayment: when configured, records the attempt as INITIATED then FAILED with a clear, honest reason (not a fabricated success)', async () => {
    const service = buildService(FULLY_CONFIGURED);
    recorder.findByInternalReference.mockResolvedValue(null);
    recorder.getVodacomOperatorId.mockResolvedValue(1);
    recorder.recordInitiated.mockResolvedValue({
      paymentTransactionId: 10,
      internalReference: 'TJZ-C2B-1',
      status: 'INITIATED',
    });
    recorder.recordFailure.mockResolvedValue({
      paymentTransactionId: 10,
      status: 'FAILED',
    });

    await expect(
      service.createC2BPayment({
        internalReference: 'TJZ-C2B-1',
        msisdn: '0712345678',
        amount: 1000,
        currency: 'TZS',
        memberId: 1,
        narration: 'Health contribution',
      }),
    ).rejects.toThrow(VodacomEndpointNotDocumentedError);

    expect(recorder.recordInitiated).toHaveBeenCalledWith({
      internalReference: 'TJZ-C2B-1',
      memberId: 1,
      telecomOperatorId: 1,
      amount: 1000,
      currency: 'TZS',
      transactionType: 'C2B',
    });
    expect(recorder.recordFailure).toHaveBeenCalledWith(
      10,
      expect.stringContaining('C2B'),
      null,
    );
  });

  it('duplicate/idempotent request: an existing internalReference is returned without creating a second record or calling Vodacom again', async () => {
    const service = buildService(FULLY_CONFIGURED);
    recorder.findByInternalReference.mockResolvedValue({
      internalReference: 'TJZ-C2B-1',
      externalTransactionId: null,
      status: 'FAILED',
      failureReason: 'previous attempt failed',
      rawReference: null,
    });

    const result = await service.createC2BPayment({
      internalReference: 'TJZ-C2B-1',
      msisdn: '0712345678',
      amount: 1000,
      currency: 'TZS',
      memberId: 1,
      narration: 'Health contribution',
    });

    expect(result).toMatchObject({
      internalReference: 'TJZ-C2B-1',
      status: 'FAILED',
      failureReason: 'previous attempt failed',
    });
    expect(recorder.recordInitiated).not.toHaveBeenCalled();
    expect(recorder.getVodacomOperatorId).not.toHaveBeenCalled();
  });

  it('a duplicate replay of an already-SUCCESSFUL transaction reports SUCCESSFUL again, not FAILED', async () => {
    const service = buildService(FULLY_CONFIGURED);
    recorder.findByInternalReference.mockResolvedValue({
      internalReference: 'TJZ-C2B-2',
      externalTransactionId: 'MPESA-REF-1',
      status: 'SUCCESSFUL',
      failureReason: null,
      rawReference: '{"ok":true}',
    });

    const result = await service.createC2BPayment({
      internalReference: 'TJZ-C2B-2',
      msisdn: '0712345678',
      amount: 1000,
      currency: 'TZS',
      memberId: 1,
      narration: 'Health contribution',
    });

    expect(result).toMatchObject({
      status: 'SUCCESSFUL',
      providerTransactionId: 'MPESA-REF-1',
    });
  });

  it('createB2CPayment: rejects when not configured', async () => {
    const service = buildService({});
    recorder.findByInternalReference.mockResolvedValue(null);

    await expect(
      service.createB2CPayment({
        internalReference: 'TJZ-B2C-1',
        msisdn: '0712345678',
        amount: 500,
        currency: 'TZS',
        memberId: 1,
        narration: 'Refund',
      }),
    ).rejects.toThrow(ServiceUnavailableException);
  });

  it('generateSession: rejects when not configured', async () => {
    const service = buildService({});
    await expect(service.generateSession()).rejects.toThrow(
      ServiceUnavailableException,
    );
  });

  it('generateSession: when configured, throws VodacomEndpointNotDocumentedError (no invented wire call)', async () => {
    const service = buildService(FULLY_CONFIGURED);
    await expect(service.generateSession()).rejects.toThrow(
      VodacomEndpointNotDocumentedError,
    );
  });

  it('queryTransaction: rejects when not configured', async () => {
    const service = buildService({});
    await expect(
      service.queryTransaction({ providerTransactionId: 'MPESA-1' }),
    ).rejects.toThrow(ServiceUnavailableException);
  });

  it('reverseTransaction: rejects when not configured', async () => {
    const service = buildService({});
    await expect(
      service.reverseTransaction({
        originalProviderTransactionId: 'MPESA-1',
        internalReference: 'TJZ-REV-1',
        amount: 1000,
        reason: 'customer dispute',
      }),
    ).rejects.toThrow(ServiceUnavailableException);
  });
});
