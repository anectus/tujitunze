import { DataSource } from 'typeorm';

import { TelecomService } from './telecom.service';
import { WebhookOutgoingTransactionDto } from './dto/webhook-outgoing-transaction.dto';

// Principle 2 — outgoing-transaction diversion. Covers: an inactive
// rule is acknowledged and skipped (never an error, never a credit —
// the underlying transaction already settled regardless, and Principle
// 2 rules seed inactive pending a commercial agreement, see design
// doc §09), the PENDING_REVIEW fallback, and the full SUCCESSFUL
// credit path with the exact "10,000 TZS bill -> 200 TZS" example.
describe('TelecomService.handleOutgoingTransactionWebhook', () => {
  let dataSource: { query: jest.Mock; transaction: jest.Mock; manager: object };
  let auditLogsService: { record: jest.Mock };
  let walletsService: { creditContribution: jest.Mock };
  let service: TelecomService;

  const dto: WebhookOutgoingTransactionDto = {
    operatorId: 1,
    phoneNumber: '0754000000',
    transactionType: 'BILL_PAYMENT',
    grossAmountTzs: 10000,
    transactionTimestamp: '2026-09-02T08:00:00Z',
    externalTransactionId: 'TXN-1',
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

  it('returns duplicate:true on a replayed externalTransactionId', async () => {
    dataSource.query.mockResolvedValueOnce([
      { diversion_id: 1, external_transaction_id: 'TXN-1' },
    ]);

    const result = await service.handleOutgoingTransactionWebhook(1, dto);

    expect(result).toMatchObject({ duplicate: true });
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('acknowledges and credits nothing when the rule is not active yet, but still persists a SKIPPED row', async () => {
    dataSource.query
      .mockResolvedValueOnce([]) // idempotency
      .mockResolvedValueOnce([{ rule_id: 3, rate: '0.0200', is_active: false }])
      .mockResolvedValueOnce([]); // phone lookup: no match

    dataSource.transaction.mockImplementation(
      (callback: (manager: unknown) => unknown) =>
        callback({
          query: jest
            .fn()
            .mockResolvedValueOnce([{ event_id: 5 }]) // INSERT telecom_outgoing_transaction_events RETURNING event_id
            .mockResolvedValueOnce(undefined) // INSERT outgoing_transaction_savings
            .mockResolvedValueOnce([{ diversion_id: 5, status: 'SKIPPED' }]), // SELECT JOIN (selectOutgoingDiversionByEventId)
        }),
    );

    const result = await service.handleOutgoingTransactionWebhook(1, dto);

    expect(result).toMatchObject({ status: 'SKIPPED' });
    // Now wrapped in a transaction (unlike before) so the event and its
    // saving row are written atomically — see migration 0028.
    expect(dataSource.transaction).toHaveBeenCalled();
    expect(walletsService.creditContribution).not.toHaveBeenCalled();
    expect(auditLogsService.record).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        actionType: 'telecom.outgoing_diversion_skipped',
      }),
    );
  });

  it('acknowledges and credits nothing when no rule is configured at all, but still persists a SKIPPED row', async () => {
    dataSource.query
      .mockResolvedValueOnce([]) // idempotency
      .mockResolvedValueOnce([]) // rule lookup: none configured
      .mockResolvedValueOnce([]); // phone lookup: no match

    dataSource.transaction.mockImplementation(
      (callback: (manager: unknown) => unknown) =>
        callback({
          query: jest
            .fn()
            .mockResolvedValueOnce([{ event_id: 6 }])
            .mockResolvedValueOnce(undefined)
            .mockResolvedValueOnce([{ diversion_id: 6, status: 'SKIPPED' }]),
        }),
    );

    const result = await service.handleOutgoingTransactionWebhook(1, dto);

    expect(result).toMatchObject({ status: 'SKIPPED' });
    expect(dataSource.transaction).toHaveBeenCalled();
  });

  it('writes a PENDING_REVIEW row and never credits the wallet when the phone has no matching member', async () => {
    dataSource.query
      .mockResolvedValueOnce([]) // idempotency
      .mockResolvedValueOnce([{ rule_id: 3, rate: '0.0200', is_active: true }])
      .mockResolvedValueOnce([]); // phone lookup: no match

    dataSource.transaction.mockImplementation(
      (callback: (manager: unknown) => unknown) =>
        callback({
          query: jest
            .fn()
            .mockResolvedValueOnce([{ event_id: 77 }]) // INSERT telecom_outgoing_transaction_events RETURNING event_id
            .mockResolvedValueOnce(undefined) // INSERT outgoing_transaction_savings
            .mockResolvedValueOnce([
              { diversion_id: 77, status: 'PENDING_REVIEW' },
            ]), // SELECT JOIN (selectOutgoingDiversionByEventId)
        }),
    );

    const result = await service.handleOutgoingTransactionWebhook(1, dto);

    expect(result).toMatchObject({ matched: false, status: 'PENDING_REVIEW' });
    expect(walletsService.creditContribution).not.toHaveBeenCalled();
  });

  it('never credits a member who has opted out', async () => {
    dataSource.query
      .mockResolvedValueOnce([]) // idempotency
      .mockResolvedValueOnce([{ rule_id: 3, rate: '0.0200', is_active: true }])
      .mockResolvedValueOnce([{ phone_id: 10, user_id: 5 }]) // phone lookup
      .mockResolvedValueOnce([{ consented: false }]); // opted out

    dataSource.transaction.mockImplementation(
      (callback: (manager: unknown) => unknown) =>
        callback({
          query: jest
            .fn()
            .mockResolvedValueOnce([{ event_id: 62 }]) // INSERT telecom_outgoing_transaction_events RETURNING event_id
            .mockResolvedValueOnce(undefined) // INSERT outgoing_transaction_savings
            .mockResolvedValueOnce([{ diversion_id: 62, status: 'OPTED_OUT' }]), // SELECT JOIN (selectOutgoingDiversionByEventId)
        }),
    );

    const result = await service.handleOutgoingTransactionWebhook(1, dto);

    expect(result).toMatchObject({ matched: true, status: 'OPTED_OUT' });
    expect(walletsService.creditContribution).not.toHaveBeenCalled();
    // Now wrapped in a transaction (unlike before) so the event and its
    // saving row are written atomically — see migration 0028.
    expect(dataSource.transaction).toHaveBeenCalled();
  });

  it('credits exactly the diverted share to the wallet on a matched, successful diversion', async () => {
    dataSource.query
      .mockResolvedValueOnce([]) // idempotency
      .mockResolvedValueOnce([{ rule_id: 3, rate: '0.0200', is_active: true }]) // 2%
      .mockResolvedValueOnce([{ phone_id: 10, user_id: 5 }]) // phone lookup
      .mockResolvedValueOnce([]); // consent check: no row => opted in

    const managerQuery = jest
      .fn()
      // 1. INSERT telecom_outgoing_transaction_events RETURNING event_id
      .mockResolvedValueOnce([{ event_id: 88 }])
      // 2. INSERT outgoing_transaction_savings
      .mockResolvedValueOnce(undefined)
      // 3. INSERT telecom_contributions RETURNING ...
      .mockResolvedValueOnce([
        {
          contribution_id: 300,
          reference_number: 'DIV-BILL_PAYMENT-TXN-1',
          internal_reference: 'TJZ-DIV-1',
          contribution_amount: '200.00',
          contribution_source: 'BILL_PAYMENT',
          processing_status: 'Received',
          contribution_date: new Date('2026-09-02T08:00:00Z'),
        },
      ])
      // 4. UPDATE processing_status = 'Validated'
      .mockResolvedValueOnce(undefined)
      // 5. UPDATE outgoing_transaction_savings SET status='SUCCESSFUL' (no destructure)
      .mockResolvedValueOnce(undefined)
      // 6. SELECT JOIN (selectOutgoingDiversionByEventId) for finalDiversion
      .mockResolvedValueOnce([{ diversion_id: 88, status: 'SUCCESSFUL' }])
      // 7. INSERT saving_ledger
      .mockResolvedValueOnce(undefined);

    dataSource.transaction.mockImplementation(
      (callback: (manager: unknown) => unknown) =>
        callback({ query: managerQuery }),
    );

    walletsService.creditContribution.mockResolvedValue({
      walletTransaction: { walletTransactionId: 901 },
      allocation: null,
    });

    const result = await service.handleOutgoingTransactionWebhook(1, dto);

    // 2% of 10,000 TZS = 200 TZS — the design document's worked example.
    expect(walletsService.creditContribution).toHaveBeenCalledWith(
      expect.anything(),
      5,
      200,
      expect.objectContaining({ contributionId: 300 }),
    );
    expect(result).toMatchObject({ matched: true, status: 'SUCCESSFUL' });
  });
});
