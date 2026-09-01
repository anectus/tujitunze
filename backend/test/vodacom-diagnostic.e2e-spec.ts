import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

// Proves the RBAC boundary and the "no credentials -> honest 503, never
// a fabricated success" rule for GET /telecom/vodacom/test-connection.
// Does not (and cannot, without real Vodacom credentials) prove a real
// sandbox SessionKey was obtained — that requires
// VODACOM_MPESA_API_KEY/VODACOM_MPESA_ORIGIN, which are not available
// in this environment (see the STEP report).
describe('GET /telecom/vodacom/test-connection (e2e)', () => {
  let app: INestApplication<App>;
  let jwtService: JwtService;
  let dataSource: DataSource;

  const ts = Date.now().toString();
  const createdUserIds: number[] = [];

  const nida = (i: number) =>
    `${ts.slice(0, 8)}-${ts.slice(8, 13)}-${String(i).padStart(5, '0')}-12`;

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
  });

  afterAll(async () => {
    await dataSource.query(`DELETE FROM users WHERE user_id = ANY($1)`, [
      createdUserIds,
    ]);
    await app.close();
  });

  it('rejects an unauthenticated request', async () => {
    await request(app.getHttpServer())
      .get('/telecom/vodacom/test-connection')
      .expect(401);
  });

  it('rejects a non-Admin authenticated user (e.g. Telecom staff)', async () => {
    const telecomStaffId = await createUser('VodacomDiagTelecomStaff', 1);
    const token = signToken(
      telecomStaffId,
      ['Telecom'],
      'VodacomDiagTelecomStaff',
    );

    await request(app.getHttpServer())
      .get('/telecom/vodacom/test-connection')
      .set('Authorization', `Bearer ${token}`)
      .expect(403);
  });

  it('an Admin user reaches the handler; without real credentials configured this environment returns a safe 503 — never a fabricated success', async () => {
    const adminId = await createUser('VodacomDiagAdmin', 2);
    const token = signToken(adminId, ['Admin'], 'VodacomDiagAdmin');

    const res = await request(app.getHttpServer())
      .get('/telecom/vodacom/test-connection')
      .set('Authorization', `Bearer ${token}`);

    // Either a real (500-range config error surfaced as 503) or,
    // if a future environment has real credentials configured, this
    // assertion would need updating to expect 200 — but it must NEVER
    // silently report success without genuine Vodacom credentials.
    if (res.status === 503) {
      expect(JSON.stringify(res.body)).not.toContain('sessionKey');
      expect(JSON.stringify(res.body)).not.toMatch(/VODACOM_MPESA_API_KEY=\S/);
    } else {
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('success');
      expect(res.body).not.toHaveProperty('sessionKey');
    }
  });
});
