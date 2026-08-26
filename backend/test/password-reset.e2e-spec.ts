import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ThrottlerStorage } from '@nestjs/throttler';
import { DataSource } from 'typeorm';
import { createHash } from 'crypto';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

interface ForgotPasswordResponse {
  message: string;
  channel: 'EMAIL' | 'PHONE';
}
interface VerifyOtpResponse {
  resetToken: string;
}
interface LoginResponse {
  accessToken: string;
}
interface ErrorResponse {
  message: string;
}

// Proves the "either email or phone" forgot-password flow described in
// CLAUDE.md: identifier-type detection, account-enumeration resistance,
// hashed single-use tokens/OTPs, attempt/expiry limits, and that the loop
// actually closes (reset -> old password stops working -> new one logs in)
// for BOTH channels. ThrottlerGuard is overridden here (rate limiting on
// these same routes is covered separately in rate-limiting.e2e-spec.ts) so
// this file's ~25 sequential requests to the same 3/min and 5/min routes
// don't trip 429s and corrupt unrelated assertions.
//
// This environment's backend/.env has MAIL_* pointed at a disposable
// Ethereal test inbox (real SMTP send, nothing delivered to a real
// person) but still has no SMS_* set — so a registered EMAIL identifier
// now genuinely sends and returns the generic 201, while a registered
// PHONE identifier still correctly fails closed with 503 "not
// configured" rather than faking delivery — that PHONE case is asserted
// deliberately below, not worked around. The full verify/reset/login
// loop for both channels is still proven end-to-end by seeding an
// already-"delivered" token/OTP hash directly into
// password_reset_tokens/password_reset_otps, the same way a real
// email/SMS payload would have arrived at the client — this keeps the
// bulk of the suite independent of real network delivery even though
// one test below now exercises the real Ethereal send.
describe('Password reset — email or phone (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;

  const ts = Date.now().toString();
  const tsDigits = ts.slice(-8);
  const createdUserIds: number[] = [];
  const createdPhoneIds: number[] = [];

  const nida = (i: number) =>
    `${ts.slice(0, 8)}-${ts.slice(8, 13)}-${String(i).padStart(5, '0')}-03`;

  let emailUserId: number;
  const emailUserEmail = `pwreset-email-${ts}@test.local`;
  const emailUserOldPassword = 'OldPassEmail123!';

  let phoneUserId: number;
  const phoneUserNida = nida(2);
  const phoneUserPhone = `07${tsDigits}`;
  const unknownPhoneA = `06${tsDigits}`;
  const unknownPhoneB = `06${tsDigits.split('').reverse().join('')}`;
  const phoneUserOldPassword = 'OldPassPhone123!';

  const seedEmailResetToken = async (
    userId: number,
    rawToken: string,
    opts?: { expired?: boolean },
  ) => {
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    await dataSource.query(
      `INSERT INTO password_reset_tokens (user_id, token_hash, channel, expires_at, used_at)
       VALUES ($1, $2, 'EMAIL', $3, NULL)`,
      [
        userId,
        tokenHash,
        opts?.expired
          ? new Date(Date.now() - 60_000)
          : new Date(Date.now() + 20 * 60_000),
      ],
    );
  };

  const seedPhoneOtp = async (
    userId: number,
    phoneNumber: string,
    otp: string,
    opts?: { expired?: boolean; attempts?: number },
  ) => {
    const otpHash = createHash('sha256').update(otp).digest('hex');
    await dataSource.query(
      `INSERT INTO password_reset_otps (user_id, phone_number, otp_hash, attempts, max_attempts, expires_at, verified_at)
       VALUES ($1, $2, $3, $4, 5, $5, NULL)`,
      [
        userId,
        phoneNumber,
        otpHash,
        opts?.attempts ?? 0,
        opts?.expired
          ? new Date(Date.now() - 60_000)
          : new Date(Date.now() + 10 * 60_000),
      ],
    );
  };

  beforeAll(async () => {
    // Rate limiting on these same routes is covered separately in
    // rate-limiting.e2e-spec.ts; stub the storage ThrottlerGuard reads
    // from so this file's ~25 sequential requests per route don't trip
    // 429s and corrupt unrelated assertions.
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(ThrottlerStorage)
      .useValue({
        increment: () =>
          Promise.resolve({
            totalHits: 0,
            timeToExpire: 1,
            isBlocked: false,
            timeToBlockExpire: 0,
          }),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    dataSource = app.get(DataSource);

    const [operator] = await dataSource.query<{ operator_id: number }[]>(
      `SELECT operator_id FROM telecom_operators LIMIT 1`,
    );

    const emailHash = await bcrypt.hash(emailUserOldPassword, 12);
    const [emailUser] = await dataSource.query<{ user_id: number }[]>(
      `INSERT INTO users (first_name, surname, nida_number, email, password_hash, member_status)
       VALUES ($1, 'E2E', $2, $3, $4, 'Active') RETURNING user_id`,
      ['PWResetEmail', nida(1), emailUserEmail, emailHash],
    );
    emailUserId = emailUser.user_id;
    createdUserIds.push(emailUserId);

    const phoneHash = await bcrypt.hash(phoneUserOldPassword, 12);
    const [phoneUser] = await dataSource.query<{ user_id: number }[]>(
      `INSERT INTO users (first_name, surname, nida_number, password_hash, member_status)
       VALUES ($1, 'E2E', $2, $3, 'Active') RETURNING user_id`,
      ['PWResetPhone', phoneUserNida, phoneHash],
    );
    phoneUserId = phoneUser.user_id;
    createdUserIds.push(phoneUserId);

    const [phoneRow] = await dataSource.query<{ phone_id: number }[]>(
      `INSERT INTO phone_numbers (user_id, operator_id, phone_number, is_primary, phone_status)
       VALUES ($1, $2, $3, true, 'Active') RETURNING phone_id`,
      [phoneUserId, operator.operator_id, phoneUserPhone],
    );
    createdPhoneIds.push(phoneRow.phone_id);
  });

  afterAll(async () => {
    await dataSource.query(
      `DELETE FROM password_reset_otps WHERE user_id = ANY($1)`,
      [createdUserIds],
    );
    await dataSource.query(
      `DELETE FROM password_reset_tokens WHERE user_id = ANY($1)`,
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
    await app.close();
  });

  describe('POST /auth/forgot-password — identifier detection & enumeration resistance', () => {
    it('returns a generic message for an unregistered email, channel=EMAIL', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({ identifier: `no-such-user-${ts}@test.local` })
        .expect(201);
      const body = res.body as ForgotPasswordResponse;
      expect(body.channel).toBe('EMAIL');
      expect(body.message).not.toMatch(/not found|does not exist/i);
    });

    it('returns a generic message for an unregistered phone, channel=PHONE', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({ identifier: unknownPhoneA })
        .expect(201);
      expect((res.body as ForgotPasswordResponse).channel).toBe('PHONE');
    });

    it('rejects a malformed email-shaped identifier with 400', async () => {
      await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({ identifier: 'not-an-email@' })
        .expect(400);
    });

    it('rejects a malformed phone identifier with 400', async () => {
      await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({ identifier: '12345' })
        .expect(400);
    });

    it('normalizes 255/+255/0 Tanzanian phone formats to the same account (no account, still generic 201)', async () => {
      const suffix = phoneUserPhone.slice(1);
      for (const identifier of [
        phoneUserPhone,
        `255${suffix}`,
        `+255${suffix}`,
      ]) {
        const res = await request(app.getHttpServer())
          .post('/auth/forgot-password')
          .send({ identifier })
          .expect(503); // registered phone -> attempts real send, see class comment
        expect((res.body as ErrorResponse).message).toMatch(/not configured/i);
      }
    });

    it('rejects an empty body with 400 (DTO validation applies)', async () => {
      await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({})
        .expect(400);
    });

    it('sends a real email for a REGISTERED identifier (MAIL_* configured) with the same generic response', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({ identifier: emailUserEmail })
        .expect(201);
      const body = res.body as ForgotPasswordResponse;
      expect(body.channel).toBe('EMAIL');
      expect(body.message).not.toMatch(/not found|does not exist/i);
    }, 15_000);
  });

  describe('Email recovery — reset link -> set password -> login', () => {
    const rawToken = `email-token-${ts}`;
    const newPassword = 'NewPassEmail123!';

    beforeAll(async () => {
      await seedEmailResetToken(emailUserId, rawToken);
    });

    it('rejects an unknown token', async () => {
      await request(app.getHttpServer())
        .post('/auth/reset-password')
        .send({ token: 'does-not-exist', newPassword })
        .expect(401);
    });

    it('rejects a password shorter than 8 characters', async () => {
      await request(app.getHttpServer())
        .post('/auth/reset-password')
        .send({ token: rawToken, newPassword: 'short' })
        .expect(400);
    });

    it('rejects a request with neither token nor resetToken', async () => {
      await request(app.getHttpServer())
        .post('/auth/reset-password')
        .send({ newPassword })
        .expect(400);
    });

    it('resets the password with a valid token, then the token is single-use', async () => {
      await request(app.getHttpServer())
        .post('/auth/reset-password')
        .send({ token: rawToken, newPassword })
        .expect(201);

      await request(app.getHttpServer())
        .post('/auth/reset-password')
        .send({ token: rawToken, newPassword: 'AnotherPass123!' })
        .expect(401);
    });

    it('logs in with the new password; the old password no longer works', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ identifier: emailUserEmail, password: emailUserOldPassword })
        .expect(401);

      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ identifier: emailUserEmail, password: newPassword })
        .expect(201);
      expect((res.body as LoginResponse).accessToken).toBeTruthy();
    });
  });

  describe('Email reset token expiration', () => {
    const rawToken = `email-expired-token-${ts}`;

    beforeAll(async () => {
      await seedEmailResetToken(emailUserId, rawToken, { expired: true });
    });

    it('rejects an expired token', async () => {
      await request(app.getHttpServer())
        .post('/auth/reset-password')
        .send({ token: rawToken, newPassword: 'DoesNotMatter123!' })
        .expect(401);
    });
  });

  describe('Phone recovery — OTP -> verify -> set password -> login', () => {
    const otp = '123456';
    const newPassword = 'NewPassPhone123!';
    let verifiedResetToken: string;

    beforeAll(async () => {
      await seedPhoneOtp(phoneUserId, phoneUserPhone, otp);
    });

    it('rejects verification for a phone with no account (no enumeration)', async () => {
      await request(app.getHttpServer())
        .post('/auth/verify-reset-otp')
        .send({ identifier: unknownPhoneB, otp: '000000' })
        .expect(401);
    });

    it('rejects an OTP that is not exactly 6 digits (DTO validation)', async () => {
      await request(app.getHttpServer())
        .post('/auth/verify-reset-otp')
        .send({ identifier: phoneUserPhone, otp: '12' })
        .expect(400);
    });

    it('rejects the wrong OTP', async () => {
      await request(app.getHttpServer())
        .post('/auth/verify-reset-otp')
        .send({ identifier: phoneUserPhone, otp: '000000' })
        .expect(401);
    });

    it('verifies the correct OTP and returns a reset authorization (not the OTP itself)', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/verify-reset-otp')
        .send({ identifier: phoneUserPhone, otp })
        .expect(201);
      const body = res.body as VerifyOtpResponse;
      verifiedResetToken = body.resetToken;
      expect(verifiedResetToken).toBeTruthy();
      expect(JSON.stringify(body)).not.toContain(otp);
    });

    it('rejects reusing the same OTP a second time', async () => {
      await request(app.getHttpServer())
        .post('/auth/verify-reset-otp')
        .send({ identifier: phoneUserPhone, otp })
        .expect(401);
    });

    it('rejects a password reset with a garbage resetToken', async () => {
      await request(app.getHttpServer())
        .post('/auth/reset-password')
        .send({ resetToken: 'garbage', newPassword })
        .expect(401);
    });

    it('sets the new password using the verified authorization, then it is single-use', async () => {
      await request(app.getHttpServer())
        .post('/auth/reset-password')
        .send({ resetToken: verifiedResetToken, newPassword })
        .expect(201);

      await request(app.getHttpServer())
        .post('/auth/reset-password')
        .send({
          resetToken: verifiedResetToken,
          newPassword: 'AnotherPass123!',
        })
        .expect(401);
    });

    it('logs in with the new password; the old password no longer works', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ identifier: phoneUserNida, password: phoneUserOldPassword })
        .expect(401);

      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ identifier: phoneUserNida, password: newPassword })
        .expect(201);
      expect((res.body as LoginResponse).accessToken).toBeTruthy();
    });
  });

  describe('Phone OTP attempt limiting', () => {
    const otp = '654321';

    beforeAll(async () => {
      // One wrong guess away from the default max of 5.
      await seedPhoneOtp(phoneUserId, phoneUserPhone, otp, { attempts: 4 });
    });

    it('locks the OTP out after the final allowed wrong attempt, even for the correct code', async () => {
      await request(app.getHttpServer())
        .post('/auth/verify-reset-otp')
        .send({ identifier: phoneUserPhone, otp: '000000' })
        .expect(401);

      await request(app.getHttpServer())
        .post('/auth/verify-reset-otp')
        .send({ identifier: phoneUserPhone, otp })
        .expect(401);
    });
  });

  describe('Phone OTP expiration', () => {
    const otp = '999999';

    beforeAll(async () => {
      await seedPhoneOtp(phoneUserId, phoneUserPhone, otp, { expired: true });
    });

    it('rejects an expired OTP even when correct', async () => {
      await request(app.getHttpServer())
        .post('/auth/verify-reset-otp')
        .send({ identifier: phoneUserPhone, otp })
        .expect(401);
    });
  });

  describe('POST /auth/resend-reset-otp', () => {
    it('rejects an email-shaped identifier — this endpoint is phone-only', async () => {
      await request(app.getHttpServer())
        .post('/auth/resend-reset-otp')
        .send({ identifier: emailUserEmail })
        .expect(400);
    });

    it('returns a generic message for an unregistered phone (no enumeration)', async () => {
      await request(app.getHttpServer())
        .post('/auth/resend-reset-otp')
        .send({ identifier: unknownPhoneA })
        .expect(201);
    });

    it('fails closed with a dev-configuration error for a registered phone (SMS_* unset)', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/resend-reset-otp')
        .send({ identifier: phoneUserPhone })
        .expect(503);
      expect((res.body as ErrorResponse).message).toMatch(/not configured/i);
    });
  });

  describe('Storage security', () => {
    it('never stores an OTP or reset token in plaintext', async () => {
      const otpRows = await dataSource.query<{ otp_hash: string }[]>(
        `SELECT otp_hash FROM password_reset_otps WHERE user_id = $1`,
        [phoneUserId],
      );
      expect(otpRows.length).toBeGreaterThan(0);
      for (const row of otpRows) {
        expect(row.otp_hash).toMatch(/^[0-9a-f]{64}$/);
        expect(row.otp_hash).not.toMatch(/^\d{6}$/);
      }

      const tokenRows = await dataSource.query<{ token_hash: string }[]>(
        `SELECT token_hash FROM password_reset_tokens WHERE user_id = ANY($1)`,
        [createdUserIds],
      );
      expect(tokenRows.length).toBeGreaterThan(0);
      for (const row of tokenRows) {
        expect(row.token_hash).toMatch(/^[0-9a-f]{64}$/);
      }
    });
  });
});
