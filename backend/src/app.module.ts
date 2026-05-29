import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';

import { PrismaModule } from './shared/prisma/prisma.module';
import { I18nModule } from './shared/i18n/i18n.module';
import { TenantModule } from './modules/tenant/tenant.module';
import { TenantMiddleware } from './modules/tenant/tenant.middleware';

import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { AuthGuard } from './common/guards/auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { FeatureGuard } from './common/guards/feature.guard';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { RolesModule } from './modules/roles/roles.module';
import { CustomersModule } from './modules/customers/customers.module';
import { SuppliersModule } from './modules/suppliers/suppliers.module';
import { CompaniesModule } from './modules/companies/companies.module';
import { TaxesModule } from './modules/taxes/taxes.module';
import { BatchesModule } from './modules/batches/batches.module';
import { StocksModule } from './modules/stocks/stocks.module';
import { ProductsModule } from './modules/products/products.module';
import { PurchaseOrdersModule } from './modules/purchase-orders/purchase-orders.module';
import { CurrenciesModule } from './modules/currencies/currencies.module';
import { ExchangeRatesModule } from './modules/exchange-rates/exchange-rates.module';
import { WithholdingsModule } from './modules/withholdings/withholdings.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { AdminModule } from './modules/admin/admin.module';
import { PagoMovilModule } from './modules/pago-movil/pago-movil.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { BootstrapModule } from './modules/bootstrap/bootstrap.module';
import { SyncModule } from './modules/sync/sync.module';

import appConfig from './core/config/app.config';
import jwtConfig from './core/config/jwt.config';
import databaseConfig from './core/config/database.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [appConfig, jwtConfig, databaseConfig],
      isGlobal: true,
    }),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET ?? 'gladmin-dev-secret',
      signOptions: { expiresIn: '7d' },
    }),
    PrismaModule,
    I18nModule,
    TenantModule,
    UsersModule,
    AuthModule,
    RolesModule,
    CustomersModule,
    SuppliersModule,
    CompaniesModule,
    TaxesModule,
    BatchesModule,
    StocksModule,
    ProductsModule,
    PurchaseOrdersModule,
    CurrenciesModule,
    ExchangeRatesModule,
    WithholdingsModule,
    DashboardModule,
    AdminModule,
    PagoMovilModule,
    PaymentsModule,
    BootstrapModule,
    SyncModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_GUARD,
      useClass: FeatureGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantMiddleware)
      .forRoutes('*');
  }
}
