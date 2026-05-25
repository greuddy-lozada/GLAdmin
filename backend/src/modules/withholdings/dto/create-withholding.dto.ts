import { IsString, IsNumber, IsOptional, IsDateString } from 'class-validator';

export class CreateWithholdingDto {
  @IsNumber() idSupplier: number;
  @IsOptional() @IsNumber() idPurchaseOrder?: number;
  @IsString() type: string;
  @IsNumber() percentage: number;
  @IsNumber() baseAmount: number;
  @IsOptional() @IsNumber() baseAmountUsd?: number;
  @IsOptional() @IsNumber() withheldAmount?: number;
  @IsOptional() @IsNumber() withheldAmountUsd?: number;
  @IsOptional() @IsNumber() exchangeRate?: number;
  @IsOptional() @IsString() documentNumber?: string;
  @IsOptional() @IsString() period?: string;
}
