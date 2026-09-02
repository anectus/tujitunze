import { IsBoolean } from 'class-validator';

export class UpdateSavingConsentDto {
  @IsBoolean()
  consented!: boolean;
}
