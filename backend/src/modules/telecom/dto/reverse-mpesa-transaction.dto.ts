import { IsBoolean, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ReverseMpesaTransactionDto {
  @IsBoolean()
  approved!: boolean;

  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  reason!: string;
}
