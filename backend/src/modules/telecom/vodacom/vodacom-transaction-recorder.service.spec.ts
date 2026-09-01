import { NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { VodacomTransactionRecorder } from './vodacom-transaction-recorder.service';

function fakeRow(overrides: Record<string, unknown> = {}) {
  return {
    payment_transaction_id: 1,
    external_transaction_id: null,
    internal_reference: 'TJZ-REF-1',
    member_id: 5,
    channel: 'MOBILE_MONEY',
    provider: 'VODACOM_MPESA',
    telecom_operator_id: 1,
    bank_id: null,
    phone_id: null,
    member_bank_account_id: null,
    msisdn: '0754000000',
    amount: '1000.00',
    currency: 'TZS',
    transaction_type: 'C2B',
    status: 'INITIATED',
    provider_timestamp: null,
    received_at: new Date(),
    processed_at: null,
    failure_reason: null,
    reversal_reference: null,
    raw_reference: null,
    metadata: null,
    contribution_id: null,
    bank_transaction_id: null,
    conversation_id: null,
    third_party_conversation_id: 'TJZ-TPC-1',
    response_code: null,
    response_description: null,
    reconciliation_status: 'Pending',
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  };
}

describe('VodacomTransactionRecorder', () => {
  let query: jest.Mock<Promise<unknown>, [string, unknown[]?]>;
  let recorder: VodacomTransactionRecorder;

  beforeEach(() => {
    query = jest.fn<Promise<unknown>, [string, unknown[]?]>();
    const dataSource = { query } as unknown as DataSource;
    recorder = new VodacomTransactionRecorder(dataSource);
  });

  it('findByInternalReference returns null when no row exists', async () => {
    query.mockResolvedValue([]);
    const result = await recorder.findByInternalReference('TJZ-MISSING');
    expect(result).toBeNull();
  });

  it('findByInternalReference maps an existing row to camelCase', async () => {
    query.mockResolvedValue([fakeRow()]);
    const result = await recorder.findByInternalReference('TJZ-REF-1');
    expect(result).toMatchObject({
      internalReference: 'TJZ-REF-1',
      status: 'INITIATED',
      provider: 'VODACOM_MPESA',
      msisdn: '0754000000',
      thirdPartyConversationId: 'TJZ-TPC-1',
      reconciliationStatus: 'Pending',
    });
  });

  it('recordInitiated inserts a row with status INITIATED, msisdn, and third_party_conversation_id', async () => {
    query.mockResolvedValue([fakeRow({ status: 'INITIATED' })]);

    const result = await recorder.recordInitiated({
      internalReference: 'TJZ-REF-1',
      memberId: 5,
      telecomOperatorId: 1,
      msisdn: '0754000000',
      thirdPartyConversationId: 'TJZ-TPC-1',
      amount: 1000,
      currency: 'TZS',
      transactionType: 'C2B',
    });

    expect(result.status).toBe('INITIATED');
    const [sql, params] = query.mock.calls[0];
    expect(sql).toContain('INSERT INTO payment_transactions');
    expect(sql).toContain("'MOBILE_MONEY'");
    expect(sql).toContain("'VODACOM_MPESA'");
    expect(params).toEqual([
      'TJZ-REF-1',
      5,
      1,
      null,
      null,
      '0754000000',
      'TJZ-TPC-1',
      1000,
      'TZS',
      'C2B',
      null,
    ]);
  });

  it('recordInitiated uses the provided queryable (e.g. a transactional EntityManager) instead of the DataSource', async () => {
    const managerQuery = jest.fn().mockResolvedValue([fakeRow()]);
    const manager = {
      query: managerQuery,
    } as unknown as import('typeorm').EntityManager;

    await recorder.recordInitiated(
      {
        internalReference: 'TJZ-REF-1',
        memberId: 5,
        telecomOperatorId: 1,
        msisdn: '0754000000',
        thirdPartyConversationId: 'TJZ-TPC-1',
        amount: 1000,
        currency: 'TZS',
        transactionType: 'C2B',
      },
      manager,
    );

    expect(managerQuery).toHaveBeenCalled();
    expect(query).not.toHaveBeenCalled();
  });

  it('recordOutcome updates status to FAILED with the given reason (UPDATE...RETURNING nested-array shape)', async () => {
    // manager/dataSource.query() on an UPDATE...RETURNING resolves to
    // [rows, affectedRowCount] under this TypeORM version — verified
    // empirically against the live DB for this exact call pattern.
    query.mockResolvedValue([
      [fakeRow({ status: 'FAILED', failure_reason: 'boom' })],
      1,
    ]);

    const result = await recorder.recordOutcome(1, {
      status: 'FAILED',
      failureReason: 'boom',
      rawResponse: { raw: true },
    });

    expect(result.status).toBe('FAILED');
    expect(result.failureReason).toBe('boom');
    const [sql, params] = query.mock.calls[0];
    expect(sql).toContain('SET status = CASE');
    expect(params[0]).toBe(1);
    expect(params[1]).toBe('FAILED');
    expect(params[6]).toBe('boom');
    expect(params[7]).toBe(JSON.stringify({ raw: true }));
  });

  it('recordOutcome throws NotFoundException when the row does not exist', async () => {
    query.mockResolvedValue([[], 0]);
    await expect(
      recorder.recordOutcome(999, { status: 'FAILED', rawResponse: null }),
    ).rejects.toThrow(NotFoundException);
  });

  it('recordOutcome updates status to SUCCESSFUL with the external transaction id, conversation id, and response code', async () => {
    query.mockResolvedValue([
      [
        fakeRow({
          status: 'SUCCESSFUL',
          external_transaction_id: 'MPESA-999',
          conversation_id: 'CONV-1',
          response_code: 'INS-0',
        }),
      ],
      1,
    ]);

    const result = await recorder.recordOutcome(1, {
      status: 'SUCCESSFUL',
      externalTransactionId: 'MPESA-999',
      conversationId: 'CONV-1',
      responseCode: 'INS-0',
      responseDescription: 'Request processed successfully',
      rawResponse: { ok: true },
    });

    expect(result.status).toBe('SUCCESSFUL');
    expect(result.externalTransactionId).toBe('MPESA-999');
    expect(result.conversationId).toBe('CONV-1');
    expect(result.responseCode).toBe('INS-0');
  });

  it('recordOutcome uses the provided queryable (e.g. a transactional EntityManager) instead of the DataSource', async () => {
    const managerQuery = jest.fn().mockResolvedValue([[fakeRow()], 1]);
    const manager = {
      query: managerQuery,
    } as unknown as import('typeorm').EntityManager;

    await recorder.recordOutcome(
      1,
      {
        status: 'SUCCESSFUL',
        externalTransactionId: 'MPESA-1',
        rawResponse: null,
      },
      manager,
    );

    expect(managerQuery).toHaveBeenCalled();
    expect(query).not.toHaveBeenCalled();
  });

  it('getVodacomOperatorId returns the operator_id for the "Vodacom" row', async () => {
    query.mockResolvedValue([{ operator_id: 7 }]);
    const id = await recorder.getVodacomOperatorId();
    expect(id).toBe(7);
    expect(query.mock.calls[0][0]).toContain("WHERE operator_name = 'Vodacom'");
  });

  it('getVodacomOperatorId throws NotFoundException when no Vodacom operator row exists', async () => {
    query.mockResolvedValue([]);
    await expect(recorder.getVodacomOperatorId()).rejects.toThrow(
      NotFoundException,
    );
  });
});
