import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { EmailModule } from '../email/email.module';
import { PasswordResetToken } from './entities/password-reset-token.entity';
import { PasswordResetOtp } from './entities/password-reset-otp.entity';
import { SmsService } from './sms.service';

@Module({
  imports: [
    AuditLogsModule,
    EmailModule,
    TypeOrmModule.forFeature([PasswordResetToken, PasswordResetOtp]),
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          // Seconds, not a duration string — @nestjs/jwt's StringValue type
          // only accepts a fixed set of unit suffixes it can't infer from a
          // generic ConfigService string.
          expiresIn: parseInt(
            config.get<string>('JWT_EXPIRES_IN_SECONDS') ?? '3600',
            10,
          ),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, SmsService],
  exports: [JwtModule],
})
export class AuthModule {}
