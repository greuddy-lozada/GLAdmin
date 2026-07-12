import { IsString, IsOptional, IsUUID, IsBoolean } from 'class-validator';

export class CreateOrgDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsUUID()
  planId?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
