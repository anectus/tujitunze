import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

// Proves the GET /admin/audit-logs boundary added when the Super-admin
// dashboard's "View Audit Logs" quick action / sidebar link was wired up:
// the endpoint now accepts Admin (its original caller) and Super-admin,
// and still rejects everyone else. Regression coverage for exactly the
// bug this was written to catch — the endpoint silently reverting to
// Admin-only and Super-admin getting a 403 (which the frontend renders
// as a redirect-to-/login, easy to mistake for "being logged out").
describe('Audit logs access (e2e)', () => {
  let app: INestApplication<App>;
  let jwtService: JwtService;
  let dataSource: DataSource;

  const ts = Date.now().toString();
  const createdUserIds: number[] = [];

  const nida = (i: number) =>
    `${ts.slice(0, 8)}-${ts.slice(8, 13)}-${String(i).padStart(5, '0')}-01`;

  const signToken = (userId: number, roles: string[], firstName: string) =>
    jwtService.sign({ sub: userId, roles, firstName });

  const createUserWithRole = async (
    firstName: string,
    nidaIndex: number,
    roleName: string,
  ): Promise<number> => {
    const [row] = await dataSource.query<{ user_id: number }[]>(
      `INSERT INTO users (first_name, surname, nida_number, password_hash, member_status)
       VALUES ($1, 'E2E', $2, 'x', 'Active')
       RETURNING user_id`,
      [firstName, nida(nidaIndex)],
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
    await app.init();

    jwtService = app.get(JwtService);
    dataSource = app.get(DataSource);
  });

  afterAll(async () => {
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
    await request(app.getHttpServer()).get('/admin/audit-logs').expect(401);
  });

  it('rejects a Bank staff token', async () => {
    const userId = await createUserWithRole('BankStaff', 1, 'Bank');
    const token = signToken(userId, ['Bank'], 'BankStaff');

    await request(app.getHttpServer())
      .get('/admin/audit-logs')
      .set('Authorization', `Bearer ${token}`)
      .expect(403);
  });

  it('accepts an Admin token', async () => {
    const userId = await createUserWithRole('AdminStaff', 2, 'Admin');
    const token = signToken(userId, ['Admin'], 'AdminStaff');

    const response = await request(app.getHttpServer())
      .get('/admin/audit-logs')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
  });

  it('accepts a Super-admin token', async () => {
    const userId = await createUserWithRole('SuperAdminStaff', 3, 'Super-admin');
    const token = signToken(userId, ['Super-admin'], 'SuperAdminStaff');

    const response = await request(app.getHttpServer())
      .get('/admin/audit-logs')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
  });
});
