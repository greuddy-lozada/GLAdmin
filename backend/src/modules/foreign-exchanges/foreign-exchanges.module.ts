import { Module } from '@nestjs/common';
import { ForeignExchangesService } from './foreign-exchanges.service';
import { ForeignExchangesController } from './foreign-exchanges.controller';

@Module({
  controllers: [ForeignExchangesController],
  providers: [ForeignExchangesService],
})
export class ForeignExchangesModule {}
