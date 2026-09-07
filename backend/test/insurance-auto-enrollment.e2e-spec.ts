import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { WalletsService } from '../src/modules/wallets/wallets.service';

// Proves the one real gap in the otherwise-existing per-contribution
// insurance-allocation flow (WalletsService.creditContribution): a
// member with no active policy is auto-enrolled into the platform's
// "Tujitunze Insurance" fallback (migration 0029) instead of the
// contribution going unallocated, then the SAME allocation logic every
// other provider already goes through runs unchanged.
describe('Insurance auto-enrollment fallback (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let walletsService: WalletsService;
  let jwtService: JwtService;

  const ts = Date.now().toString();
  const createdUserIds: number[] = [];

  const nida = (i: number) =>
    `${ts.slice(0, 8)}-${ts.slice(8, 13)}-${String(i).padStart(5, '0')}-07`;

  const createUser = async (firstName: string, nidaIndex: number) => {
    const [row] = await dataSource.query<{ user_id: number }[]>(
      `INSERT INTO users (first_name, surname, nida_number, password_hash, member_status)
       VALUES ($1, 'E2E', $2, 'x', 'Active') RETURNING user_id`,
      [firstName, nida(nidaIndex)],
    );
    createdUserIds.push(row.user_id);
    return row.user_id;
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    dataSource = app.get(DataSource);
    walletsService = app.get(WalletsService);
    jwtService = app.get(JwtService);
  });

  const signToken = (userId: number) =>
    jwtService.sign({ sub: userId, roles: ['Member'], firstName: 'E2E' });

  afterAll(async () => {
    await dataSource.query(
      `DELETE FROM insurance_allocations WHERE member_id = ANY($1)`,
      [createdUserIds],
    );
    await dataSource.query(
      `DELETE FROM member_insurance WHERE member_id = ANY($1)`,
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
      `DELETE FROM notifications WHERE member_id = ANY($1)`,
      [createdUserIds],
    );
    await dataSource.query(`DELETE FROM audit_logs WHERE member_id = ANY($1)`, [
      createdUserIds,
    ]);
    await dataSource.query(`DELETE FROM users WHERE user_id = ANY($1)`, [
      createdUserIds,
    ]);
    await app.close();
  });

  it('auto-enrolls a member with no active policy into Tujitunze Insurance and allocates the contribution to it', async () => {
    const memberId = await createUser('AutoEnrollE2E', 1);

    const result = await dataSource.transaction((manager) =>
      walletsService.creditContribution(manager, memberId, 10000, {
        transactionType: 'Airtime',
        transactionReference: `AE-${ts}`,
        remarks: 'e2e auto-enroll test',
      }),
    );

    expect(result.allocation).not.toBeNull();
    expect(result.allocation?.status).toBe('Allocated');
    expect(result.allocation?.providerName).toBe('Tujitunze Insurance');

    const [policy] = await dataSource.query<
      { policy_status: string; policy_number: string; plan_id: number }[]
    >(
      `SELECT policy_status, policy_number, plan_id FROM member_insurance WHERE member_id = $1`,
      [memberId],
    );
    expect(policy).toBeDefined();
    expect(policy.policy_status).toBe('Active');

    const [plan] = await dataSource.query<{ plan_code: string }[]>(
      `SELECT plan_code FROM insurance_plans WHERE plan_id = $1`,
      [policy.plan_id],
    );
    expect(plan.plan_code).toBe('TJZ-BASIC');

    const [auditRow] = await dataSource.query<{ action_type: string }[]>(
      `SELECT action_type FROM audit_logs WHERE member_id = $1 AND action_type = 'member.insurance_auto_enroll'`,
      [memberId],
    );
    expect(auditRow).toBeDefined();

    // GET /members/insurance-allocations-summary (backs the dashboard's
    // pie chart) reflects the same allocation, with Tujitunze Insurance
    // as just another provider_name — no special-casing.
    const res = await request(app.getHttpServer())
      .get('/members/insurance-allocations-summary')
      .set('Authorization', `Bearer ${signToken(memberId)}`)
      .expect(200);

    const body = res.body as {
      items: { providerName: string; count: number; totalTzs: number }[];
    };
    expect(body.items).toContainEqual({
      providerName: 'Tujitunze Insurance',
      count: 1,
      totalTzs: 10000,
    });
  });

  it('does not re-enroll a member who already has an active policy elsewhere', async () => {
    const memberId = await createUser('AlreadyInsuredE2E', 2);

    const [existingPlan] = await dataSource.query<{ plan_id: number }[]>(
      `SELECT plan_id FROM insurance_plans WHERE plan_code != 'TJZ-BASIC' AND status = 'Active' LIMIT 1`,
    );

    await dataSource.query(
      `INSERT INTO member_insurance (member_id, plan_id, policy_number, start_date, policy_status)
       VALUES ($1, $2, $3, CURRENT_DATE, 'Active')`,
      [memberId, existingPlan.plan_id, `POL-E2E-${ts}`],
    );

    const result = await dataSource.transaction((manager) =>
      walletsService.creditContribution(manager, memberId, 5000, {
        transactionType: 'Airtime',
        transactionReference: `AE2-${ts}`,
        remarks: 'e2e already-insured test',
      }),
    );

    expect(result.allocation?.providerName).not.toBe('Tujitunze Insurance');

    const [{ count }] = await dataSource.query<{ count: string }[]>(
      `SELECT COUNT(*)::int AS count FROM member_insurance WHERE member_id = $1`,
      [memberId],
    );
    expect(Number(count)).toBe(1);
  });
});
