import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';

import { PrismaModule } from './shared/prisma/prisma.module';
import { CacheModule } from './shared/cache/cache.module';
import { I18nModule } from './shared/i18n/i18n.module';
import { TenantModule } from './modules/tenant/tenant.module';
import { TenantMiddleware } from './modules/tenant/tenant.middleware';

import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { AuthGuard } from './common/guards/auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { PlanLevelGuard } from './common/guards/plan-level.guard';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { RolesModule } from './modules/roles/roles.module';
import { CustomersModule } from './modules/customers/customers.module';
import { SuppliersModule } from './modules/suppliers/suppliers.module';
import { CompaniesModule } from './modules/companies/companies.module';
import { TaxesModule } from './modules/taxes/taxes.module';
import { BrandsModule } from './modules/brands/brands.module';
import { CashRegisterModule } from './modules/cash-register/cash-register.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { BatchesModule } from './modules/batches/batches.module';
import { StocksModule } from './modules/stocks/stocks.module';
import { ProductsModule } from './modules/products/products.module';
import { PurchaseOrdersModule } from './modules/purchase-orders/purchase-orders.module';
import { CurrenciesModule } from './modules/currencies/currencies.module';
import { ExchangeRatesModule } from './modules/exchange-rates/exchange-rates.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { AdminModule } from './modules/admin/admin.module';
import { PagoMovilModule } from './modules/pago-movil/pago-movil.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { BootstrapModule } from './modules/bootstrap/bootstrap.module';
import { SyncModule } from './modules/sync/sync.module';
import { SalesModule } from './modules/sales/sales.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { HealthModule } from './modules/health/health.module';
import { AuditLogModule } from './modules/audit-log/audit-log.module';
import { SubscriptionsModule } from './modules/subscriptions/subscription-payments.module';
import { ReportsModule } from './modules/reports/reports.module';

import appConfig from './core/config/app.config';
import jwtConfig from './core/config/jwt.config';
import databaseConfig from './core/config/database.config';

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  throw new Error('JWT_SECRET environment variable is required');
}

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [appConfig, jwtConfig, databaseConfig],
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    JwtModule.register({
      global: true,
      secret: jwtSecret,
      signOptions: { expiresIn: '15m' },
    }),
    PrismaModule,
    CacheModule,
    I18nModule,
    TenantModule,
    UsersModule,
    AuthModule,
    RolesModule,
    CustomersModule,
    SuppliersModule,
    CompaniesModule,
    TaxesModule,
    BrandsModule,
    CashRegisterModule,
    CategoriesModule,
    BatchesModule,
    StocksModule,
    ProductsModule,
    PurchaseOrdersModule,
    CurrenciesModule,
    ExchangeRatesModule,
    DashboardModule,
    AdminModule,
    PagoMovilModule,
    PaymentsModule,
    BootstrapModule,
    SyncModule,
    SalesModule,
    UploadsModule,
    HealthModule,
    AuditLogModule,
    SubscriptionsModule,
    ReportsModule,
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
      useClass: PlanLevelGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantMiddleware).forRoutes('*');
  }
}
