import {
  IsString,
  IsEmail,
  IsOptional,
  IsBoolean,
  IsUUID,
  MinLength,
  MaxLength,
} from 'class-validator';

export class CreateAdminUserDto {
  @IsString()
  @MinLength(2)
  @MaxLength(20)
  firstName: string;

  @IsString()
  @MinLength(2)
  @MaxLength(20)
  lastName: string;

  @IsString()
  @MinLength(4)
  @MaxLength(30)
  userName: string;

  @IsString()
  @MinLength(5)
  @MaxLength(25)
  password: string;

  @IsEmail()
  email: string;

  @IsUUID()
  idRole: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsUUID()
  organizationId?: string;

  @IsOptional()
  @IsUUID()
  orgRoleId?: string;
}
