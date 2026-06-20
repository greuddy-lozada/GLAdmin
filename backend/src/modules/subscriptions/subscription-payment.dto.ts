import { IsString, IsNumber, IsOptional, IsIn, Min } from 'class-validator';

export class CreateSubscriptionPaymentDto {
  @IsNumber()
  @Min(1)
  planId: number;

  @IsString()
  @IsIn(['pago_movil', 'cash_usd'])
  method: string;

  // Pago Móvil
  @IsOptional()
  @IsString()
  bankId?: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  reference?: string;

  @IsOptional()
  @IsString()
  proofImage?: string;
}

export class ReviewSubscriptionPaymentDto {
  @IsString()
  @IsIn(['approved', 'rejected'])
  status: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
