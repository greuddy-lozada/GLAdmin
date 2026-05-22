import { IsString, IsNumber, IsOptional } from 'class-validator';

export class CreateProductDto {
  @IsString() code: string;
  @IsString() name: string;
  @IsNumber() price: number;
  @IsOptional() @IsNumber() dollarPrice?: number;
  @IsOptional() @IsNumber() idTax?: number;
  @IsOptional() @IsString() observation?: string;
  @IsOptional() @IsString() image?: string;
}
