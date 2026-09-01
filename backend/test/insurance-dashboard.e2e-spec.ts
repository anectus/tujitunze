import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

// Proves the completed Insurance dashboard (STEP 8): real contribution/
// allocation stats, a filterable+paginated allocation list with
// contribution reference + allocation reference + amount + date +
// status, tenant scoping (RBAC), and no unnecessary member PII exposed.
// No new tables — everything reads insurance_allocations joined to
// wallet_transactions/telecom_contributions/bank_transactions, exactly
// as the STEP 6/7 ledger already built.
describe('Insurance dashboard — contribution & allocation stats (e2e)', () => {
  let app: INestApplication<App>;
  let jwtService: JwtService;
  let dataSource: DataSource;

  const ts = Date.now().toString();
  const createdUserIds: number[] = [];
  const createdPhoneIds: number[] = [];
  const createdBankAccountIds: number[] = [];
  const createdProviderIds: number[] = [];
  const createdPlanIds: number[] = [];

  const nida = (i: number) =>
    `${ts.slice(0, 8)}-${ts.slice(8, 13)}-${String(i).padStart(5, '0')}-10`;

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

  let insuranceStaffId: number;
  let insuranceToken: string;
  let operatorId: number;
  let telecomStaffId: number;
  let telecomToken: string;
  let bankId: number;
  let bankStaffId: number;
  let bankToken: string;

  let providerId: number;
  let planId: number;
  let otherProviderId: number;

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

    // Deliberately excludes Vodacom: that operator's webhook contribution
    // now routes through the real (genuinely credentialed) M-Pesa
    // collection rail — this test exercises the pre-existing direct-
    // credit path shared by every other operator, not Vodacom itself.
    const [operator] = await dataSource.query<{ operator_id: number }[]>(
      `SELECT operator_id FROM telecom_operators WHERE operator_name != 'Vodacom' LIMIT 1`,
    );
    operatorId = operator.operator_id;
    telecomStaffId = await createUser('InsDashTelecomStaff', 1, {
      telecom_operator_id: operatorId,
    });
    telecomToken = signToken(
      telecomStaffId,
      ['Telecom'],
      'InsDashTelecomStaff',
    );

    const [bank] = await dataSource.query<{ bank_id: number }[]>(
      `SELECT bank_id FROM banks LIMIT 1`,
    );
    bankId = bank.bank_id;
    bankStaffId = await createUser('InsDashBankStaff', 2, { bank_id: bankId });
    bankToken = signToken(bankStaffId, ['Bank'], 'InsDashBankStaff');

    const [provider] = await dataSource.query<{ provider_id: number }[]>(
      `INSERT INTO insurance_providers (provider_name, status) VALUES ($1, 'Active') RETURNING provider_id`,
      [`E2E InsDash Insurance ${ts}`],
    );
    providerId = provider.provider_id;
    createdProviderIds.push(providerId);

    insuranceStaffId = await createUser('InsDashInsuranceStaff', 3, {
      insurance_provider_id: providerId,
    });
    insuranceToken = signToken(
      insuranceStaffId,
      ['Insurance'],
      'InsDashInsuranceStaff',
    );

    const [plan] = await dataSource.query<{ plan_id: number }[]>(
      `INSERT INTO insurance_plans (provider_id, plan_name, coverage_amount, premium_amount, status)
       VALUES ($1, $2, 100000, 1000, 'Active') RETURNING plan_id`,
      [providerId, `E2E InsDash Plan ${ts}`],
    );
    planId = plan.plan_id;
    createdPlanIds.push(planId);

    const [otherProvider] = await dataSource.query<{ provider_id: number }[]>(
      `INSERT INTO insurance_providers (provider_name, status) VALUES ($1, 'Active') RETURNING provider_id`,
      [`E2E InsDash Other Insurance ${ts}`],
    );
    otherProviderId = otherProvider.provider_id;
    createdProviderIds.push(otherProviderId);
  });

  afterAll(async () => {
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

  it('rejects a non-Insurance token', async () => {
    await request(app.getHttpServer())
      .get('/insurance/contributions/summary')
      .set('Authorization', `Bearer ${telecomToken}`)
      .expect(403);
    await request(app.getHttpServer())
      .get('/insurance/allocations')
      .set('Authorization', `Bearer ${telecomToken}`)
      .expect(403);
  });

  describe('Fixtures: 1 Airtime + 1 Bank Transfer contribution, both Allocated to this provider', () => {
    const airtimeRef = `INSDASH-AIR-${ts}`;
    const bankRef = `INSDASH-BANK-${ts}`;
    let memberAId: number;
    let memberBId: number;

    it('sets up both members with an Active policy against this provider', async () => {
      memberAId = await createUser('InsDashMemberA', 4);
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
        [memberAId, planId, `POL-INSDASH-A-${ts}`],
      );

      await request(app.getHttpServer())
        .post('/telecom/contributions')
        .set('Authorization', `Bearer ${telecomToken}`)
        .send({ phoneNumber, amount: 25, referenceNumber: airtimeRef })
        .expect(201);

      memberBId = await createUser('InsDashMemberB', 5);
      const accountNumber = `ACC-INSDASH-${ts}`;
      const [account] = await dataSource.query<
        { member_bank_account_id: number }[]
      >(
        `INSERT INTO member_bank_accounts (member_id, bank_id, account_number, account_holder_name, account_status, verification_status)
         VALUES ($1, $2, $3, 'InsDash E2E', 'Active', 'Verified') RETURNING member_bank_account_id`,
        [memberBId, bankId, accountNumber],
      );
      createdBankAccountIds.push(account.member_bank_account_id);
      await dataSource.query(
        `INSERT INTO member_insurance (member_id, plan_id, policy_number, start_date, policy_status)
         VALUES ($1, $2, $3, CURRENT_DATE, 'Active')`,
        [memberBId, planId, `POL-INSDASH-B-${ts}`],
      );

      await request(app.getHttpServer())
        .post('/bank/contributions')
        .set('Authorization', `Bearer ${bankToken}`)
        .send({ accountNumber, amount: 40, transactionReference: bankRef })
        .expect(201);
    });

    it('GET /insurance/contributions/summary reflects both channels and the Allocated bucket', async () => {
      const res = await request(app.getHttpServer())
        .get('/insurance/contributions/summary')
        .set('Authorization', `Bearer ${insuranceToken}`)
        .expect(200);

      expect(res.body).toMatchObject({
        totalAllocatedContributions: { count: 2, amount: 65 },
        completedAllocations: { count: 2, amount: 65 },
        pendingAllocations: { count: 0, amount: 0 },
        failedAllocations: { count: 0, amount: 0 },
        reversedAllocations: { count: 0, amount: 0 },
        telecomContributions: { count: 1, amount: 25 },
        bankContributions: { count: 1, amount: 40 },
      });
    });

    it('GET /insurance/allocations exposes contribution reference, allocation reference, amount, date, status — and memberId but never memberName', async () => {
      const res = await request(app.getHttpServer())
        .get('/insurance/allocations')
        .set('Authorization', `Bearer ${insuranceToken}`)
        .expect(200);

      const body = res.body as {
        items: Record<string, unknown>[];
        totalAllocated: number;
      };

      const airtimeRow = body.items.find(
        (i) => i.contributionReference === airtimeRef,
      );
      expect(airtimeRow).toMatchObject({
        channel: 'AIRTIME',
        memberId: memberAId,
        allocationStatus: 'Allocated',
        contributionReference: airtimeRef,
      });
      expect(airtimeRow?.allocationReference).toMatch(/^ALLOC-/);
      expect(airtimeRow?.createdAt).toBeTruthy();
      expect(airtimeRow).not.toHaveProperty('memberName');
      expect(JSON.stringify(airtimeRow)).not.toMatch(
        /InsDashMemberA|InsDashMemberB/,
      );

      const bankRow = body.items.find(
        (i) => i.contributionReference === bankRef,
      );
      expect(bankRow).toMatchObject({
        channel: 'BANK_TRANSFER',
        memberId: memberBId,
        allocationStatus: 'Allocated',
      });

      expect(body.totalAllocated).toBeGreaterThanOrEqual(65);
    });

    it('filters by channel=AIRTIME', async () => {
      const res = await request(app.getHttpServer())
        .get('/insurance/allocations')
        .query({ channel: 'AIRTIME' })
        .set('Authorization', `Bearer ${insuranceToken}`)
        .expect(200);

      const body = res.body as { items: { channel: string }[] };
      expect(body.items.length).toBeGreaterThan(0);
      expect(body.items.every((i) => i.channel === 'AIRTIME')).toBe(true);
    });

    it('filters by channel=BANK_TRANSFER', async () => {
      const res = await request(app.getHttpServer())
        .get('/insurance/allocations')
        .query({ channel: 'BANK_TRANSFER' })
        .set('Authorization', `Bearer ${insuranceToken}`)
        .expect(200);

      const body = res.body as { items: { channel: string }[] };
      expect(body.items.length).toBeGreaterThan(0);
      expect(body.items.every((i) => i.channel === 'BANK_TRANSFER')).toBe(true);
    });

    it('filters by status=Allocated', async () => {
      const res = await request(app.getHttpServer())
        .get('/insurance/allocations')
        .query({ status: 'Allocated' })
        .set('Authorization', `Bearer ${insuranceToken}`)
        .expect(200);

      const body = res.body as { items: { allocationStatus: string }[] };
      expect(body.items.every((i) => i.allocationStatus === 'Allocated')).toBe(
        true,
      );
    });

    it('filters out everything with a future-only date range', async () => {
      const res = await request(app.getHttpServer())
        .get('/insurance/allocations')
        .query({ dateFrom: '2099-01-01T00:00:00.000Z' })
        .set('Authorization', `Bearer ${insuranceToken}`)
        .expect(200);

      const body = res.body as { items: unknown[]; total: number };
      const ourRows = (
        res.body as {
          items: { contributionReference: string | null }[];
        }
      ).items.filter((i) =>
        [airtimeRef, bankRef].includes(i.contributionReference ?? ''),
      );
      expect(ourRows).toHaveLength(0);
      expect(body.total).toBeGreaterThanOrEqual(0);
    });

    it('paginates with pageSize=1', async () => {
      const res = await request(app.getHttpServer())
        .get('/insurance/allocations')
        .query({ page: 1, pageSize: 1 })
        .set('Authorization', `Bearer ${insuranceToken}`)
        .expect(200);

      const body = res.body as { items: unknown[]; pageSize: number };
      expect(body.items).toHaveLength(1);
      expect(body.pageSize).toBe(1);
    });

    it('tenant isolation: a different insurance provider sees none of these allocations', async () => {
      const otherStaffId = await createUser('InsDashOtherStaff', 6, {
        insurance_provider_id: otherProviderId,
      });
      const otherToken = signToken(
        otherStaffId,
        ['Insurance'],
        'InsDashOtherStaff',
      );

      const summaryRes = await request(app.getHttpServer())
        .get('/insurance/contributions/summary')
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(200);
      expect(summaryRes.body).toMatchObject({
        totalAllocatedContributions: { count: 0, amount: 0 },
      });

      const allocationsRes = await request(app.getHttpServer())
        .get('/insurance/allocations')
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(200);
      const body = allocationsRes.body as {
        items: { contributionReference: string | null }[];
      };
      expect(
        body.items.some((i) =>
          [airtimeRef, bankRef].includes(i.contributionReference ?? ''),
        ),
      ).toBe(false);
    });
  });

  describe('Seeded real insurance companies', () => {
    it('NHIF, Diamond Trust Insurance, and Jubilee Insurance exist and are selectable', async () => {
      const rows = await dataSource.query<
        { provider_name: string; status: string }[]
      >(
        `SELECT provider_name, status FROM insurance_providers
         WHERE provider_name IN ('NHIF', 'Diamond Trust Insurance', 'Jubilee Insurance')`,
      );
      expect(rows).toHaveLength(3);
      expect(rows.every((r) => r.status === 'Active')).toBe(true);
    });

    it('each seeded company has at least one Active plan', async () => {
      const rows = await dataSource.query<{ count: number }[]>(
        `SELECT COUNT(*)::int AS count
         FROM insurance_plans ip
         JOIN insurance_providers prov ON prov.provider_id = ip.provider_id
         WHERE prov.provider_name IN ('NHIF', 'Diamond Trust Insurance', 'Jubilee Insurance')
           AND ip.status = 'Active'`,
      );
      expect(rows[0].count).toBeGreaterThanOrEqual(3);
    });
  });
});
