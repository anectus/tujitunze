import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import type { Request } from 'express';

// Bank's mirror of TelecomApiKeyGuard — authenticates an inbound webhook
// call FROM a bank's own system against banks.api_key_hash (already
// written by BankService.regenerateApiKey(), never previously read by
// anything). Kept as its own guard rather than a shared abstraction to
// match this codebase's established pattern of Telecom/Bank running
// deliberately parallel, not shared, implementations.
@Injectable()
export class BankApiKeyGuard implements CanActivate {
  constructor(private readonly dataSource: DataSource) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const apiKey = request.header('x-api-key');
    const bankId = Number((request.body as { bankId?: unknown })?.bankId);

    if (!apiKey || !bankId || !Number.isInteger(bankId)) {
      throw new UnauthorizedException('Missing or invalid API key');
    }

    const [bank] = await this.dataSource.query<
      { bank_id: number; api_key_hash: string | null; status: string }[]
    >(`SELECT bank_id, api_key_hash, status FROM banks WHERE bank_id = $1`, [
      bankId,
    ]);

    if (!bank?.api_key_hash || bank.status !== 'Active') {
      throw new UnauthorizedException('Missing or invalid API key');
    }

    const valid = await bcrypt.compare(apiKey, bank.api_key_hash);
    if (!valid) {
      throw new UnauthorizedException('Missing or invalid API key');
    }

    (request as Request & { bankId: number }).bankId = bankId;
    return true;
  }
}
