import { IsString, IsOptional } from 'class-validator';

export class CreateBatchDto {
  @IsString() code: string;
  @IsOptional() @IsString() description?: string;
}
