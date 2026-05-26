import { IsString, IsEmail, MinLength, IsOptional } from 'class-validator';

export class SetupDto {
  @IsString()
  organizationName: string;

  @IsOptional()
  @IsString()
  organizationSlug?: string;

  @IsEmail()
  adminEmail: string;

  @IsString()
  @MinLength(6)
  adminPassword: string;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;
}
