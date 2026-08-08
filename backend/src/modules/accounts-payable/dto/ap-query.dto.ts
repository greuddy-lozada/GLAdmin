import { IsIn, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class ApQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  @IsIn(['open', 'paid', 'overdue', 'all'])
  status?: 'open' | 'paid' | 'overdue' | 'all';
}
