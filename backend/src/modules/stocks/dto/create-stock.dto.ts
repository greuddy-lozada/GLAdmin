import { IsNumber, IsOptional } from 'class-validator';

export class CreateStockDto {
  @IsNumber() idProduct: number;
  @IsOptional() @IsNumber() idSupplier?: number;
  @IsOptional() @IsNumber() idBatch?: number;
  @IsNumber() existence: number;
}
