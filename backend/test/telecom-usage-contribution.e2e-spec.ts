import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

// Proves the Model B usage-based Telecom contribution flow end to end:
//
//   VOICE/SMS/DATA usage event -> validate -> 6% of QUANTITY (never a
//   monetary value TUJITUNZE invents) -> telecom_contributions row ->
//   WalletsService.creditContribution (wallet + insurance allocation,
//   the SAME shared path every other channel already uses) -> audit log
//   -> reconciliation (the existing engine, unmodified).
//
// This exercises the real production code path — POST
// /telecom/webhooks/usage — the same way
// telecom-webhook-security.e2e-spec.ts exercises the purchase-based
// webhook, and does not touch or re-test the already-working Telecom
// connection-test endpoint.
describe('Telecom usage-based contribution — Model B 6% (e2e)', () => {
  let app: INestApplication<App>;
  let jwtService: JwtService;
  let dataSource: DataSource;

  const ts = Date.now().toString();
  const createdUserIds: number[] = [];
  const createdPhoneIds: number[] = [];
  const createdProviderIds: number[] = [];
  const createdPlanIds: number[] = [];
  const createdRunIds: number[] = [];

  const nida = (i: number) =>
    `${ts.slice(0, 8)}-${ts.slice(8, 13)}-${String(i).padStart(5, '0')}-06`;

  const phoneFor = (n: number) =>
    `07${String(Number(ts.slice(-8)) + n).padStart(8, '0')}`;

  const signToken = (userId: number, roles: string[], firstName: string) =>
    jwtService.sign({ sub: userId, roles, firstName });

  const createUser = async (
    firstName: string,
    nidaIndex: number,
    extraCols: Record<string, unknown> = {},
  ): Promise<number> => {
    const cols = [
      'first_name',
      'surname',
      'nida_number',
      'password_hash',
      'member_status',
      ...Object.keys(extraCols),
    ];
    const placeholders = cols.map((_, i) => `$${i + 1}`).join(', ');
    const values = [
      firstName,
      'E2E',
      nida(nidaIndex),
      'x',
      'Active',
      ...Object.values(extraCols),
    ];
    const [row] = await dataSource.query<{ user_id: number }[]>(
      `INSERT INTO users (${cols.join(', ')}) VALUES (${placeholders}) RETURNING user_id`,
      values,
    );
    createdUserIds.push(row.user_id);
    return row.user_id;
  };

  const createPhone = async (
    userId: number,
    operatorIdForPhone: number,
    phoneNumber: string,
  ): Promise<void> => {
    const [phone] = await dataSource.query<{ phone_id: number }[]>(
      `INSERT INTO phone_numbers (user_id, operator_id, phone_number, is_primary, phone_status)
       VALUES ($1, $2, $3, true, 'Active') RETURNING phone_id`,
      [userId, operatorIdForPhone, phoneNumber],
    );
    createdPhoneIds.push(phone.phone_id);
  };

  let operatorId: number;
  let otherOperatorId: number;
  let telecomStaffId: number;
  let providerId: number;
  let planId: number;

  let rawApiKey: string;
  let originalApiKeyHash: string | null;

  const sendUsage = (payload: Record<string, unknown>) =>
    request(app.getHttpServer())
      .post('/telecom/webhooks/usage')
      .set('X-API-Key', rawApiKey)
      .send(payload);

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    jwtService = app.get(JwtService);
    dataSource = app.get(DataSource);

    // Deliberately the LAST seeded operator (not LIMIT 1's first row) to
    // avoid clobbering the api_key_hash another e2e spec file running in
    // a parallel Jest worker may be actively using on operator #1.
    const [operator] = await dataSource.query<{ operator_id: number }[]>(
      `SELECT operator_id FROM telecom_operators ORDER BY operator_id DESC LIMIT 1`,
    );
    operatorId = operator.operator_id;

    const [other] = await dataSource.query<{ operator_id: number }[]>(
      `SELECT operator_id FROM telecom_operators WHERE operator_id != $1 ORDER BY operator_id ASC LIMIT 1`,
      [operatorId],
    );
    otherOperatorId = other.operator_id;

    telecomStaffId = await createUser('UsageE2EStaff', 1, {
      telecom_operator_id: operatorId,
    });

    const [{ api_key_hash: origHash }] = await dataSource.query<
      { api_key_hash: string | null }[]
    >(`SELECT api_key_hash FROM telecom_operators WHERE operator_id = $1`, [
      operatorId,
    ]);
    originalApiKeyHash = origHash;
    rawApiKey = `tk_e2e_usage_${crypto.randomBytes(12).toString('hex')}`;
    await dataSource.query(
      `UPDATE telecom_operators SET api_key_hash = $2, status = 'Active' WHERE operator_id = $1`,
      [operatorId, await bcrypt.hash(rawApiKey, 12)],
    );

    const [provider] = await dataSource.query<{ provider_id: number }[]>(
      `INSERT INTO insurance_providers (provider_name, status) VALUES ($1, 'Active') RETURNING provider_id`,
      [`E2E Usage Insurance ${ts}`],
    );
    providerId = provider.provider_id;
    createdProviderIds.push(providerId);

    const [plan] = await dataSource.query<{ plan_id: number }[]>(
      `INSERT INTO insurance_plans (provider_id, plan_name, coverage_amount, premium_amount, status)
       VALUES ($1, $2, 100000, 1000, 'Active') RETURNING plan_id`,
      [providerId, `E2E Usage Plan ${ts}`],
    );
    planId = plan.plan_id;
    createdPlanIds.push(planId);
  });

  afterAll(async () => {
    await dataSource.query(
      `DELETE FROM telecom_reconciliation_records WHERE run_id = ANY($1)`,
      [createdRunIds],
    );
    await dataSource.query(
      `DELETE FROM telecom_reconciliation_runs WHERE run_id = ANY($1)`,
      [createdRunIds],
    );
    await dataSource.query(
      `DELETE FROM insurance_allocations WHERE member_id = ANY($1)`,
      [createdUserIds],
    );
    await dataSource.query(
      `DELETE FROM wallet_transactions WHERE wallet_id IN (SELECT wallet_id FROM health_wallets WHERE member_id = ANY($1))`,
      [createdUserIds],
    );
    await dataSource.query(`DELETE FROM health_wallets WHERE member_id = ANY($1)`, [
      createdUserIds,
    ]);
    await dataSource.query(
      `DELETE FROM telecom_usage_events WHERE external_transaction_id LIKE $1`,
      [`USGE2E-${ts}-%`],
    );
    await dataSource.query(`DELETE FROM telecom_contributions WHERE member_id = ANY($1)`, [
      createdUserIds,
    ]);
    await dataSource.query(`DELETE FROM notifications WHERE member_id = ANY($1)`, [
      createdUserIds,
    ]);
    await dataSource.query(`DELETE FROM audit_logs WHERE member_id = ANY($1)`, [
      createdUserIds,
    ]);
    await dataSource.query(`DELETE FROM member_insurance WHERE member_id = ANY($1)`, [
      createdUserIds,
    ]);
    await dataSource.query(`DELETE FROM insurance_plans WHERE plan_id = ANY($1)`, [
      createdPlanIds,
    ]);
    await dataSource.query(`DELETE FROM phone_numbers WHERE phone_id = ANY($1)`, [
      createdPhoneIds,
    ]);
    await dataSource.query(`DELETE FROM users WHERE user_id = ANY($1)`, [
      createdUserIds,
    ]);
    await dataSource.query(`DELETE FROM insurance_providers WHERE provider_id = ANY($1)`, [
      createdProviderIds,
    ]);
    await dataSource.query(
      `UPDATE telecom_operators SET api_key_hash = $2 WHERE operator_id = $1`,
      [operatorId, originalApiKeyHash],
    );
    await app.close();
  });

  let memberVoiceId: number;
  let phoneVoice: string;

  it('1. valid VOICE usage event: exact 6% quantity, real wallet credit, insurance allocation, audit log', async () => {
    memberVoiceId = await createUser('UsageVoiceMember', 2);
    phoneVoice = phoneFor(1);
    await createPhone(memberVoiceId, operatorId, phoneVoice);
    await dataSource.query(
      `INSERT INTO member_insurance (member_id, plan_id, policy_number, start_date, policy_status)
       VALUES ($1, $2, $3, CURRENT_DATE, 'Active')`,
      [memberVoiceId, planId, `POL-USG-${ts}`],
    );

    const payload = {
      operatorId,
      phoneNumber: phoneVoice,
      usageType: 'VOICE',
      quantity: 100, // minutes
      unit: 'MINUTES',
      usageTimestamp: new Date().toISOString(),
      externalTransactionId: `USGE2E-${ts}-voice`,
      providerValuationTzs: 1200, // provider-authorized value for the 6-minute contribution quantity
    };

    const res = await sendUsage(payload).expect(201);

    expect(res.body).toMatchObject({
      duplicate: false,
      matched: true,
      status: 'SUCCESSFUL',
      allocation: { status: 'Allocated', providerName: `E2E Usage Insurance ${ts}` },
    });
    expect(Number(res.body.usageEvent.contributionQuantity)).toBe(6); // 100 * 0.06
    expect(Number(res.body.usageEvent.contributionRate)).toBeCloseTo(0.06, 4);
    expect(res.body.contribution.referenceNumber).toBe(
      `USG-VOICE-USGE2E-${ts}-voice`,
    );

    const [wallet] = await dataSource.query<{ balance: string }[]>(
      `SELECT balance FROM health_wallets WHERE member_id = $1`,
      [memberVoiceId],
    );
    expect(Number(wallet.balance)).toBe(1200);

    const [allocation] = await dataSource.query<
      { allocation_status: string; amount: string }[]
    >(
      `SELECT allocation_status, amount FROM insurance_allocations WHERE member_id = $1`,
      [memberVoiceId],
    );
    expect(allocation.allocation_status).toBe('Allocated');
    expect(Number(allocation.amount)).toBe(1200);

    const [audit] = await dataSource.query<{ action_type: string }[]>(
      `SELECT action_type FROM audit_logs
       WHERE member_id = $1 AND action_type = 'telecom.usage_event_process'`,
      [memberVoiceId],
    );
    expect(audit.action_type).toBe('telecom.usage_event_process');
  });

  it('2. valid SMS usage event for a member with NO insurance policy: contribution + wallet credit succeed, allocation stays null', async () => {
    const memberSmsId = await createUser('UsageSmsMember', 3);
    const phoneSms = phoneFor(2);
    await createPhone(memberSmsId, operatorId, phoneSms);

    const payload = {
      operatorId,
      phoneNumber: phoneSms,
      usageType: 'SMS',
      quantity: 50,
      unit: 'SMS',
      usageTimestamp: new Date().toISOString(),
      externalTransactionId: `USGE2E-${ts}-sms`,
      providerValuationTzs: 300,
    };

    const res = await sendUsage(payload).expect(201);

    expect(res.body).toMatchObject({ matched: true, status: 'SUCCESSFUL' });
    expect(res.body.allocation).toBeNull();
    expect(Number(res.body.usageEvent.contributionQuantity)).toBe(3); // 50 * 0.06

    const [wallet] = await dataSource.query<{ balance: string }[]>(
      `SELECT balance FROM health_wallets WHERE member_id = $1`,
      [memberSmsId],
    );
    expect(Number(wallet.balance)).toBe(300);

    const allocations = await dataSource.query<{ allocation_id: number }[]>(
      `SELECT allocation_id FROM insurance_allocations WHERE member_id = $1`,
      [memberSmsId],
    );
    expect(allocations.length).toBe(0);
  });

  let dataContributionReference: string;
  const dataProviderValuationTzs = 900;

  it('3. valid DATA usage event: correct 6% quantity calculation', async () => {
    const memberDataId = await createUser('UsageDataMember', 4);
    const phoneData = phoneFor(3);
    await createPhone(memberDataId, operatorId, phoneData);

    const payload = {
      operatorId,
      phoneNumber: phoneData,
      usageType: 'DATA',
      quantity: 1000, // MB
      unit: 'MB',
      usageTimestamp: new Date().toISOString(),
      externalTransactionId: `USGE2E-${ts}-data`,
      providerValuationTzs: dataProviderValuationTzs,
    };

    const res = await sendUsage(payload).expect(201);

    expect(Number(res.body.usageEvent.contributionQuantity)).toBe(60); // 1000 * 0.06
    dataContributionReference = res.body.contribution.referenceNumber;
    expect(dataContributionReference).toBe(`USG-DATA-USGE2E-${ts}-data`);
  });

  it('4. duplicate event: resending the same externalTransactionId + usageType produces exactly one financial effect', async () => {
    const payload = {
      operatorId,
      phoneNumber: phoneVoice,
      usageType: 'VOICE',
      quantity: 100,
      unit: 'MINUTES',
      usageTimestamp: new Date().toISOString(),
      externalTransactionId: `USGE2E-${ts}-voice`,
      providerValuationTzs: 1200,
    };

    const res = await sendUsage(payload).expect(201);
    expect(res.body.duplicate).toBe(true);

    const count = await dataSource.query<{ count: number }[]>(
      `SELECT COUNT(*)::int AS count FROM telecom_usage_events WHERE external_transaction_id = $1`,
      [`USGE2E-${ts}-voice`],
    );
    expect(count[0].count).toBe(1);

    const [wallet] = await dataSource.query<{ balance: string }[]>(
      `SELECT balance FROM health_wallets WHERE member_id = $1`,
      [memberVoiceId],
    );
    expect(Number(wallet.balance)).toBe(1200); // unchanged
  });

  it('5. invalid member: an unmatched phone number is recorded PENDING_REVIEW and never credited', async () => {
    const unmatchedPhone = phoneFor(4);

    const res = await sendUsage({
      operatorId,
      phoneNumber: unmatchedPhone,
      usageType: 'VOICE',
      quantity: 10,
      unit: 'MINUTES',
      usageTimestamp: new Date().toISOString(),
      externalTransactionId: `USGE2E-${ts}-unmatched`,
      providerValuationTzs: 100,
    }).expect(201);

    expect(res.body).toMatchObject({ matched: false, status: 'PENDING_REVIEW' });
    expect(res.body.usageEvent.memberId).toBeNull();

    const count = await dataSource.query<{ count: number }[]>(
      `SELECT COUNT(*)::int AS count FROM telecom_contributions WHERE reference_number = $1`,
      [`USG-VOICE-USGE2E-${ts}-unmatched`],
    );
    expect(count[0].count).toBe(0);
  });

  it('6. wrong operator: a phone registered under a different operator is not matched by this operator key', async () => {
    const crossMemberId = await createUser('UsageCrossOperatorMember', 5);
    const crossPhone = phoneFor(5);
    await createPhone(crossMemberId, otherOperatorId, crossPhone);

    const res = await sendUsage({
      operatorId, // authenticated as `operatorId`, not otherOperatorId
      phoneNumber: crossPhone,
      usageType: 'SMS',
      quantity: 10,
      unit: 'SMS',
      usageTimestamp: new Date().toISOString(),
      externalTransactionId: `USGE2E-${ts}-wrongop`,
      providerValuationTzs: 50,
    }).expect(201);

    expect(res.body).toMatchObject({ matched: false, status: 'PENDING_REVIEW' });

    const [wallet] = await dataSource.query<{ balance: string }[] >(
      `SELECT balance FROM health_wallets WHERE member_id = $1`,
      [crossMemberId],
    );
    expect(wallet).toBeUndefined(); // no wallet ever created for this member
  });

  it('7. invalid usage type: rejected by DTO validation before any DB write', async () => {
    await sendUsage({
      operatorId,
      phoneNumber: phoneVoice,
      usageType: 'FAX',
      quantity: 10,
      unit: 'MINUTES',
      usageTimestamp: new Date().toISOString(),
      externalTransactionId: `USGE2E-${ts}-badtype`,
      providerValuationTzs: 100,
    }).expect(400);

    const count = await dataSource.query<{ count: number }[]>(
      `SELECT COUNT(*)::int AS count FROM telecom_usage_events WHERE external_transaction_id = $1`,
      [`USGE2E-${ts}-badtype`],
    );
    expect(count[0].count).toBe(0);
  });

  it('8. invalid amount: a non-positive quantity is rejected by DTO validation', async () => {
    await sendUsage({
      operatorId,
      phoneNumber: phoneVoice,
      usageType: 'VOICE',
      quantity: -5,
      unit: 'MINUTES',
      usageTimestamp: new Date().toISOString(),
      externalTransactionId: `USGE2E-${ts}-badqty`,
      providerValuationTzs: 100,
    }).expect(400);
  });

  it('8b. invalid amount: a zero providerValuationTzs is rejected by DTO validation (never invented, never zero-filled)', async () => {
    await sendUsage({
      operatorId,
      phoneNumber: phoneVoice,
      usageType: 'VOICE',
      quantity: 10,
      unit: 'MINUTES',
      usageTimestamp: new Date().toISOString(),
      externalTransactionId: `USGE2E-${ts}-badvaluation`,
      providerValuationTzs: 0,
    }).expect(400);
  });

  it('9. mismatched usage type/unit pair is rejected as malformed before any DB write', async () => {
    await sendUsage({
      operatorId,
      phoneNumber: phoneVoice,
      usageType: 'VOICE',
      quantity: 10,
      unit: 'SMS', // VOICE must be reported in MINUTES
      usageTimestamp: new Date().toISOString(),
      externalTransactionId: `USGE2E-${ts}-badunit`,
      providerValuationTzs: 100,
    }).expect(400);

    const count = await dataSource.query<{ count: number }[]>(
      `SELECT COUNT(*)::int AS count FROM telecom_usage_events WHERE external_transaction_id = $1`,
      [`USGE2E-${ts}-badunit`],
    );
    expect(count[0].count).toBe(0);
  });

  it('10. transaction rollback: a wallet that cannot receive a contribution leaves no partial usage-event or contribution row', async () => {
    const memberRollbackId = await createUser('UsageRollbackMember', 6);
    const phoneRollback = phoneFor(6);
    await createPhone(memberRollbackId, operatorId, phoneRollback);
    await dataSource.query(
      `INSERT INTO health_wallets (member_id, wallet_number, balance, wallet_status)
       VALUES ($1, $2, 0, 'Suspended')`,
      [memberRollbackId, `TW-E2E-USG-${ts}`],
    );

    await sendUsage({
      operatorId,
      phoneNumber: phoneRollback,
      usageType: 'DATA',
      quantity: 200,
      unit: 'MB',
      usageTimestamp: new Date().toISOString(),
      externalTransactionId: `USGE2E-${ts}-rollback`,
      providerValuationTzs: 150,
    }).expect(400);

    const usageEventCount = await dataSource.query<{ count: number }[]>(
      `SELECT COUNT(*)::int AS count FROM telecom_usage_events WHERE external_transaction_id = $1`,
      [`USGE2E-${ts}-rollback`],
    );
    expect(usageEventCount[0].count).toBe(0); // insert rolled back with the rest of the transaction

    const contributionCount = await dataSource.query<{ count: number }[]>(
      `SELECT COUNT(*)::int AS count FROM telecom_contributions WHERE reference_number = $1`,
      [`USG-DATA-USGE2E-${ts}-rollback`],
    );
    expect(contributionCount[0].count).toBe(0);

    const [wallet] = await dataSource.query<{ balance: string }[]>(
      `SELECT balance FROM health_wallets WHERE member_id = $1`,
      [memberRollbackId],
    );
    expect(Number(wallet.balance)).toBe(0); // untouched
  });

  it('11. reconciliation: the usage contribution reference is matched by the existing (unmodified) reconciliation engine', async () => {
    const staffToken = signToken(telecomStaffId, ['Telecom'], 'UsageE2EStaff');

    const res = await request(app.getHttpServer())
      .post('/telecom/reconciliation/runs')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        records: [
          {
            externalReference: dataContributionReference,
            amount: dataProviderValuationTzs,
          },
        ],
      })
      .expect(201);

    createdRunIds.push(res.body.runId);
    expect(res.body.matchedCount).toBe(1);
  });

  it('12. staff can list/view usage events for their own operator with reconciliation status and a full trace', async () => {
    const staffToken = signToken(telecomStaffId, ['Telecom'], 'UsageE2EStaff');

    const listRes = await request(app.getHttpServer())
      .get('/telecom/usage-events?usageType=VOICE')
      .set('Authorization', `Bearer ${staffToken}`)
      .expect(200);
    expect(
      listRes.body.items.some(
        (item: { externalTransactionId: string }) =>
          item.externalTransactionId === `USGE2E-${ts}-voice`,
      ),
    ).toBe(true);

    const summaryRes = await request(app.getHttpServer())
      .get('/telecom/usage-events/summary')
      .set('Authorization', `Bearer ${staffToken}`)
      .expect(200);
    expect(summaryRes.body.byUsageType.VOICE.count).toBeGreaterThanOrEqual(1);
    expect(summaryRes.body.byStatus.SUCCESSFUL).toBeGreaterThanOrEqual(1);

    const [voiceEvent] = await dataSource.query<{ usage_event_id: number }[]>(
      `SELECT usage_event_id FROM telecom_usage_events WHERE external_transaction_id = $1`,
      [`USGE2E-${ts}-voice`],
    );
    const detailRes = await request(app.getHttpServer())
      .get(`/telecom/usage-events/${voiceEvent.usage_event_id}`)
      .set('Authorization', `Bearer ${staffToken}`)
      .expect(200);
    expect(detailRes.body.trace).toMatchObject({
      allocationStatus: 'Allocated',
    });
    expect(detailRes.body.trace.walletTransactionId).toEqual(expect.any(Number));
  });

  it('13. unauthorized request: a missing API key is rejected before any processing', async () => {
    const res = await request(app.getHttpServer())
      .post('/telecom/webhooks/usage')
      .send({
        operatorId,
        phoneNumber: phoneVoice,
        usageType: 'VOICE',
        quantity: 10,
        unit: 'MINUTES',
        usageTimestamp: new Date().toISOString(),
        externalTransactionId: `USGE2E-${ts}-unauth`,
        providerValuationTzs: 100,
      })
      .expect(401);
    expect(res.body.message).toMatch(/API key/i);

    const count = await dataSource.query<{ count: number }[]>(
      `SELECT COUNT(*)::int AS count FROM telecom_usage_events WHERE external_transaction_id = $1`,
      [`USGE2E-${ts}-unauth`],
    );
    expect(count[0].count).toBe(0);
  });
});
