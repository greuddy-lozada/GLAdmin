import { IsNumber, Min, IsOptional, IsString } from 'class-validator';

export class OpenRegisterDto {
  @IsNumber()
  @Min(0)
  initialCash: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  initialCashUsd?: number;

  @IsString()
  @IsOptional()
  notes?: string;
}
