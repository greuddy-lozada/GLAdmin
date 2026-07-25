import { IsString, IsNotEmpty } from 'class-validator';

export class CreateCashRegisterDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  code: string;
}
