import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  constructor(private readonly configService: ConfigService) {}

  async sendPasswordResetOtp(phoneNumber: string, otp: string): Promise<void> {
    const provider = this.configService
      .get<string>('SMS_PROVIDER')
      ?.trim()
      .toLowerCase();

    if (provider !== 'africastalking') {
      throw new ServiceUnavailableException(
        'Password reset SMS service is not configured.',
      );
    }

    const apiUrl = this.configService.get<string>('SMS_API_URL');
    const username = this.configService.get<string>('SMS_USERNAME');
    const apiKey = this.configService.get<string>('SMS_API_KEY');
    const senderId = this.configService.get<string>('SMS_SENDER_ID');

    if (!apiUrl || !username || !apiKey || !senderId) {
      throw new ServiceUnavailableException(
        'Password reset SMS service is not configured.',
      );
    }

    const message = `TUJITUNZE: Your password reset verification code is ${otp}. This code expires in 10 minutes. Do not share this code with anyone.`;

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
          apiKey,
        },
        body: new URLSearchParams({
          username,
          to: phoneNumber,
          message,
          from: senderId,
        }),
      });

      if (!response.ok) {
        throw new Error(`SMS provider returned HTTP ${response.status}`);
      }
    } catch (error) {
      this.logger.error(
        'Password reset SMS could not be sent.',
        error instanceof Error ? error.message : 'Unknown SMS provider error',
      );
      throw new ServiceUnavailableException(
        'Unable to send the password reset code. Please try again later.',
      );
    }
  }
}
