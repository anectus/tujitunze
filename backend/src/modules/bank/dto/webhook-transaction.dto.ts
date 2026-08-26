import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';

export class WebhookTransactionDto {
  @IsInt()
  @IsPositive()
  bankId!: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  accountNumber!: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  transactionAmount!: number;

  @IsIn(['Bank Transfer'])
  transactionType!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  externalTransactionId!: string;
}
