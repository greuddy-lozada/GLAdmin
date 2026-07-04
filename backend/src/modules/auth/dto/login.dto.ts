import { IsEmail, IsString } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Ingrese un correo electrónico válido' })
  email: string;

  @IsString({ message: 'La contraseña es obligatoria' })
  password: string;
}
