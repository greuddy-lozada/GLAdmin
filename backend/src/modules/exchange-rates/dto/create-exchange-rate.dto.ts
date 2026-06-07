import { IsNumber, IsString, IsOptional, IsDateString, Min } from 'class-validator';

export class CreateExchangeRateDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  rateBcvUsd?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  rateParalelo?: number;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsString()
  source?: string;
}
