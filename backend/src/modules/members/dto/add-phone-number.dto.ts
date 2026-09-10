import { IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class AddPhoneNumberDto {
  @IsString()
  @IsNotEmpty()
  phoneNumber!: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  accountNumber?: string;

  // Defaults to 'Standard' (one active SIM per operator per NIDA) when
  // omitted. Must be explicitly set to 'M2M' to register a device SIM
  // (up to four active per operator) — see
  // MembersService.addPhoneNumber's slot-limit check.
  @IsOptional()
  @IsIn(['Standard', 'M2M'])
  simType?: string;
}
