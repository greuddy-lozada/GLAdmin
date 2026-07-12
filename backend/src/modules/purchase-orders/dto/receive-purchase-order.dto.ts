import {
  IsArray,
  ValidateNested,
  IsInt,
  IsUUID,
  Min,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';

class ReceiveDetailDto {
  @IsUUID() id: string;
  @IsInt() @Min(1) quantity: number;
}

export class ReceivePurchaseOrderDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ReceiveDetailDto)
  details: ReceiveDetailDto[];
}
