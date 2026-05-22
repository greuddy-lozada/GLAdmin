import { IsNumber, IsOptional } from 'class-validator';

export class CreateForeignExchangeDto {
  @IsNumber() value: number;
  @IsOptional() @IsNumber() idCurrency?: number;
}
