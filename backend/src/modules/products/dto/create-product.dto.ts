import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  Min,
} from 'class-validator';

export class CreateProductDto {
  @IsString() code: string;
  @IsString() name: string;
  @IsNumber() price: number;
  @IsOptional() @IsNumber() dollarPrice?: number;
  @IsOptional() @IsNumber() @Min(0) baseCost?: number;
  @IsOptional() @IsNumber() @Min(0) margin?: number;
  @IsOptional() @IsNumber() idTax?: number;
  @IsOptional() @IsNumber() idBrand?: number;
  @IsOptional() @IsNumber() idCategory?: number;
  @IsOptional() @IsString() observation?: string;
  @IsOptional() @IsString() image?: string;
  @IsOptional() @IsBoolean() available?: boolean;
}
