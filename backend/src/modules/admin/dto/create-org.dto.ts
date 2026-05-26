import { IsString, IsOptional, IsInt, IsBoolean } from 'class-validator';

export class CreateOrgDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsInt()
  planId?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
