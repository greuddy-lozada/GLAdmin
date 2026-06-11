import { IsString, IsOptional, IsBoolean, IsNumber, Min, Max } from 'class-validator';

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

  @IsOptional()
  @IsBoolean()
  isWithholdingAgent?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  withholdingPercentage?: number;

  @IsOptional()
  @IsString()
  withholdingProof?: string;
}
