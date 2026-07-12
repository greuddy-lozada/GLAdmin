import { IsUUID } from 'class-validator';

export class CreateCheckoutSessionDto {
  @IsUUID()
  planId: string;

  @IsUUID()
  organizationId: string;
}
