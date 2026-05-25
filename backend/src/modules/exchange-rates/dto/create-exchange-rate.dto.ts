import { IsNumber, IsString, IsOptional, IsDateString, IsIn } from 'class-validator';

export class CreateExchangeRateDto {
  @IsNumber()
  rate: number;

  @IsOptional()
  @IsNumber()
  currencyId?: number;

  @IsOptional()
  @IsString()
  @IsIn(['official', 'paralelo', 'manual'])
  type?: string;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsString()
  source?: string;
}
