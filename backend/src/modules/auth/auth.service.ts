import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { IsNull, Not } from 'typeorm';
import { createHash, randomBytes, randomInt } from 'crypto';
import { isEmail } from 'class-validator';

import * as bcrypt from 'bcrypt';

import { User } from '../members/entities/user.entity';
import { PhoneNumber } from '../members/entities/phone-number.entity';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { PasswordResetToken } from './entities/password-reset-token.entity';
import { PasswordResetOtp } from './entities/password-reset-otp.entity';
import { VerifyResetOtpDto } from './dto/verify-reset-otp.dto';
import { SmsService } from './sms.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly auditLogsService: AuditLogsService,
    private readonly smsService: SmsService,
    private readonly emailService: EmailService,
  ) {}

  async requestPasswordReset(
    data: ForgotPasswordDto,
  ): Promise<{ message: string; channel: 'EMAIL' | 'PHONE' }> {
    const identifier = data.identifier.trim();
    const message =
      'If an account exists with that email or phone number, password-reset instructions have been sent.';

    if (identifier.includes('@')) {
      this.logger.log(
        'Forgot password request received. identifier type: EMAIL',
      );
      if (!isEmail(identifier)) {
        throw new BadRequestException(
          'Enter a valid email address or phone number.',
        );
      }
      const user = await this.dataSource.manager.findOne(User, {
        where: { email: identifier.toLowerCase() },
      });
      if (!user || !user.email) {
        this.logger.log(
          'Forgot password request: EMAIL identifier, no matching member — returning generic response without contacting the mail service.',
        );
        return { message, channel: 'EMAIL' };
      }
      this.logger.log(
        'Forgot password request: EMAIL identifier, member found — invoking email reset (issueEmailReset/getMailConfig).',
      );
      await this.issueEmailReset(user);
      return { message, channel: 'EMAIL' };
    }

    this.logger.log('Forgot password request received. identifier type: PHONE');
    const phoneNumber = this.normalizeTanzanianPhone(identifier);
    return this.issuePhoneOtp(phoneNumber, message);
  }

  private async issueEmailReset(user: User): Promise<void> {
    const recipient = user.email;
    this.logger.log(
      `EMAIL RESET: recipient configured: ${recipient ? 'YES' : 'NO'}`,
    );
    if (!recipient) {
      return;
    }
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    if (!frontendUrl) {
      throw new ServiceUnavailableException(
        'Password reset email service is not configured.',
      );
    }
    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    await this.dataSource.transaction(async (manager) => {
      await manager.update(
        PasswordResetToken,
        { userId: user.userId, usedAt: IsNull() },
        { usedAt: new Date() },
      );
      await manager.save(PasswordResetToken, {
        userId: user.userId,
        tokenHash,
        channel: 'EMAIL',
        expiresAt,
        usedAt: null,
      });
      await this.auditLogsService.record(manager, {
        memberId: user.userId,
        actionType: 'member.password_reset_requested',
        affectedTable: 'password_reset_tokens',
        newValue: { channel: 'EMAIL', expiresAt: expiresAt.toISOString() },
      });
    });

    try {
      const resetLink = `${frontendUrl}/reset-password?token=${rawToken}`;
      await this.emailService.send({
        to: recipient,
        subject: 'TUJITUNZE Password Reset',
        text: `You requested to reset your TUJITUNZE password.\n\nReset your password here: ${resetLink}\n\nThis link expires in 30 minutes and can only be used once. If you did not request this, you can safely ignore this email.`,
        html: this.buildPasswordResetEmailHtml(resetLink),
      });
    } catch (error) {
      this.logger.error(
        'Password reset email could not be sent.',
        error instanceof Error ? error.message : 'Unknown mail transport error',
      );
      // Mirrors issuePhoneOtp()'s catch: don't leave a valid, unused reset
      // token sitting in the database if it was never actually delivered.
      await this.dataSource.manager.update(
        PasswordResetToken,
        { userId: user.userId, tokenHash },
        { usedAt: new Date() },
      );
      throw new ServiceUnavailableException(
        'Unable to send the password reset email. Please try again later.',
      );
    }
  }

  // Plain-text (above) stays the primary content for text-only mail
  // clients; this is the HTML companion nodemailer sends alongside it.
  // Never embeds the member's password or the raw token anywhere but the
  // single reset link href.
  private buildPasswordResetEmailHtml(resetLink: string): string {
    return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background-color:#f3f4f6;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6;padding:32px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
            <tr>
              <td style="background-color:#1d4ed8;padding:24px 32px;">
                <span style="color:#ffffff;font-size:20px;font-weight:bold;">TUJITUNZE</span>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <h1 style="margin:0 0 16px;color:#111827;font-size:20px;">Password Reset Request</h1>
                <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6;">
                  You requested to reset your TUJITUNZE password. Click the button below to choose a new one.
                </p>
                <p style="margin:0 0 24px;text-align:center;">
                  <a href="${resetLink}" style="display:inline-block;background-color:#1d4ed8;color:#ffffff;text-decoration:none;font-weight:bold;font-size:15px;padding:12px 28px;border-radius:8px;">
                    Reset Password
                  </a>
                </p>
                <p style="margin:0 0 16px;color:#6b7280;font-size:13px;line-height:1.6;">
                  This link expires in 30 minutes and can only be used once.
                </p>
                <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.6;">
                  If you did not request this, you can safely ignore this email — your password will not be changed.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px;background-color:#f9fafb;border-top:1px solid #e5e7eb;">
                <p style="margin:0;color:#9ca3af;font-size:12px;">
                  TUJITUNZE — Health Savings and Insurance Management System, Tanzania
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
  }

  private async issuePhoneOtp(
    phoneNumber: string,
    message: string,
  ): Promise<{ message: string; channel: 'PHONE' }> {
    const phone = await this.dataSource.manager.findOne(PhoneNumber, {
      where: { phoneNumber },
      relations: { user: true },
    });
    if (!phone?.user) {
      this.logger.log(
        'Forgot password request: PHONE identifier, no matching member — returning generic response without contacting the SMS service.',
      );
      return { message, channel: 'PHONE' };
    }
    this.logger.log(
      'Forgot password request: PHONE identifier, member found — invoking SMS OTP (issuePhoneOtp/SmsService). MAIL_*/getMailConfig is never called on this path.',
    );

    const otp = randomInt(0, 1_000_000).toString().padStart(6, '0');
    const otpHash = createHash('sha256').update(otp).digest('hex');
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await this.dataSource.transaction(async (manager) => {
      await manager.update(
        PasswordResetOtp,
        { userId: phone.user.userId, phoneNumber, verifiedAt: IsNull() },
        { expiresAt: new Date() },
      );
      await manager.update(
        PasswordResetToken,
        { userId: phone.user.userId, usedAt: IsNull() },
        { usedAt: new Date() },
      );
      await manager.save(PasswordResetOtp, {
        userId: phone.user.userId,
        phoneNumber,
        otpHash,
        attempts: 0,
        maxAttempts: 5,
        expiresAt,
        verifiedAt: null,
      });
      await this.auditLogsService.record(manager, {
        memberId: phone.user.userId,
        actionType: 'member.password_reset_otp_requested',
        affectedTable: 'password_reset_otps',
        newValue: { phoneNumber, expiresAt: expiresAt.toISOString() },
      });
    });

    try {
      await this.smsService.sendPasswordResetOtp(phoneNumber, otp);
    } catch (error) {
      await this.dataSource.manager.update(
        PasswordResetOtp,
        { userId: phone.user.userId, otpHash },
        { expiresAt: new Date() },
      );
      throw error;
    }

    return { message, channel: 'PHONE' };
  }

  async verifyResetOtp(
    data: VerifyResetOtpDto,
  ): Promise<{ resetToken: string }> {
    const phoneNumber = this.normalizeTanzanianPhone(data.identifier);
    const phone = await this.dataSource.manager.findOne(PhoneNumber, {
      where: { phoneNumber },
      relations: { user: true },
    });

    if (!phone?.user) {
      throw new UnauthorizedException('Invalid or expired verification code.');
    }

    // Throwing from inside dataSource.transaction()'s callback rolls back
    // everything written in it — including a just-recorded failed
    // attempt. That would silently defeat the attempt limit below (wrong
    // guesses would never actually persist), so failure is signalled by
    // returning a result and throwing after the transaction has
    // committed instead.
    const result = await this.dataSource.transaction(async (manager) => {
      const otpRecord = await manager.findOne(PasswordResetOtp, {
        where: {
          userId: phone.user.userId,
          phoneNumber,
          verifiedAt: IsNull(),
        },
        order: { createdAt: 'DESC' },
        lock: { mode: 'pessimistic_write' },
      });

      if (
        !otpRecord ||
        otpRecord.expiresAt.getTime() <= Date.now() ||
        otpRecord.attempts >= otpRecord.maxAttempts
      ) {
        return { ok: false as const };
      }

      const suppliedHash = createHash('sha256').update(data.otp).digest('hex');
      if (suppliedHash !== otpRecord.otpHash) {
        otpRecord.attempts += 1;
        if (otpRecord.attempts >= otpRecord.maxAttempts) {
          otpRecord.expiresAt = new Date();
        }
        await manager.save(PasswordResetOtp, otpRecord);
        return { ok: false as const };
      }

      otpRecord.verifiedAt = new Date();
      await manager.save(PasswordResetOtp, otpRecord);

      const rawResetToken = randomBytes(32).toString('hex');
      await manager.update(
        PasswordResetToken,
        { userId: phone.user.userId, usedAt: IsNull() },
        { usedAt: new Date() },
      );
      await manager.save(PasswordResetToken, {
        userId: phone.user.userId,
        tokenHash: createHash('sha256').update(rawResetToken).digest('hex'),
        channel: 'PHONE',
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        usedAt: null,
      });

      return { ok: true as const, resetToken: rawResetToken };
    });

    if (!result.ok) {
      throw new UnauthorizedException('Invalid or expired verification code.');
    }

    return { resetToken: result.resetToken };
  }

  async resendResetOtp(
    data: ForgotPasswordDto,
  ): Promise<{ message: string; channel: 'PHONE' }> {
    const identifier = data.identifier.trim();
    if (identifier.includes('@')) {
      throw new BadRequestException('A phone number is required.');
    }
    const phoneNumber = this.normalizeTanzanianPhone(identifier);
    return this.issuePhoneOtp(
      phoneNumber,
      'If an account exists with that phone number, a new verification code has been sent.',
    );
  }

  private normalizeTanzanianPhone(raw: string): string {
    let phoneNumber = raw.trim().replace(/\s+/g, '');

    if (phoneNumber.startsWith('+255')) {
      phoneNumber = '0' + phoneNumber.substring(4);
    } else if (phoneNumber.startsWith('255')) {
      phoneNumber = '0' + phoneNumber.substring(3);
    }

    if (!/^0[67]\d{8}$/.test(phoneNumber)) {
      throw new BadRequestException('Invalid Tanzanian mobile phone number');
    }

    return phoneNumber;
  }

  async resetPassword(data: ResetPasswordDto): Promise<{ message: string }> {
    const resetAuthorization = data.resetToken ?? data.token;
    if (!resetAuthorization) {
      throw new BadRequestException('A valid reset authorization is required.');
    }
    const tokenHash = createHash('sha256')
      .update(resetAuthorization)
      .digest('hex');

    await this.dataSource.transaction(async (manager) => {
      const resetToken = await manager.findOne(PasswordResetToken, {
        where: { tokenHash, usedAt: IsNull() },
        lock: { mode: 'pessimistic_write' },
      });

      if (
        !resetToken ||
        resetToken.usedAt ||
        resetToken.expiresAt.getTime() <= Date.now()
      ) {
        throw new UnauthorizedException(
          'This password reset link is invalid or expired.',
        );
      }

      const user = await manager.findOne(User, {
        where: { userId: resetToken.userId },
      });

      if (!user) {
        throw new UnauthorizedException(
          'This password reset link is invalid or expired.',
        );
      }

      user.passwordHash = await bcrypt.hash(data.newPassword, 12);
      await manager.save(User, user);
      resetToken.usedAt = new Date();
      await manager.save(PasswordResetToken, resetToken);
      await manager.update(
        PasswordResetToken,
        {
          userId: user.userId,
          id: Not(resetToken.id),
          usedAt: IsNull(),
        },
        { usedAt: new Date() },
      );
      await manager.update(
        PasswordResetOtp,
        { userId: user.userId, verifiedAt: IsNull() },
        { expiresAt: new Date() },
      );
      await this.auditLogsService.record(manager, {
        memberId: user.userId,
        actionType: 'member.password_reset',
        affectedTable: 'users',
        affectedRecordId: user.userId,
      });
    });

    return { message: 'Password reset successful. You can now log in.' };
  }

  async login(data: LoginDto) {
    const identifier = data.identifier.trim();

    // NIDA number and email are both unique, so at most one user can
    // match either — no ambiguity like there was matching on surname.
    const user = await this.dataSource.manager.findOne(User, {
      where: [{ nidaNumber: identifier }, { email: identifier.toLowerCase() }],
    });

    const passwordMatches =
      user && (await bcrypt.compare(data.password, user.passwordHash));

    if (!user || !passwordMatches) {
      throw new UnauthorizedException(
        'Invalid NIDA number, email, or password',
      );
    }

    const roleRows = await this.dataSource.manager.query<
      { role_name: string }[]
    >(
      `
      SELECT r.role_name
      FROM member_roles mr
      INNER JOIN roles r ON r.role_id = mr.role_id
      WHERE mr.member_id = $1
      `,
      [user.userId],
    );

    const roles = roleRows.map((row) => row.role_name);

    const accessToken = await this.jwtService.signAsync({
      sub: user.userId,
      roles,
      firstName: user.firstName,
    });

    const { passwordHash: _passwordHash, ...safeUser } = user;

    return {
      message: 'Login successful.',
      accessToken,
      member: { ...safeUser, roles },
    };
  }
}
