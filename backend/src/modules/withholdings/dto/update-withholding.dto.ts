import { PartialType } from '@nestjs/mapped-types';
import { CreateWithholdingDto } from './create-withholding.dto';

export class UpdateWithholdingDto extends PartialType(CreateWithholdingDto) {}
