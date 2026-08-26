import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

// operatorId is validated here too (not just consumed by
// TelecomApiKeyGuard) so a malformed/missing value 400s before the guard
// ever runs a DB lookup against it.
export class WebhookContributionDto {
  @IsInt()
  @IsPositive()
  operatorId!: number;

  @IsString()
  @Matches(/^0[67]\d{8}$/, {
    message: "Enter the member's registered Tanzanian phone number",
  })
  phoneNumber!: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  transactionAmount!: number;

  @IsIn(['Airtime', 'Data Bundle', 'Mobile Money Transfer'])
  transactionType!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  externalTransactionId!: string;
}
