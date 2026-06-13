import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { Logger } from '@nestjs/common';

const logger = new Logger('Seed');
const prisma = new PrismaClient();

async function main() {
  // ── Roles ──
  await prisma.role.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, name: 'Master', slug: 'master' },
  });
  await prisma.role.upsert({
    where: { id: 2 },
    update: {},
    create: { id: 2, name: 'Ejecutivo', slug: 'executive' },
  });
  await prisma.role.upsert({
    where: { id: 3 },
    update: {},
    create: { id: 3, name: 'Gerente', slug: 'manager' },
  });
  await prisma.role.upsert({
    where: { id: 4 },
    update: {},
    create: { id: 4, name: 'Empleado', slug: 'employee' },
  });
  logger.log('Roles created');

  // ── Admin user ──
  const password = await bcrypt.hash('000000', 10);
  await prisma.user.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      email: 'admin@gladmin.com',
      userName: 'glozada',
      firstName: 'Greuddy',
      lastName: 'Lozada',
      password,
      idRole: 1,
      isActive: true,
    },
  });
  logger.log('Admin user created');

  // ── Currencies ──
  for (const c of [
    { id: 1, code: 'VED', name: 'Bolívar Soberano', symbol: 'Bs.' },
    { id: 2, code: 'USD', name: 'Dólar Americano', symbol: 'US$' },
    { id: 3, code: 'EUR', name: 'Euro', symbol: '€' },
  ]) {
    await prisma.currency.upsert({ where: { id: c.id }, update: {}, create: c });
  }
  logger.log('Currencies created');

  // ── Plans ──
  await prisma.plan.upsert({
    where: { name: 'free' },
    update: {},
    create: {
      id: 1,
      name: 'free',
      label: 'Free',
      amount: 0,
      currency: 'usd',
      interval: 'lifetime',
      features: JSON.stringify(['basic_auth', 'multi_currency', 'basic_reports']),
      maxUsers: 5,
    },
  });

  await prisma.plan.upsert({
    where: { name: 'starter' },
    update: {},
    create: {
      id: 2,
      name: 'starter',
      label: 'Starter',
      amount: 2999,
      currency: 'usd',
      interval: 'monthly',
      features: JSON.stringify([
        'basic_auth', 'multi_currency', 'basic_reports',
        'suppliers', 'customers', 'products', 'export',
      ]),
      maxUsers: 10,
    },
  });

  await prisma.plan.upsert({
    where: { name: 'professional' },
    update: {},
    create: {
      id: 3,
      name: 'professional',
      label: 'Professional',
      amount: 9999,
      currency: 'usd',
      interval: 'monthly',
      features: JSON.stringify([
        'basic_auth', 'multi_currency', 'basic_reports', 'advanced_reports',
        'suppliers', 'customers', 'products', 'export',
        'api_access', 'audit_log', 'purchase_orders', 'sales',
        'inventory',
      ]),
      maxUsers: 50,
    },
  });

  await prisma.plan.upsert({
    where: { name: 'enterprise' },
    update: {},
    create: {
      id: 4,
      name: 'enterprise',
      label: 'Enterprise',
      amount: 29999,
      currency: 'usd',
      interval: 'monthly',
      features: JSON.stringify([
        'basic_auth', 'multi_currency', 'basic_reports', 'advanced_reports',
        'suppliers', 'customers', 'products', 'export',
        'api_access', 'audit_log', 'purchase_orders', 'sales',
        'inventory', 'multiple_orgs', 'white_label',
        'priority_support',
      ]),
      maxUsers: 999,
    },
  });

  const freePlan = await prisma.plan.findUnique({ where: { name: 'free' } });
  logger.log('Plans created');

  // ── Default Organization ──
  await prisma.organization.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: 'Default Organization',
      slug: 'default',
      isActive: true,
      settings: JSON.stringify({ requireInvite: false, allowPublicSignup: false }),
      planId: freePlan!.id,
    },
  });
  logger.log('Default organization created');

  // ── Assign existing users to org ──
  const users = await prisma.user.findMany();
  for (const user of users) {
    await prisma.userOrganization.upsert({
      where: { userId_organizationId: { userId: user.id, organizationId: 1 } },
      update: {},
      create: {
        userId: user.id,
        organizationId: 1,
        roleId: user.idRole,
      },
    });
    await prisma.user.update({
      where: { id: user.id },
      data: { currentOrganizationId: 1 },
    });
  }
  logger.log('User organizations created');

  // ── Exchange Rates ──
  await prisma.exchangeRate.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, rate: 60.50, currencyId: 2, type: 'official', date: new Date('2026-05-20'), source: 'BCV', organizationId: 1 },
  });
  await prisma.exchangeRate.upsert({
    where: { id: 2 },
    update: {},
    create: { id: 2, rate: 72.00, currencyId: 2, type: 'paralelo', date: new Date('2026-05-20'), source: 'dolartoday', organizationId: 1 },
  });
  logger.log('Exchange rates created');

  // ── Taxes (Venezuela: IVA) ──
  await prisma.tax.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, name: 'IVA 16%', percentage: 16, formula: 'base * 0.16', organizationId: 1 },
  });
  await prisma.tax.upsert({
    where: { id: 2 },
    update: {},
    create: { id: 2, name: 'IVA 8%', percentage: 8, formula: 'base * 0.08', organizationId: 1 },
  });
  await prisma.tax.upsert({
    where: { id: 3 },
    update: {},
    create: { id: 3, name: 'Exento', percentage: 0, organizationId: 1 },
  });
  logger.log('Taxes created');

  // ── Categories ──
  await prisma.category.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, name: 'Electrónicos', description: 'Productos electrónicos y tecnología', organizationId: 1 },
  });
  await prisma.category.upsert({
    where: { id: 2 },
    update: {},
    create: { id: 2, name: 'Computación', idParent: 1, description: 'Computadoras, laptops y accesorios', organizationId: 1 },
  });
  await prisma.category.upsert({
    where: { id: 3 },
    update: {},
    create: { id: 3, name: 'Audio y Video', idParent: 1, description: 'Parlantes, audífonos, proyectores', organizationId: 1 },
  });
  await prisma.category.upsert({
    where: { id: 4 },
    update: {},
    create: { id: 4, name: 'Accesorios Tecnológicos', idParent: 1, description: 'Cables, cargadores, fundas', organizationId: 1 },
  });
  await prisma.category.upsert({
    where: { id: 5 },
    update: {},
    create: { id: 5, name: 'Hogar', description: 'Artículos para el hogar', organizationId: 1 },
  });
  await prisma.category.upsert({
    where: { id: 6 },
    update: {},
    create: { id: 6, name: 'Cocina', idParent: 5, description: 'Utensilios y electrodomésticos de cocina', organizationId: 1 },
  });
  await prisma.category.upsert({
    where: { id: 7 },
    update: {},
    create: { id: 7, name: 'Baño', idParent: 5, description: 'Accesorios y productos para el baño', organizationId: 1 },
  });
  await prisma.category.upsert({
    where: { id: 8 },
    update: {},
    create: { id: 8, name: 'Ropa y Moda', organizationId: 1 },
  });
  await prisma.category.upsert({
    where: { id: 9 },
    update: {},
    create: { id: 9, name: 'Deportes', description: 'Artículos deportivos y fitness', organizationId: 1 },
  });
  await prisma.category.upsert({
    where: { id: 10 },
    update: {},
    create: { id: 10, name: 'Alimentos y Bebidas', organizationId: 1 },
  });
  await prisma.category.upsert({
    where: { id: 11 },
    update: {},
    create: { id: 11, name: 'Salud y Belleza', organizationId: 1 },
  });
  await prisma.category.upsert({
    where: { id: 12 },
    update: {},
    create: { id: 12, name: 'Juguetes', organizationId: 1 },
  });
  logger.log('Categories created');

  // ── Customers ──
  await prisma.customer.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      idCardNumber: 'V-12345678',
      firstName: 'Juan',
      lastName: 'Pérez',
      address: 'Av. Principal, Urbanización Las Flores, Caracas',
      phoneNumber: '0412-555-0101',
      email: 'juan.perez@email.com',
      organizationId: 1,
    },
  });
  await prisma.customer.upsert({
    where: { id: 2 },
    update: {},
    create: {
      id: 2,
      idCardNumber: 'V-87654321',
      firstName: 'María',
      lastName: 'González',
      address: 'Calle Sucre #42, Valencia, Edo. Carabobo',
      phoneNumber: '0414-555-0202',
      email: 'maria.gonzalez@email.com',
      organizationId: 1,
    },
  });
  logger.log('Customers created');

  // ── Suppliers ──
  await prisma.supplier.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      companyName: 'Distribuidora Nacional C.A.',
      businessName: 'Distribuidora Nacional, C.A.',
      fiscalAddress: 'Zona Industrial de Caracas, Galpón 5, Dtto. Capital',
      taxId: 'J-12345678-9',
      taxWithholdingAgent: true,
      firstName: 'Carlos',
      lastName: 'Martínez',
      address: 'Zona Industrial de Caracas, Galpón 5',
      phoneNumber: '0212-555-0303',
      email: 'carlos@distribuidoranacional.com',
      organizationId: 1,
    },
  });
  await prisma.supplier.upsert({
    where: { id: 2 },
    update: {},
    create: {
      id: 2,
      companyName: 'Importadora del Caribe SA',
      businessName: 'Importadora del Caribe, S.A.',
      fiscalAddress: 'Av. Libertador #350, Chacao, Miranda',
      taxId: 'J-98765432-1',
      taxWithholdingAgent: false,
      firstName: 'Ana',
      lastName: 'Ramírez',
      address: 'Av. Libertador #350, Chacao',
      phoneNumber: '0212-555-0404',
      email: 'ana@importadoracaribe.com',
      organizationId: 1,
    },
  });
  logger.log('Suppliers created');

  // ── Company ──
  await prisma.company.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      taxId: 'J-40123456-7',
      name: 'GLAdmin Solutions C.A.',
      address: 'Av. Abraham Lincoln, Torre GLAdmin, Caracas',
      phoneNumber: '0212-555-0000',
      email: 'info@gladmin.com',
      website: 'https://gladmin.com',
      organizationId: 1,
    },
  });
  logger.log('Company created');

  // ── Products (prices in VED) ──
  await prisma.product.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, code: 'PROD-001', name: 'Laptop HP ProBook 450', price: 45000, dollarPrice: 750, idTax: 1, available: true, organizationId: 1 },
  });
  await prisma.product.upsert({
    where: { id: 2 },
    update: {},
    create: { id: 2, code: 'PROD-002', name: 'Monitor LG 24" Full HD', price: 12000, dollarPrice: 200, idTax: 1, available: true, organizationId: 1 },
  });
  await prisma.product.upsert({
    where: { id: 3 },
    update: {},
    create: { id: 3, code: 'PROD-003', name: 'Teclado Mecánico Redragon', price: 2500, idTax: 3, available: true, organizationId: 1 },
  });
  await prisma.product.upsert({
    where: { id: 4 },
    update: {},
    create: { id: 4, code: 'PROD-004', name: 'Mouse Inalámbrico Logitech', price: 1800, idTax: 3, available: true, organizationId: 1 },
  });
  await prisma.product.upsert({
    where: { id: 5 },
    update: {},
    create: { id: 5, code: 'PROD-005', name: 'Webcam HD 1080p', price: 3200, dollarPrice: 55, idTax: 2, available: true, organizationId: 1 },
  });
  logger.log('Products created');

  // ── Batches ──
  await prisma.batch.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, code: 'LOTE-2025-001', description: 'Lote inicial enero 2025', organizationId: 1 },
  });
  await prisma.batch.upsert({
    where: { id: 2 },
    update: {},
    create: { id: 2, code: 'LOTE-2025-002', description: 'Lote marzo 2025', organizationId: 1 },
  });
  logger.log('Batches created');

  // ── Stocks ──
  await prisma.stock.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, idProduct: 1, idSupplier: 1, idBatch: 1, existence: 15, organizationId: 1 },
  });
  await prisma.stock.upsert({
    where: { id: 2 },
    update: {},
    create: { id: 2, idProduct: 2, idSupplier: 1, idBatch: 1, existence: 30, organizationId: 1 },
  });
  await prisma.stock.upsert({
    where: { id: 3 },
    update: {},
    create: { id: 3, idProduct: 3, idSupplier: 2, idBatch: 2, existence: 50, organizationId: 1 },
  });
  logger.log('Stocks created');

  // ── Purchase Order (multi-currency) ──
  await prisma.purchaseOrder.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      idSupplier: 1,
      code: 'OC-2025-001',
      date: new Date('2025-01-15'),
      amount: 75000,
      amountUsd: 75000 / 72.00,
      exchangeRate: 72.00,
      exchangeRateId: 2,
      officialExchangeRate: 60.50,
      officialExchangeRateId: 1,
      paymentMethod: 1,
      status: 2,
      organizationId: 1,
    },
  });
  logger.log('Purchase order created');

  // ── Purchase Order Details (multi-currency) ──
  await prisma.purchaseOrderDet.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, idPurchaseOrder: 1, idProduct: 1, quantity: 5, unitPrice: 9000, unitPriceUsd: 9000 / 72.00, subtotal: 45000, subtotalUsd: 45000 / 72.00, organizationId: 1 },
  });
  await prisma.purchaseOrderDet.upsert({
    where: { id: 2 },
    update: {},
    create: { id: 2, idPurchaseOrder: 1, idProduct: 2, quantity: 10, unitPrice: 3000, unitPriceUsd: 3000 / 72.00, subtotal: 30000, subtotalUsd: 30000 / 72.00, organizationId: 1 },
  });
  logger.log('Purchase order details created');

  // ── Accounts Payable (multi-currency) ──
  await prisma.accountsPayable.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      idPurchaseOrder: 1,
      dueDate: new Date('2025-02-15'),
      issueDate: new Date('2025-01-15'),
      amount: 75000,
      amountUsd: 75000 / 72.00,
      exchangeRate: 72.00,
      status: 1,
      organizationId: 1,
    },
  });
  logger.log('Accounts payable created');

  logger.log('✅ Seed completed successfully');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    logger.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
