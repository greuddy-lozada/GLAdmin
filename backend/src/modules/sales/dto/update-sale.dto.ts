import { IsString, IsOptional, IsInt, IsDateString } from 'class-validator';

export class UpdateSaleDto {
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
  @IsInt()
  idCustomer?: number;
}
