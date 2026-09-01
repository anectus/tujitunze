import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

// Proves GET /insurance/dashboard/summary — the consolidated Insurance
// Dashboard payload (contributions incl. per-operator/per-bank
// breakdown, allocations, member coverage, claims, available funds,
// recent activity) — returns real, tenant-scoped database values, is
// RBAC-protected, and never references Hospital functionality (removed
// architecture-wide). No new tables: everything reads
// insurance_allocations/wallet_transactions/telecom_contributions/
// bank_transactions/member_insurance/healthcare_claims/settlements/
// audit_logs exactly as the STEP 3/4/5/6/7 ledger already built.
describe('GET /insurance/dashboard/summary (e2e)', () => {
  let app: INestApplication<App>;
  let jwtService: JwtService;
  let dataSource: DataSource;

  const ts = Date.now().toString();
  const createdUserIds: number[] = [];
  const createdPhoneIds: number[] = [];
  const createdBankAccountIds: number[] = [];
  const createdProviderIds: number[] = [];
  const createdPlanIds: number[] = [];
  const createdHospitalIds: number[] = [];

  const nida = (i: number) =>
    `${ts.slice(0, 8)}-${ts.slice(8, 13)}-${String(i).padStart(5, '0')}-11`;

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
  let operatorName: string;
  let telecomStaffId: number;
  let telecomToken: string;
  let bankId: number;
  let bankName: string;
  let bankStaffId: number;
  let bankToken: string;

  let providerId: number;
  let planId: number;

  let claimId: number;

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

    // Deliberately excludes Vodacom: this operator's webhook contribution
    // now routes through the real (genuinely credentialed) M-Pesa
    // collection rail — this test exercises the pre-existing direct-
    // credit path shared by every other operator, not Vodacom itself.
    const [operator] = await dataSource.query<
      { operator_id: number; operator_name: string }[]
    >(
      `SELECT operator_id, operator_name FROM telecom_operators WHERE operator_name != 'Vodacom' LIMIT 1`,
    );
    operatorId = operator.operator_id;
    operatorName = operator.operator_name;
    telecomStaffId = await createUser('SummaryTelecomStaff', 1, {
      telecom_operator_id: operatorId,
    });
    telecomToken = signToken(
      telecomStaffId,
      ['Telecom'],
      'SummaryTelecomStaff',
    );

    const [bank] = await dataSource.query<
      { bank_id: number; bank_name: string }[]
    >(`SELECT bank_id, bank_name FROM banks LIMIT 1`);
    bankId = bank.bank_id;
    bankName = bank.bank_name;
    bankStaffId = await createUser('SummaryBankStaff', 2, { bank_id: bankId });
    bankToken = signToken(bankStaffId, ['Bank'], 'SummaryBankStaff');

    const [provider] = await dataSource.query<{ provider_id: number }[]>(
      `INSERT INTO insurance_providers (provider_name, status) VALUES ($1, 'Active') RETURNING provider_id`,
      [`E2E Summary Insurance ${ts}`],
    );
    providerId = provider.provider_id;
    createdProviderIds.push(providerId);

    insuranceStaffId = await createUser('SummaryInsuranceStaff', 3, {
      insurance_provider_id: providerId,
    });
    insuranceToken = signToken(
      insuranceStaffId,
      ['Insurance'],
      'SummaryInsuranceStaff',
    );

    const [plan] = await dataSource.query<{ plan_id: number }[]>(
      `INSERT INTO insurance_plans (provider_id, plan_name, coverage_amount, premium_amount, status)
       VALUES ($1, $2, 100000, 1000, 'Active') RETURNING plan_id`,
      [providerId, `E2E Summary Plan ${ts}`],
    );
    planId = plan.plan_id;
    createdPlanIds.push(planId);
  });

  afterAll(async () => {
    await dataSource.query(
      `DELETE FROM audit_logs WHERE affected_table = 'healthcare_claims' AND affected_record_id = $1`,
      [claimId],
    );
    await dataSource.query(
      `DELETE FROM healthcare_claims WHERE claim_id = $1`,
      [claimId],
    );
    await dataSource.query(
      `DELETE FROM hospitals WHERE hospital_id = ANY($1)`,
      [createdHospitalIds],
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

  it('rejects an unauthenticated request', async () => {
    await request(app.getHttpServer())
      .get('/insurance/dashboard/summary')
      .expect(401);
  });

  it('rejects a non-Insurance authenticated user (RBAC boundary holds)', async () => {
    await request(app.getHttpServer())
      .get('/insurance/dashboard/summary')
      .set('Authorization', `Bearer ${telecomToken}`)
      .expect(403);
  });

  describe('Real data: one Airtime + one Bank Transfer contribution, one claim', () => {
    let memberAId: number;
    let memberBId: number;
    const airtimeRef = `SUMM-AIR-${ts}`;
    const bankRef = `SUMM-BANK-${ts}`;

    it('sets up fixtures across both channels', async () => {
      memberAId = await createUser('SummaryMemberA', 4);
      const phoneNumber = `07${ts.slice(-8)}`;
      const [phone] = await dataSource.query<{ phone_id: number }[]>(
        `INSERT INTO phone_numbers (user_id, operator_id, phone_number, is_primary, phone_status)
         VALUES ($1, $2, $3, true, 'Active') RETURNING phone_id`,
        [memberAId, operatorId, phoneNumber],
      );
      createdPhoneIds.push(phone.phone_id);

      const [memberInsuranceRow] = await dataSource.query<
        { member_insurance_id: number }[]
      >(
        `INSERT INTO member_insurance (member_id, plan_id, policy_number, start_date, policy_status)
         VALUES ($1, $2, $3, CURRENT_DATE, 'Active') RETURNING member_insurance_id`,
        [memberAId, planId, `POL-SUMM-A-${ts}`],
      );

      await request(app.getHttpServer())
        .post('/telecom/contributions')
        .set('Authorization', `Bearer ${telecomToken}`)
        .send({ phoneNumber, amount: 25, referenceNumber: airtimeRef })
        .expect(201);

      memberBId = await createUser('SummaryMemberB', 5);
      const accountNumber = `ACC-SUMM-${ts}`;
      const [account] = await dataSource.query<
        { member_bank_account_id: number }[]
      >(
        `INSERT INTO member_bank_accounts (member_id, bank_id, account_number, account_holder_name, account_status, verification_status)
         VALUES ($1, $2, $3, 'Summary E2E', 'Active', 'Verified') RETURNING member_bank_account_id`,
        [memberBId, bankId, accountNumber],
      );
      createdBankAccountIds.push(account.member_bank_account_id);
      await dataSource.query(
        `INSERT INTO member_insurance (member_id, plan_id, policy_number, start_date, policy_status)
         VALUES ($1, $2, $3, CURRENT_DATE, 'Active')`,
        [memberBId, planId, `POL-SUMM-B-${ts}`],
      );

      await request(app.getHttpServer())
        .post('/bank/contributions')
        .set('Authorization', `Bearer ${bankToken}`)
        .send({ accountNumber, amount: 40, transactionReference: bankRef })
        .expect(201);

      // One claim against memberA's policy, approved through the real
      // endpoint. healthcare_claims.hospital_id stays NOT NULL — hospitals
      // is kept as a frozen historical/reference table, not dropped (same
      // pattern insurance-claims.e2e-spec.ts already establishes) — this
      // hospital row is never surfaced by the dashboard summary endpoint.
      const [hospital] = await dataSource.query<{ hospital_id: number }[]>(
        `INSERT INTO hospitals (hospital_name, status) VALUES ($1, 'Active') RETURNING hospital_id`,
        [`E2E Summary Historical Hospital ${ts}`],
      );
      createdHospitalIds.push(hospital.hospital_id);

      const [claim] = await dataSource.query<{ claim_id: number }[]>(
        `INSERT INTO healthcare_claims
           (member_id, hospital_id, member_insurance_id, claim_number, claim_amount, claim_status)
         VALUES ($1, $2, $3, $4, $5, 'Pending') RETURNING claim_id`,
        [
          memberAId,
          hospital.hospital_id,
          memberInsuranceRow.member_insurance_id,
          `CLM-SUMM-${ts}`,
          15000,
        ],
      );
      claimId = claim.claim_id;

      await request(app.getHttpServer())
        .patch(`/insurance/claims/${claimId}/status`)
        .set('Authorization', `Bearer ${insuranceToken}`)
        .send({ claimStatus: 'Approved', approvedAmount: 12000 })
        .expect(200);
    });

    it('returns HTTP 200 with real database values for the authorized Insurance user', async () => {
      const res = await request(app.getHttpServer())
        .get('/insurance/dashboard/summary')
        .set('Authorization', `Bearer ${insuranceToken}`)
        .expect(200);

      expect(res.body).toMatchObject({
        provider: { status: 'Active' },
        contributions: {
          total: 65,
          totalCount: 2,
          airtime: 25,
          airtimeCount: 1,
          bankTransfer: 40,
          bankTransferCount: 1,
        },
        allocations: {
          totalCollected: 65,
          totalAllocated: 65,
          pending: 0,
          failed: 0,
          reversed: 0,
          recordCount: 2,
        },
        members: {
          total: 2,
          active: 2,
          inactive: 0,
          covered: 2,
        },
        claims: {
          total: 1,
          pending: 0,
          approved: 1,
          rejected: 0,
          claimedAmount: 15000,
          approvedAmount: 12000,
        },
      });

      const body = res.body as {
        contributions: {
          byOperator: { operatorName: string; amount: number }[];
          byBank: { bankName: string; amount: number }[];
        };
        allocations: { latest: { contributionReference: string }[] };
        members: { eligible: number };
        availableFunds: number;
        recentActivity: { type: string; actionType: string }[];
      };

      expect(body.contributions.byOperator).toContainEqual(
        expect.objectContaining({ operatorName, amount: 25 }),
      );
      expect(body.contributions.byBank).toContainEqual(
        expect.objectContaining({ bankName, amount: 40 }),
      );

      expect(
        body.allocations.latest.some(
          (a) => a.contributionReference === airtimeRef,
        ),
      ).toBe(true);
      expect(
        body.allocations.latest.some(
          (a) => a.contributionReference === bankRef,
        ),
      ).toBe(true);

      // availableFunds = totalAllocated(65) - approvedClaims(12000) ->
      // floored at 0 since claims here exceed contributions (small test
      // fixture amounts) — proves the computation runs, not a fabricated
      // positive number.
      expect(body.availableFunds).toBe(0);

      expect(body.members.eligible).toBeGreaterThanOrEqual(0);

      expect(
        body.recentActivity.some(
          (a) => a.actionType === 'insurance.allocation_create',
        ),
      ).toBe(true);
      expect(body.recentActivity.some((a) => a.type === 'Claim approved')).toBe(
        true,
      );
      expect(
        body.recentActivity.some((a) =>
          ['telecom.contribution_record', 'bank.contribution_record'].includes(
            a.actionType,
          ),
        ),
      ).toBe(true);
    });

    it('never references Hospital functionality anywhere in the payload', async () => {
      const res = await request(app.getHttpServer())
        .get('/insurance/dashboard/summary')
        .set('Authorization', `Bearer ${insuranceToken}`)
        .expect(200);

      const serialized = JSON.stringify(res.body).toLowerCase();
      expect(serialized).not.toContain('hospital');
      expect(serialized).not.toContain('treatment');
      expect(serialized).not.toContain('doctor');
      expect(serialized).not.toContain('appointment');
      expect(serialized).not.toContain('clinical');
    });

    it('tenant isolation: a different provider sees zeroed contribution/allocation stats', async () => {
      const [otherProvider] = await dataSource.query<{ provider_id: number }[]>(
        `INSERT INTO insurance_providers (provider_name, status) VALUES ($1, 'Active') RETURNING provider_id`,
        [`E2E Summary Other Insurance ${ts}`],
      );
      createdProviderIds.push(otherProvider.provider_id);
      const otherStaffId = await createUser('SummaryOtherStaff', 6, {
        insurance_provider_id: otherProvider.provider_id,
      });
      const otherToken = signToken(
        otherStaffId,
        ['Insurance'],
        'SummaryOtherStaff',
      );

      const res = await request(app.getHttpServer())
        .get('/insurance/dashboard/summary')
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(200);

      expect(res.body).toMatchObject({
        contributions: { total: 0, totalCount: 0 },
        allocations: { totalCollected: 0, recordCount: 0 },
        claims: { total: 0 },
      });
    });
  });
});
