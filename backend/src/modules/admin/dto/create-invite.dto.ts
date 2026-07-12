import { IsUUID, IsEmail } from 'class-validator';

export class CreateInviteDto {
  @IsEmail()
  email: string;

  @IsUUID()
  organizationId: string;

  @IsUUID()
  roleId: string;
}
