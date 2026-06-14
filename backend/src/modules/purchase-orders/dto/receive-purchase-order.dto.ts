import {
  IsArray,
  ValidateNested,
  IsInt,
  Min,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';

class ReceiveDetailDto {
  @IsInt() id: number;
  @IsInt() @Min(1) quantity: number;
}

export class ReceivePurchaseOrderDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ReceiveDetailDto)
  details: ReceiveDetailDto[];
}
