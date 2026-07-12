import {
  IsString,
  IsOptional,
  IsUUID,
  IsDateString,
  IsInt,
  IsBoolean,
  IsIn,
  IsNumber,
  IsArray,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PurchaseOrderStatus } from '../../../common/types/statuses';

class UpdateDetailDto {
  @IsOptional() @IsUUID() idProduct?: string;
  @IsOptional() @IsInt() @Min(1) quantity?: number;
  @IsOptional() @IsNumber() unitPrice?: number;
  @IsOptional() @IsNumber() unitPriceUsd?: number;
  @IsOptional() @IsNumber() subtotal?: number;
  @IsOptional() @IsNumber() subtotalUsd?: number;
  @IsOptional() @IsString() observation?: string;
}

export class UpdatePurchaseOrderDto {
  @IsOptional()
  @IsUUID()
  idSupplier?: string;

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

  @IsOptional()
  @IsIn(Object.values(PurchaseOrderStatus))
  status?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateDetailDto)
  details?: UpdateDetailDto[];
}
