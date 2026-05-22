import { IsString, IsOptional } from 'class-validator';

export class CreateCompanyDto {
  @IsString() documentNumber: string;
  @IsString() name: string;
  @IsString() address: string;
  @IsString() phoneNumber: string;
  @IsString() email: string;
  @IsOptional() @IsString() website?: string;
}
