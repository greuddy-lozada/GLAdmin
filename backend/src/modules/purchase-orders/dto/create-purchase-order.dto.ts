import {
  IsString,
  IsNumber,
  IsOptional,
  IsUUID,
  IsDateString,
  ValidateNested,
  IsArray,
  IsInt,
  Min,
  IsBoolean,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';

class PurchaseOrderDetailDto {
  @IsUUID() idProduct: string;
  @IsOptional() @IsInt() @Min(1) quantity?: number;
  @IsOptional() @IsNumber() @Min(0) unitPrice?: number;
  @IsOptional() @IsNumber() @Min(0) unitPriceUsd?: number;
  @IsOptional() @IsNumber() subtotal?: number;
  @IsOptional() @IsNumber() subtotalUsd?: number;
  @IsOptional() @IsString() observation?: string;
}

export class CreatePurchaseOrderDto {
  @IsUUID() idSupplier: string;
  @IsOptional() @IsString() code?: string;
  @IsOptional() @IsDateString() date?: string;
  @IsOptional() @IsNumber() amount?: number;
  @IsOptional() @IsNumber() amountUsd?: number;
  @IsOptional() @IsNumber() exchangeRate?: number;
  @IsOptional() @IsUUID() exchangeRateId?: string;
  @IsOptional() @IsUUID() exchangeRateDayId?: string;
  @IsOptional() @IsNumber() officialExchangeRate?: number;
  @IsOptional() @IsUUID() officialExchangeRateId?: string;
  @IsOptional() @IsNumber() paymentMethod?: number;
  @IsOptional() @IsNumber() status?: number;
  @IsOptional() @IsNumber() baseAmount?: number;
  @IsOptional() @IsNumber() baseAmountUsd?: number;
  @IsOptional() @IsNumber() ivaAmount?: number;
  @IsOptional() @IsNumber() ivaAmountUsd?: number;
  @IsOptional() @IsBoolean() applyWithholding?: boolean;
  @IsOptional() @IsIn([75, 100]) withholdingPercentage?: number;
  @IsOptional() @IsString() withholdingProof?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PurchaseOrderDetailDto)
  details?: PurchaseOrderDetailDto[];
}
