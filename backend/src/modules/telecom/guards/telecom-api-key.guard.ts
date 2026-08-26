import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import type { Request } from 'express';

// Authenticates an inbound webhook call FROM a telecom operator's own
// system, as opposed to JwtAuthGuard/RolesGuard which authenticate an
// HSIMS staff member's browser session — a fundamentally different
// caller, so a separate guard rather than bending the JWT one to fit.
// Reuses the exact api_key_hash infrastructure TelecomService.
// regenerateApiKey() already writes (bcrypt, one-way, shown once at
// generation) — this guard is the first thing that actually reads it.
//
// operatorId travels in the body (needed to know WHICH operator's hash
// to compare against — bcrypt hashes can't be looked up by value) and
// the raw key travels in the X-API-Key header, never logged.
@Injectable()
export class TelecomApiKeyGuard implements CanActivate {
  constructor(private readonly dataSource: DataSource) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const apiKey = request.header('x-api-key');
    const operatorId = Number(
      (request.body as { operatorId?: unknown })?.operatorId,
    );

    if (!apiKey || !operatorId || !Number.isInteger(operatorId)) {
      throw new UnauthorizedException('Missing or invalid API key');
    }

    const [operator] = await this.dataSource.query<
      { operator_id: number; api_key_hash: string | null; status: string }[]
    >(
      `SELECT operator_id, api_key_hash, status FROM telecom_operators WHERE operator_id = $1`,
      [operatorId],
    );

    if (!operator?.api_key_hash || operator.status !== 'Active') {
      throw new UnauthorizedException('Missing or invalid API key');
    }

    const valid = await bcrypt.compare(apiKey, operator.api_key_hash);
    if (!valid) {
      throw new UnauthorizedException('Missing or invalid API key');
    }

    (request as Request & { telecomOperatorId: number }).telecomOperatorId =
      operatorId;
    return true;
  }
}
