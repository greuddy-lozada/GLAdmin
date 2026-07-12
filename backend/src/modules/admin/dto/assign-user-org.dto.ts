import { IsUUID } from 'class-validator';

export class AssignUserOrgDto {
  @IsUUID()
  userId: string;

  @IsUUID()
  roleId: string;
}
