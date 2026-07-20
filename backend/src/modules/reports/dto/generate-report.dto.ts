import { IsString, IsNotEmpty, IsObject } from 'class-validator';

export class GenerateReportDto {
  @IsString()
  @IsNotEmpty()
  type: string;

  @IsObject()
  parameters: Record<string, unknown>;
}
