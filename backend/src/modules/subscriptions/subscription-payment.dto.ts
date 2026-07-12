import { IsString, IsUUID, IsOptional, IsIn } from 'class-validator';

export class CreateSubscriptionPaymentDto {
  @IsUUID()
  planId: string;

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
