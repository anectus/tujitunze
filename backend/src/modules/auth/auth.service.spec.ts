import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { AuthService } from './auth.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { SmsService } from './sms.service';
import { EmailService } from '../email/email.service';

jest.mock('nodemailer');

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: DataSource,
          useValue: {
            manager: {
              findOne: jest.fn(),
            },
          },
        },
        { provide: JwtService, useValue: {} },
        { provide: ConfigService, useValue: {} },
        { provide: AuditLogsService, useValue: {} },
        { provide: SmsService, useValue: {} },
        EmailService,
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('requestPasswordReset — email send failure', () => {
    // Regression test for the gap identified in CLAUDE.md's forgot/reset
    // password section: issueEmailReset() previously left a valid, unused
    // password_reset_tokens row in place if transporter.sendMail() threw,
    // even though the token was never actually delivered to the user.
    it('invalidates the just-created reset token when sendMail() throws, instead of leaving it usable', async () => {
      const sendMail = jest.fn().mockRejectedValue(new Error('boom'));
      (nodemailer.createTransport as jest.Mock).mockReturnValue({ sendMail });

      const transactionManagerUpdate = jest.fn().mockResolvedValue(undefined);
      const transactionManagerSave = jest.fn().mockResolvedValue(undefined);
      const directManagerUpdate = jest.fn().mockResolvedValue(undefined);

      const dataSource = {
        manager: {
          findOne: jest.fn().mockResolvedValue({
            userId: 1,
            email: 'member@example.com',
          }),
          update: directManagerUpdate,
        },
        transaction: jest
          .fn()
          .mockImplementation((cb: (manager: unknown) => unknown) =>
            Promise.resolve(
              cb({
                update: transactionManagerUpdate,
                save: transactionManagerSave,
              }),
            ),
          ),
      };

      const configValues: Record<string, string> = {
        MAIL_HOST: 'smtp.example.com',
        MAIL_PORT: '587',
        MAIL_USER: 'user',
        MAIL_PASSWORD: 'pass',
        MAIL_FROM: 'from@example.com',
        FRONTEND_URL: 'http://localhost:3000',
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          AuthService,
          { provide: DataSource, useValue: dataSource },
          { provide: JwtService, useValue: {} },
          {
            provide: ConfigService,
            useValue: { get: (key: string) => configValues[key] },
          },
          {
            provide: AuditLogsService,
            useValue: { record: jest.fn().mockResolvedValue(undefined) },
          },
          { provide: SmsService, useValue: {} },
          EmailService,
        ],
      }).compile();

      const failingService = module.get<AuthService>(AuthService);

      await expect(
        failingService.requestPasswordReset({
          identifier: 'member@example.com',
        }),
      ).rejects.toThrow(
        'Unable to send the password reset email. Please try again later.',
      );

      expect(sendMail).toHaveBeenCalledTimes(1);
      // The token row created inside the transaction must be invalidated
      // via a follow-up update outside it, keyed by the same tokenHash —
      // not left as a live, usable, never-delivered token.
      expect(directManagerUpdate).toHaveBeenCalledTimes(1);
      const [, where, patch] = directManagerUpdate.mock.calls[0] as [
        unknown,
        { userId: number; tokenHash: string },
        { usedAt: Date },
      ];
      expect(where.userId).toBe(1);
      expect(typeof where.tokenHash).toBe('string');
      expect(where.tokenHash).toHaveLength(64);
      expect(patch.usedAt).toBeInstanceOf(Date);
    });
  });
});
