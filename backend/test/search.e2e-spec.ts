import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

interface SearchResults {
  members: { id: number; title: string; subtitle: string; href: string }[];
  wallet: { id: number; title: string; subtitle: string; href: string }[];
  insurance: { id: number; title: string; subtitle: string; href: string }[];
  telecom: { id: number; title: string; subtitle: string; href: string }[];
  notifications: {
    id: number;
    title: string;
    subtitle: string;
    href: string;
  }[];
}

// Proves the authorization scoping GET /search relies on — the whole
// point of this endpoint's design (see search.service.ts's threat-model
// comment): a Member must never see another member's data or the
// "members" (NIDA/email lookup) category at all, an Admin must never see
// a *different* member's search results leaked as someone else's, and a
// tenant-scoped role (Bank here, as a representative case) must get
// nothing rather than a guess at cross-tenant data.
describe('Global search (e2e)', () => {
  let app: INestApplication<App>;
  let jwtService: JwtService;
  let dataSource: DataSource;

  const ts = Date.now().toString();
  const createdUserIds: number[] = [];
  const createdProviderIds: number[] = [];
  const createdPlanIds: number[] = [];

  let memberAId: number;
  let memberBId: number;
  let adminId: number;
  let bankStaffId: number;
  const searchTerm = `E2ESearchTerm${ts}`;

  const nida = (i: number) =>
    `${ts.slice(0, 8)}-${ts.slice(8, 13)}-${String(i).padStart(5, '0')}-01`;

  const signToken = (userId: number, roles: string[], firstName: string) =>
    jwtService.sign({ sub: userId, roles, firstName });

  const createUserWithRole = async (
    firstName: string,
    nidaIndex: number,
    roleName: string,
    extra: { email?: string } = {},
  ): Promise<number> => {
    const [row] = await dataSource.query<{ user_id: number }[]>(
      `INSERT INTO users (first_name, surname, email, nida_number, password_hash, member_status)
       VALUES ($1, 'E2E', $2, $3, 'x', 'Active')
       RETURNING user_id`,
      [firstName, extra.email ?? null, nida(nidaIndex)],
    );
    await dataSource.query(
      `INSERT INTO member_roles (member_id, role_id)
       SELECT $1, role_id FROM roles WHERE role_name = $2`,
      [row.user_id, roleName],
    );
    createdUserIds.push(row.user_id);
    return row.user_id;
  };

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

    memberAId = await createUserWithRole('MemberA', 1, 'Member', {
      email: `member-a-${ts}@test.local`,
    });
    memberBId = await createUserWithRole('MemberB', 2, 'Member', {
      email: `member-b-${ts}@test.local`,
    });
    adminId = await createUserWithRole('SearchAdmin', 3, 'Admin');

    const [bank] = await dataSource.query<{ bank_id: number }[]>(
      `SELECT bank_id FROM banks LIMIT 1`,
    );
    bankStaffId = await createUserWithRole('SearchBankStaff', 4, 'Bank', {});
    await dataSource.query(`UPDATE users SET bank_id = $1 WHERE user_id = $2`, [
      bank.bank_id,
      bankStaffId,
    ]);

    // Member A's own data — should only ever be visible to Member A.
    const [wallet] = await dataSource.query<{ wallet_id: number }[]>(
      `INSERT INTO health_wallets (member_id, wallet_number, balance, wallet_status)
       VALUES ($1, $2, 0, 'Active') RETURNING wallet_id`,
      [memberAId, `WLT-E2E-${ts}`],
    );
    await dataSource.query(
      `INSERT INTO wallet_transactions (wallet_id, transaction_type, amount, transaction_reference, remarks)
       VALUES ($1, $2, 1000, $3, 'seeded for search e2e')`,
      [wallet.wallet_id, `Contribution - ${searchTerm}`, `REF-${searchTerm}`],
    );

    const [provider] = await dataSource.query<{ provider_id: number }[]>(
      `INSERT INTO insurance_providers (provider_name, status) VALUES ($1, 'Active') RETURNING provider_id`,
      [`E2E Search Insurance ${ts}`],
    );
    createdProviderIds.push(provider.provider_id);
    const [plan] = await dataSource.query<{ plan_id: number }[]>(
      `INSERT INTO insurance_plans (provider_id, plan_name, coverage_amount, premium_amount, status)
       VALUES ($1, $2, 100000, 1000, 'Active') RETURNING plan_id`,
      [provider.provider_id, `E2E Search Plan ${ts}`],
    );
    createdPlanIds.push(plan.plan_id);
    await dataSource.query(
      `INSERT INTO member_insurance (member_id, plan_id, policy_number, start_date, policy_status)
       VALUES ($1, $2, $3, CURRENT_DATE, 'Active')`,
      [memberAId, plan.plan_id, `POL-${searchTerm}`],
    );

    await dataSource.query(
      `INSERT INTO notifications (member_id, title, message)
       VALUES ($1, $2, 'seeded for search e2e')`,
      [memberAId, `Notification ${searchTerm}`],
    );
  });

  afterAll(async () => {
    await dataSource.query(
      `DELETE FROM notifications WHERE member_id = ANY($1)`,
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
    await dataSource.query(`DELETE FROM insurance_plans WHERE plan_id = ANY($1)`, [
      createdPlanIds,
    ]);
    await dataSource.query(
      `DELETE FROM insurance_providers WHERE provider_id = ANY($1)`,
      [createdProviderIds],
    );
    await dataSource.query(
      `DELETE FROM member_roles WHERE member_id = ANY($1)`,
      [createdUserIds],
    );
    await dataSource.query(`DELETE FROM users WHERE user_id = ANY($1)`, [
      createdUserIds,
    ]);
    await app.close();
  });

  it('rejects a request with no token', async () => {
    await request(app.getHttpServer())
      .get(`/search?q=${searchTerm}`)
      .expect(401);
  });

  it('rejects a query shorter than 2 characters', async () => {
    const token = signToken(memberAId, ['Member'], 'MemberA');

    await request(app.getHttpServer())
      .get('/search?q=a')
      .set('Authorization', `Bearer ${token}`)
      .expect(400);
  });

  it("a Member finds their own wallet/insurance/notifications, and gets no members category at all", async () => {
    const token = signToken(memberAId, ['Member'], 'MemberA');

    const response = await request(app.getHttpServer())
      .get(`/search?q=${searchTerm}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const body = response.body as SearchResults;
    expect(body.wallet).toHaveLength(1);
    expect(body.insurance).toHaveLength(1);
    expect(body.notifications).toHaveLength(1);
    expect(body.members).toHaveLength(0);
    expect(body.telecom).toHaveLength(0);
  });

  it("a Member searching for another member's data (or by NIDA/email) finds nothing", async () => {
    const token = signToken(memberBId, ['Member'], 'MemberB');

    // Member B searching for Member A's seeded transaction reference.
    const byData = await request(app.getHttpServer())
      .get(`/search?q=${searchTerm}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    const byDataBody = byData.body as SearchResults;
    expect(byDataBody.wallet).toHaveLength(0);
    expect(byDataBody.insurance).toHaveLength(0);
    expect(byDataBody.notifications).toHaveLength(0);

    // Member B searching for Member A's own name — proves a Member can't
    // use this endpoint to look up another member at all (no "members"
    // category is ever populated for a Member token).
    const byName = await request(app.getHttpServer())
      .get(`/search?q=MemberA`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect((byName.body as SearchResults).members).toHaveLength(0);
  });

  it('an Admin finds members by name/email, with no wallet/insurance/notifications leakage', async () => {
    const token = signToken(adminId, ['Admin'], 'SearchAdmin');

    const response = await request(app.getHttpServer())
      .get('/search?q=MemberA')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const body = response.body as SearchResults;
    expect(body.members.length).toBeGreaterThanOrEqual(1);
    expect(body.members.some((m) => m.id === memberAId)).toBe(true);
    expect(body.members[0].href).toBe(`/admin/members/${body.members[0].id}`);
    expect(body.wallet).toHaveLength(0);
    expect(body.insurance).toHaveLength(0);
    expect(body.notifications).toHaveLength(0);
  });

  it('a tenant-scoped staff role (Bank) gets an empty result rather than a guess at cross-tenant data', async () => {
    const token = signToken(bankStaffId, ['Bank'], 'SearchBankStaff');

    const response = await request(app.getHttpServer())
      .get(`/search?q=${searchTerm}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const body = response.body as SearchResults;
    expect(body.members).toHaveLength(0);
    expect(body.wallet).toHaveLength(0);
    expect(body.insurance).toHaveLength(0);
    expect(body.telecom).toHaveLength(0);
    expect(body.notifications).toHaveLength(0);
  });
});
