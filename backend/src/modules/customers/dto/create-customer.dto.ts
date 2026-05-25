import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateCustomerDto {
  @IsString()
  idCardNumber: string;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsBoolean()
  available?: boolean;
}
