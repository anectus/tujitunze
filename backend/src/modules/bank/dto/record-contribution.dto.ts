import {
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';

export class RecordContributionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  accountNumber!: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amount!: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  transactionReference!: string;
}
