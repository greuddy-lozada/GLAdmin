import { IsString, IsNumber, IsOptional, IsBoolean, Min } from 'class-validator';

export class CreatePagoMovilConfigDto {
  @IsString()
  phoneNumber: string;

  @IsString()
  bankId: string;

  @IsString()
  idNumber: string;

  @IsNumber()
  @Min(0)
  exchangeRate: number;
}

export class UpdatePagoMovilConfigDto {
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  bankId?: string;

  @IsOptional()
  @IsString()
  idNumber?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  exchangeRate?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
