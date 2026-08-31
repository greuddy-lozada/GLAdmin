import { IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class FindAdminUsersQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsUUID()
  organizationId?: string;
}
