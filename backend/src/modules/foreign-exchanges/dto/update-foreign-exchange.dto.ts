import { PartialType } from '@nestjs/mapped-types';
import { CreateForeignExchangeDto } from './create-foreign-exchange.dto';

export class UpdateForeignExchangeDto extends PartialType(
  CreateForeignExchangeDto,
) {}
