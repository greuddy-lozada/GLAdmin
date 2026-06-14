import {
  IsString,
  IsOptional,
  IsInt,
  IsNumber,
  IsDateString,
  ValidateNested,
  IsArray,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSaleItemDto {
  @IsInt()
  productId: number;

  @IsInt()
  quantity: number;

  @IsNumber()
  unitPrice: number;

  @IsNumber()
  unitPriceUsd: number;

  @IsNumber()
  subtotal: number;

  @IsNumber()
  subtotalUsd: number;

  @IsOptional()
  @IsString()
  taxName?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  taxPercentage?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  taxAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  taxAmountUsd?: number;

  @IsOptional()
  @IsString()
  observation?: string;
}

export class CreateSaleDto {
  @IsString()
  code: string;

  @IsDateString()
  date: string;

  @IsNumber()
  amount: number;

  @IsNumber()
  amountUsd: number;

  @IsNumber()
  exchangeRate: number;

  @IsInt()
  paymentMethod: number;

  @IsInt()
  status: number;

  @IsOptional()
  @IsInt()
  idCustomer?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  totalTax?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  totalTaxUsd?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  withholdingPercentage?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  withholdingAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  withholdingAmountUsd?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSaleItemDto)
  items: CreateSaleItemDto[];
}
