import {
  IsString,
  IsOptional,
  IsDateString,
  IsInt,
  IsBoolean,
  IsIn,
} from 'class-validator';

export class UpdatePurchaseOrderDto {
  @IsOptional()
  @IsInt()
  idSupplier?: number;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsInt()
  paymentMethod?: number;

  @IsOptional()
  @IsBoolean()
  applyWithholding?: boolean;

  @IsOptional()
  @IsIn([75, 100])
  withholdingPercentage?: number;

  @IsOptional()
  @IsString()
  withholdingProof?: string;
}
