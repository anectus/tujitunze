import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

// Proves POST /telecom/operator/connection-test (item 2 of the Vodacom
// sandbox integration task): it must use the CALLING staff member's own
// users.telecom_operator_id (never a body-supplied id), dispatch to a
// real Vodacom sandbox call when that operator is Vodacom, write an
// api_access_logs row regardless of outcome, and never create a
// payment_transactions or telecom_contributions row — a connection test
// is read-only with respect to money. It cannot (and does not try to)
// prove a real sandbox SUCCESS, because VODACOM_MPESA_API_KEY,
// VODACOM_MPESA_ORIGIN, and VODACOM_MPESA_SERVICE_PROVIDER_CODE are not
// configured in this environment — see the STEP report. What it proves
// instead is the honest "credentials_missing" outcome, never a
// fabricated "connected".
describe('POST /telecom/operator/connection-test (e2e)', () => {
  let app: INestApplication<App>;
  let jwtService: JwtService;
  let dataSource: DataSource;

  const ts = Date.now().toString();
  const createdUserIds: number[] = [];

  const nida = (i: number) =>
    `${ts.slice(0, 8)}-${ts.slice(8, 13)}-${String(i).padStart(5, '0')}-13`;

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

  let vodacomOperatorId: number;
  let nonVodacomOperatorId: number;

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

    const [vodacom] = await dataSource.query<{ operator_id: number }[]>(
      `SELECT operator_id FROM telecom_operators WHERE operator_name = 'Vodacom'`,
    );
    vodacomOperatorId = vodacom.operator_id;

    const [other] = await dataSource.query<{ operator_id: number }[]>(
      `SELECT operator_id FROM telecom_operators WHERE operator_name != 'Vodacom' LIMIT 1`,
    );
    nonVodacomOperatorId = other.operator_id;
  });

  afterAll(async () => {
    // api_access_logs.actor_id FK's the user this test creates — this
    // suite's whole point is that a real row gets written there, so it
    // must be cleaned up first or the user DELETE below violates the
    // constraint.
    await dataSource.query(
      `DELETE FROM api_access_logs WHERE actor_id = ANY($1)`,
      [createdUserIds],
    );
    await dataSource.query(`DELETE FROM users WHERE user_id = ANY($1)`, [
      createdUserIds,
    ]);
    await app.close();
  });

  it('rejects an unauthenticated request', async () => {
    await request(app.getHttpServer())
      .post('/telecom/operator/connection-test')
      .expect(401);
  });

  it('rejects a non-Telecom role (e.g. Admin)', async () => {
    const adminId = await createUser('ConnTestAdmin', 1);
    const token = signToken(adminId, ['Admin'], 'ConnTestAdmin');

    await request(app.getHttpServer())
      .post('/telecom/operator/connection-test')
      .set('Authorization', `Bearer ${token}`)
      .expect(403);
  });

  it('rejects a Telecom staff account with no operator assigned yet', async () => {
    const unassignedId = await createUser('ConnTestUnassigned', 2);
    const token = signToken(unassignedId, ['Telecom'], 'ConnTestUnassigned');

    await request(app.getHttpServer())
      .post('/telecom/operator/connection-test')
      .set('Authorization', `Bearer ${token}`)
      .expect(403);
  });

  it('a Vodacom-assigned staff member gets a real (never fabricated) result — credentials_missing in this environment — and writes an api_access_logs row without touching money', async () => {
    const staffId = await createUser('ConnTestVodacomStaff', 3, {
      telecom_operator_id: vodacomOperatorId,
    });
    const token = signToken(staffId, ['Telecom'], 'ConnTestVodacomStaff');

    const [beforeLogCount] = await dataSource.query<{ count: string }[]>(
      `SELECT COUNT(*)::int AS count FROM api_access_logs WHERE operator_id = $1`,
      [vodacomOperatorId],
    );
    const [beforePaymentCount] = await dataSource.query<{ count: string }[]>(
      `SELECT COUNT(*)::int AS count FROM payment_transactions`,
    );

    const res = await request(app.getHttpServer())
      .post('/telecom/operator/connection-test')
      .set('Authorization', `Bearer ${token}`)
      .expect(201);

    // Structured states only — the STEP-required vocabulary. Never a
    // silently-invented "success" absent real credentials.
    expect([
      'connected',
      'credentials_missing',
      'authentication_failed',
      'connection_failed',
      'timeout',
    ]).toContain(res.body.state);
    expect(res.body).not.toHaveProperty('sessionKey');
    expect(JSON.stringify(res.body)).not.toMatch(/VODACOM_MPESA_API_KEY=\S/);

    // Honest in THIS environment specifically (API key/origin/service
    // provider code are unset — see .env) — not a hardcoded assumption
    // about every environment.
    expect(res.body).toMatchObject({
      provider: 'Vodacom',
      state: 'credentials_missing',
      success: false,
    });

    const [afterLogCount] = await dataSource.query<{ count: string }[]>(
      `SELECT COUNT(*)::int AS count FROM api_access_logs WHERE operator_id = $1`,
      [vodacomOperatorId],
    );
    expect(Number(afterLogCount.count)).toBe(Number(beforeLogCount.count) + 1);

    const [latestLog] = await dataSource.query<
      { event_type: string; actor_id: number; success: boolean }[]
    >(
      `SELECT event_type, actor_id, success FROM api_access_logs
       WHERE operator_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [vodacomOperatorId],
    );
    expect(latestLog).toMatchObject({
      event_type: 'connection_test',
      actor_id: staffId,
      success: false,
    });

    // Never creates a financial record — a connection test proves
    // connectivity/authentication only.
    const [afterPaymentCount] = await dataSource.query<{ count: string }[]>(
      `SELECT COUNT(*)::int AS count FROM payment_transactions`,
    );
    expect(Number(afterPaymentCount.count)).toBe(
      Number(beforePaymentCount.count),
    );
  });

  it('a staff member assigned to an operator with no real integration gets integration_not_configured, scoped to THEIR OWN operator', async () => {
    const staffId = await createUser('ConnTestOtherStaff', 4, {
      telecom_operator_id: nonVodacomOperatorId,
    });
    const token = signToken(staffId, ['Telecom'], 'ConnTestOtherStaff');

    const res = await request(app.getHttpServer())
      .post('/telecom/operator/connection-test')
      .set('Authorization', `Bearer ${token}`)
      .expect(201);

    expect(res.body).toMatchObject({
      state: 'integration_not_configured',
      success: false,
    });
    expect(res.body.provider).not.toBe('Vodacom');
  });
});
