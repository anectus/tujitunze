import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

// Proves the STEP 4 telecom webhook security boundary end to end, on top
// of the existing STEP 3 ledger:
//
//   TELECOM -> SECURE WEBHOOK/API -> AUTHENTICATION (TelecomApiKeyGuard,
//   pre-existing) -> SIGNATURE VERIFICATION -> REPLAY PROTECTION
//   (TelecomWebhookSignatureGuard, new) -> IDEMPOTENCY -> MEMBER
//   IDENTIFICATION -> CONTRIBUTION -> INSURANCE ALLOCATION -> AUDIT LOG
//   (TelecomService.handleContributionWebhook, pre-existing, now signature-
//   aware).
//
// This is a sandbox exercise of the real production code path — the
// signing secret is generated for real via POST /telecom/operator/webhook
// (the same endpoint a real operator integration would call), not a
// fake/stubbed value. No real telecom operator credentials exist in this
// environment, so no live money movement is being claimed — see the
// SANDBOX ADAPTER NOTE on TelecomWebhooksController.
describe('Telecom webhook security — signature & replay (e2e)', () => {
  let app: INestApplication<App>;
  let jwtService: JwtService;
  let dataSource: DataSource;

  const ts = Date.now().toString();
  const createdUserIds: number[] = [];
  const createdPhoneIds: number[] = [];

  const nida = (i: number) =>
    `${ts.slice(0, 8)}-${ts.slice(8, 13)}-${String(i).padStart(5, '0')}-05`;

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
  let telecomStaffId: number;
  let memberId: number;
  let phoneNumber: string;

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
      .post('/telecom/webhooks/contribution')
      .set('X-API-Key', rawApiKey);
    if (signatureHeader) {
      req.set('X-Telecom-Signature', signatureHeader);
    }
    return req.send(payload);
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    // rawBody: true is required for TelecomWebhookSignatureGuard to see
    // the exact bytes the HMAC in these tests is computed over.
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

    const [operator] = await dataSource.query<{ operator_id: number }[]>(
      `SELECT operator_id FROM telecom_operators LIMIT 1`,
    );
    operatorId = operator.operator_id;

    telecomStaffId = await createUser('WebhookSecStaff', 1, {
      telecom_operator_id: operatorId,
    });

    memberId = await createUser('WebhookSecMember', 2);
    phoneNumber = `07${ts.slice(-8)}`;
    const [phone] = await dataSource.query<{ phone_id: number }[]>(
      `INSERT INTO phone_numbers (user_id, operator_id, phone_number, is_primary, phone_status)
       VALUES ($1, $2, $3, true, 'Active') RETURNING phone_id`,
      [memberId, operatorId, phoneNumber],
    );
    createdPhoneIds.push(phone.phone_id);

    const [{ api_key_hash: origHash }] = await dataSource.query<
      { api_key_hash: string | null }[]
    >(`SELECT api_key_hash FROM telecom_operators WHERE operator_id = $1`, [
      operatorId,
    ]);
    originalApiKeyHash = origHash;
    rawApiKey = `tk_e2e_sig_${crypto.randomBytes(12).toString('hex')}`;
    await dataSource.query(
      `UPDATE telecom_operators SET api_key_hash = $2, status = 'Active' WHERE operator_id = $1`,
      [operatorId, await bcrypt.hash(rawApiKey, 12)],
    );

    const [origWebhook] = await dataSource.query<
      {
        webhook_url: string | null;
        webhook_secret: string | null;
        webhook_secret_generated_at: Date | null;
      }[]
    >(
      `SELECT webhook_url, webhook_secret, webhook_secret_generated_at FROM telecom_operators WHERE operator_id = $1`,
      [operatorId],
    );
    originalWebhookState = origWebhook;

    // Configure the webhook secret through the REAL staff-facing endpoint
    // — exactly what a real operator integration would call — rather
    // than writing the secret directly into the DB.
    const staffToken = signToken(
      telecomStaffId,
      ['Telecom'],
      'WebhookSecStaff',
    );
    const configureRes = await request(app.getHttpServer())
      .post('/telecom/operator/webhook')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ webhookUrl: `https://operator-e2e-${ts}.example.com/hooks` })
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
      `DELETE FROM telecom_contributions WHERE member_id = ANY($1)`,
      [createdUserIds],
    );
    await dataSource.query(
      `DELETE FROM notifications WHERE member_id = ANY($1)`,
      [createdUserIds],
    );
    await dataSource.query(`DELETE FROM audit_logs WHERE member_id = ANY($1)`, [
      createdUserIds,
    ]);
    await dataSource.query(
      `DELETE FROM phone_numbers WHERE phone_id = ANY($1)`,
      [createdPhoneIds],
    );
    await dataSource.query(`DELETE FROM users WHERE user_id = ANY($1)`, [
      createdUserIds,
    ]);
    await dataSource.query(
      `UPDATE telecom_operators
       SET api_key_hash = $2, webhook_url = $3, webhook_secret = $4, webhook_secret_generated_at = $5
       WHERE operator_id = $1`,
      [
        operatorId,
        originalApiKeyHash,
        originalWebhookState.webhook_url,
        originalWebhookState.webhook_secret,
        originalWebhookState.webhook_secret_generated_at,
      ],
    );
    await app.close();
  });

  it('1. valid transaction: authenticated + correctly signed + fresh -> creates a real, traceable contribution', async () => {
    const payload = {
      operatorId,
      phoneNumber,
      transactionAmount: 4000,
      transactionType: 'Airtime',
      externalTransactionId: `WHSEC-${ts}-valid`,
    };
    const res = await sendWebhook(payload, buildSignatureHeader(payload))
      .expect(201);

    expect(res.body).toMatchObject({
      duplicate: false,
      contributionCreated: true,
      signatureVerified: true,
    });

    const [wallet] = await dataSource.query<{ balance: string }[]>(
      `SELECT balance FROM health_wallets WHERE member_id = $1`,
      [memberId],
    );
    expect(Number(wallet.balance)).toBe(20); // 0.5% of 4000

    const [auditRow] = await dataSource.query<{ action_type: string }[]>(
      `SELECT action_type FROM audit_logs
       WHERE member_id = $1 AND action_type = 'telecom.webhook_contribution'`,
      [memberId],
    );
    expect(auditRow.action_type).toBe('telecom.webhook_contribution');
  });

  it('2. duplicate transaction: redelivering the same externalTransactionId (even freshly re-signed) does not create a second contribution', async () => {
    const payload = {
      operatorId,
      phoneNumber,
      transactionAmount: 4000,
      transactionType: 'Airtime',
      externalTransactionId: `WHSEC-${ts}-valid`,
    };
    const res = await sendWebhook(payload, buildSignatureHeader(payload))
      .expect(201);

    expect(res.body).toMatchObject({ duplicate: true });

    const count = await dataSource.query<{ count: number }[]>(
      `SELECT COUNT(*)::int AS count FROM telecom_contributions WHERE reference_number = $1`,
      [`WHSEC-${ts}-valid`],
    );
    expect(count[0].count).toBe(1);

    const [wallet] = await dataSource.query<{ balance: string }[]>(
      `SELECT balance FROM health_wallets WHERE member_id = $1`,
      [memberId],
    );
    expect(Number(wallet.balance)).toBe(20); // unchanged
  });

  it('3. invalid signature: wrong secret is rejected before any DB write', async () => {
    const payload = {
      operatorId,
      phoneNumber,
      transactionAmount: 1000,
      transactionType: 'Airtime',
      externalTransactionId: `WHSEC-${ts}-badsig`,
    };
    await sendWebhook(
      payload,
      buildSignatureHeader(payload, 'wrong-secret-entirely'),
    ).expect(401);

    const count = await dataSource.query<{ count: number }[]>(
      `SELECT COUNT(*)::int AS count FROM telecom_contributions WHERE reference_number = $1`,
      [`WHSEC-${ts}-badsig`],
    );
    expect(count[0].count).toBe(0);
  });

  it('4. replay: a validly-signed but stale (>5 min old) timestamp is rejected', async () => {
    const payload = {
      operatorId,
      phoneNumber,
      transactionAmount: 1000,
      transactionType: 'Airtime',
      externalTransactionId: `WHSEC-${ts}-replay`,
    };
    const staleTimestamp = Date.now() - 10 * 60 * 1000; // 10 minutes ago
    await sendWebhook(
      payload,
      buildSignatureHeader(payload, webhookSecret, staleTimestamp),
    ).expect(401);

    const count = await dataSource.query<{ count: number }[]>(
      `SELECT COUNT(*)::int AS count FROM telecom_contributions WHERE reference_number = $1`,
      [`WHSEC-${ts}-replay`],
    );
    expect(count[0].count).toBe(0);
  });

  it('5. invalid amount: a correctly-signed but non-positive amount is rejected by DTO validation', async () => {
    const payload = {
      operatorId,
      phoneNumber,
      transactionAmount: -50,
      transactionType: 'Airtime',
      externalTransactionId: `WHSEC-${ts}-badamount`,
    };
    await sendWebhook(payload, buildSignatureHeader(payload)).expect(400);
  });

  it('6. unknown member: a correctly-signed request for a phone number this operator has no member for is rejected', async () => {
    const payload = {
      operatorId,
      phoneNumber: '0791234999',
      transactionAmount: 1000,
      transactionType: 'Airtime',
      externalTransactionId: `WHSEC-${ts}-unknownmember`,
    };
    await sendWebhook(payload, buildSignatureHeader(payload)).expect(404);
  });

  it('7. invalid reference: an empty externalTransactionId is rejected by DTO validation', async () => {
    const payload = {
      operatorId,
      phoneNumber,
      transactionAmount: 1000,
      transactionType: 'Airtime',
      externalTransactionId: '',
    };
    await sendWebhook(payload, buildSignatureHeader(payload)).expect(400);
  });

  it('still accepts an unsigned call from an operator that has never configured a webhook secret (signature is "where supported", not mandatory day one)', async () => {
    const [otherOperator] = await dataSource.query<{ operator_id: number }[]>(
      `SELECT operator_id FROM telecom_operators WHERE operator_id != $1 LIMIT 1`,
      [operatorId],
    );
    if (!otherOperator) {
      return; // only one operator seeded in this environment — nothing to assert
    }

    const [{ api_key_hash: otherOrigHash }] = await dataSource.query<
      { api_key_hash: string | null }[]
    >(
      `SELECT api_key_hash FROM telecom_operators WHERE operator_id = $1`,
      [otherOperator.operator_id],
    );
    const otherRawKey = `tk_e2e_nosig_${crypto.randomBytes(12).toString('hex')}`;
    await dataSource.query(
      `UPDATE telecom_operators SET api_key_hash = $2, status = 'Active' WHERE operator_id = $1`,
      [otherOperator.operator_id, await bcrypt.hash(otherRawKey, 12)],
    );

    const otherMemberId = await createUser('NoSigMember', 3);
    const otherPhone = `07${String(Number(ts.slice(-8)) + 1).padStart(8, '0')}`;
    const [phoneRow] = await dataSource.query<{ phone_id: number }[]>(
      `INSERT INTO phone_numbers (user_id, operator_id, phone_number, is_primary, phone_status)
       VALUES ($1, $2, $3, true, 'Active') RETURNING phone_id`,
      [otherMemberId, otherOperator.operator_id, otherPhone],
    );
    createdPhoneIds.push(phoneRow.phone_id);

    const res = await request(app.getHttpServer())
      .post('/telecom/webhooks/contribution')
      .set('X-API-Key', otherRawKey)
      .send({
        operatorId: otherOperator.operator_id,
        phoneNumber: otherPhone,
        transactionAmount: 1000,
        transactionType: 'Airtime',
        externalTransactionId: `WHSEC-${ts}-nosig`,
      })
      .expect(201);

    expect(res.body).toMatchObject({
      contributionCreated: true,
      signatureVerified: false,
    });

    await dataSource.query(
      `UPDATE telecom_operators SET api_key_hash = $2 WHERE operator_id = $1`,
      [otherOperator.operator_id, otherOrigHash],
    );
  });
});
