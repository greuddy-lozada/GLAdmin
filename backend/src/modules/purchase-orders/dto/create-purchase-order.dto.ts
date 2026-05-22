import {
  IsString,
  IsNumber,
  IsOptional,
  IsDateString,
  ValidateNested,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';

class PurchaseOrderDetailDto {
  @IsNumber() idProduct: number;
  @IsOptional() @IsNumber() quantity?: number;
  @IsOptional() @IsNumber() subtotal?: number;
  @IsOptional() @IsString() observation?: string;
}

export class CreatePurchaseOrderDto {
  @IsNumber() idSupplier: number;
  @IsOptional() @IsString() code?: string;
  @IsOptional() @IsDateString() date?: string;
  @IsOptional() @IsNumber() amount?: number;
  @IsOptional() @IsNumber() paymentMethod?: number;
  @IsOptional() @IsNumber() status?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PurchaseOrderDetailDto)
  details?: PurchaseOrderDetailDto[];
}
