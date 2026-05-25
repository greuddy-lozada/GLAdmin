import {
  IsString,
  IsEmail,
  IsOptional,
  IsBoolean,
  IsNumber,
  MinLength,
  MaxLength,
} from 'class-validator';

export class CreateUserDto {
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

  @IsNumber()
  idRole: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
