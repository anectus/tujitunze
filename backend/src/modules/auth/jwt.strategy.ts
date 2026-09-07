import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { Request } from 'express';

import { ACCESS_TOKEN_COOKIE_NAME } from './auth-cookie.constants';

export interface JwtPayload {
  sub: number;
  roles: string[];
  firstName: string;
}

export interface AuthenticatedUser {
  userId: number;
  roles: string[];
  firstName: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    // Disable strict-safe checks here: passport-jwt's helpers and ConfigService types
    // cause `@typescript-eslint/no-unsafe-*` false positives in our lint setup.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
    const fromBearerHeader = ExtractJwt.fromAuthHeaderAsBearerToken();
    // The browser frontend now authenticates via the httpOnly cookie
    // login sets (see auth.service.ts/auth.controller.ts) rather than
    // a manually-attached Authorization header. Bearer-header
    // extraction stays as a fallback — every e2e spec in this repo
    // signs a token and sends it as a header, and any future non-
    // browser API client (a script, a partner integration) still needs
    // a way in that doesn't involve cookies at all.
    const fromCookie = (req: Request): string | null =>
      (req?.cookies?.[ACCESS_TOKEN_COOKIE_NAME] as string | undefined) ?? null;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
    const jwtFromRequest = ExtractJwt.fromExtractors([
      fromBearerHeader,
      fromCookie,
    ]);

    const secret = config.getOrThrow<string>('JWT_SECRET');

    /* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment */
    super({
      jwtFromRequest,
      ignoreExpiration: false,
      secretOrKey: secret,
    });
    /* eslint-enable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment */
  }

  validate(payload: JwtPayload): AuthenticatedUser {
    if (!payload?.sub) {
      throw new UnauthorizedException();
    }

    return {
      userId: payload.sub,
      roles: payload.roles ?? [],
      firstName: payload.firstName,
    };
  }
}
