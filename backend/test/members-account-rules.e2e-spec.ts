import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

// Proves the two per-member account rules MembersService now enforces
// hold end to end against a running app, not just by inspection of the
// service code:
//
// 1. TCRA-aligned SIM limits (MembersService.assertSimSlotAvailable):
//    one active Standard SIM per telecom operator per NIDA, up to four
//    active M2M (device) SIMs per operator.
// 2. Bank product uniqueness (MembersService.assertBankProductAvailable):
//    bankId + accountType + currency + accountCapacity must be unique
//    per member among non-Inactive accounts.
//
// Kept to exactly 10 POST /members/phone-numbers calls in the telecom
// block below — that route is @Throttle-d at 10/min per IP
// (rate-limiting.e2e-spec.ts), and this file boots its own app instance
// (its own in-memory ThrottlerStorage), so staying at the limit rather
// than over it keeps every call in this spec countable instead of
// tripping a 429 the assertions aren't expecting.
describe('Member telecom/bank account rules (e2e)', () => {
  let app: INestApplication<App>;
  let jwtService: JwtService;
  let dataSource: DataSource;

  const ts = Date.now().toString();
  const createdUserIds: number[] = [];

  let seqCounter = 0;
  // 3-digit operator prefix + a unique 7-digit suffix derived from the
  // run timestamp and an incrementing counter, matching the
  // ^0[67][0-9]{8}$ phone_numbers CHECK constraint (10 chars total).
  const mkPhone = (prefix: string): string => {
    seqCounter += 1;
    const base = `${ts}${String(seqCounter).padStart(4, '0')}`;
    return `${prefix}${base.slice(-7)}`;
  };

  const nida = (i: number) =>
    `${ts.slice(0, 8)}-${ts.slice(8, 13)}-${String(i).padStart(5, '0')}-09`;

  const signToken = (userId: number, firstName: string) =>
    jwtService.sign({ sub: userId, roles: ['Member'], firstName });

  const operatorId = async (name: string): Promise<number> => {
    const [row] = await dataSource.query<{ operator_id: number }[]>(
      `SELECT operator_id FROM telecom_operators WHERE operator_name = $1`,
      [name],
    );
    return row.operator_id;
  };

  const bankId = async (name: string): Promise<number> => {
    const [row] = await dataSource.query<{ bank_id: number }[]>(
      `SELECT bank_id FROM banks WHERE bank_name = $1`,
      [name],
    );
    return row.bank_id;
  };

  // Registers a real member (through the real /members/register
  // endpoint, so it also owns one Standard SIM on registrationOperator
  // — the same "registration provides the first SIM" flow production
  // members go through), then completes onboarding's gender/region step
  // so canManageAccounts is true, matching MobileMoneyAccountForm's own
  // two-step sequence.
  const createMember = async (
    firstName: string,
    nidaIndex: number,
    registrationPhonePrefix: string,
  ) => {
    const registerResponse = await request(app.getHttpServer())
      .post('/members/register')
      .send({
        firstName,
        surname: 'E2E',
        phoneNumber: mkPhone(registrationPhonePrefix),
        nidaNumber: nida(nidaIndex),
        password: 'Passw0rd!123',
      });

    expect(registerResponse.status).toBe(201);

    const userId: number = registerResponse.body.member.userId;
    createdUserIds.push(userId);

    const token = signToken(userId, firstName);

    const profileResponse = await request(app.getHttpServer())
      .patch('/members/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ gender: 'Male', region: 'Dar es Salaam' });

    expect(profileResponse.status).toBe(200);

    return { userId, token };
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
    if (createdUserIds.length) {
      // phone_numbers/member_bank_accounts/notifications cascade on user
      // delete, but audit_logs.member_id is NO ACTION (see
      // AuditLogsService — audit rows are meant to outlive the account
      // they're about), so those have to go first or the DELETE below
      // hits a foreign-key violation.
      await dataSource.query(
        `DELETE FROM audit_logs WHERE member_id = ANY($1)`,
        [createdUserIds],
      );
      await dataSource.query(`DELETE FROM users WHERE user_id = ANY($1)`, [
        createdUserIds,
      ]);
    }
    await app.close();
  });

  describe('Telecom SIM limits', () => {
    it('enforces one Standard SIM per operator and up to four M2M SIMs per operator', async () => {
      // Registers on TTCL — that's this member's first (registration)
      // SIM, already occupying TTCL's one-Standard-per-operator slot
      // without a separate addPhoneNumber call.
      const { token } = await createMember('SimLimitMember', 1, '073');
      const authHeader = `Bearer ${token}`;

      const vodacomId = await operatorId('Vodacom');

      // 1. First standard Vodacom SIM — allowed.
      const firstVodacom = await request(app.getHttpServer())
        .post('/members/phone-numbers')
        .set('Authorization', authHeader)
        .send({ phoneNumber: mkPhone('074') });

      expect(firstVodacom.status).toBe(201);
      expect(firstVodacom.body.simType).toBe('Standard');
      expect(firstVodacom.body.operatorId).toBe(vodacomId);

      // 2. A second standard Vodacom SIM — rejected, one per operator.
      const secondVodacom = await request(app.getHttpServer())
        .post('/members/phone-numbers')
        .set('Authorization', authHeader)
        .send({ phoneNumber: mkPhone('075') });

      expect(secondVodacom.status).toBe(409);
      expect(secondVodacom.body.message).toMatch(/Vodacom/);
      expect(secondVodacom.body.message).toMatch(/one standard SIM per operator/i);

      // 3. Four M2M Vodacom SIMs — all allowed; M2M is a separate cap
      // from the Standard SIM already registered above.
      for (let i = 0; i < 4; i += 1) {
        const m2mResponse = await request(app.getHttpServer())
          .post('/members/phone-numbers')
          .set('Authorization', authHeader)
          .send({ phoneNumber: mkPhone('076'), simType: 'M2M' });

        expect(m2mResponse.status).toBe(201);
        expect(m2mResponse.body.simType).toBe('M2M');
      }

      // 4. A fifth M2M Vodacom SIM — rejected, four per operator is the
      // M2M ceiling.
      const fifthM2m = await request(app.getHttpServer())
        .post('/members/phone-numbers')
        .set('Authorization', authHeader)
        .send({ phoneNumber: mkPhone('079'), simType: 'M2M' });

      expect(fifthM2m.status).toBe(409);
      expect(fifthM2m.body.message).toMatch(/maximum of 4 M2M SIMs/);

      // 5. Standard SIMs on the remaining operators — each operator's
      // own one-per-operator slot is independent, so Airtel/Yas Money
      // (the TCRA-era Tigo brand — see migration 0001's rename)/Halotel
      // all succeed even though Vodacom is now full for both SIM types.
      const remainingOperators: [string, string][] = [
        ['Airtel', '078'],
        ['Yas Money', '071'],
        ['Halotel', '061'],
      ];

      for (const [name, prefix] of remainingOperators) {
        const response = await request(app.getHttpServer())
          .post('/members/phone-numbers')
          .set('Authorization', authHeader)
          .send({ phoneNumber: mkPhone(prefix) });

        expect(response.status).toBe(201);
        expect(response.body.operatorId).toBe(await operatorId(name));
      }
    });
  });

  describe('Bank account product uniqueness', () => {
    it('allows distinct bank/type/currency products and rejects duplicates', async () => {
      const { token } = await createMember('BankRulesMember', 2, '078');
      const authHeader = `Bearer ${token}`;

      const nmb = await bankId('NMB Bank');
      const crdb = await bankId('CRDB Bank');

      const acct = (suffix: string) => `E2E${ts.slice(-8)}${suffix}`;

      // 1. NMB Savings TZS — allowed.
      const nmbSavingsTzs = await request(app.getHttpServer())
        .post('/members/bank-accounts')
        .set('Authorization', authHeader)
        .send({
          bankId: nmb,
          accountNumber: acct('1'),
          accountType: 'Savings',
        });

      expect(nmbSavingsTzs.status).toBe(201);
      expect(nmbSavingsTzs.body.currency).toBe('TZS');
      expect(nmbSavingsTzs.body.accountCapacity).toBe('Individual');

      // 2. CRDB Savings TZS — a different bank, so this is a distinct
      // product even though type/currency match #1.
      const crdbSavingsTzs = await request(app.getHttpServer())
        .post('/members/bank-accounts')
        .set('Authorization', authHeader)
        .send({
          bankId: crdb,
          accountNumber: acct('2'),
          accountType: 'Savings',
        });

      expect(crdbSavingsTzs.status).toBe(201);

      // 3. A second NMB Savings TZS account (different account number)
      // — rejected, this bank/type/currency/capacity combination is
      // already on file.
      const duplicateNmbSavingsTzs = await request(app.getHttpServer())
        .post('/members/bank-accounts')
        .set('Authorization', authHeader)
        .send({
          bankId: nmb,
          accountNumber: acct('3'),
          accountType: 'Savings',
        });

      expect(duplicateNmbSavingsTzs.status).toBe(409);
      expect(duplicateNmbSavingsTzs.body.message).toBe(
        'You already have this account type at this bank.',
      );

      // 4. NMB Savings USD — allowed; differs from #1 by currency alone.
      const nmbSavingsUsd = await request(app.getHttpServer())
        .post('/members/bank-accounts')
        .set('Authorization', authHeader)
        .send({
          bankId: nmb,
          accountNumber: acct('4'),
          accountType: 'Savings',
          currency: 'USD',
        });

      expect(nmbSavingsUsd.status).toBe(201);
      expect(nmbSavingsUsd.body.currency).toBe('USD');
    });
  });
});
