import { Body, Controller, Get, Post, Res, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';

import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyResetOtpDto } from './dto/verify-reset-otp.dto';
import { CurrentUser } from './decorators/current-user.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import type { AuthenticatedUser } from './jwt.strategy';
import {
  ACCESS_TOKEN_COOKIE_NAME,
  getAccessTokenCookieOptions,
} from './auth-cookie.constants';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // 5/min per IP — brute-force guard on credential checking.
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('login')
  async login(
    @Body() body: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.login(body);

    // passthrough: true means this still gets merged with the return
    // value below (NestJS serializes that as the JSON body as normal)
    // — accessToken stays in that JSON body too, for now, rather than
    // removed outright: every one of the 45+ existing frontend fetch
    // call sites that manually attach it as a Bearer header, plus every
    // e2e spec's signToken-style helper, would otherwise need to change
    // in the same pass as this cookie. The cookie is what actually
    // matters for the browser going forward (see AuthProvider.tsx);
    // the JSON field becomes dead weight once those call sites migrate
    // off it, not before.
    response.cookie(
      ACCESS_TOKEN_COOKIE_NAME,
      result.accessToken,
      getAccessTokenCookieOptions(),
    );

    return result;
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie(
      ACCESS_TOKEN_COOKIE_NAME,
      getAccessTokenCookieOptions(),
    );
    return { message: 'Logged out.' };
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
