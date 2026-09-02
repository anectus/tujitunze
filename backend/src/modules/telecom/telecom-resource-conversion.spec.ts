import { DataSource } from 'typeorm';
import { BadRequestException } from '@nestjs/common';

import { TelecomService } from './telecom.service';
import { WebhookResourceConversionDto } from './dto/webhook-resource-conversion.dto';

// Principle 1 — resource conversion. Covers the branches that matter
// most for a financial webhook: idempotent replay, no-active-rule
// rejection, the PENDING_REVIEW fallback that must never touch the
// wallet, and the full SUCCESSFUL credit path with the exact amount
// the design's "100 min -> 10 saved -> 50 TZS" example implies.
describe('TelecomService.handleResourceConversionWebhook', () => {
  let dataSource: { query: jest.Mock; transaction: jest.Mock; manager: object };
  let auditLogsService: { record: jest.Mock };
  let walletsService: { creditContribution: jest.Mock };
  let service: TelecomService;

  const dto: WebhookResourceConversionDto = {
    operatorId: 1,
    phoneNumber: '0754000000',
    resourceType: 'VOICE',
    grossUnits: 100,
    unit: 'MINUTES',
    conversionTimestamp: '2026-09-02T08:00:00Z',
    externalTransactionId: 'CONV-1',
    providerUnitValueTzs: 5,
  };

  beforeEach(() => {
    dataSource = { query: jest.fn(), transaction: jest.fn(), manager: {} };
    auditLogsService = { record: jest.fn().mockResolvedValue(undefined) };
    walletsService = { creditContribution: jest.fn() };
    service = new TelecomService(
      dataSource as unknown as DataSource,
      auditLogsService as never,
      walletsService as never,
      {
        assertOperatorSupported: jest.fn(),
        isVodacomOperator: jest.fn(),
      } as never,
      {} as never,
      { get: jest.fn() } as never,
    );
  });

  it('rejects a unit/resourceType mismatch before touching the database', async () => {
    await expect(
      service.handleResourceConversionWebhook(1, { ...dto, unit: 'MB' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(dataSource.query).not.toHaveBeenCalled();
  });

  it('returns duplicate:true on a replayed externalTransactionId without writing anything new', async () => {
    dataSource.query.mockResolvedValueOnce([
      {
        conversion_id: 1,
        net_units_to_customer: '90.00',
        external_transaction_id: 'CONV-1',
      },
    ]);

    const result = await service.handleResourceConversionWebhook(1, dto);

    expect(result).toMatchObject({ duplicate: true, netUnitsToCustomer: 90 });
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('rejects when no active RESOURCE_CONVERSION rule exists for the resource type, but still persists a NO_ACTIVE_RULE row', async () => {
    dataSource.query
      .mockResolvedValueOnce([]) // idempotency check: no existing row (JOIN select)
      .mockResolvedValueOnce([]) // phone lookup: no match
      .mockResolvedValueOnce([]); // rule lookup: none active

    dataSource.transaction.mockImplementation(
      (callback: (manager: unknown) => unknown) =>
        callback({
          query: jest
            .fn()
            .mockResolvedValueOnce([{ event_id: 42 }]) // INSERT telecom_resource_conversion_events RETURNING event_id
            .mockResolvedValueOnce(undefined), // INSERT telecom_resource_usage_splits
        }),
    );

    await expect(
      service.handleResourceConversionWebhook(1, dto),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(auditLogsService.record).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        actionType: 'telecom.resource_conversion_no_active_rule',
      }),
    );
  });

  it('writes a PENDING_REVIEW row and never credits the wallet when the phone has no matching member', async () => {
    dataSource.query
      .mockResolvedValueOnce([]) // idempotency
      .mockResolvedValueOnce([]) // phone lookup: no match
      .mockResolvedValueOnce([{ rule_id: 7, rate: '0.1000' }]); // active 10% rule

    dataSource.transaction.mockImplementation(
      (callback: (manager: unknown) => unknown) =>
        callback({
          query: jest
            .fn()
            .mockResolvedValueOnce([{ event_id: 99 }]) // INSERT telecom_resource_conversion_events RETURNING event_id
            .mockResolvedValueOnce(undefined) // INSERT telecom_resource_usage_splits
            .mockResolvedValueOnce([
              {
                conversion_id: 99,
                status: 'PENDING_REVIEW',
                net_units_to_customer: '90.00',
              },
            ]), // SELECT JOIN (selectResourceConversionByEventId)
        }),
    );

    const result = await service.handleResourceConversionWebhook(1, dto);

    expect(result).toMatchObject({
      matched: false,
      status: 'PENDING_REVIEW',
      netUnitsToCustomer: 90,
    });
    expect(walletsService.creditContribution).not.toHaveBeenCalled();
    expect(auditLogsService.record).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        actionType: 'telecom.resource_conversion_pending_review',
      }),
    );
  });

  it('never credits a member who has opted out, and passes through the full gross amount', async () => {
    dataSource.query
      .mockResolvedValueOnce([]) // idempotency
      .mockResolvedValueOnce([{ phone_id: 10, user_id: 5 }]) // phone lookup
      .mockResolvedValueOnce([{ rule_id: 7, rate: '0.1000' }]) // active rule
      .mockResolvedValueOnce([{ consented: false }]); // opted out

    dataSource.transaction.mockImplementation(
      (callback: (manager: unknown) => unknown) =>
        callback({
          query: jest
            .fn()
            .mockResolvedValueOnce([{ event_id: 61 }]) // INSERT telecom_resource_conversion_events RETURNING event_id
            .mockResolvedValueOnce(undefined) // INSERT telecom_resource_usage_splits
            .mockResolvedValueOnce([
              {
                conversion_id: 61,
                status: 'OPTED_OUT',
                net_units_to_customer: '100.00',
              },
            ]), // SELECT JOIN (selectResourceConversionByEventId)
        }),
    );

    const result = await service.handleResourceConversionWebhook(1, dto);

    expect(result).toMatchObject({
      matched: true,
      status: 'OPTED_OUT',
      netUnitsToCustomer: 100,
    });
    expect(walletsService.creditContribution).not.toHaveBeenCalled();
    // Now wrapped in a transaction (unlike before) so the event and its
    // usage-split row are written atomically — see migration 0028.
    expect(dataSource.transaction).toHaveBeenCalled();
  });

  it('credits exactly the saved-resource value to the wallet on a matched, successful conversion', async () => {
    dataSource.query
      .mockResolvedValueOnce([]) // idempotency
      .mockResolvedValueOnce([{ phone_id: 10, user_id: 5 }]) // phone lookup
      .mockResolvedValueOnce([{ rule_id: 7, rate: '0.1000' }]) // 10% rule
      .mockResolvedValueOnce([]); // consent check: no row => opted in

    const managerQuery = jest
      .fn()
      // 1. INSERT telecom_resource_conversion_events RETURNING event_id
      .mockResolvedValueOnce([{ event_id: 55 }])
      // 2. INSERT telecom_resource_usage_splits
      .mockResolvedValueOnce(undefined)
      // 3. INSERT telecom_contributions RETURNING ...
      .mockResolvedValueOnce([
        {
          contribution_id: 200,
          reference_number: 'RSC-VOICE-CONV-1',
          internal_reference: 'TJZ-RSC-1',
          contribution_amount: '50.00',
          contribution_source: 'VOICE',
          processing_status: 'Received',
          contribution_date: new Date('2026-09-02T08:00:00Z'),
        },
      ])
      // 4. UPDATE processing_status = 'Validated' (no destructure)
      .mockResolvedValueOnce(undefined)
      // 5. UPDATE telecom_resource_usage_splits SET status='SUCCESSFUL' (no destructure)
      .mockResolvedValueOnce(undefined)
      // 6. SELECT JOIN (selectResourceConversionByEventId) for finalConversion
      .mockResolvedValueOnce([
        {
          conversion_id: 55,
          status: 'SUCCESSFUL',
          net_units_to_customer: '90.00',
        },
      ])
      // 7. INSERT saving_ledger
      .mockResolvedValueOnce(undefined);

    dataSource.transaction.mockImplementation(
      (callback: (manager: unknown) => unknown) =>
        callback({ query: managerQuery }),
    );

    walletsService.creditContribution.mockResolvedValue({
      walletTransaction: { walletTransactionId: 900 },
      allocation: null,
    });

    const result = await service.handleResourceConversionWebhook(1, dto);

    // 10% of 100 minutes = 10 saved minutes; 10 x 5 TZS/min = 50 TZS —
    // the exact figure the design document's worked example uses.
    expect(walletsService.creditContribution).toHaveBeenCalledWith(
      expect.anything(),
      5,
      50,
      expect.objectContaining({ contributionId: 200 }),
    );
    expect(result).toMatchObject({
      matched: true,
      status: 'SUCCESSFUL',
      netUnitsToCustomer: 90,
    });
  });
});
