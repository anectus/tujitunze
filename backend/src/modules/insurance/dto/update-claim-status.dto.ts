import {
  IsIn,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateClaimStatusDto {
  @IsIn(['Approved', 'Rejected'])
  claimStatus!: 'Approved' | 'Rejected';

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  approvedAmount?: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  remarks?: string;
}
