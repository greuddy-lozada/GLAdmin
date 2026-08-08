import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class RegisterArPaymentDto {
  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsOptional()
  @IsNumber()
  method?: number;

  @IsOptional()
  @IsString()
  note?: string;
}
