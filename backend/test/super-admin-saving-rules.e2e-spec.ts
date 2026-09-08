import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

interface SavingRuleResponse {
  ruleId: number;
  ruleType: string;
  principle: string;
  ratePercent: string;
  isActive: boolean;
}

// Functional verification for the Super-admin Saving Rules page's backend
// contract: create-side duplicate/validation rejection, and that a PATCH's
// response — the exact object the frontend writes into its local state on
// Save — matches what a fresh GET (i.e. a page reload) reads back, proving
// the "Save persists across reload" claim rather than assuming it from the
// frontend code alone. There's no DELETE endpoint for saving rules (by
// design — these are fixed, pre-seeded rows, see CLAUDE.md), so this PATCHes
// a real existing rule and restores its captured original state in
// afterAll rather than creating/deleting a throwaway row.
describe('Super-admin saving rules (e2e)', () => {
  let app: INestApplication<App>;
  let jwtService: JwtService;
  let dataSource: DataSource;

  const ts = Date.now().toString();
  const createdUserIds: number[] = [];

  let superAdminUserId: number;
  let bankUserId: number;
  let targetRuleId: number;
  let originalRuleState: {
    rate_percent: string;
    minimum_amount: string;
    is_active: boolean;
    effective_to: Date | null;
  };

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
    // Without this, class-validator never runs (Known Security Gap #11,
    // CLAUDE.md) and ratePercent: 150 would reach the service unchecked
    // instead of getting the 400 the real running server returns.
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

    superAdminUserId = await createUserWithRole('SuperAdmin', 1, 'Super-admin');
    bankUserId = await createUserWithRole('BankStaff', 2, 'Bank');

    // TUMA/TRANSACTION_DIVERSION is a real, permanent seeded row (not
    // something this test owns) — capture its exact current state so it
    // can be restored afterward instead of leaving test mutations live.
    const [tuma] = await dataSource.query<
      { rule_id: number; rate_percent: string; minimum_amount: string; is_active: boolean; effective_to: Date | null }[]
    >(
      `SELECT rule_id, rate_percent, minimum_amount, is_active, effective_to
       FROM contribution_rules WHERE rule_type = 'TUMA' AND principle = 'TRANSACTION_DIVERSION'`,
    );
    targetRuleId = tuma.rule_id;
    originalRuleState = {
      rate_percent: tuma.rate_percent,
      minimum_amount: tuma.minimum_amount,
      is_active: tuma.is_active,
      effective_to: tuma.effective_to,
    };
  });

  afterAll(async () => {
    // Restore the row this test mutated to exactly what it was before.
    await dataSource.query(
      `UPDATE contribution_rules
       SET rate_percent = $2, minimum_amount = $3, is_active = $4, effective_to = $5
       WHERE rule_id = $1`,
      [
        targetRuleId,
        originalRuleState.rate_percent,
        originalRuleState.minimum_amount,
        originalRuleState.is_active,
        originalRuleState.effective_to,
      ],
    );

    await dataSource.query(
      `DELETE FROM member_roles WHERE member_id = ANY($1)`,
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

  it('rejects a non-Super-admin token on every route', async () => {
    const token = signToken(bankUserId, ['Bank'], 'BankStaff');

    await request(app.getHttpServer())
      .get('/super-admin/saving-rules')
      .set('Authorization', `Bearer ${token}`)
      .expect(403);

    await request(app.getHttpServer())
      .patch(`/super-admin/saving-rules/${targetRuleId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ ratePercent: 5 })
      .expect(403);
  });

  it('rejects creating a duplicate (ruleType, principle) rule', async () => {
    const token = signToken(superAdminUserId, ['Super-admin'], 'SuperAdmin');

    const response = await request(app.getHttpServer())
      .post('/super-admin/saving-rules')
      .set('Authorization', `Bearer ${token}`)
      .send({ principle: 'RESOURCE_CONVERSION', ruleType: 'VOICE', ratePercent: 10 })
      .expect(409);

    expect((response.body as { message: string }).message).toContain(
      'already exists',
    );
  });

  it('rejects an out-of-range ratePercent instead of silently accepting it', async () => {
    const token = signToken(superAdminUserId, ['Super-admin'], 'SuperAdmin');

    await request(app.getHttpServer())
      .post('/super-admin/saving-rules')
      .set('Authorization', `Bearer ${token}`)
      .send({ principle: 'RESOURCE_CONVERSION', ruleType: 'VOICE', ratePercent: 150 })
      .expect(400);

    await request(app.getHttpServer())
      .patch(`/super-admin/saving-rules/${targetRuleId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ ratePercent: 0 })
      .expect(400);
  });

  it('rejects an invalid ruleType for the given principle', async () => {
    const token = signToken(superAdminUserId, ['Super-admin'], 'SuperAdmin');

    const response = await request(app.getHttpServer())
      .post('/super-admin/saving-rules')
      .set('Authorization', `Bearer ${token}`)
      .send({ principle: 'RESOURCE_CONVERSION', ruleType: 'NOT_A_REAL_TYPE', ratePercent: 10 })
      .expect(400);

    expect((response.body as { message: string }).message).toContain(
      'not a valid ruleType',
    );
  });

  it('PATCH persists the new rate/active state — a fresh GET (reload) reads back exactly what Save returned', async () => {
    const token = signToken(superAdminUserId, ['Super-admin'], 'SuperAdmin');

    const patchResponse = await request(app.getHttpServer())
      .patch(`/super-admin/saving-rules/${targetRuleId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ ratePercent: 3.5, isActive: true })
      .expect(200);

    const patched = patchResponse.body as SavingRuleResponse;
    expect(patched.ratePercent).toBe('3.5000');
    expect(patched.isActive).toBe(true);

    const listResponse = await request(app.getHttpServer())
      .get('/super-admin/saving-rules')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const reloaded = (listResponse.body as SavingRuleResponse[]).find(
      (rule) => rule.ruleId === targetRuleId,
    );
    expect(reloaded?.ratePercent).toBe('3.5000');
    expect(reloaded?.isActive).toBe(true);
  });

  it('logs a failed create attempt to the audit trail, not just the 409 response', async () => {
    const token = signToken(superAdminUserId, ['Super-admin'], 'SuperAdmin');

    await request(app.getHttpServer())
      .post('/super-admin/saving-rules')
      .set('Authorization', `Bearer ${token}`)
      .send({ principle: 'RESOURCE_CONVERSION', ruleType: 'VOICE', ratePercent: 10 })
      .expect(409);

    const [log] = await dataSource.query<
      { new_value: Record<string, unknown> }[]
    >(
      `SELECT new_value FROM audit_logs
       WHERE action_type = 'saving_rule.create_failed' AND member_id = $1
       ORDER BY created_at DESC LIMIT 1`,
      [superAdminUserId],
    );

    expect(log).toBeDefined();
    expect(log.new_value).toMatchObject({
      attempted: { ruleType: 'VOICE', principle: 'RESOURCE_CONVERSION' },
    });
    expect(String(log.new_value.error)).toContain('already exists');
  });

  it('writes a complete newValue snapshot to the audit log on update, not an empty object', async () => {
    const token = signToken(superAdminUserId, ['Super-admin'], 'SuperAdmin');

    await request(app.getHttpServer())
      .patch(`/super-admin/saving-rules/${targetRuleId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ ratePercent: 2.25 })
      .expect(200);

    const [log] = await dataSource.query<
      { new_value: Record<string, unknown> }[]
    >(
      `SELECT new_value FROM audit_logs
       WHERE action_type = 'saving_rule.update' AND affected_record_id = $1
       ORDER BY created_at DESC LIMIT 1`,
      [targetRuleId],
    );

    expect(log).toBeDefined();
    expect(Object.keys(log.new_value)).not.toHaveLength(0);
    expect(log.new_value).toMatchObject({ ruleId: targetRuleId, ratePercent: '2.2500' });
  });
});
