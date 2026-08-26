import {
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class RecordContributionDto {
  @IsString()
  @Matches(/^0[67]\d{8}$/, {
    message: "Enter the member's registered Tanzanian phone number",
  })
  phoneNumber!: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amount!: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  referenceNumber!: string;

  @IsOptional()
  @IsIn(['Airtime', 'Data Bundle', 'Mobile Money Transfer'])
  contributionSource?: string;
}
