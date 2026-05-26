import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateSupplierDto {
  @IsString()
  companyName: string;

  @IsOptional() @IsString() businessName?: string;
  @IsOptional() @IsString() fiscalAddress?: string;
  @IsOptional() @IsString() taxId?: string;
  @IsOptional() @IsString() firstName?: string;
  @IsOptional() @IsString() lastName?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() phoneNumber?: string;
  @IsOptional() @IsString() email?: string;
  @IsOptional() @IsBoolean() taxWithholdingAgent?: boolean;
}
