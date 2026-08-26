import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateSettlementDto {
  @IsIn(['Telecom', 'Insurance'])
  counterpartyType!: 'Telecom' | 'Insurance';

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  counterpartyName!: string;

  @IsOptional()
  @IsInt()
  @IsPositive()
  telecomOperatorId?: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  insuranceProviderId?: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amount!: number;
}
