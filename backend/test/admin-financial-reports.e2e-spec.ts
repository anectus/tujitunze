import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

// Proves STEP 9's Admin financial reporting end to end, on top of the
// existing STEP 3/6/7 contribution + allocation + reconciliation ledger.
// No new source-of-truth tables — telecom_contributions,
// bank_transactions, insurance_allocations, and admin_reconciliation_records
// (STEP 7) remain authoritative; GET /admin/reports/financial* only
// queries and aggregates them, filtered and paginated, for Admin.
//
// Isolation strategy: every fixture's external reference carries the
// same unique `RPT-<ts>` prefix, and most assertions filter by
// `reference=RPT-<ts>` so this suite's counts are exact regardless of
// what other data exists in the database (this DB is shared across the
// whole e2e run, not reset between spec files).
describe('Admin financial reporting (e2e)', () => {
  let app: INestApplication<App>;
  let jwtService: JwtService;
  let dataSource: DataSource;

  const ts = Date.now().toString();
  const REF = `RPT-${ts}`;
  const createdUserIds: number[] = [];
  const createdPhoneIds: number[] = [];
  const createdBankAccountIds: number[] = [];
  const createdProviderIds: number[] = [];
  const createdPlanIds: number[] = [];
  const createdRunIds: number[] = [];

  const nida = (i: number) =>
    `${ts.slice(0, 8)}-${ts.slice(8, 13)}-${String(i).padStart(5, '0')}-09`;

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

  let adminToken: string;
  let telecomStaffId: number;
  let telecomToken: string;
  let bankStaffId: number;
  let bankToken: string;

  let operatorId: number;
  let bankId: number;
  let activeProviderId: number;
  let activePlanId: number;
  let suspendedProviderId: number;
  let suspendedPlanId: number;

  let memberAId: number;
  let memberBId: number;
  let contributionDId: number;

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

    const adminId = await createUser('FinReportAdmin', 1);
    adminToken = signToken(adminId, ['Admin'], 'FinReportAdmin');

    const [operator] = await dataSource.query<{ operator_id: number }[]>(
      `SELECT operator_id FROM telecom_operators LIMIT 1`,
    );
    operatorId = operator.operator_id;
    telecomStaffId = await createUser('FinReportTelecomStaff', 2, {
      telecom_operator_id: operatorId,
    });
    telecomToken = signToken(telecomStaffId, ['Telecom'], 'FinReportTelecomStaff');

    const [bank] = await dataSource.query<{ bank_id: number }[]>(
      `SELECT bank_id FROM banks LIMIT 1`,
    );
    bankId = bank.bank_id;
    bankStaffId = await createUser('FinReportBankStaff', 3, { bank_id: bankId });
    bankToken = signToken(bankStaffId, ['Bank'], 'FinReportBankStaff');

    const [provider] = await dataSource.query<{ provider_id: number }[]>(
      `INSERT INTO insurance_providers (provider_name, status) VALUES ($1, 'Active') RETURNING provider_id`,
      [`E2E FinReport Insurance ${ts}`],
    );
    activeProviderId = provider.provider_id;
    createdProviderIds.push(activeProviderId);

    const [plan] = await dataSource.query<{ plan_id: number }[]>(
      `INSERT INTO insurance_plans (provider_id, plan_name, coverage_amount, premium_amount, status)
       VALUES ($1, $2, 100000, 1000, 'Active') RETURNING plan_id`,
      [activeProviderId, `E2E FinReport Plan ${ts}`],
    );
    activePlanId = plan.plan_id;
    createdPlanIds.push(activePlanId);

    const [suspendedProvider] = await dataSource.query<
      { provider_id: number }[]
    >(
      `INSERT INTO insurance_providers (provider_name, status) VALUES ($1, 'Suspended') RETURNING provider_id`,
      [`E2E FinReport Suspended Insurance ${ts}`],
    );
    suspendedProviderId = suspendedProvider.provider_id;
    createdProviderIds.push(suspendedProviderId);

    const [suspendedPlan] = await dataSource.query<{ plan_id: number }[]>(
      `INSERT INTO insurance_plans (provider_id, plan_name, coverage_amount, premium_amount, status)
       VALUES ($1, $2, 100000, 1000, 'Active') RETURNING plan_id`,
      [suspendedProviderId, `E2E FinReport Suspended Plan ${ts}`],
    );
    suspendedPlanId = suspendedPlan.plan_id;
    createdPlanIds.push(suspendedPlanId);
  });

  afterAll(async () => {
    await dataSource.query(
      `DELETE FROM admin_reconciliation_records WHERE run_id = ANY($1)`,
      [createdRunIds],
    );
    await dataSource.query(
      `DELETE FROM admin_reconciliation_runs WHERE run_id = ANY($1)`,
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
    await dataSource.query(
      `DELETE FROM health_wallets WHERE member_id = ANY($1)`,
      [createdUserIds],
    );
    await dataSource.query(
      `DELETE FROM telecom_contributions WHERE member_id = ANY($1)`,
      [createdUserIds],
    );
    await dataSource.query(
      `DELETE FROM bank_transactions WHERE member_bank_account_id = ANY($1)`,
      [createdBankAccountIds],
    );
    await dataSource.query(
      `DELETE FROM notifications WHERE member_id = ANY($1)`,
      [createdUserIds],
    );
    await dataSource.query(`DELETE FROM audit_logs WHERE member_id = ANY($1)`, [
      createdUserIds,
    ]);
    await dataSource.query(
      `DELETE FROM member_insurance WHERE member_id = ANY($1)`,
      [createdUserIds],
    );
    await dataSource.query(
      `DELETE FROM insurance_plans WHERE plan_id = ANY($1)`,
      [createdPlanIds],
    );
    await dataSource.query(
      `DELETE FROM member_bank_accounts WHERE member_bank_account_id = ANY($1)`,
      [createdBankAccountIds],
    );
    await dataSource.query(
      `DELETE FROM phone_numbers WHERE phone_id = ANY($1)`,
      [createdPhoneIds],
    );
    await dataSource.query(`DELETE FROM users WHERE user_id = ANY($1)`, [
      createdUserIds,
    ]);
    await dataSource.query(
      `DELETE FROM insurance_providers WHERE provider_id = ANY($1)`,
      [createdProviderIds],
    );
    await app.close();
  });

  it('rejects non-Admin tokens on all three endpoints', async () => {
    await request(app.getHttpServer())
      .get('/admin/reports/financial')
      .set('Authorization', `Bearer ${telecomToken}`)
      .expect(403);
    await request(app.getHttpServer())
      .get('/admin/reports/financial/transactions')
      .set('Authorization', `Bearer ${telecomToken}`)
      .expect(403);
    await request(app.getHttpServer())
      .get('/admin/reports/financial/filters')
      .set('Authorization', `Bearer ${telecomToken}`)
      .expect(403);
  });

  describe('Fixtures: 6 contributions across both channels and every allocation outcome', () => {
    it('A — Airtime, Active provider -> Allocated', async () => {
      memberAId = await createUser('FinReportMemberA', 4);
      const phoneNumber = `07${ts.slice(-8)}`;
      const [phone] = await dataSource.query<{ phone_id: number }[]>(
        `INSERT INTO phone_numbers (user_id, operator_id, phone_number, is_primary, phone_status)
         VALUES ($1, $2, $3, true, 'Active') RETURNING phone_id`,
        [memberAId, operatorId, phoneNumber],
      );
      createdPhoneIds.push(phone.phone_id);
      await dataSource.query(
        `INSERT INTO member_insurance (member_id, plan_id, policy_number, start_date, policy_status)
         VALUES ($1, $2, $3, CURRENT_DATE, 'Active')`,
        [memberAId, activePlanId, `POL-RPT-A-${ts}`],
      );

      const res = await request(app.getHttpServer())
        .post('/telecom/contributions')
        .set('Authorization', `Bearer ${telecomToken}`)
        .send({ phoneNumber, amount: 20, referenceNumber: `${REF}-A` })
        .expect(201);
      expect(res.body).toMatchObject({ processingStatus: 'Allocated' });
    });

    it('B — Bank Transfer, Active provider -> Allocated', async () => {
      memberBId = await createUser('FinReportMemberB', 5);
      const accountNumber = `ACC-RPT-${ts}`;
      const [account] = await dataSource.query<
        { member_bank_account_id: number }[]
      >(
        `INSERT INTO member_bank_accounts (member_id, bank_id, account_number, account_holder_name, account_status, verification_status)
         VALUES ($1, $2, $3, 'FinReport E2E', 'Active', 'Verified') RETURNING member_bank_account_id`,
        [memberBId, bankId, accountNumber],
      );
      createdBankAccountIds.push(account.member_bank_account_id);
      await dataSource.query(
        `INSERT INTO member_insurance (member_id, plan_id, policy_number, start_date, policy_status)
         VALUES ($1, $2, $3, CURRENT_DATE, 'Active')`,
        [memberBId, activePlanId, `POL-RPT-B-${ts}`],
      );

      const res = await request(app.getHttpServer())
        .post('/bank/contributions')
        .set('Authorization', `Bearer ${bankToken}`)
        .send({ accountNumber, amount: 30, transactionReference: `${REF}-B` })
        .expect(201);
      expect(res.body).toMatchObject({ transactionStatus: 'Allocated' });
    });

    it('C — Airtime, Suspended provider -> FailedAllocation (contribution stays Validated)', async () => {
      const memberId = await createUser('FinReportMemberC', 6);
      const phoneNumber = `07${String(Number(ts.slice(-8)) + 1).padStart(8, '0')}`;
      const [phone] = await dataSource.query<{ phone_id: number }[]>(
        `INSERT INTO phone_numbers (user_id, operator_id, phone_number, is_primary, phone_status)
         VALUES ($1, $2, $3, true, 'Active') RETURNING phone_id`,
        [memberId, operatorId, phoneNumber],
      );
      createdPhoneIds.push(phone.phone_id);
      await dataSource.query(
        `INSERT INTO member_insurance (member_id, plan_id, policy_number, start_date, policy_status)
         VALUES ($1, $2, $3, CURRENT_DATE, 'Active')`,
        [memberId, suspendedPlanId, `POL-RPT-C-${ts}`],
      );

      const res = await request(app.getHttpServer())
        .post('/telecom/contributions')
        .set('Authorization', `Bearer ${telecomToken}`)
        .send({ phoneNumber, amount: 8, referenceNumber: `${REF}-C` })
        .expect(201);
      expect(res.body).toMatchObject({ processingStatus: 'Validated' });
    });

    it('D — Airtime, Active provider -> Allocated, then reversed -> Reversed', async () => {
      const memberId = await createUser('FinReportMemberD', 7);
      const phoneNumber = `07${String(Number(ts.slice(-8)) + 2).padStart(8, '0')}`;
      const [phone] = await dataSource.query<{ phone_id: number }[]>(
        `INSERT INTO phone_numbers (user_id, operator_id, phone_number, is_primary, phone_status)
         VALUES ($1, $2, $3, true, 'Active') RETURNING phone_id`,
        [memberId, operatorId, phoneNumber],
      );
      createdPhoneIds.push(phone.phone_id);
      await dataSource.query(
        `INSERT INTO member_insurance (member_id, plan_id, policy_number, start_date, policy_status)
         VALUES ($1, $2, $3, CURRENT_DATE, 'Active')`,
        [memberId, activePlanId, `POL-RPT-D-${ts}`],
      );

      const createRes = await request(app.getHttpServer())
        .post('/telecom/contributions')
        .set('Authorization', `Bearer ${telecomToken}`)
        .send({ phoneNumber, amount: 9, referenceNumber: `${REF}-D` })
        .expect(201);
      expect(createRes.body).toMatchObject({ processingStatus: 'Allocated' });
      contributionDId = (createRes.body as { contributionId: number })
        .contributionId;

      await request(app.getHttpServer())
        .patch(`/telecom/contributions/${contributionDId}/reverse`)
        .set('Authorization', `Bearer ${telecomToken}`)
        .expect(200);
    });

    it('E — Airtime, no active policy -> no allocation at all', async () => {
      const memberId = await createUser('FinReportMemberE', 8);
      const phoneNumber = `07${String(Number(ts.slice(-8)) + 3).padStart(8, '0')}`;
      const [phone] = await dataSource.query<{ phone_id: number }[]>(
        `INSERT INTO phone_numbers (user_id, operator_id, phone_number, is_primary, phone_status)
         VALUES ($1, $2, $3, true, 'Active') RETURNING phone_id`,
        [memberId, operatorId, phoneNumber],
      );
      createdPhoneIds.push(phone.phone_id);

      const res = await request(app.getHttpServer())
        .post('/telecom/contributions')
        .set('Authorization', `Bearer ${telecomToken}`)
        .send({ phoneNumber, amount: 6, referenceNumber: `${REF}-E` })
        .expect(201);
      expect(res.body).toMatchObject({
        processingStatus: 'Validated',
        allocation: null,
      });
    });

    it('F — Airtime, Active provider -> Allocated, then forced to Pending (simulates an in-flight allocation)', async () => {
      const memberId = await createUser('FinReportMemberF', 9);
      const phoneNumber = `07${String(Number(ts.slice(-8)) + 4).padStart(8, '0')}`;
      const [phone] = await dataSource.query<{ phone_id: number }[]>(
        `INSERT INTO phone_numbers (user_id, operator_id, phone_number, is_primary, phone_status)
         VALUES ($1, $2, $3, true, 'Active') RETURNING phone_id`,
        [memberId, operatorId, phoneNumber],
      );
      createdPhoneIds.push(phone.phone_id);
      await dataSource.query(
        `INSERT INTO member_insurance (member_id, plan_id, policy_number, start_date, policy_status)
         VALUES ($1, $2, $3, CURRENT_DATE, 'Active')`,
        [memberId, activePlanId, `POL-RPT-F-${ts}`],
      );

      const res = await request(app.getHttpServer())
        .post('/telecom/contributions')
        .set('Authorization', `Bearer ${telecomToken}`)
        .send({ phoneNumber, amount: 15, referenceNumber: `${REF}-F` })
        .expect(201);
      expect(res.body).toMatchObject({ processingStatus: 'Allocated' });

      await dataSource.query(
        `UPDATE insurance_allocations SET allocation_status = 'Pending', completed_at = NULL WHERE member_id = $1`,
        [memberId],
      );
    });
  });

  describe('GET /admin/reports/financial — aggregate report, scoped by reference=RPT-<ts>', () => {
    it('unfiltered (within this prefix): totals across both channels and every allocation bucket', async () => {
      const res = await request(app.getHttpServer())
        .get('/admin/reports/financial')
        .query({ reference: REF })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toMatchObject({
        totalContributions: { count: 6 },
        telecomContributions: { count: 5 },
        bankContributions: { count: 1, amount: 30 },
        totalInsuranceAllocations: { count: 5 },
        allocated: { count: 2 },
        pending: { count: 1 },
        failed: { count: 1, amount: 8 },
        reversed: { count: 1, amount: 9 },
        unreconciled: { count: 6 },
      });
    });

    it('channel=AIRTIME isolates the 5 telecom rows', async () => {
      const res = await request(app.getHttpServer())
        .get('/admin/reports/financial')
        .query({ reference: REF, channel: 'AIRTIME' })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      expect(res.body).toMatchObject({ totalContributions: { count: 5 } });
    });

    it('channel=BANK_TRANSFER isolates the 1 bank row', async () => {
      const res = await request(app.getHttpServer())
        .get('/admin/reports/financial')
        .query({ reference: REF, channel: 'BANK_TRANSFER' })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      expect(res.body).toMatchObject({ totalContributions: { count: 1 } });
    });

    it('operatorId scopes to telecom rows only (bank row has no operator)', async () => {
      const res = await request(app.getHttpServer())
        .get('/admin/reports/financial')
        .query({ reference: REF, operatorId })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      expect(res.body).toMatchObject({ totalContributions: { count: 5 } });
    });

    it('bankId scopes to the bank row only', async () => {
      const res = await request(app.getHttpServer())
        .get('/admin/reports/financial')
        .query({ reference: REF, bankId })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      expect(res.body).toMatchObject({ totalContributions: { count: 1 } });
    });

    it('insuranceProviderId=active matches A, B, D, F (4 rows) — C used the suspended provider', async () => {
      const res = await request(app.getHttpServer())
        .get('/admin/reports/financial')
        .query({ reference: REF, insuranceProviderId: activeProviderId })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      expect(res.body).toMatchObject({ totalContributions: { count: 4 } });
    });

    it('insuranceProviderId=suspended matches only C', async () => {
      const res = await request(app.getHttpServer())
        .get('/admin/reports/financial')
        .query({ reference: REF, insuranceProviderId: suspendedProviderId })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      expect(res.body).toMatchObject({ totalContributions: { count: 1 } });
    });

    it("status=Reversed matches only D's contribution", async () => {
      const res = await request(app.getHttpServer())
        .get('/admin/reports/financial')
        .query({ reference: REF, status: 'Reversed' })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      expect(res.body).toMatchObject({ totalContributions: { count: 1 } });
    });

    it('status=Validated matches C and E', async () => {
      const res = await request(app.getHttpServer())
        .get('/admin/reports/financial')
        .query({ reference: REF, status: 'Validated' })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      expect(res.body).toMatchObject({ totalContributions: { count: 2 } });
    });

    it('status=Allocated matches A, B, F', async () => {
      const res = await request(app.getHttpServer())
        .get('/admin/reports/financial')
        .query({ reference: REF, status: 'Allocated' })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      expect(res.body).toMatchObject({ totalContributions: { count: 3 } });
    });

    it('memberId isolates a single member', async () => {
      const res = await request(app.getHttpServer())
        .get('/admin/reports/financial')
        .query({ reference: REF, memberId: memberAId })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      expect(res.body).toMatchObject({
        totalContributions: { count: 1, amount: 20 },
      });
    });

    it('date range covering today includes all fixtures; a future-only range excludes them', async () => {
      const today = new Date().toISOString().slice(0, 10);
      const okRes = await request(app.getHttpServer())
        .get('/admin/reports/financial')
        .query({
          reference: REF,
          dateFrom: `${today}T00:00:00.000Z`,
          dateTo: `${today}T23:59:59.999Z`,
        })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      expect(okRes.body).toMatchObject({ totalContributions: { count: 6 } });

      const futureRes = await request(app.getHttpServer())
        .get('/admin/reports/financial')
        .query({ reference: REF, dateFrom: '2099-01-01T00:00:00.000Z' })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      expect(futureRes.body).toMatchObject({ totalContributions: { count: 0 } });
    });

    it('reconciling A drops unreconciled from 6 to 5', async () => {
      const runRes = await request(app.getHttpServer())
        .post('/admin/reconciliation/runs')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          records: [
            { channel: 'AIRTIME', externalReference: `${REF}-A`, amount: 20 },
          ],
        })
        .expect(201);
      createdRunIds.push((runRes.body as { runId: number }).runId);
      expect(runRes.body).toMatchObject({ matchedCount: 1 });

      const res = await request(app.getHttpServer())
        .get('/admin/reports/financial')
        .query({ reference: REF })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      expect(res.body).toMatchObject({ unreconciled: { count: 5 } });
    });
  });

  describe('GET /admin/reports/financial/transactions — paginated list', () => {
    it('paginates the same 6-row scope with pageSize=4', async () => {
      const page1 = await request(app.getHttpServer())
        .get('/admin/reports/financial/transactions')
        .query({ reference: REF, page: 1, pageSize: 4 })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      const body1 = page1.body as { items: unknown[]; total: number };
      expect(body1.total).toBe(6);
      expect(body1.items).toHaveLength(4);

      const page2 = await request(app.getHttpServer())
        .get('/admin/reports/financial/transactions')
        .query({ reference: REF, page: 2, pageSize: 4 })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      const body2 = page2.body as { items: unknown[]; total: number };
      expect(body2.total).toBe(6);
      expect(body2.items).toHaveLength(2);
    });

    it('each row exposes contribution reference, allocation reference, amount, date, status, and channel', async () => {
      const res = await request(app.getHttpServer())
        .get('/admin/reports/financial/transactions')
        .query({ reference: `${REF}-A` })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const body = res.body as {
        items: {
          channel: string;
          contributionReference: string;
          amount: string;
          status: string;
          occurredAt: string;
          allocation: { allocationReference: string; status: string } | null;
        }[];
      };
      expect(body.items).toHaveLength(1);
      expect(body.items[0]).toMatchObject({
        channel: 'AIRTIME',
        contributionReference: `${REF}-A`,
        amount: '20.00',
        status: 'Allocated',
      });
      expect(body.items[0].occurredAt).toBeTruthy();
      expect(body.items[0].allocation?.allocationReference).toMatch(/^ALLOC-/);
      expect(body.items[0].allocation?.status).toBe('Allocated');
    });
  });

  describe('GET /admin/reports/financial/filters', () => {
    it('returns real operators, banks, and insurance providers', async () => {
      const res = await request(app.getHttpServer())
        .get('/admin/reports/financial/filters')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const body = res.body as {
        operators: { id: number; name: string }[];
        banks: { id: number; name: string }[];
        insuranceProviders: { id: number; name: string }[];
      };
      expect(body.operators.map((o) => o.id)).toContain(operatorId);
      expect(body.banks.map((b) => b.id)).toContain(bankId);
      expect(body.insuranceProviders.map((p) => p.id)).toContain(
        activeProviderId,
      );
    });
  });
});
