import { Module } from '@nestjs/common';
import { PagoMovilService } from './pago-movil.service';
import { PagoMovilConfigController } from './pago-movil-config.controller';
import { PagoMovilTransactionController } from './pago-movil-transaction.controller';
import { PrismaModule } from '../../shared/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PagoMovilConfigController, PagoMovilTransactionController],
  providers: [PagoMovilService],
})
export class PagoMovilModule {}
