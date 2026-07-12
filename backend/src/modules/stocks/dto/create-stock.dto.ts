import { IsNumber, IsOptional, IsUUID } from 'class-validator';

export class CreateStockDto {
  @IsUUID() idProduct: string;
  @IsOptional() @IsUUID() idSupplier?: string;
  @IsOptional() @IsUUID() idBatch?: string;
  @IsNumber() existence: number;
}
