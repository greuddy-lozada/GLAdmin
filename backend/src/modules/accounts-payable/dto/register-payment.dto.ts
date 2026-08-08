import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class RegisterApPaymentDto {
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
