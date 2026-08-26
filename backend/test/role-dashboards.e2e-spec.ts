import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

// Proves the boundary the role-scoped dashboards rely on: RolesGuard
// rejects a token with no auth and a token whose role doesn't match.
// Per-tenant scoping (e.g. a Bank/Telecom/Insurance account only seeing
// its own tenant's data) is covered by each module's own service-level
// logic; this spec is the shared guard-boundary check across all of them.
describe('Role-scoped dashboards (e2e)', () => {
  let app: INestApplication<App>;
  let jwtService: JwtService;
  let dataSource: DataSource;

  const ts = Date.now().toString();
  const createdUserIds: number[] = [];

  let memberUserId: number;

  const nida = (i: number) =>
    `${ts.slice(0, 8)}-${ts.slice(8, 13)}-${String(i).padStart(5, '0')}-00`;

  const signToken = (userId: number, roles: string[], firstName: string) =>
    jwtService.sign({ sub: userId, roles, firstName });

  const createUser = async (
    firstName: string,
    nidaIndex: number,
  ): Promise<number> => {
    const [row] = await dataSource.query<{ user_id: number }[]>(
      `INSERT INTO users (first_name, surname, nida_number, password_hash, member_status)
       VALUES ($1, 'E2E', $2, 'x', 'Active')
       RETURNING user_id`,
      [firstName, nida(nidaIndex)],
    );
    createdUserIds.push(row.user_id);
    return row.user_id;
  };

  const assignRole = async (userId: number, roleName: string) => {
    await dataSource.query(
      `INSERT INTO member_roles (member_id, role_id)
       SELECT $1, role_id FROM roles WHERE role_name = $2`,
      [userId, roleName],
    );
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    jwtService = app.get(JwtService);
    dataSource = app.get(DataSource);

    memberUserId = await createUser('Member', 1);
    await assignRole(memberUserId, 'Member');
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

  const dashboardRoutes: { path: string; role: string }[] = [
    { path: '/bank/dashboard', role: 'Bank' },
    { path: '/telecom/dashboard', role: 'Telecom' },
    { path: '/insurance/dashboard', role: 'Insurance' },
    { path: '/super-admin/dashboard', role: 'Super-admin' },
  ];

  describe.each(dashboardRoutes)('$path', ({ path }) => {
    it('rejects a request with no token', () => {
      return request(app.getHttpServer()).get(path).expect(401);
    });

    it("rejects a Member-role token that doesn't hold the required role", () => {
      const token = signToken(memberUserId, ['Member'], 'Member');

      return request(app.getHttpServer())
        .get(path)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });
  });
});
