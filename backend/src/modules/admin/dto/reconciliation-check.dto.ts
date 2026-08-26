import {
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';

// One externally-reported transaction Admin wants checked against
// TUJITUNZE's own records. memberIdentifier is optional (a phone number
// for AIRTIME, an account number for BANK_TRANSFER) — supplying it lets
// the member-match check run; omitting it just leaves that one check
// unanswered (null) rather than failing it.
export class ReconciliationCheckDto {
  @IsIn(['AIRTIME', 'BANK_TRANSFER'])
  channel!: 'AIRTIME' | 'BANK_TRANSFER';

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  externalReference!: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amount!: number;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  memberIdentifier?: string;
}
