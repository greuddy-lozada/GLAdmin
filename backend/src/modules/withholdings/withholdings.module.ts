import { Module } from '@nestjs/common';
import { WithholdingsService } from './withholdings.service';
import { WithholdingsController } from './withholdings.controller';

@Module({
  controllers: [WithholdingsController],
  providers: [WithholdingsService],
})
export class WithholdingsModule {}
