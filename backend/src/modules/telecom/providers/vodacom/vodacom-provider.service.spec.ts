import { BadRequestException } from '@nestjs/common';

import { VodacomProviderService } from './vodacom-provider.service';

describe('VodacomProviderService', () => {
  let service: VodacomProviderService;

  beforeEach(() => {
    service = new VodacomProviderService();
  });

  describe('normalizeResourceConversion', () => {
    it('maps a Vodacom bundle-purchase event onto WebhookResourceConversionDto', () => {
      const dto = service.normalizeResourceConversion(7, {
        msisdn: '255756801149',
        bundleType: 'DATA',
        bundleUnits: 500,
        bundleUnitType: 'MB',
        unitValueTzs: 4.5,
        purchaseTimestamp: '2026-09-03T09:00:00Z',
        vodacomTransactionId: 'VOD-RC-1',
        vodacomReference: 'REF-1',
      });

      expect(dto).toMatchObject({
        operatorId: 7,
        phoneNumber: '0756801149',
        externalTransactionId: 'VOD-RC-1',
        resourceType: 'DATA',
        grossUnits: 500,
        unit: 'MB',
        conversionTimestamp: '2026-09-03T09:00:00Z',
        providerUnitValueTzs: 4.5,
        providerReference: 'REF-1',
      });
    });

    it('accepts a local 0-prefixed MSISDN unchanged', () => {
      const dto = service.normalizeResourceConversion(7, {
        msisdn: '0756801149',
        bundleType: 'VOICE',
        bundleUnits: 100,
        bundleUnitType: 'MINUTES',
        unitValueTzs: 5,
        purchaseTimestamp: '2026-09-03T09:00:00Z',
        vodacomTransactionId: 'VOD-RC-2',
      });

      expect(dto.phoneNumber).toBe('0756801149');
    });

    it('rejects an unrecognized MSISDN shape', () => {
      expect(() =>
        service.normalizeResourceConversion(7, {
          msisdn: '12345',
          bundleType: 'VOICE',
          bundleUnits: 100,
          bundleUnitType: 'MINUTES',
          unitValueTzs: 5,
          purchaseTimestamp: '2026-09-03T09:00:00Z',
          vodacomTransactionId: 'VOD-RC-3',
        }),
      ).toThrow(BadRequestException);
    });
  });

  describe('normalizeOutgoingTransaction', () => {
    it.each([
      ['C2C', 'TUMA'],
      ['C2B', 'LIPA_NAMBA'],
      ['CASHOUT', 'TOA'],
      ['BILLPAY', 'BILL_PAYMENT'],
    ] as const)(
      'maps service code %s to transactionType %s',
      (serviceCode, expected) => {
        const dto = service.normalizeOutgoingTransaction(7, {
          msisdn: '255756801149',
          serviceCode,
          amountTzs: 10000,
          settledAt: '2026-09-03T09:05:00Z',
          vodacomTransactionId: `VOD-OT-${serviceCode}`,
        });

        expect(dto).toMatchObject({
          operatorId: 7,
          phoneNumber: '0756801149',
          externalTransactionId: `VOD-OT-${serviceCode}`,
          transactionType: expected,
          grossAmountTzs: 10000,
          transactionTimestamp: '2026-09-03T09:05:00Z',
        });
      },
    );

    it('rejects an unrecognized service code', () => {
      expect(() =>
        service.normalizeOutgoingTransaction(7, {
          msisdn: '0756801149',
          serviceCode: 'UNKNOWN' as never,
          amountTzs: 1000,
          settledAt: '2026-09-03T09:05:00Z',
          vodacomTransactionId: 'VOD-OT-X',
        }),
      ).toThrow(BadRequestException);
    });
  });
});
