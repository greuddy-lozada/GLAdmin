import { IsString, IsIn, IsOptional, IsObject } from 'class-validator';

export class ResolveConflictDto {
  @IsString()
  @IsIn(['resolved_server', 'resolved_local', 'manual'])
  status: 'resolved_server' | 'resolved_local' | 'manual';

  @IsOptional()
  @IsObject()
  manualData?: Record<string, unknown>;
}
