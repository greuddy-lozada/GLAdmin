import {
  IsString,
  IsNumber,
  IsOptional,
  IsDateString,
  ValidateNested,
  IsArray,
  IsInt,
  IsPositive,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

class PurchaseOrderDetailDto {
  @IsInt() @IsPositive() idProduct: number;
  @IsOptional() @IsInt() @Min(1) quantity?: number;
  @IsOptional() @IsNumber() @Min(0) unitPrice?: number;
  @IsOptional() @IsNumber() @Min(0) unitPriceUsd?: number;
  @IsOptional() @IsNumber() subtotal?: number;
  @IsOptional() @IsNumber() subtotalUsd?: number;
  @IsOptional() @IsString() observation?: string;
}

export class CreatePurchaseOrderDto {
  @IsNumber() idSupplier: number;
  @IsOptional() @IsString() code?: string;
  @IsOptional() @IsDateString() date?: string;
  @IsOptional() @IsNumber() amount?: number;
  @IsOptional() @IsNumber() amountUsd?: number;
  @IsOptional() @IsNumber() exchangeRate?: number;
  @IsOptional() @IsNumber() exchangeRateId?: number;
  @IsOptional() @IsNumber() officialExchangeRate?: number;
  @IsOptional() @IsNumber() officialExchangeRateId?: number;
  @IsOptional() @IsNumber() paymentMethod?: number;
  @IsOptional() @IsNumber() status?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PurchaseOrderDetailDto)
  details?: PurchaseOrderDetailDto[];
}
