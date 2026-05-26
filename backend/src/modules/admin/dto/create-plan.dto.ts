import { IsString, IsInt, IsOptional, IsBoolean } from 'class-validator';

export class CreatePlanDto {
  @IsString()
  name: string;

  @IsString()
  label: string;

  @IsInt()
  amount: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsString()
  interval: string;

  @IsOptional()
  @IsString()
  features?: string;

  @IsOptional()
  @IsInt()
  maxUsers?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
