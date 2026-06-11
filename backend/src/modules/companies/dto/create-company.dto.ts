import { IsString, IsOptional, IsBoolean, IsNumber, Min, Max } from 'class-validator';

export class CreateCompanyDto {
  @IsString() taxId: string;
  @IsString() name: string;
  @IsString() address: string;
  @IsString() phoneNumber: string;
  @IsString() email: string;
  @IsOptional() @IsString() website?: string;
  @IsOptional() @IsBoolean() isWithholdingAgent?: boolean;
  @IsOptional() @IsNumber() @Min(0) @Max(100) withholdingPercentage?: number;
}
