import {
  IsString,
  IsNumber,
  IsOptional,
  IsUUID,
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
  @IsOptional() @IsUUID() idTax?: string;
  @IsOptional() @IsUUID() idBrand?: string;
  @IsOptional() @IsUUID() idCategory?: string;
  @IsOptional() @IsString() observation?: string;
  @IsOptional() @IsString() image?: string;
  @IsOptional() @IsBoolean() available?: boolean;
}
