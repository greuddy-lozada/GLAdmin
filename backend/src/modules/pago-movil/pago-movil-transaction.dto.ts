import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class CreatePagoMovilTransactionDto {
  @IsNumber()
  @Min(0)
  amountVes: number;

  @IsNumber()
  @Min(0)
  amountUsd: number;

  @IsString()
  bankId: string;

  @IsString()
  phoneNumber: string;

  @IsString()
  reference: string;

  @IsOptional()
  @IsString()
  proofImage?: string;
}

export class ReviewPagoMovilTransactionDto {
  @IsString()
  status: 'approved' | 'rejected';

  @IsOptional()
  @IsString()
  notes?: string;
}
