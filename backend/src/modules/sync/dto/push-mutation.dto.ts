import {
  IsString,
  IsOptional,
  IsInt,
  IsIn,
  IsObject,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';

export class PushMutationDto {
  @IsString()
  @IsIn(['create', 'update', 'delete'])
  operation: 'create' | 'update' | 'delete';

  @IsString()
  table: string;

  @IsOptional()
  @IsInt()
  recordId?: number;

  @IsObject()
  data: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  stockSnapshot?: Record<string, number>;

  @IsDateString()
  localTimestamp: string;
}

export class PushRequestDto {
  @Type(() => PushMutationDto)
  mutations: PushMutationDto[];
}
