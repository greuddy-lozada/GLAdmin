import { IsNumber, Min, IsOptional, IsString } from 'class-validator';

export class CloseRegisterDto {
  @IsNumber()
  @Min(0)
  countedCash: number;

  @IsString()
  @IsOptional()
  notes?: string;
}
