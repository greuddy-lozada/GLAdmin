import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class UpdateCashRegisterDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  code?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
