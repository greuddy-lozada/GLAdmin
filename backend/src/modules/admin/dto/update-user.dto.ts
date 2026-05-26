import { IsOptional, IsBoolean, IsInt } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsInt()
  roleId?: number;
}
