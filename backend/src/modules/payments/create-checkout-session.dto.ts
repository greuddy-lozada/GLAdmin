import { IsInt } from 'class-validator';

export class CreateCheckoutSessionDto {
  @IsInt()
  planId: number;

  @IsInt()
  organizationId: number;
}
