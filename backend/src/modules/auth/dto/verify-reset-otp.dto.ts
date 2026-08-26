import { IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';

export class VerifyResetOtpDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(254)
  identifier!: string;

  @IsString()
  @Matches(/^\d{6}$/, { message: 'OTP must be exactly 6 digits' })
  otp!: string;
}
