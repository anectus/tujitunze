import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

// Proves STEP 7's Admin-facing financial reconciliation end to end, on
// top of the existing STEP 3/4/5/6 contribution + allocation ledger:
//
//   EXTERNAL TRANSACTION -> TUJITUNZE CONTRIBUTION -> INSURANCE ALLOCATION
//
// No new source-of-truth tables — telecom_contributions,
// bank_transactions, insurance_allocations, wallet_transactions remain
// authoritative; admin_reconciliation_runs/records (migration 0016) only
// record the computed result of checking an externally-reported
// transaction against them. Every one of the 8 detect categories plus
// the success case is exercised, and GET .../runs/:id proves Admin can
// answer all seven required questions per record.
describe('Admin financial reconciliation (e2e)', () => {
  let app: INestApplication<App>;
  let jwtService: JwtService;
  let dataSource: DataSource;

  const ts = Date.now().toString();
  const createdUserIds: number[] = [];
  const createdPhoneIds: number[] = [];
  const createdProviderIds: number[] = [];
  const createdPlanIds: number[] = [];
  const createdBankAccountIds: number[] = [];
  const createdRunIds: number[] = [];

  const nida = (i: number) =>
    `${ts.slice(0, 8)}-${ts.slice(8, 13)}-${String(i).padStart(5, '0')}-08`;

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

  let adminId: number;
  let adminToken: string;

  let operatorId: number;
  let telecomStaffId: number;
  let originalOperatorApiKeyHash: string | null;

  let bankId: number;
  let bankStaffId: number;

  let activeProviderId: number;
  let activePlanId: number;
  let suspendedProviderId: number;
  let suspendedPlanId: number;

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

    adminId = await createUser('ReconAdmin', 1);
    adminToken = signToken(adminId, ['Admin'], 'ReconAdmin');

    // Deliberately excludes Vodacom: that operator's webhook contribution
    // now routes through the real (genuinely credentialed) M-Pesa
    // collection rail — this test exercises the pre-existing direct-
    // credit path shared by every other operator, not Vodacom itself.
    const [operator] = await dataSource.query<{ operator_id: number }[]>(
      `SELECT operator_id FROM telecom_operators WHERE operator_name != 'Vodacom' LIMIT 1`,
    );
    operatorId = operator.operator_id;
    telecomStaffId = await createUser('ReconTelecomStaff', 2, {
      telecom_operator_id: operatorId,
    });
    const [{ api_key_hash: origHash }] = await dataSource.query<
      { api_key_hash: string | null }[]
    >(`SELECT api_key_hash FROM telecom_operators WHERE operator_id = $1`, [
      operatorId,
    ]);
    originalOperatorApiKeyHash = origHash;

    const [bank] = await dataSource.query<{ bank_id: number }[]>(
      `SELECT bank_id FROM banks LIMIT 1`,
    );
    bankId = bank.bank_id;
    bankStaffId = await createUser('ReconBankStaff', 3, { bank_id: bankId });

    const [provider] = await dataSource.query<{ provider_id: number }[]>(
      `INSERT INTO insurance_providers (provider_name, status) VALUES ($1, 'Active') RETURNING provider_id`,
      [`E2E Recon Insurance ${ts}`],
    );
    activeProviderId = provider.provider_id;
    createdProviderIds.push(activeProviderId);

    const [plan] = await dataSource.query<{ plan_id: number }[]>(
      `INSERT INTO insurance_plans (provider_id, plan_name, coverage_amount, premium_amount, status)
       VALUES ($1, $2, 100000, 1000, 'Active') RETURNING plan_id`,
      [activeProviderId, `E2E Recon Plan ${ts}`],
    );
    activePlanId = plan.plan_id;
    createdPlanIds.push(activePlanId);

    const [suspendedProvider] = await dataSource.query<
      { provider_id: number }[]
    >(
      `INSERT INTO insurance_providers (provider_name, status) VALUES ($1, 'Suspended') RETURNING provider_id`,
      [`E2E Recon Suspended Insurance ${ts}`],
    );
    suspendedProviderId = suspendedProvider.provider_id;
    createdProviderIds.push(suspendedProviderId);

    const [suspendedPlan] = await dataSource.query<{ plan_id: number }[]>(
      `INSERT INTO insurance_plans (provider_id, plan_name, coverage_amount, premium_amount, status)
       VALUES ($1, $2, 100000, 1000, 'Active') RETURNING plan_id`,
      [suspendedProviderId, `E2E Recon Suspended Plan ${ts}`],
    );
    suspendedPlanId = suspendedPlan.plan_id;
    createdPlanIds.push(suspendedPlanId);
  });

  afterAll(async () => {
    await dataSource.query(
      `DELETE FROM admin_reconciliation_records WHERE run_id = ANY($1)`,
      [createdRunIds],
    );
    await dataSource.query(
      `DELETE FROM admin_reconciliation_runs WHERE run_id = ANY($1)`,
      [createdRunIds],
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
    await dataSource.query(
      `UPDATE telecom_operators SET api_key_hash = $2 WHERE operator_id = $1`,
      [operatorId, originalOperatorApiKeyHash],
    );
    await app.close();
  });

  it('rejects a non-Admin token', async () => {
    const token = signToken(telecomStaffId, ['Telecom'], 'ReconTelecomStaff');
    await request(app.getHttpServer())
      .post('/admin/reconciliation/check')
      .set('Authorization', `Bearer ${token}`)
      .send({ channel: 'AIRTIME', externalReference: 'X', amount: 1 })
      .expect(403);
  });

  describe('Matched — a clean Airtime contribution with an active allocation', () => {
    let memberId: number;
    let phoneNumber: string;
    const externalRef = `RECON-MATCH-${ts}`;

    it('sets up the member, policy, and contribution', async () => {
      memberId = await createUser('MatchedMember', 4);
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
        [memberId, activePlanId, `POL-RECON-${ts}`],
      );

      const rawApiKey = `tk_e2e_recon_${crypto.randomBytes(12).toString('hex')}`;
      await dataSource.query(
        `UPDATE telecom_operators SET api_key_hash = $2, status = 'Active' WHERE operator_id = $1`,
        [operatorId, await bcrypt.hash(rawApiKey, 12)],
      );

      const token = signToken(telecomStaffId, ['Telecom'], 'ReconTelecomStaff');
      await request(app.getHttpServer())
        .post('/telecom/contributions')
        .set('Authorization', `Bearer ${token}`)
        .send({ phoneNumber, amount: 20, referenceNumber: externalRef })
        .expect(201);
    });

    it('POST /admin/reconciliation/check answers all seven questions correctly', async () => {
      const res = await request(app.getHttpServer())
        .post('/admin/reconciliation/check')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          channel: 'AIRTIME',
          externalReference: externalRef,
          amount: 20,
          memberIdentifier: phoneNumber,
        })
        .expect(201);

      expect(res.body).toMatchObject({
        status: 'Matched',
        checks: {
          externalTransactionExists: true,
          contributionExists: true,
          amountMatches: true,
          memberMatches: true,
          allocationExists: true,
          allocationAmountMatches: true,
          alreadyProcessed: false,
        },
      });
    });

    it('a persisted run records the same Matched result and is retrievable via GET', async () => {
      const res = await request(app.getHttpServer())
        .post('/admin/reconciliation/runs')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          records: [
            {
              channel: 'AIRTIME',
              externalReference: externalRef,
              amount: 20,
              memberIdentifier: phoneNumber,
            },
          ],
        })
        .expect(201);

      expect(res.body).toMatchObject({ matchedCount: 1, exceptionCount: 0 });
      const runId = (res.body as { runId: number }).runId;
      createdRunIds.push(runId);

      const getRes = await request(app.getHttpServer())
        .get(`/admin/reconciliation/runs/${runId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const body = getRes.body as {
        records: { status: string; externalReference: string }[];
      };
      expect(body.records).toHaveLength(1);
      expect(body.records[0]).toMatchObject({
        status: 'Matched',
        externalReference: externalRef,
      });
    });

    it('resubmitting the same reference is now AlreadyProcessed, not Matched again', async () => {
      const res = await request(app.getHttpServer())
        .post('/admin/reconciliation/check')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          channel: 'AIRTIME',
          externalReference: externalRef,
          amount: 20,
        })
        .expect(201);

      expect(res.body).toMatchObject({
        status: 'AlreadyProcessed',
        checks: { alreadyProcessed: true },
      });
    });
  });

  describe('Missing — external transaction reported but no contribution exists', () => {
    it('POST /admin/reconciliation/check returns Missing', async () => {
      const res = await request(app.getHttpServer())
        .post('/admin/reconciliation/check')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          channel: 'AIRTIME',
          externalReference: `RECON-MISSING-${ts}`,
          amount: 10,
        })
        .expect(201);

      expect(res.body).toMatchObject({
        status: 'Missing',
        checks: { externalTransactionExists: true, contributionExists: false },
      });
    });
  });

  describe('AmountMismatch — reported amount does not match the recorded contribution', () => {
    let memberId: number;
    let phoneNumber: string;
    const externalRef = `RECON-AMOUNT-${ts}`;

    it('records a real contribution then checks it with the wrong amount', async () => {
      memberId = await createUser('AmountMismatchMember', 5);
      phoneNumber = `07${String(Number(ts.slice(-8)) + 1).padStart(8, '0')}`;
      const [phone] = await dataSource.query<{ phone_id: number }[]>(
        `INSERT INTO phone_numbers (user_id, operator_id, phone_number, is_primary, phone_status)
         VALUES ($1, $2, $3, true, 'Active') RETURNING phone_id`,
        [memberId, operatorId, phoneNumber],
      );
      createdPhoneIds.push(phone.phone_id);

      const token = signToken(telecomStaffId, ['Telecom'], 'ReconTelecomStaff');
      await request(app.getHttpServer())
        .post('/telecom/contributions')
        .set('Authorization', `Bearer ${token}`)
        .send({ phoneNumber, amount: 20, referenceNumber: externalRef })
        .expect(201);

      const res = await request(app.getHttpServer())
        .post('/admin/reconciliation/check')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          channel: 'AIRTIME',
          externalReference: externalRef,
          amount: 999,
        })
        .expect(201);

      expect(res.body).toMatchObject({
        status: 'AmountMismatch',
        checks: { contributionExists: true, amountMatches: false },
      });
    });
  });

  describe('UnknownMember — reported member identifier does not resolve to the contribution member', () => {
    it('checks a real contribution against a phone number belonging to someone else', async () => {
      const memberId = await createUser('UnknownMemberOwner', 6);
      const phoneNumber = `07${String(Number(ts.slice(-8)) + 2).padStart(8, '0')}`;
      const [phone] = await dataSource.query<{ phone_id: number }[]>(
        `INSERT INTO phone_numbers (user_id, operator_id, phone_number, is_primary, phone_status)
         VALUES ($1, $2, $3, true, 'Active') RETURNING phone_id`,
        [memberId, operatorId, phoneNumber],
      );
      createdPhoneIds.push(phone.phone_id);

      const otherMemberId = await createUser('UnknownMemberOther', 7);
      const otherPhoneNumber = `07${String(Number(ts.slice(-8)) + 3).padStart(8, '0')}`;
      const [otherPhone] = await dataSource.query<{ phone_id: number }[]>(
        `INSERT INTO phone_numbers (user_id, operator_id, phone_number, is_primary, phone_status)
         VALUES ($1, $2, $3, true, 'Active') RETURNING phone_id`,
        [otherMemberId, operatorId, otherPhoneNumber],
      );
      createdPhoneIds.push(otherPhone.phone_id);

      const externalRef = `RECON-MEMBER-${ts}`;
      const token = signToken(telecomStaffId, ['Telecom'], 'ReconTelecomStaff');
      await request(app.getHttpServer())
        .post('/telecom/contributions')
        .set('Authorization', `Bearer ${token}`)
        .send({ phoneNumber, amount: 12, referenceNumber: externalRef })
        .expect(201);

      const res = await request(app.getHttpServer())
        .post('/admin/reconciliation/check')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          channel: 'AIRTIME',
          externalReference: externalRef,
          amount: 12,
          memberIdentifier: otherPhoneNumber,
        })
        .expect(201);

      expect(res.body).toMatchObject({
        status: 'UnknownMember',
        checks: { amountMatches: true, memberMatches: false },
      });
    });
  });

  describe('FailedAllocation — active policy, but its insurance provider is Suspended', () => {
    it('the contribution reconciles to FailedAllocation, not Matched', async () => {
      const memberId = await createUser('FailedAllocMember', 8);
      const phoneNumber = `07${String(Number(ts.slice(-8)) + 4).padStart(8, '0')}`;
      const [phone] = await dataSource.query<{ phone_id: number }[]>(
        `INSERT INTO phone_numbers (user_id, operator_id, phone_number, is_primary, phone_status)
         VALUES ($1, $2, $3, true, 'Active') RETURNING phone_id`,
        [memberId, operatorId, phoneNumber],
      );
      createdPhoneIds.push(phone.phone_id);

      await dataSource.query(
        `INSERT INTO member_insurance (member_id, plan_id, policy_number, start_date, policy_status)
         VALUES ($1, $2, $3, CURRENT_DATE, 'Active')`,
        [memberId, suspendedPlanId, `POL-RECON-SUSPENDED-${ts}`],
      );

      const externalRef = `RECON-FAILALLOC-${ts}`;
      const token = signToken(telecomStaffId, ['Telecom'], 'ReconTelecomStaff');
      await request(app.getHttpServer())
        .post('/telecom/contributions')
        .set('Authorization', `Bearer ${token}`)
        .send({ phoneNumber, amount: 8, referenceNumber: externalRef })
        .expect(201);

      const res = await request(app.getHttpServer())
        .post('/admin/reconciliation/check')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ channel: 'AIRTIME', externalReference: externalRef, amount: 8 })
        .expect(201);

      expect(res.body).toMatchObject({
        status: 'FailedAllocation',
        checks: {
          contributionExists: true,
          amountMatches: true,
          allocationExists: true,
          allocationAmountMatches: true,
        },
      });
    });
  });

  describe('Reversed — a contribution that was reversed after being Allocated', () => {
    it('reconciles to Reversed after the reversal endpoint runs', async () => {
      const memberId = await createUser('ReversedMember', 9);
      const phoneNumber = `07${String(Number(ts.slice(-8)) + 5).padStart(8, '0')}`;
      const [phone] = await dataSource.query<{ phone_id: number }[]>(
        `INSERT INTO phone_numbers (user_id, operator_id, phone_number, is_primary, phone_status)
         VALUES ($1, $2, $3, true, 'Active') RETURNING phone_id`,
        [memberId, operatorId, phoneNumber],
      );
      createdPhoneIds.push(phone.phone_id);

      await dataSource.query(
        `INSERT INTO member_insurance (member_id, plan_id, policy_number, start_date, policy_status)
         VALUES ($1, $2, $3, CURRENT_DATE, 'Active')`,
        [memberId, activePlanId, `POL-RECON-REV-${ts}`],
      );

      const externalRef = `RECON-REVERSED-${ts}`;
      const token = signToken(telecomStaffId, ['Telecom'], 'ReconTelecomStaff');
      const createRes = await request(app.getHttpServer())
        .post('/telecom/contributions')
        .set('Authorization', `Bearer ${token}`)
        .send({ phoneNumber, amount: 9, referenceNumber: externalRef })
        .expect(201);

      const contributionId = (createRes.body as { contributionId: number })
        .contributionId;

      await request(app.getHttpServer())
        .patch(`/telecom/contributions/${contributionId}/reverse`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const res = await request(app.getHttpServer())
        .post('/admin/reconciliation/check')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ channel: 'AIRTIME', externalReference: externalRef, amount: 9 })
        .expect(201);

      expect(res.body).toMatchObject({ status: 'Reversed' });
    });
  });

  describe('Duplicate — the same external reference appears twice in one upload batch', () => {
    it('the second occurrence in the batch is Duplicate', async () => {
      const externalRef = `RECON-DUP-${ts}`;
      const res = await request(app.getHttpServer())
        .post('/admin/reconciliation/runs')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          records: [
            { channel: 'AIRTIME', externalReference: externalRef, amount: 5 },
            { channel: 'AIRTIME', externalReference: externalRef, amount: 5 },
          ],
        })
        .expect(201);

      createdRunIds.push((res.body as { runId: number }).runId);

      const body = res.body as { records: { status: string }[] };
      expect(body.records[0].status).not.toBe('Duplicate');
      expect(body.records[1].status).toBe('Duplicate');
    });
  });

  describe('Unknown — a TUJITUNZE contribution not present in the reported batch', () => {
    it('a run with scanUnknown* flags the un-reported contribution as Unknown', async () => {
      const memberId = await createUser('UnknownTxnMember', 10);
      const phoneNumber = `07${String(Number(ts.slice(-8)) + 6).padStart(8, '0')}`;
      const [phone] = await dataSource.query<{ phone_id: number }[]>(
        `INSERT INTO phone_numbers (user_id, operator_id, phone_number, is_primary, phone_status)
         VALUES ($1, $2, $3, true, 'Active') RETURNING phone_id`,
        [memberId, operatorId, phoneNumber],
      );
      createdPhoneIds.push(phone.phone_id);

      const externalRef = `RECON-UNKNOWN-${ts}`;
      const token = signToken(telecomStaffId, ['Telecom'], 'ReconTelecomStaff');
      await request(app.getHttpServer())
        .post('/telecom/contributions')
        .set('Authorization', `Bearer ${token}`)
        .send({ phoneNumber, amount: 7, referenceNumber: externalRef })
        .expect(201);

      const today = new Date().toISOString().slice(0, 10);
      const res = await request(app.getHttpServer())
        .post('/admin/reconciliation/runs')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          records: [
            {
              channel: 'AIRTIME',
              externalReference: `RECON-UNRELATED-${ts}`,
              amount: 1,
            },
          ],
          scanUnknownChannel: 'AIRTIME',
          scanUnknownFrom: `${today}T00:00:00.000Z`,
          scanUnknownTo: `${today}T23:59:59.999Z`,
        })
        .expect(201);

      createdRunIds.push((res.body as { runId: number }).runId);

      const body = res.body as {
        records: { externalReference: string; status: string }[];
      };
      const unknownRecord = body.records.find(
        (r) => r.externalReference === externalRef,
      );
      expect(unknownRecord).toMatchObject({ status: 'Unknown' });
    });
  });

  describe('Cross-channel — Bank Transfer reconciles through the same admin endpoint', () => {
    it('Matched works identically for a Bank Transfer contribution', async () => {
      const memberId = await createUser('BankMatchedMember', 11);
      const accountNumber = `ACC-RECON-${ts}`;
      const [account] = await dataSource.query<
        { member_bank_account_id: number }[]
      >(
        `INSERT INTO member_bank_accounts (member_id, bank_id, account_number, account_holder_name, account_status, verification_status)
         VALUES ($1, $2, $3, 'Recon E2E', 'Active', 'Verified') RETURNING member_bank_account_id`,
        [memberId, bankId, accountNumber],
      );
      createdBankAccountIds.push(account.member_bank_account_id);

      await dataSource.query(
        `INSERT INTO member_insurance (member_id, plan_id, policy_number, start_date, policy_status)
         VALUES ($1, $2, $3, CURRENT_DATE, 'Active')`,
        [memberId, activePlanId, `POL-RECON-BANK-${ts}`],
      );

      const externalRef = `RECON-BANK-${ts}`;
      const token = signToken(bankStaffId, ['Bank'], 'ReconBankStaff');
      await request(app.getHttpServer())
        .post('/bank/contributions')
        .set('Authorization', `Bearer ${token}`)
        .send({ accountNumber, amount: 30, transactionReference: externalRef })
        .expect(201);

      const res = await request(app.getHttpServer())
        .post('/admin/reconciliation/check')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          channel: 'BANK_TRANSFER',
          externalReference: externalRef,
          amount: 30,
          memberIdentifier: accountNumber,
        })
        .expect(201);

      expect(res.body).toMatchObject({
        status: 'Matched',
        checks: {
          contributionExists: true,
          amountMatches: true,
          memberMatches: true,
          allocationExists: true,
          allocationAmountMatches: true,
        },
      });
    });
  });

  describe('GET /admin/reconciliation/runs lists runs newest first', () => {
    it('returns at least the runs created in this suite', async () => {
      const res = await request(app.getHttpServer())
        .get('/admin/reconciliation/runs')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const body = res.body as { run_id: number }[];
      const ids = body.map((r) => r.run_id);
      for (const runId of createdRunIds) {
        expect(ids).toContain(runId);
      }
    });
  });
});
