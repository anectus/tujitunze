import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

export interface SendEmailOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
}

interface MailConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  from: string;
}

// Shared SMTP transport for any module that needs to send mail (currently
// AuthService's password-reset flow). MAIL_* is the preferred variable
// prefix; SMTP_* remains supported as an alias — see backend/.env.example.
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly configService: ConfigService) {}

  private getMailConfig(): MailConfig {
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
    const configuredPort =
      this.configService.get<string>('MAIL_PORT') ??
      this.configService.get<string>('SMTP_PORT') ??
      '587';
    const port = Number(configuredPort);

    this.logger.log(
      `EMAIL: host configured: ${host ? 'YES' : 'NO'}, port: ${configuredPort}, ` +
        `username configured: ${username ? 'YES' : 'NO'}, password configured: ${password ? 'YES' : 'NO'}, ` +
        `from configured: ${from ? 'YES' : 'NO'}`,
    );

    if (
      !host ||
      !username ||
      !password ||
      !from ||
      !Number.isInteger(port) ||
      port < 1 ||
      port > 65535
    ) {
      throw new ServiceUnavailableException('Email service is not configured.');
    }

    return { host, port, username, password, from };
  }

  // Throws ServiceUnavailableException (config missing) or whatever
  // nodemailer throws (transport/delivery failure) — callers decide how to
  // handle that (e.g. AuthService invalidates the token it just issued).
  async send(options: SendEmailOptions): Promise<void> {
    const mailConfig = this.getMailConfig();
    const transporter = nodemailer.createTransport({
      host: mailConfig.host,
      port: mailConfig.port,
      secure: mailConfig.port === 465,
      auth: { user: mailConfig.username, pass: mailConfig.password },
    });

    const info = await transporter.sendMail({
      from: mailConfig.from,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });

    this.logger.log(
      `EMAIL: sendMail messageId=${info.messageId} accepted=${JSON.stringify(info.accepted)} rejected=${JSON.stringify(info.rejected)} response=${info.response}`,
    );

    // Only non-empty when the transport is Ethereal's test SMTP service —
    // a no-op against a real provider like Gmail/SendGrid.
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      this.logger.log(
        `EMAIL: this is an Ethereal test inbox — nothing was delivered to a real mailbox. View it here: ${previewUrl}`,
      );
    }
  }
}
