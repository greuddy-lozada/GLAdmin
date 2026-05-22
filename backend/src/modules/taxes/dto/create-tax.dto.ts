import { IsString, IsNumber, IsOptional } from 'class-validator';

export class CreateTaxDto {
  @IsString() name: string;
  @IsNumber() percentage: number;
  @IsOptional() @IsString() formula?: string;
}
