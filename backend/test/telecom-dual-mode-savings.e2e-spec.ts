import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

// Proves the full webhook -> wallet -> ledger chain for both principles
// of the dual-mode micro-savings engine (migration 0025 + the
// 2026-09-02 audit-remediation pass), end to end against a running app
// — not just the existing unit specs' mocked repositories. Follows the
// exact setup pattern telecom-webhook-security.e2e-spec.ts already
// established (real webhook secret issued via the staff endpoint, real
// HMAC signing, useGlobalPipes to match main.ts).
describe('Telecom dual-mode micro-savings — webhook to wallet to ledger (e2e)', () => {
  let app: INestApplication<App>;
  let jwtService: JwtService;
  let dataSource: DataSource;

  const ts = Date.now().toString();
  const createdUserIds: number[] = [];
  const createdPhoneIds: number[] = [];

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
    path: 'resource-conversion' | 'outgoing-transaction',
    payload: Record<string, unknown>,
  ) =>
    request(app.getHttpServer())
      .post(`/telecom/webhooks/${path}`)
      .set('X-API-Key', rawApiKey)
      .set('X-Telecom-Signature', buildSignatureHeader(payload))
      .send(payload);

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

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

    // Picks the LAST non-Vodacom operator (not the first) so this spec's
    // api_key_hash/webhook_secret mutations don't race against
    // contribution-channels.e2e-spec.ts and telecom-webhook-security.
    // e2e-spec.ts, which both claim the FIRST one — Jest runs spec files
    // in parallel workers by default, and all three mutating the same
    // row concurrently was an intermittent pre-existing flake this
    // avoids rather than fixes at its root.
    const [operator] = await dataSource.query<{ operator_id: number }[]>(
      `SELECT operator_id FROM telecom_operators WHERE operator_name != 'Vodacom' ORDER BY operator_id DESC LIMIT 1`,
    );
    operatorId = operator.operator_id;

    telecomStaffId = await createUser('DualModeStaff', 1, {
      telecom_operator_id: operatorId,
    });

    memberId = await createUser('DualModeMember', 2);
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
    rawApiKey = `tk_e2e_dualmode_${crypto.randomBytes(12).toString('hex')}`;
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

    const staffToken = signToken(telecomStaffId, ['Telecom'], 'DualModeStaff');
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
      `DELETE FROM saving_ledger WHERE member_id = ANY($1)`,
      [createdUserIds],
    );
    // telecom_resource_usage_splits / outgoing_transaction_savings cascade
    // from these deletes (event_id FK is ON DELETE CASCADE — see migration
    // 0028).
    await dataSource.query(
      `DELETE FROM telecom_resource_conversion_events WHERE member_id = ANY($1)`,
      [createdUserIds],
    );
    await dataSource.query(
      `DELETE FROM telecom_outgoing_transaction_events WHERE member_id = ANY($1)`,
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
      `DELETE FROM notifications WHERE member_id = ANY($1)`,
      [createdUserIds],
    );
    await dataSource.query(`DELETE FROM audit_logs WHERE member_id = ANY($1)`, [
      createdUserIds,
    ]);
    await dataSource.query(
      `DELETE FROM member_saving_consents WHERE member_id = ANY($1)`,
      [createdUserIds],
    );
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

  it('Principle 1 happy path: resource-conversion webhook credits the wallet and writes one saving_ledger row', async () => {
    const payload = {
      operatorId,
      phoneNumber,
      resourceType: 'VOICE',
      grossUnits: 100,
      unit: 'MINUTES',
      conversionTimestamp: new Date().toISOString(),
      externalTransactionId: `RSC-E2E-${ts}-1`,
      providerUnitValueTzs: 5,
    };

    const res = await sendWebhook('resource-conversion', payload).expect(201);

    expect(res.body).toMatchObject({
      duplicate: false,
      matched: true,
      status: 'SUCCESSFUL',
      netUnitsToCustomer: 90, // 10% VOICE rate
    });

    const [wallet] = await dataSource.query<{ balance: string }[]>(
      `SELECT balance FROM health_wallets WHERE member_id = $1`,
      [memberId],
    );
    expect(Number(wallet.balance)).toBe(50); // 10 saved minutes * 5 TZS/min

    const [conversion] = await dataSource.query<
      { status: string; net_units_to_customer: string }[]
    >(
      `SELECT s.status, s.net_units_to_customer
       FROM telecom_resource_conversion_events e
       JOIN telecom_resource_usage_splits s ON s.event_id = e.event_id
       WHERE e.external_transaction_id = $1`,
      [payload.externalTransactionId],
    );
    expect(conversion.status).toBe('SUCCESSFUL');
    expect(Number(conversion.net_units_to_customer)).toBe(90);

    const [ledgerRow] = await dataSource.query<
      { principle: string; saved_value_tzs: string }[]
    >(
      `SELECT principle, saved_value_tzs FROM saving_ledger
       WHERE member_id = $1 AND source_table = 'telecom_resource_conversion_events'`,
      [memberId],
    );
    expect(ledgerRow.principle).toBe('RESOURCE_CONVERSION');
    expect(Number(ledgerRow.saved_value_tzs)).toBe(50);
  });

  it('Principle 1 opted-out: a member who has opted out keeps the full gross amount and nothing is credited', async () => {
    await dataSource.query(
      `INSERT INTO member_saving_consents (member_id, consented) VALUES ($1, FALSE)`,
      [memberId],
    );

    const payload = {
      operatorId,
      phoneNumber,
      resourceType: 'DATA',
      grossUnits: 200,
      unit: 'MB',
      conversionTimestamp: new Date().toISOString(),
      externalTransactionId: `RSC-E2E-${ts}-optout`,
      providerUnitValueTzs: 2,
    };

    const res = await sendWebhook('resource-conversion', payload).expect(201);

    expect(res.body).toMatchObject({
      status: 'OPTED_OUT',
      netUnitsToCustomer: 200,
    });

    const [conversion] = await dataSource.query<
      { status: string; saved_units: string; net_units_to_customer: string }[]
    >(
      `SELECT s.status, s.saved_units, s.net_units_to_customer
       FROM telecom_resource_conversion_events e
       JOIN telecom_resource_usage_splits s ON s.event_id = e.event_id
       WHERE e.external_transaction_id = $1`,
      [payload.externalTransactionId],
    );
    expect(conversion.status).toBe('OPTED_OUT');
    expect(Number(conversion.saved_units)).toBe(0);
    expect(Number(conversion.net_units_to_customer)).toBe(200);

    const [wallet] = await dataSource.query<{ balance: string }[]>(
      `SELECT balance FROM health_wallets WHERE member_id = $1`,
      [memberId],
    );
    expect(Number(wallet.balance)).toBe(50); // unchanged from the prior test

    await dataSource.query(
      `DELETE FROM member_saving_consents WHERE member_id = $1`,
      [memberId],
    );
  });

  it('Principle 2 SKIPPED: an inactive-rule transaction type (TUMA, seeded is_active=FALSE) is persisted with status SKIPPED, not dropped', async () => {
    const payload = {
      operatorId,
      phoneNumber,
      transactionType: 'TUMA',
      grossAmountTzs: 10000,
      transactionTimestamp: new Date().toISOString(),
      externalTransactionId: `DIV-E2E-${ts}-skipped`,
    };

    const res = await sendWebhook('outgoing-transaction', payload).expect(201);
    const body = res.body as {
      duplicate: boolean;
      status: string;
      diversion: unknown;
    };

    expect(body).toMatchObject({ duplicate: false, status: 'SKIPPED' });
    expect(body.diversion).toBeTruthy();

    const [diversion] = await dataSource.query<
      { status: string; member_id: number | null }[]
    >(
      `SELECT s.status, e.member_id
       FROM telecom_outgoing_transaction_events e
       JOIN outgoing_transaction_savings s ON s.event_id = e.event_id
       WHERE e.external_transaction_id = $1`,
      [payload.externalTransactionId],
    );
    expect(diversion.status).toBe('SKIPPED');
    expect(diversion.member_id).toBe(memberId);

    const [wallet] = await dataSource.query<{ balance: string }[]>(
      `SELECT balance FROM health_wallets WHERE member_id = $1`,
      [memberId],
    );
    expect(Number(wallet.balance)).toBe(50); // unchanged — nothing credited
  });

  it('Principle 2 duplicate: redelivering the same SKIPPED external id returns duplicate:true without a second row', async () => {
    const payload = {
      operatorId,
      phoneNumber,
      transactionType: 'TUMA',
      grossAmountTzs: 10000,
      transactionTimestamp: new Date().toISOString(),
      externalTransactionId: `DIV-E2E-${ts}-skipped`,
    };

    const res = await sendWebhook('outgoing-transaction', payload).expect(201);
    expect(res.body).toMatchObject({ duplicate: true });

    const count = await dataSource.query<{ count: number }[]>(
      `SELECT COUNT(*)::int AS count FROM telecom_outgoing_transaction_events WHERE external_transaction_id = $1`,
      [payload.externalTransactionId],
    );
    expect(count[0].count).toBe(1);
  });
});
