import {
  IsString,
  IsEmail,
  MinLength,
  IsOptional,
  IsNotEmpty,
} from 'class-validator';

export class SetupDto {
  @IsString({ message: 'VALIDATION.IS_STRING' })
  @IsNotEmpty({ message: 'VALIDATION.IS_NOT_EMPTY' })
  organizationName: string;

  @IsOptional()
  @IsString({ message: 'VALIDATION.IS_STRING' })
  organizationSlug?: string;

  @IsEmail({}, { message: 'VALIDATION.IS_EMAIL' })
  adminEmail: string;

  @IsString({ message: 'VALIDATION.IS_STRING' })
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  adminPassword: string;

  @IsString({ message: 'VALIDATION.IS_STRING' })
  @IsNotEmpty({ message: 'VALIDATION.IS_NOT_EMPTY' })
  firstName: string;

  @IsString({ message: 'VALIDATION.IS_STRING' })
  @IsNotEmpty({ message: 'VALIDATION.IS_NOT_EMPTY' })
  lastName: string;
}
