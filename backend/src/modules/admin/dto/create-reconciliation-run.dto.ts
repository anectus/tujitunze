import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsIn,
  IsOptional,
  ValidateNested,
} from 'class-validator';

import { ReconciliationCheckDto } from './reconciliation-check.dto';

export class CreateReconciliationRunDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(5000)
  @ValidateNested({ each: true })
  @Type(() => ReconciliationCheckDto)
  records!: ReconciliationCheckDto[];

  // Optional "unknown transaction" scan: within [scanUnknownFrom,
  // scanUnknownTo] for scanUnknownChannel, any TUJITUNZE contribution/
  // bank_transaction whose reference was NOT among `records` above gets
  // flagged Unknown. All three must be supplied together — reconciling
  // "what we have that you didn't report" requires an explicit, honest
  // date window, never a guessed one.
  @IsOptional()
  @IsIn(['AIRTIME', 'BANK_TRANSFER'])
  scanUnknownChannel?: 'AIRTIME' | 'BANK_TRANSFER';

  @IsOptional()
  @IsDateString()
  scanUnknownFrom?: string;

  @IsOptional()
  @IsDateString()
  scanUnknownTo?: string;
}
