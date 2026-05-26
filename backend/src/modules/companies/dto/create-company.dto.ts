import { IsString, IsOptional } from 'class-validator';

export class CreateCompanyDto {
  @IsString() taxId: string;
  @IsString() name: string;
  @IsString() address: string;
  @IsString() phoneNumber: string;
  @IsString() email: string;
  @IsOptional() @IsString() website?: string;
}
