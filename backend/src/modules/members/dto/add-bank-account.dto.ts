import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';

export class AddBankAccountDto {
  @IsInt()
  @IsPositive()
  bankId!: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  accountNumber!: string;

  @IsIn(['Savings', 'Current'])
  accountType!: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  accountHolderName?: string;

  // Defaults to 'TZS' when omitted. Part of the per-bank product
  // uniqueness key alongside accountType and accountCapacity — see
  // MembersService.addBankAccount.
  @IsOptional()
  @IsIn(['TZS', 'USD'])
  currency?: string;

  // Defaults to 'Individual' when omitted.
  @IsOptional()
  @IsIn(['Individual', 'Joint'])
  accountCapacity?: string;
}
