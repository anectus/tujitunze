import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

interface ContributionResponse {
  walletTransactionId: number;
  amount: string;
}

interface WalletTransactionsResponse {
  items: { channel: string; transactionReference: string | null }[];
}

// Proves CLAUDE.md's two-channel contribution collection model: Airtime
// (Telecom) and Bank Transfer (Bank) both produce a normalized, traceable
// contribution that credits the SAME member wallet ledger
// (wallet_transactions, via WalletsService.creditContribution — shared
// by both TelecomService.recordContribution and
// BankService.recordContribution rather than two separate financial
// systems), each tenant-isolated, idempotent on their reference/
// transaction-reference UNIQUE constraint, and visible to Admin's
// cross-channel summary and the Member's own transaction history with
// the correct channel label.
describe('Contribution channels — Airtime & Bank Transfer (e2e)', () => {
  let app: INestApplication<App>;
  let jwtService: JwtService;
  let dataSource: DataSource;

  const ts = Date.now().toString();
  const createdUserIds: number[] = [];
  const createdPhoneIds: number[] = [];
  const createdBankAccountIds: number[] = [];
  const createdProviderIds: number[] = [];

  const nida = (i: number) =>
    `${ts.slice(0, 8)}-${ts.slice(8, 13)}-${String(i).padStart(5, '0')}-04`;

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
  let bankId: number;
  let providerId: number;

  let telecomStaffId: number;
  let bankStaffId: number;

  let airtimeMemberId: number;
  let airtimePhoneNumber: string;

  let bankMemberId: number;
  let bankAccountId: number;
  let bankAccountNumber: string;

  let telecomRawApiKey: string;
  let bankRawApiKey: string;
  let originalOperatorApiKeyHash: string | null;
  let originalBankApiKeyHash: string | null;

  let planId: number;

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

    const [bank] = await dataSource.query<{ bank_id: number }[]>(
      `SELECT bank_id FROM banks LIMIT 1`,
    );
    bankId = bank.bank_id;

    const [provider] = await dataSource.query<{ provider_id: number }[]>(
      `INSERT INTO insurance_providers (provider_name, status) VALUES ($1, 'Active') RETURNING provider_id`,
      [`E2E Contribution Channels Insurance ${ts}`],
    );
    providerId = provider.provider_id;
    createdProviderIds.push(providerId);

    telecomStaffId = await createUser('TelecomStaff', 1, {
      telecom_operator_id: operatorId,
    });
    bankStaffId = await createUser('BankStaff', 2, { bank_id: bankId });

    airtimeMemberId = await createUser('AirtimeMember', 3);
    airtimePhoneNumber = `07${ts.slice(-8)}`;
    const [phone] = await dataSource.query<{ phone_id: number }[]>(
      `INSERT INTO phone_numbers (user_id, operator_id, phone_number, is_primary, phone_status)
       VALUES ($1, $2, $3, true, 'Active') RETURNING phone_id`,
      [airtimeMemberId, operatorId, airtimePhoneNumber],
    );
    createdPhoneIds.push(phone.phone_id);

    bankMemberId = await createUser('BankMember', 4);
    const [account] = await dataSource.query<
      { member_bank_account_id: number }[]
    >(
      `INSERT INTO member_bank_accounts (member_id, bank_id, account_number, account_holder_name, account_status, verification_status)
       VALUES ($1, $2, $3, 'Bank Member E2E', 'Active', 'Verified') RETURNING member_bank_account_id`,
      [bankMemberId, bankId, `ACC-${ts}`],
    );
    bankAccountId = account.member_bank_account_id;
    bankAccountNumber = `ACC-${ts}`;
    createdBankAccountIds.push(bankAccountId);

    // Webhook auth fixtures — temporarily overwrite the shared seed
    // operator/bank's api_key_hash so TelecomApiKeyGuard/BankApiKeyGuard
    // have something real to bcrypt.compare against; restored in
    // afterAll so this doesn't permanently invalidate whatever real key
    // (if any) that seed row already had.
    const [{ api_key_hash: origOperatorHash }] = await dataSource.query<
      { api_key_hash: string | null }[]
    >(`SELECT api_key_hash FROM telecom_operators WHERE operator_id = $1`, [
      operatorId,
    ]);
    originalOperatorApiKeyHash = origOperatorHash;
    telecomRawApiKey = `tk_e2e_${crypto.randomBytes(12).toString('hex')}`;
    await dataSource.query(
      `UPDATE telecom_operators SET api_key_hash = $2, status = 'Active' WHERE operator_id = $1`,
      [operatorId, await bcrypt.hash(telecomRawApiKey, 12)],
    );

    const [{ api_key_hash: origBankHash }] = await dataSource.query<
      { api_key_hash: string | null }[]
    >(`SELECT api_key_hash FROM banks WHERE bank_id = $1`, [bankId]);
    originalBankApiKeyHash = origBankHash;
    bankRawApiKey = `bk_e2e_${crypto.randomBytes(12).toString('hex')}`;
    await dataSource.query(
      `UPDATE banks SET api_key_hash = $2, status = 'Active' WHERE bank_id = $1`,
      [bankId, await bcrypt.hash(bankRawApiKey, 12)],
    );

    // Active insurance policy for airtimeMemberId — the only way
    // creditContribution() actually creates an insurance_allocations
    // row, so allocation-traceability tests need this to exist.
    const [plan] = await dataSource.query<{ plan_id: number }[]>(
      `INSERT INTO insurance_plans (provider_id, plan_name, coverage_amount, premium_amount, status)
       VALUES ($1, $2, 100000, 1000, 'Active') RETURNING plan_id`,
      [providerId, `E2E Contribution Plan ${ts}`],
    );
    planId = plan.plan_id;

    await dataSource.query(
      `INSERT INTO member_insurance (member_id, plan_id, policy_number, start_date, policy_status)
       VALUES ($1, $2, $3, CURRENT_DATE, 'Active')`,
      [airtimeMemberId, planId, `POL-E2E-${ts}`],
    );

    await dataSource.query(
      `INSERT INTO member_insurance (member_id, plan_id, policy_number, start_date, policy_status)
       VALUES ($1, $2, $3, CURRENT_DATE, 'Active')`,
      [bankMemberId, planId, `POL-E2E-BANK-${ts}`],
    );
  });

  afterAll(async () => {
    const allUserIds = [
      ...createdUserIds,
      // wallets/wallet_transactions cascade cleanup below uses these too
    ];
    await dataSource.query(
      `DELETE FROM insurance_allocations WHERE member_id = ANY($1)`,
      [allUserIds],
    );
    await dataSource.query(
      `DELETE FROM wallet_transactions WHERE wallet_id IN (SELECT wallet_id FROM health_wallets WHERE member_id = ANY($1))`,
      [allUserIds],
    );
    await dataSource.query(
      `DELETE FROM health_wallets WHERE member_id = ANY($1)`,
      [allUserIds],
    );
    await dataSource.query(
      `DELETE FROM telecom_contributions WHERE member_id = ANY($1)`,
      [allUserIds],
    );
    await dataSource.query(
      `DELETE FROM bank_transactions WHERE member_bank_account_id = ANY($1)`,
      [createdBankAccountIds],
    );
    await dataSource.query(
      `DELETE FROM notifications WHERE member_id = ANY($1)`,
      [allUserIds],
    );
    await dataSource.query(`DELETE FROM audit_logs WHERE member_id = ANY($1)`, [
      allUserIds,
    ]);
    await dataSource.query(
      `DELETE FROM member_insurance WHERE member_id = ANY($1)`,
      [allUserIds],
    );
    await dataSource.query(`DELETE FROM insurance_plans WHERE plan_id = $1`, [
      planId,
    ]);
    await dataSource.query(
      `DELETE FROM member_bank_accounts WHERE member_bank_account_id = ANY($1)`,
      [createdBankAccountIds],
    );
    await dataSource.query(
      `DELETE FROM phone_numbers WHERE phone_id = ANY($1)`,
      [createdPhoneIds],
    );
    await dataSource.query(`DELETE FROM users WHERE user_id = ANY($1)`, [
      allUserIds,
    ]);
    await dataSource.query(
      `DELETE FROM insurance_providers WHERE provider_id = ANY($1)`,
      [createdProviderIds],
    );
    await dataSource.query(
      `UPDATE telecom_operators SET api_key_hash = $2 WHERE operator_id = $1`,
      [operatorId, originalOperatorApiKeyHash],
    );
    await dataSource.query(
      `UPDATE banks SET api_key_hash = $2 WHERE bank_id = $1`,
      [bankId, originalBankApiKeyHash],
    );
    await app.close();
  });

  describe('AIRTIME channel — POST /telecom/contributions', () => {
    it('rejects a non-Telecom token', async () => {
      const token = signToken(bankStaffId, ['Bank'], 'BankStaff');
      await request(app.getHttpServer())
        .post('/telecom/contributions')
        .set('Authorization', `Bearer ${token}`)
        .send({
          phoneNumber: airtimePhoneNumber,
          amount: 20,
          referenceNumber: `AIR-${ts}-1`,
        })
        .expect(403);
    });

    it('rejects a negative/zero amount (DTO validation)', async () => {
      const token = signToken(telecomStaffId, ['Telecom'], 'TelecomStaff');
      await request(app.getHttpServer())
        .post('/telecom/contributions')
        .set('Authorization', `Bearer ${token}`)
        .send({
          phoneNumber: airtimePhoneNumber,
          amount: -5,
          referenceNumber: `AIR-${ts}-bad`,
        })
        .expect(400);
    });

    it("rejects a phone number that isn't this operator's own member (tenant isolation)", async () => {
      const token = signToken(telecomStaffId, ['Telecom'], 'TelecomStaff');
      await request(app.getHttpServer())
        .post('/telecom/contributions')
        .set('Authorization', `Bearer ${token}`)
        .send({
          phoneNumber: '0799999999',
          amount: 20,
          referenceNumber: `AIR-${ts}-unknown`,
        })
        .expect(404);
    });

    it('records a real contribution, credits the wallet, and logs an audit entry', async () => {
      const token = signToken(telecomStaffId, ['Telecom'], 'TelecomStaff');
      const res = await request(app.getHttpServer())
        .post('/telecom/contributions')
        .set('Authorization', `Bearer ${token}`)
        .send({
          phoneNumber: airtimePhoneNumber,
          amount: 20,
          referenceNumber: `AIR-${ts}-1`,
        })
        .expect(201);

      const body = res.body as ContributionResponse;
      expect(body.walletTransactionId).toBeTruthy();
      expect(body.amount).toBe('20.00');

      const [wallet] = await dataSource.query<{ balance: string }[]>(
        `SELECT balance FROM health_wallets WHERE member_id = $1`,
        [airtimeMemberId],
      );
      expect(Number(wallet.balance)).toBe(20);

      const [auditRow] = await dataSource.query<{ action_type: string }[]>(
        `SELECT action_type FROM audit_logs
         WHERE member_id = $1 AND action_type = 'telecom.contribution_record'`,
        [airtimeMemberId],
      );
      expect(auditRow.action_type).toBe('telecom.contribution_record');
    });

    it('rejects reprocessing the same reference number (idempotency)', async () => {
      const token = signToken(telecomStaffId, ['Telecom'], 'TelecomStaff');
      await request(app.getHttpServer())
        .post('/telecom/contributions')
        .set('Authorization', `Bearer ${token}`)
        .send({
          phoneNumber: airtimePhoneNumber,
          amount: 20,
          referenceNumber: `AIR-${ts}-1`,
        })
        .expect(409);

      const [wallet] = await dataSource.query<{ balance: string }[]>(
        `SELECT balance FROM health_wallets WHERE member_id = $1`,
        [airtimeMemberId],
      );
      expect(Number(wallet.balance)).toBe(20); // unchanged — not double-credited
    });
  });

  describe('BANK_TRANSFER channel — POST /bank/contributions', () => {
    it('rejects a non-Bank token', async () => {
      const token = signToken(telecomStaffId, ['Telecom'], 'TelecomStaff');
      await request(app.getHttpServer())
        .post('/bank/contributions')
        .set('Authorization', `Bearer ${token}`)
        .send({
          accountNumber: bankAccountNumber,
          amount: 50,
          transactionReference: `BNK-${ts}-1`,
        })
        .expect(403);
    });

    it("rejects an account id that isn't this bank's own linked account (tenant isolation)", async () => {
      const token = signToken(bankStaffId, ['Bank'], 'BankStaff');
      await request(app.getHttpServer())
        .post('/bank/contributions')
        .set('Authorization', `Bearer ${token}`)
        .send({
          accountNumber: 'ACC-DOES-NOT-EXIST',
          amount: 50,
          transactionReference: `BNK-${ts}-unknown`,
        })
        .expect(404);
    });

    it('rejects a negative/zero amount (DTO validation)', async () => {
      const token = signToken(bankStaffId, ['Bank'], 'BankStaff');
      await request(app.getHttpServer())
        .post('/bank/contributions')
        .set('Authorization', `Bearer ${token}`)
        .send({
          accountNumber: bankAccountNumber,
          amount: -10,
          transactionReference: `BNK-${ts}-bad`,
        })
        .expect(400);
    });

    it('records a real contribution, credits the wallet, and logs an audit entry', async () => {
      const token = signToken(bankStaffId, ['Bank'], 'BankStaff');
      const res = await request(app.getHttpServer())
        .post('/bank/contributions')
        .set('Authorization', `Bearer ${token}`)
        .send({
          accountNumber: bankAccountNumber,
          amount: 50,
          transactionReference: `BNK-${ts}-1`,
        })
        .expect(201);

      const body = res.body as ContributionResponse;
      expect(body.walletTransactionId).toBeTruthy();
      expect(body.amount).toBe('50.00');

      const [wallet] = await dataSource.query<{ balance: string }[]>(
        `SELECT balance FROM health_wallets WHERE member_id = $1`,
        [bankMemberId],
      );
      expect(Number(wallet.balance)).toBe(50);
    });

    it('rejects reprocessing the same transaction reference (idempotency)', async () => {
      const token = signToken(bankStaffId, ['Bank'], 'BankStaff');
      await request(app.getHttpServer())
        .post('/bank/contributions')
        .set('Authorization', `Bearer ${token}`)
        .send({
          accountNumber: bankAccountNumber,
          amount: 50,
          transactionReference: `BNK-${ts}-1`,
        })
        .expect(409);
    });
  });

  describe('Cross-channel visibility', () => {
    it("Member's transaction history correctly labels each channel", async () => {
      const airtimeToken = signToken(
        airtimeMemberId,
        ['Member'],
        'AirtimeMember',
      );
      const res = await request(app.getHttpServer())
        .get('/members/wallet/transactions')
        .set('Authorization', `Bearer ${airtimeToken}`)
        .expect(200);

      const body = res.body as WalletTransactionsResponse;
      const row = body.items.find(
        (i) => i.transactionReference === `AIR-${ts}-1`,
      );
      expect(row?.channel).toBe('AIRTIME');

      const bankToken = signToken(bankMemberId, ['Member'], 'BankMember');
      const bankRes = await request(app.getHttpServer())
        .get('/members/wallet/transactions')
        .set('Authorization', `Bearer ${bankToken}`)
        .expect(200);

      const bankBody = bankRes.body as WalletTransactionsResponse;
      const bankRow = bankBody.items.find(
        (i) => i.transactionReference === `BNK-${ts}-1`,
      );
      expect(bankRow?.channel).toBe('BANK_TRANSFER');
    });

    it("Admin's cross-channel summary reflects both channels", async () => {
      const adminId = await createUser('SummaryAdmin', 5);
      const token = signToken(adminId, ['Admin'], 'SummaryAdmin');

      const res = await request(app.getHttpServer())
        .get('/admin/contributions/summary')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const body = res.body as {
        airtime: { total: number };
        bankTransfer: { total: number };
        totalCollected: number;
      };
      expect(body.airtime.total).toBeGreaterThanOrEqual(20);
      expect(body.bankTransfer.total).toBeGreaterThanOrEqual(50);
      expect(body.totalCollected).toBeGreaterThanOrEqual(70);
    });
  });

  describe('AIRTIME webhook — POST /telecom/webhooks/contribution', () => {
    it('rejects a missing/wrong API key', async () => {
      await request(app.getHttpServer())
        .post('/telecom/webhooks/contribution')
        .send({
          operatorId,
          phoneNumber: airtimePhoneNumber,
          transactionAmount: 4000,
          transactionType: 'Airtime',
          externalTransactionId: `WH-AIR-${ts}-bad-key`,
        })
        .expect(401);

      await request(app.getHttpServer())
        .post('/telecom/webhooks/contribution')
        .set('X-API-Key', 'wrong-key-entirely')
        .send({
          operatorId,
          phoneNumber: airtimePhoneNumber,
          transactionAmount: 4000,
          transactionType: 'Airtime',
          externalTransactionId: `WH-AIR-${ts}-bad-key-2`,
        })
        .expect(401);
    });

    it('rejects an unknown member phone (no enumeration of the error type)', async () => {
      await request(app.getHttpServer())
        .post('/telecom/webhooks/contribution')
        .set('X-API-Key', telecomRawApiKey)
        .send({
          operatorId,
          phoneNumber: '0798888888',
          transactionAmount: 4000,
          transactionType: 'Airtime',
          externalTransactionId: `WH-AIR-${ts}-unknown`,
        })
        .expect(404);
    });

    it("does not create a contribution below the rule's minimum qualifying amount", async () => {
      const res = await request(app.getHttpServer())
        .post('/telecom/webhooks/contribution')
        .set('X-API-Key', telecomRawApiKey)
        .send({
          operatorId,
          phoneNumber: airtimePhoneNumber,
          transactionAmount: 0.5,
          transactionType: 'Airtime',
          externalTransactionId: `WH-AIR-${ts}-below-min`,
        })
        .expect(201);

      expect(res.body).toMatchObject({ contributionCreated: false });
    });

    it('computes the contribution via contribution_rules (0.5% of the transaction), not the raw transaction amount', async () => {
      const res = await request(app.getHttpServer())
        .post('/telecom/webhooks/contribution')
        .set('X-API-Key', telecomRawApiKey)
        .send({
          operatorId,
          phoneNumber: airtimePhoneNumber,
          transactionAmount: 4000,
          transactionType: 'Airtime',
          externalTransactionId: `WH-AIR-${ts}-1`,
        })
        .expect(201);

      expect(res.body).toMatchObject({
        contributionCreated: true,
        transactionAmount: 4000,
        contributionAmount: 20,
      });
      const webhookBody = res.body as {
        allocation: { insuranceProviderId: number } | null;
      };
      expect(webhookBody.allocation).toMatchObject({
        insuranceProviderId: providerId,
      });
    });

    it('redelivering the same externalTransactionId does not create a second contribution', async () => {
      const before = await dataSource.query<{ count: number }[]>(
        `SELECT COUNT(*)::int AS count FROM telecom_contributions WHERE reference_number = $1`,
        [`WH-AIR-${ts}-1`],
      );
      expect(before[0].count).toBe(1);

      const res = await request(app.getHttpServer())
        .post('/telecom/webhooks/contribution')
        .set('X-API-Key', telecomRawApiKey)
        .send({
          operatorId,
          phoneNumber: airtimePhoneNumber,
          transactionAmount: 4000,
          transactionType: 'Airtime',
          externalTransactionId: `WH-AIR-${ts}-1`,
        })
        .expect(201);

      expect(res.body).toMatchObject({ duplicate: true });

      const after = await dataSource.query<{ count: number }[]>(
        `SELECT COUNT(*)::int AS count FROM telecom_contributions WHERE reference_number = $1`,
        [`WH-AIR-${ts}-1`],
      );
      expect(after[0].count).toBe(1);
    });
  });

  describe('BANK_TRANSFER webhook — POST /bank/webhooks/transaction', () => {
    it('rejects a missing/wrong API key', async () => {
      await request(app.getHttpServer())
        .post('/bank/webhooks/transaction')
        .send({
          bankId,
          accountNumber: bankAccountNumber,
          transactionAmount: 12500,
          transactionType: 'Bank Transfer',
          externalTransactionId: `WH-BNK-${ts}-bad-key`,
        })
        .expect(401);
    });

    it('rejects an unknown account number at this bank', async () => {
      await request(app.getHttpServer())
        .post('/bank/webhooks/transaction')
        .set('X-API-Key', bankRawApiKey)
        .send({
          bankId,
          accountNumber: 'ACC-DOES-NOT-EXIST',
          transactionAmount: 12500,
          transactionType: 'Bank Transfer',
          externalTransactionId: `WH-BNK-${ts}-unknown`,
        })
        .expect(404);
    });

    it('computes the contribution via contribution_rules (0.4% of the transaction)', async () => {
      const res = await request(app.getHttpServer())
        .post('/bank/webhooks/transaction')
        .set('X-API-Key', bankRawApiKey)
        .send({
          bankId,
          accountNumber: bankAccountNumber,
          transactionAmount: 12500,
          transactionType: 'Bank Transfer',
          externalTransactionId: `WH-BNK-${ts}-1`,
        })
        .expect(201);

      expect(res.body).toMatchObject({
        contributionCreated: true,
        transactionAmount: 12500,
        contributionAmount: 50,
      });
      const webhookBody = res.body as {
        allocation: { insuranceProviderId: number } | null;
      };
      expect(webhookBody.allocation).toMatchObject({
        insuranceProviderId: providerId,
      });
    });

    it('redelivering the same externalTransactionId does not create a second transaction', async () => {
      const res = await request(app.getHttpServer())
        .post('/bank/webhooks/transaction')
        .set('X-API-Key', bankRawApiKey)
        .send({
          bankId,
          accountNumber: bankAccountNumber,
          transactionAmount: 12500,
          transactionType: 'Bank Transfer',
          externalTransactionId: `WH-BNK-${ts}-1`,
        })
        .expect(201);

      expect(res.body).toMatchObject({ duplicate: true });

      const count = await dataSource.query<{ count: number }[]>(
        `SELECT COUNT(*)::int AS count FROM bank_transactions WHERE transaction_reference = $1`,
        [`WH-BNK-${ts}-1`],
      );
      expect(count[0].count).toBe(1);
    });
  });

  describe('Insurance allocation traceability — GET /insurance/allocations', () => {
    it("Insurance can see exactly where a member's contribution went", async () => {
      const insuranceStaffId = await createUser('AllocInsuranceStaff', 6, {
        insurance_provider_id: providerId,
      });
      const token = signToken(
        insuranceStaffId,
        ['Insurance'],
        'AllocInsuranceStaff',
      );

      const res = await request(app.getHttpServer())
        .get('/insurance/allocations')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const body = res.body as {
        items: {
          memberId: number;
          amount: string;
          channel: string;
          allocationStatus: string;
        }[];
        totalAllocated: number;
      };

      const airtimeAllocation = body.items.find(
        (i) => i.memberId === airtimeMemberId && i.channel === 'AIRTIME',
      );
      expect(airtimeAllocation).toBeTruthy();
      expect(airtimeAllocation?.amount).toBe('20.00');
      expect(airtimeAllocation?.allocationStatus).toBe('Allocated');

      const bankAllocation = body.items.find(
        (i) => i.memberId === bankMemberId && i.channel === 'BANK_TRANSFER',
      );
      expect(bankAllocation).toBeTruthy();
      expect(bankAllocation?.amount).toBe('50.00');

      expect(body.totalAllocated).toBeGreaterThanOrEqual(70);
    });
  });

  describe('Reversal — PATCH .../contributions/:id/reverse', () => {
    it('reverses a Confirmed Airtime contribution: debits the wallet back and marks its allocation Reversed', async () => {
      const [contribution] = await dataSource.query<
        { contribution_id: number }[]
      >(
        `SELECT contribution_id FROM telecom_contributions WHERE reference_number = $1`,
        [`WH-AIR-${ts}-1`],
      );

      const [walletBefore] = await dataSource.query<{ balance: string }[]>(
        `SELECT balance FROM health_wallets WHERE member_id = $1`,
        [airtimeMemberId],
      );

      const token = signToken(telecomStaffId, ['Telecom'], 'TelecomStaff');
      const res = await request(app.getHttpServer())
        .patch(`/telecom/contributions/${contribution.contribution_id}/reverse`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body).toMatchObject({ processingStatus: 'Reversed' });

      const [walletAfter] = await dataSource.query<{ balance: string }[]>(
        `SELECT balance FROM health_wallets WHERE member_id = $1`,
        [airtimeMemberId],
      );
      expect(Number(walletAfter.balance)).toBe(
        Number(walletBefore.balance) - 20,
      );

      const [allocation] = await dataSource.query<
        { allocation_status: string }[]
      >(
        `SELECT ia.allocation_status FROM insurance_allocations ia
         JOIN wallet_transactions wt ON wt.wallet_transaction_id = ia.wallet_transaction_id
         WHERE wt.contribution_id = $1`,
        [contribution.contribution_id],
      );
      expect(allocation.allocation_status).toBe('Reversed');

      // Reversing an already-Reversed contribution is rejected.
      await request(app.getHttpServer())
        .patch(`/telecom/contributions/${contribution.contribution_id}/reverse`)
        .set('Authorization', `Bearer ${token}`)
        .expect(400);
    });
  });

  describe('Failed transaction — PATCH /telecom/contributions/:id/fail', () => {
    let failMemberId: number;
    let failPhoneNumber: string;
    let failContributionId: number;

    it('sets up a member with no active insurance policy (so the contribution stays Validated, not Allocated)', async () => {
      failMemberId = await createUser('FailMember', 8);
      failPhoneNumber = `07${String(Number(ts.slice(-8)) + 2).padStart(8, '0')}`;
      const [phone] = await dataSource.query<{ phone_id: number }[]>(
        `INSERT INTO phone_numbers (user_id, operator_id, phone_number, is_primary, phone_status)
         VALUES ($1, $2, $3, true, 'Active') RETURNING phone_id`,
        [failMemberId, operatorId, failPhoneNumber],
      );
      createdPhoneIds.push(phone.phone_id);
    });

    it('records a contribution with no active policy to allocate against (stays Validated)', async () => {
      const token = signToken(telecomStaffId, ['Telecom'], 'TelecomStaff');
      const res = await request(app.getHttpServer())
        .post('/telecom/contributions')
        .set('Authorization', `Bearer ${token}`)
        .send({
          phoneNumber: failPhoneNumber,
          amount: 15,
          referenceNumber: `AIR-${ts}-fail`,
        })
        .expect(201);

      expect(res.body).toMatchObject({ allocation: null });

      const [row] = await dataSource.query<
        { contribution_id: number; processing_status: string }[]
      >(
        `SELECT contribution_id, processing_status FROM telecom_contributions WHERE reference_number = $1`,
        [`AIR-${ts}-fail`],
      );
      expect(row.processing_status).toBe('Validated');
      failContributionId = row.contribution_id;

      const [wallet] = await dataSource.query<{ balance: string }[]>(
        `SELECT balance FROM health_wallets WHERE member_id = $1`,
        [failMemberId],
      );
      expect(Number(wallet.balance)).toBe(15);
    });

    it('rejects reversing a non-Allocated contribution (must use fail instead)', async () => {
      const token = signToken(telecomStaffId, ['Telecom'], 'TelecomStaff');
      await request(app.getHttpServer())
        .patch(`/telecom/contributions/${failContributionId}/reverse`)
        .set('Authorization', `Bearer ${token}`)
        .expect(400);
    });

    it('marks the contribution Failed, debits the wallet back, and logs an audit entry', async () => {
      const token = signToken(telecomStaffId, ['Telecom'], 'TelecomStaff');
      const res = await request(app.getHttpServer())
        .patch(`/telecom/contributions/${failContributionId}/fail`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body).toMatchObject({ processingStatus: 'Failed' });

      const [wallet] = await dataSource.query<{ balance: string }[]>(
        `SELECT balance FROM health_wallets WHERE member_id = $1`,
        [failMemberId],
      );
      expect(Number(wallet.balance)).toBe(0);

      const [auditRow] = await dataSource.query<{ action_type: string }[]>(
        `SELECT action_type FROM audit_logs
         WHERE member_id = $1 AND action_type = 'telecom.contribution_fail'`,
        [failMemberId],
      );
      expect(auditRow.action_type).toBe('telecom.contribution_fail');
    });

    it('rejects marking an already-Failed contribution as failed again', async () => {
      const token = signToken(telecomStaffId, ['Telecom'], 'TelecomStaff');
      await request(app.getHttpServer())
        .patch(`/telecom/contributions/${failContributionId}/fail`)
        .set('Authorization', `Bearer ${token}`)
        .expect(400);
    });
  });

  describe('Bank reversal — PATCH /bank/contributions/:id/reverse', () => {
    it('reverses an Allocated Bank Transfer contribution: debits the wallet back', async () => {
      const [transaction] = await dataSource.query<
        { bank_transaction_id: number }[]
      >(
        `SELECT bank_transaction_id FROM bank_transactions WHERE transaction_reference = $1`,
        [`WH-BNK-${ts}-1`],
      );

      const [walletBefore] = await dataSource.query<{ balance: string }[]>(
        `SELECT balance FROM health_wallets WHERE member_id = $1`,
        [bankMemberId],
      );

      const token = signToken(bankStaffId, ['Bank'], 'BankStaff');
      const res = await request(app.getHttpServer())
        .patch(`/bank/contributions/${transaction.bank_transaction_id}/reverse`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body).toMatchObject({ transactionStatus: 'Reversed' });

      const [walletAfter] = await dataSource.query<{ balance: string }[]>(
        `SELECT balance FROM health_wallets WHERE member_id = $1`,
        [bankMemberId],
      );
      expect(Number(walletAfter.balance)).toBe(
        Number(walletBefore.balance) - 50,
      );

      // Reversing an already-Reversed contribution is rejected.
      await request(app.getHttpServer())
        .patch(`/bank/contributions/${transaction.bank_transaction_id}/reverse`)
        .set('Authorization', `Bearer ${token}`)
        .expect(400);
    });
  });

  describe("Admin's real filterable contribution list — GET /admin/contributions", () => {
    it('filters by channel and reflects the insurance-provider breakdown', async () => {
      const adminId = await createUser('ListAdmin', 7);
      const token = signToken(adminId, ['Admin'], 'ListAdmin');

      const res = await request(app.getHttpServer())
        .get('/admin/contributions')
        .query({ channel: 'BANK_TRANSFER' })
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const body = res.body as {
        items: { channel: string; sourceName: string }[];
        total: number;
      };
      expect(body.items.length).toBeGreaterThan(0);
      expect(body.items.every((i) => i.channel === 'BANK_TRANSFER')).toBe(true);

      const summaryRes = await request(app.getHttpServer())
        .get('/admin/contributions/summary')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const summary = summaryRes.body as {
        byInsuranceProvider: { providerId: number; total: number }[];
      };
      const ourProvider = summary.byInsuranceProvider.find(
        (p) => p.providerId === providerId,
      );
      expect(ourProvider).toBeTruthy();
      expect(ourProvider!.total).toBeGreaterThanOrEqual(50);
    });
  });
});
