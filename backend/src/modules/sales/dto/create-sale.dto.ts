import { IsString, IsOptional, IsInt, IsNumber, IsDateString, ValidateNested, IsArray } from 'class-validator';
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

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSaleItemDto)
  items: CreateSaleItemDto[];
}
