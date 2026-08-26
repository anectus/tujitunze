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
import * as nodemailer from 'nodemailer';
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

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly auditLogsService: AuditLogsService,
    private readonly smsService: SmsService,
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
    const mailConfig = this.getMailConfig();
    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 20 * 60 * 1000);

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
      const transporter = nodemailer.createTransport({
        host: mailConfig.host,
        port: mailConfig.port,
        secure: mailConfig.port === 465,
        auth: { user: mailConfig.username, pass: mailConfig.password },
      });
      const info = await transporter.sendMail({
        from: mailConfig.from,
        to: recipient,
        subject: 'Reset your Tujitunze password',
        text: `We received a request to reset your Tujitunze password.\n\nReset your password here: ${mailConfig.frontendUrl}/reset-password?token=${rawToken}\n\nThis link expires in 20 minutes and can only be used once. If you did not request this, you can safely ignore this email.`,
      });
      this.logger.log(
        `EMAIL RESET: sendMail messageId=${info.messageId} accepted=${JSON.stringify(info.accepted)} rejected=${JSON.stringify(info.rejected)} response=${info.response}`,
      );
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
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
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

  private getMailConfig(): {
    host: string;
    port: number;
    username: string;
    password: string;
    from: string;
    frontendUrl: string;
  } {
    const host =
      this.configService.get<string>('MAIL_HOST') ??
      this.configService.get<string>('SMTP_HOST');
    const username =
      this.configService.get<string>('MAIL_USER') ??
      this.configService.get<string>('SMTP_USERNAME');
    const password =
      this.configService.get<string>('MAIL_PASSWORD') ??
      this.configService.get<string>('SMTP_PASSWORD');
    const from =
      this.configService.get<string>('MAIL_FROM') ??
      this.configService.get<string>('SMTP_FROM');
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    const configuredPort =
      this.configService.get<string>('MAIL_PORT') ??
      this.configService.get<string>('SMTP_PORT') ??
      '587';
    const port = Number(configuredPort);

    this.logger.log(
      `EMAIL RESET: SMTP host configured: ${host ? 'YES' : 'NO'}, ` +
        `SMTP port: ${configuredPort}, ` +
        `SMTP username configured: ${username ? 'YES' : 'NO'}, ` +
        `SMTP password configured: ${password ? 'YES' : 'NO'}, ` +
        `SMTP from configured: ${from ? 'YES' : 'NO'}, ` +
        `frontend URL configured: ${frontendUrl ? 'YES' : 'NO'}`,
    );

    if (
      !host ||
      !username ||
      !password ||
      !from ||
      !frontendUrl ||
      !Number.isInteger(port) ||
      port < 1 ||
      port > 65535
    ) {
      throw new ServiceUnavailableException(
        'Password reset email service is not configured.',
      );
    }

    return { host, port, username, password, from, frontendUrl };
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
