import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyResetOtpDto } from './dto/verify-reset-otp.dto';
import { CurrentUser } from './decorators/current-user.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import type { AuthenticatedUser } from './jwt.strategy';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // 5/min per IP — brute-force guard on credential checking.
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('login')
  async login(@Body() body: LoginDto) {
    return this.authService.login(body);
  }

  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @Post('forgot-password')
  async forgotPassword(@Body() body: ForgotPasswordDto) {
    return this.authService.requestPasswordReset(body);
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('verify-reset-otp')
  verifyResetOtp(@Body() body: VerifyResetOtpDto) {
    return this.authService.verifyResetOtp(body);
  }

  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @Post('resend-reset-otp')
  resendResetOtp(@Body() body: ForgotPasswordDto) {
    return this.authService.resendResetOtp(body);
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('reset-password')
  resetPassword(@Body() body: ResetPasswordDto) {
    return this.authService.resetPassword(body);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@CurrentUser() user: AuthenticatedUser) {
    return user;
  }
}
