import { IsString, IsUUID, MinLength, MaxLength } from 'class-validator';

export class RegisterWithInviteDto {
  @IsUUID('4')
  code: string;

  @IsString({ message: 'El nombre debe ser texto' })
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  @MaxLength(20, { message: 'El nombre debe tener máximo 20 caracteres' })
  firstName: string;

  @IsString({ message: 'El apellido debe ser texto' })
  @MinLength(2, { message: 'El apellido debe tener al menos 2 caracteres' })
  @MaxLength(20, { message: 'El apellido debe tener máximo 20 caracteres' })
  lastName: string;

  @IsString({ message: 'El nombre de usuario debe ser texto' })
  @MinLength(4, {
    message: 'El nombre de usuario debe tener al menos 4 caracteres',
  })
  @MaxLength(30, {
    message: 'El nombre de usuario debe tener máximo 30 caracteres',
  })
  userName: string;

  @IsString({ message: 'La contraseña debe ser texto' })
  @MinLength(5, { message: 'La contraseña debe tener al menos 5 caracteres' })
  @MaxLength(25, { message: 'La contraseña debe tener máximo 25 caracteres' })
  password: string;
}
