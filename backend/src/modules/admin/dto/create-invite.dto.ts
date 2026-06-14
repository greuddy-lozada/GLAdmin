import { IsInt, IsEmail } from 'class-validator';

export class CreateInviteDto {
  @IsEmail()
  email: string;

  @IsInt()
  organizationId: number;

  @IsInt()
  roleId: number;
}
