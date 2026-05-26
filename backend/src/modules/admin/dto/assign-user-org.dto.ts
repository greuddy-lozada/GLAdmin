import { IsInt } from 'class-validator';

export class AssignUserOrgDto {
  @IsInt()
  userId: number;

  @IsInt()
  roleId: number;
}
