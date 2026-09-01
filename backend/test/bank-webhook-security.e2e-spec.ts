import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

// Bank's mirror of telecom-webhook-security.e2e-spec.ts. Proves the
// STEP 5 bank webhook security boundary end to end, on top of the
// existing STEP 3 ledger:
//
//   BANK -> BANK API/WEBHOOK -> AUTHENTICATION (BankApiKeyGuard,
//   pre-existing) -> SIGNATURE VERIFICATION -> REPLAY PROTECTION
//   (BankWebhookSignatureGuard, new) -> IDEMPOTENCY -> MEMBER
//   IDENTIFICATION -> CONTRIBUTION -> INSURANCE ALLOCATION -> AUDIT LOG
//   (BankService.handleTransactionWebhook, pre-existing, now signature-
//   aware).
//
// This is a sandbox exercise of the real production code path — the
// signing secret is generated for real via POST /bank/profile/webhook
// (the same endpoint a real bank integration would call), not a
// fake/stubbed value. No real bank credentials exist in this
// environment, so no live money movement is being claimed — see the
// SANDBOX ADAPTER NOTE on BankWebhooksController.
describe('Bank webhook security — signature & replay (e2e)', () => {
  let app: INestApplication<App>;
  let jwtService: JwtService;
  let dataSource: DataSource;

  const ts = Date.now().toString();
  const createdUserIds: number[] = [];
  const createdBankAccountIds: number[] = [];

  const nida = (i: number) =>
    `${ts.slice(0, 8)}-${ts.slice(8, 13)}-${String(i).padStart(5, '0')}-06`;

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

  let bankId: number;
  let bankStaffId: number;
  let memberId: number;
  let accountNumber: string;

  let rawApiKey: string;
  let originalApiKeyHash: string | null;
  let originalWebhookState: {
    webhook_url: string | null;
    webhook_secret: string | null;
    webhook_secret_generated_at: Date | null;
  };
  let webhookSecret: string;

  const buildSignatureHeader = (
    payload: Record<string, unknown>,
    secret: string = webhookSecret,
    timestampMs: number = Date.now(),
  ) => {
    const rawBody = JSON.stringify(payload);
    const hmac = crypto
      .createHmac('sha256', secret)
      .update(`${timestampMs}.${rawBody}`)
      .digest('hex');
    return `t=${timestampMs},v1=${hmac}`;
  };

  const sendWebhook = (
    payload: Record<string, unknown>,
    signatureHeader?: string,
  ) => {
    const req = request(app.getHttpServer())
      .post('/bank/webhooks/transaction')
      .set('X-API-Key', rawApiKey);
    if (signatureHeader) {
      req.set('X-Bank-Signature', signatureHeader);
    }
    return req.send(payload);
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    // rawBody: true is required for BankWebhookSignatureGuard to see the
    // exact bytes the HMAC in these tests is computed over.
    app = moduleFixture.createNestApplication({ rawBody: true });
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

    const [bank] = await dataSource.query<{ bank_id: number }[]>(
      `SELECT bank_id FROM banks LIMIT 1`,
    );
    bankId = bank.bank_id;

    bankStaffId = await createUser('BankWebhookSecStaff', 1, {
      bank_id: bankId,
    });

    memberId = await createUser('BankWebhookSecMember', 2);
    accountNumber = `ACC-SEC-${ts}`;
    const [account] = await dataSource.query<
      { member_bank_account_id: number }[]
    >(
      `INSERT INTO member_bank_accounts (member_id, bank_id, account_number, account_holder_name, account_status, verification_status)
       VALUES ($1, $2, $3, 'Bank Webhook Sec E2E', 'Active', 'Verified') RETURNING member_bank_account_id`,
      [memberId, bankId, accountNumber],
    );
    createdBankAccountIds.push(account.member_bank_account_id);

    const [{ api_key_hash: origHash }] = await dataSource.query<
      { api_key_hash: string | null }[]
    >(`SELECT api_key_hash FROM banks WHERE bank_id = $1`, [bankId]);
    originalApiKeyHash = origHash;
    rawApiKey = `bk_e2e_sig_${crypto.randomBytes(12).toString('hex')}`;
    await dataSource.query(
      `UPDATE banks SET api_key_hash = $2, status = 'Active' WHERE bank_id = $1`,
      [bankId, await bcrypt.hash(rawApiKey, 12)],
    );

    const [origWebhook] = await dataSource.query<
      {
        webhook_url: string | null;
        webhook_secret: string | null;
        webhook_secret_generated_at: Date | null;
      }[]
    >(
      `SELECT webhook_url, webhook_secret, webhook_secret_generated_at FROM banks WHERE bank_id = $1`,
      [bankId],
    );
    originalWebhookState = origWebhook;

    // Configure the webhook secret through the REAL staff-facing endpoint
    // — exactly what a real bank integration would call — rather than
    // writing the secret directly into the DB.
    const staffToken = signToken(bankStaffId, ['Bank'], 'BankWebhookSecStaff');
    const configureRes = await request(app.getHttpServer())
      .post('/bank/profile/webhook')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ webhookUrl: `https://bank-e2e-${ts}.example.com/hooks` })
      .expect(201);

    webhookSecret = (configureRes.body as { webhookSecret: string })
      .webhookSecret;
    expect(webhookSecret).toBeTruthy();
  });

  afterAll(async () => {
    await dataSource.query(
      `DELETE FROM wallet_transactions WHERE wallet_id IN (SELECT wallet_id FROM health_wallets WHERE member_id = ANY($1))`,
      [createdUserIds],
    );
    await dataSource.query(
      `DELETE FROM health_wallets WHERE member_id = ANY($1)`,
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
      `DELETE FROM member_bank_accounts WHERE member_bank_account_id = ANY($1)`,
      [createdBankAccountIds],
    );
    await dataSource.query(`DELETE FROM users WHERE user_id = ANY($1)`, [
      createdUserIds,
    ]);
    await dataSource.query(
      `UPDATE banks
       SET api_key_hash = $2, webhook_url = $3, webhook_secret = $4, webhook_secret_generated_at = $5
       WHERE bank_id = $1`,
      [
        bankId,
        originalApiKeyHash,
        originalWebhookState.webhook_url,
        originalWebhookState.webhook_secret,
        originalWebhookState.webhook_secret_generated_at,
      ],
    );
    await app.close();
  });

  it('1. valid bank transaction: authenticated + correctly signed + fresh -> creates a real, traceable contribution', async () => {
    const payload = {
      bankId,
      accountNumber,
      transactionAmount: 12500,
      transactionType: 'Bank Transfer',
      externalTransactionId: `BWHSEC-${ts}-valid`,
    };
    const res = await sendWebhook(
      payload,
      buildSignatureHeader(payload),
    ).expect(201);

    expect(res.body).toMatchObject({
      duplicate: false,
      contributionCreated: true,
      signatureVerified: true,
    });

    const [wallet] = await dataSource.query<{ balance: string }[]>(
      `SELECT balance FROM health_wallets WHERE member_id = $1`,
      [memberId],
    );
    expect(Number(wallet.balance)).toBe(50); // 0.4% of 12500

    const [auditRow] = await dataSource.query<{ action_type: string }[]>(
      `SELECT action_type FROM audit_logs
       WHERE member_id = $1 AND action_type = 'bank.webhook_transaction'`,
      [memberId],
    );
    expect(auditRow.action_type).toBe('bank.webhook_transaction');
  });

  it('2. duplicate transaction: redelivering the same externalTransactionId (even freshly re-signed) does not create a second transaction', async () => {
    const payload = {
      bankId,
      accountNumber,
      transactionAmount: 12500,
      transactionType: 'Bank Transfer',
      externalTransactionId: `BWHSEC-${ts}-valid`,
    };
    const res = await sendWebhook(
      payload,
      buildSignatureHeader(payload),
    ).expect(201);

    expect(res.body).toMatchObject({ duplicate: true });

    const count = await dataSource.query<{ count: number }[]>(
      `SELECT COUNT(*)::int AS count FROM bank_transactions WHERE transaction_reference = $1`,
      [`BWHSEC-${ts}-valid`],
    );
    expect(count[0].count).toBe(1);

    const [wallet] = await dataSource.query<{ balance: string }[]>(
      `SELECT balance FROM health_wallets WHERE member_id = $1`,
      [memberId],
    );
    expect(Number(wallet.balance)).toBe(50); // unchanged
  });

  it('3. invalid signature: wrong secret is rejected before any DB write', async () => {
    const payload = {
      bankId,
      accountNumber,
      transactionAmount: 1000,
      transactionType: 'Bank Transfer',
      externalTransactionId: `BWHSEC-${ts}-badsig`,
    };
    await sendWebhook(
      payload,
      buildSignatureHeader(payload, 'wrong-secret-entirely'),
    ).expect(401);

    const count = await dataSource.query<{ count: number }[]>(
      `SELECT COUNT(*)::int AS count FROM bank_transactions WHERE transaction_reference = $1`,
      [`BWHSEC-${ts}-badsig`],
    );
    expect(count[0].count).toBe(0);
  });

  it('4. replay: a validly-signed but stale (>5 min old) timestamp is rejected', async () => {
    const payload = {
      bankId,
      accountNumber,
      transactionAmount: 1000,
      transactionType: 'Bank Transfer',
      externalTransactionId: `BWHSEC-${ts}-replay`,
    };
    const staleTimestamp = Date.now() - 10 * 60 * 1000; // 10 minutes ago
    await sendWebhook(
      payload,
      buildSignatureHeader(payload, webhookSecret, staleTimestamp),
    ).expect(401);

    const count = await dataSource.query<{ count: number }[]>(
      `SELECT COUNT(*)::int AS count FROM bank_transactions WHERE transaction_reference = $1`,
      [`BWHSEC-${ts}-replay`],
    );
    expect(count[0].count).toBe(0);
  });

  it('5. unknown member: a correctly-signed request for an account number this bank has no member for is rejected', async () => {
    const payload = {
      bankId,
      accountNumber: 'ACC-DOES-NOT-EXIST-SEC',
      transactionAmount: 1000,
      transactionType: 'Bank Transfer',
      externalTransactionId: `BWHSEC-${ts}-unknownmember`,
    };
    await sendWebhook(payload, buildSignatureHeader(payload)).expect(404);
  });

  it('6. invalid amount: a correctly-signed but non-positive amount is rejected by DTO validation', async () => {
    const payload = {
      bankId,
      accountNumber,
      transactionAmount: -50,
      transactionType: 'Bank Transfer',
      externalTransactionId: `BWHSEC-${ts}-badamount`,
    };
    await sendWebhook(payload, buildSignatureHeader(payload)).expect(400);
  });

  it('still accepts an unsigned call from a bank that has never configured a webhook secret (signature is "where supported", not mandatory day one)', async () => {
    const [otherBank] = await dataSource.query<{ bank_id: number }[]>(
      `SELECT bank_id FROM banks WHERE bank_id != $1 LIMIT 1`,
      [bankId],
    );
    if (!otherBank) {
      return; // only one bank seeded in this environment — nothing to assert
    }

    const [{ api_key_hash: otherOrigHash }] = await dataSource.query<
      { api_key_hash: string | null }[]
    >(`SELECT api_key_hash FROM banks WHERE bank_id = $1`, [otherBank.bank_id]);
    const otherRawKey = `bk_e2e_nosig_${crypto.randomBytes(12).toString('hex')}`;
    await dataSource.query(
      `UPDATE banks SET api_key_hash = $2, status = 'Active' WHERE bank_id = $1`,
      [otherBank.bank_id, await bcrypt.hash(otherRawKey, 12)],
    );

    const otherMemberId = await createUser('NoSigBankMember', 3);
    const otherAccountNumber = `ACC-SEC-NOSIG-${ts}`;
    const [otherAccount] = await dataSource.query<
      { member_bank_account_id: number }[]
    >(
      `INSERT INTO member_bank_accounts (member_id, bank_id, account_number, account_holder_name, account_status, verification_status)
       VALUES ($1, $2, $3, 'No Sig E2E', 'Active', 'Verified') RETURNING member_bank_account_id`,
      [otherMemberId, otherBank.bank_id, otherAccountNumber],
    );
    createdBankAccountIds.push(otherAccount.member_bank_account_id);

    const res = await request(app.getHttpServer())
      .post('/bank/webhooks/transaction')
      .set('X-API-Key', otherRawKey)
      .send({
        bankId: otherBank.bank_id,
        accountNumber: otherAccountNumber,
        transactionAmount: 1000,
        transactionType: 'Bank Transfer',
        externalTransactionId: `BWHSEC-${ts}-nosig`,
      })
      .expect(201);

    expect(res.body).toMatchObject({
      contributionCreated: true,
      signatureVerified: false,
    });

    await dataSource.query(
      `UPDATE banks SET api_key_hash = $2 WHERE bank_id = $1`,
      [otherBank.bank_id, otherOrigHash],
    );
  });
});
