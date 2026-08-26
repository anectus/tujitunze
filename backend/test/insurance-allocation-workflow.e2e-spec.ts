import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

// Proves the STEP 6 insurance allocation workflow end to end, on top of
// the existing STEP 3/4/5 contribution ledger:
//
//   TELECOM/AIRTIME or BANK TRANSFER -> CONTRIBUTION -> INSURANCE
//   ALLOCATION -> HEALTH INSURANCE COMPANY
//
// No new table: insurance_allocations (pre-existing) is joined through
// wallet_transactions to telecom_contributions/bank_transactions, exactly
// as already built — this only proves the widened status vocabulary
// (Pending/Processing/Allocated/Failed/Reversed), the new currency/
// allocation_reference/created_at/completed_at fields, failure handling,
// reversal handling, and the new GET /insurance/allocations/:id/trace
// endpoint that demonstrates the full traceable chain from the example
// in CLAUDE.md: Member X -> Telecom transaction ABC123 -> Contribution
// TZS 20 -> Allocation TZS 20 -> Insurance Company Y.
//
// Hospital does not appear anywhere in this flow.
describe('Insurance allocation workflow (e2e)', () => {
  let app: INestApplication<App>;
  let jwtService: JwtService;
  let dataSource: DataSource;

  const ts = Date.now().toString();
  const createdUserIds: number[] = [];
  const createdPhoneIds: number[] = [];
  const createdProviderIds: number[] = [];
  const createdPlanIds: number[] = [];

  const nida = (i: number) =>
    `${ts.slice(0, 8)}-${ts.slice(8, 13)}-${String(i).padStart(5, '0')}-07`;

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

  let operatorId: number;
  let telecomStaffId: number;

  let activeProviderId: number;
  let activePlanId: number;
  let insuranceStaffId: number;

  let suspendedProviderId: number;
  let suspendedPlanId: number;

  let originalOperatorApiKeyHash: string | null;
  let telecomRawApiKey: string;

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

    const [operator] = await dataSource.query<{ operator_id: number }[]>(
      `SELECT operator_id FROM telecom_operators LIMIT 1`,
    );
    operatorId = operator.operator_id;

    telecomStaffId = await createUser('AllocWorkflowTelecomStaff', 1, {
      telecom_operator_id: operatorId,
    });

    const [{ api_key_hash: origHash }] = await dataSource.query<
      { api_key_hash: string | null }[]
    >(`SELECT api_key_hash FROM telecom_operators WHERE operator_id = $1`, [
      operatorId,
    ]);
    originalOperatorApiKeyHash = origHash;
    telecomRawApiKey = `tk_e2e_alloc_${crypto.randomBytes(12).toString('hex')}`;
    await dataSource.query(
      `UPDATE telecom_operators SET api_key_hash = $2, status = 'Active' WHERE operator_id = $1`,
      [operatorId, await bcrypt.hash(telecomRawApiKey, 12)],
    );

    // An Active provider — the "Health Insurance Company Y" this member's
    // contribution should successfully allocate to.
    const [provider] = await dataSource.query<{ provider_id: number }[]>(
      `INSERT INTO insurance_providers (provider_name, status) VALUES ($1, 'Active') RETURNING provider_id`,
      [`E2E Alloc Workflow Insurance ${ts}`],
    );
    activeProviderId = provider.provider_id;
    createdProviderIds.push(activeProviderId);

    insuranceStaffId = await createUser('AllocWorkflowInsuranceStaff', 2, {
      insurance_provider_id: activeProviderId,
    });

    const [plan] = await dataSource.query<{ plan_id: number }[]>(
      `INSERT INTO insurance_plans (provider_id, plan_name, coverage_amount, premium_amount, status)
       VALUES ($1, $2, 100000, 1000, 'Active') RETURNING plan_id`,
      [activeProviderId, `E2E Alloc Workflow Plan ${ts}`],
    );
    activePlanId = plan.plan_id;
    createdPlanIds.push(activePlanId);

    // A provider that exists but has since been suspended — a member with
    // an otherwise-Active policy against THIS provider is the failure-
    // handling scenario (allocation attempted, provider not usable).
    const [suspendedProvider] = await dataSource.query<
      { provider_id: number }[]
    >(
      `INSERT INTO insurance_providers (provider_name, status) VALUES ($1, 'Suspended') RETURNING provider_id`,
      [`E2E Alloc Workflow Suspended Insurance ${ts}`],
    );
    suspendedProviderId = suspendedProvider.provider_id;
    createdProviderIds.push(suspendedProviderId);

    const [suspendedPlan] = await dataSource.query<{ plan_id: number }[]>(
      `INSERT INTO insurance_plans (provider_id, plan_name, coverage_amount, premium_amount, status)
       VALUES ($1, $2, 100000, 1000, 'Active') RETURNING plan_id`,
      [suspendedProviderId, `E2E Alloc Workflow Suspended Plan ${ts}`],
    );
    suspendedPlanId = suspendedPlan.plan_id;
    createdPlanIds.push(suspendedPlanId);
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
    await dataSource.query(
      `UPDATE telecom_operators SET api_key_hash = $2 WHERE operator_id = $1`,
      [operatorId, originalOperatorApiKeyHash],
    );
    await app.close();
  });

  describe('Full chain — Member -> Telecom transaction -> Contribution -> Allocation -> Insurance Company', () => {
    let memberId: number;
    let phoneNumber: string;
    let contributionId: number;
    let allocationId: number;
    const externalTransactionId = `ABC123-${ts}`;

    it('sets up Member X with an Active policy against the Active insurance company', async () => {
      memberId = await createUser('MemberX', 3);
      phoneNumber = `07${ts.slice(-8)}`;
      const [phone] = await dataSource.query<{ phone_id: number }[]>(
        `INSERT INTO phone_numbers (user_id, operator_id, phone_number, is_primary, phone_status)
         VALUES ($1, $2, $3, true, 'Active') RETURNING phone_id`,
        [memberId, operatorId, phoneNumber],
      );
      createdPhoneIds.push(phone.phone_id);

      await dataSource.query(
        `INSERT INTO member_insurance (member_id, plan_id, policy_number, start_date, policy_status)
         VALUES ($1, $2, $3, CURRENT_DATE, 'Active')`,
        [memberId, activePlanId, `POL-ALLOC-${ts}`],
      );
    });

    it('records the Telecom contribution (transaction ABC123) and, in the same transaction, creates a real Allocated allocation', async () => {
      const token = signToken(
        telecomStaffId,
        ['Telecom'],
        'AllocWorkflowTelecomStaff',
      );
      const res = await request(app.getHttpServer())
        .post('/telecom/contributions')
        .set('Authorization', `Bearer ${token}`)
        .send({
          phoneNumber,
          amount: 20,
          referenceNumber: externalTransactionId,
        })
        .expect(201);

      const body = res.body as {
        contributionId: number;
        processingStatus: string;
        allocation: {
          allocationId: number;
          insuranceProviderId: number;
          providerName: string;
        } | null;
      };
      expect(body.processingStatus).toBe('Allocated');
      expect(body.allocation).toMatchObject({
        insuranceProviderId: activeProviderId,
      });
      contributionId = body.contributionId;
      allocationId = body.allocation!.allocationId;
    });

    it('the allocation row itself is fully populated per the required field spec', async () => {
      const [allocation] = await dataSource.query<
        {
          allocation_id: number;
          member_id: number;
          insurance_provider_id: number;
          amount: string;
          currency: string;
          allocation_status: string;
          allocation_reference: string | null;
          created_at: Date;
          completed_at: Date | null;
        }[]
      >(
        `SELECT allocation_id, member_id, insurance_provider_id, amount, currency,
                allocation_status, allocation_reference, created_at, completed_at
         FROM insurance_allocations WHERE allocation_id = $1`,
        [allocationId],
      );

      expect(allocation.member_id).toBe(memberId);
      expect(allocation.insurance_provider_id).toBe(activeProviderId);
      expect(allocation.amount).toBe('20.00');
      expect(allocation.currency).toBe('TZS');
      expect(allocation.allocation_status).toBe('Allocated');
      expect(allocation.allocation_reference).toBeTruthy();
      expect(allocation.allocation_reference).toMatch(/^ALLOC-/);
      expect(allocation.created_at).toBeTruthy();
      expect(allocation.completed_at).toBeTruthy();
    });

    it('the allocation creation is audit-logged as its own event', async () => {
      const [auditRow] = await dataSource.query<
        { action_type: string; affected_record_id: number }[]
      >(
        `SELECT action_type, affected_record_id FROM audit_logs
         WHERE member_id = $1 AND action_type = 'insurance.allocation_create'`,
        [memberId],
      );
      expect(auditRow.action_type).toBe('insurance.allocation_create');
      expect(auditRow.affected_record_id).toBe(allocationId);
    });

    it('GET /insurance/allocations/:id/trace traces the entire chain: Member -> Telecom transaction -> Contribution -> Allocation -> Insurance Company', async () => {
      const token = signToken(
        insuranceStaffId,
        ['Insurance'],
        'AllocWorkflowInsuranceStaff',
      );
      const res = await request(app.getHttpServer())
        .get(`/insurance/allocations/${allocationId}/trace`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body).toMatchObject({
        member: { memberId },
        channel: 'AIRTIME',
        contribution: {
          contributionId,
          externalReference: externalTransactionId,
          status: 'Allocated',
        },
        allocation: {
          allocationId,
          amount: '20.00',
          currency: 'TZS',
          status: 'Allocated',
        },
        insuranceProvider: {
          providerId: activeProviderId,
        },
      });
      const body = res.body as { contribution: { internalReference: string } };
      expect(body.contribution.internalReference).toBeTruthy();
    });

    it("another insurance provider cannot trace this member's allocation (tenant isolation)", async () => {
      const otherStaffId = await createUser('OtherProviderStaff', 4, {
        insurance_provider_id: suspendedProviderId,
      });
      const token = signToken(otherStaffId, ['Insurance'], 'OtherProviderStaff');
      await request(app.getHttpServer())
        .get(`/insurance/allocations/${allocationId}/trace`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });

    it('duplicate protection: redelivering transaction ABC123 does not create a second contribution or a second allocation', async () => {
      const token = signToken(
        telecomStaffId,
        ['Telecom'],
        'AllocWorkflowTelecomStaff',
      );
      await request(app.getHttpServer())
        .post('/telecom/contributions')
        .set('Authorization', `Bearer ${token}`)
        .send({
          phoneNumber,
          amount: 20,
          referenceNumber: externalTransactionId,
        })
        .expect(409);

      const count = await dataSource.query<{ count: number }[]>(
        `SELECT COUNT(*)::int AS count FROM insurance_allocations WHERE member_id = $1`,
        [memberId],
      );
      expect(count[0].count).toBe(1);
    });

    it('reversal handling: reversing the contribution marks the allocation Reversed and is itself audit-logged', async () => {
      const token = signToken(
        telecomStaffId,
        ['Telecom'],
        'AllocWorkflowTelecomStaff',
      );
      await request(app.getHttpServer())
        .patch(`/telecom/contributions/${contributionId}/reverse`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const [allocation] = await dataSource.query<
        { allocation_status: string }[]
      >(
        `SELECT allocation_status FROM insurance_allocations WHERE allocation_id = $1`,
        [allocationId],
      );
      expect(allocation.allocation_status).toBe('Reversed');

      const [auditRow] = await dataSource.query<{ action_type: string }[]>(
        `SELECT action_type FROM audit_logs
         WHERE member_id = $1 AND action_type = 'insurance.allocation_reverse'`,
        [memberId],
      );
      expect(auditRow.action_type).toBe('insurance.allocation_reverse');

      // Reversing an already-Reversed allocation's contribution again is
      // rejected — the second reverse attempt never reaches
      // WalletsService.reverseContribution()'s allocation-scoped UPDATE
      // at all, since TelecomService itself blocks a non-Allocated
      // contribution from being reversed twice.
      await request(app.getHttpServer())
        .patch(`/telecom/contributions/${contributionId}/reverse`)
        .set('Authorization', `Bearer ${token}`)
        .expect(400);

      const [allocationAfter] = await dataSource.query<
        { allocation_status: string }[]
      >(
        `SELECT allocation_status FROM insurance_allocations WHERE allocation_id = $1`,
        [allocationId],
      );
      expect(allocationAfter.allocation_status).toBe('Reversed');
    });
  });

  describe('Failure handling — contribution to a policy whose insurance provider is Suspended', () => {
    let memberId: number;
    let phoneNumber: string;

    it('sets up a member with an Active policy against the Suspended insurance company', async () => {
      memberId = await createUser('SuspendedProviderMember', 5);
      phoneNumber = `07${String(Number(ts.slice(-8)) + 3).padStart(8, '0')}`;
      const [phone] = await dataSource.query<{ phone_id: number }[]>(
        `INSERT INTO phone_numbers (user_id, operator_id, phone_number, is_primary, phone_status)
         VALUES ($1, $2, $3, true, 'Active') RETURNING phone_id`,
        [memberId, operatorId, phoneNumber],
      );
      createdPhoneIds.push(phone.phone_id);

      await dataSource.query(
        `INSERT INTO member_insurance (member_id, plan_id, policy_number, start_date, policy_status)
         VALUES ($1, $2, $3, CURRENT_DATE, 'Active')`,
        [memberId, suspendedPlanId, `POL-ALLOC-SUSPENDED-${ts}`],
      );
    });

    it('records the contribution: money still reaches the wallet, but the allocation attempt itself is marked Failed, not silently skipped', async () => {
      const token = signToken(
        telecomStaffId,
        ['Telecom'],
        'AllocWorkflowTelecomStaff',
      );
      const res = await request(app.getHttpServer())
        .post('/telecom/contributions')
        .set('Authorization', `Bearer ${token}`)
        .send({
          phoneNumber,
          amount: 15,
          referenceNumber: `ABC-FAILALLOC-${ts}`,
        })
        .expect(201);

      const body = res.body as {
        processingStatus: string;
        allocation: {
          allocationId: number;
          insuranceProviderId: number;
          status: string;
        } | null;
      };
      // The contribution itself stays Validated (money was credited) —
      // only the allocation sub-record is Failed, distinguishing this
      // from "no active policy at all" (which never creates an
      // allocation row in the first place, and returns allocation: null).
      expect(body.processingStatus).toBe('Validated');
      expect(body.allocation).toMatchObject({
        insuranceProviderId: suspendedProviderId,
        status: 'Failed',
      });

      const [wallet] = await dataSource.query<{ balance: string }[]>(
        `SELECT balance FROM health_wallets WHERE member_id = $1`,
        [memberId],
      );
      expect(Number(wallet.balance)).toBe(15);

      const [allocationRow] = await dataSource.query<
        { allocation_status: string; completed_at: Date | null }[]
      >(
        `SELECT allocation_status, completed_at FROM insurance_allocations WHERE member_id = $1`,
        [memberId],
      );
      expect(allocationRow.allocation_status).toBe('Failed');
      expect(allocationRow.completed_at).toBeTruthy();

      const [auditRow] = await dataSource.query<{ action_type: string }[]>(
        `SELECT action_type FROM audit_logs
         WHERE member_id = $1 AND action_type = 'insurance.allocation_fail'`,
        [memberId],
      );
      expect(auditRow.action_type).toBe('insurance.allocation_fail');
    });
  });

  describe('No Hospital involvement', () => {
    it('the allocation trace response never references a hospital', async () => {
      const [existingAllocation] = await dataSource.query<
        { allocation_id: number }[]
      >(
        `SELECT allocation_id FROM insurance_allocations WHERE insurance_provider_id = $1 LIMIT 1`,
        [activeProviderId],
      );
      const token = signToken(
        insuranceStaffId,
        ['Insurance'],
        'AllocWorkflowInsuranceStaff',
      );
      const res = await request(app.getHttpServer())
        .get(`/insurance/allocations/${existingAllocation.allocation_id}/trace`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(JSON.stringify(res.body).toLowerCase()).not.toContain('hospital');
    });
  });
});
