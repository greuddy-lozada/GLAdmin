import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { Logger } from '@nestjs/common';

const logger = new Logger('Seed');
const prisma = new PrismaClient();

async function main() {
  const existingOrgs = await prisma.organization.count();
  if (existingOrgs > 0) {
    logger.log('Seed already applied, skipping');
    return;
  }

  // ── Roles (upsert by unique slug) ──
  const masterRole = await prisma.role.upsert({
    where: { slug: 'master' },
    update: {},
    create: { name: 'Master', slug: 'master', type: 'system', level: 100 },
  });
  const adminRole = await prisma.role.upsert({
    where: { slug: 'admin' },
    update: {},
    create: { name: 'Admin', slug: 'admin', type: 'system', level: 90 },
  });
  await prisma.role.upsert({
    where: { slug: 'executive' },
    update: {},
    create: { name: 'Ejecutivo', slug: 'executive', level: 80 },
  });
  await prisma.role.upsert({
    where: { slug: 'manager' },
    update: {},
    create: { name: 'Gerente', slug: 'manager', level: 60 },
  });
  await prisma.role.upsert({
    where: { slug: 'employee' },
    update: {},
    create: { name: 'Empleado', slug: 'employee', level: 40 },
  });
  logger.log('Roles created');

  // ── Admin user (upsert by unique email) ──
  const password = await bcrypt.hash('000000', 10);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@cuadra.app' },
    update: {},
    create: {
      email: 'admin@cuadra.app',
      userName: 'glozada',
      firstName: 'Greuddy',
      lastName: 'Lozada',
      password,
      idRole: adminRole.id,
      isActive: true,
    },
  });
  logger.log('Admin user created');

  // ── Plans (upsert by unique name) ──
  const freePlan = await prisma.plan.upsert({
    where: { name: 'free' },
    update: {},
    create: {
      name: 'free', label: 'Free', amount: 0, currency: 'usd', interval: 'lifetime',
      features: JSON.stringify(['basic_auth', 'multi_currency', 'basic_reports']),
      maxUsers: 5,
    },
  });
  await prisma.plan.upsert({
    where: { name: 'starter' },
    update: {},
    create: {
      name: 'starter', label: 'Starter', amount: 2999, currency: 'usd', interval: 'monthly',
      features: JSON.stringify(['basic_auth', 'multi_currency', 'basic_reports', 'suppliers', 'customers', 'products', 'export']),
      maxUsers: 10,
    },
  });
  await prisma.plan.upsert({
    where: { name: 'professional' },
    update: {},
    create: {
      name: 'professional', label: 'Professional', amount: 9999, currency: 'usd', interval: 'monthly',
      features: JSON.stringify(['basic_auth', 'multi_currency', 'basic_reports', 'advanced_reports', 'suppliers', 'customers', 'products', 'export', 'api_access', 'audit_log', 'purchase_orders', 'sales', 'inventory']),
      maxUsers: 50,
    },
  });
  await prisma.plan.upsert({
    where: { name: 'enterprise' },
    update: {},
    create: {
      name: 'enterprise', label: 'Enterprise', amount: 29999, currency: 'usd', interval: 'monthly',
      features: JSON.stringify(['basic_auth', 'multi_currency', 'basic_reports', 'advanced_reports', 'suppliers', 'customers', 'products', 'export', 'api_access', 'audit_log', 'purchase_orders', 'sales', 'inventory', 'multiple_orgs', 'white_label', 'priority_support']),
      maxUsers: 999,
    },
  });
  logger.log('Plans created');

  // ── Default Organization (upsert by unique slug) ──
  const org = await prisma.organization.upsert({
    where: { slug: 'default' },
    update: {},
    create: {
      name: 'Default Organization', slug: 'default', isActive: true,
      settings: JSON.stringify({ requireInvite: false, allowPublicSignup: false }),
      planId: freePlan.id, subscriptionStatus: 'inactive', subscriptionExpiresAt: null,
    },
  });
  logger.log('Default organization created');

  // ── Assign admin user to org ──
  await prisma.userOrganization.upsert({
    where: { userId_organizationId: { userId: adminUser.id, organizationId: org.id } },
    update: {},
    create: { userId: adminUser.id, organizationId: org.id, roleId: adminUser.idRole },
  });
  await prisma.user.update({
    where: { id: adminUser.id },
    data: { currentOrganizationId: org.id },
  });
  logger.log('User organizations created');

  // ── Currencies ──
  await prisma.currency.createMany({
    data: [
      { code: 'VED', name: 'Bolívar Soberano', symbol: 'Bs.' },
      { code: 'USD', name: 'Dólar Americano', symbol: 'US$' },
      { code: 'EUR', name: 'Euro', symbol: '€' },
    ],
  });
  const usdCurrency = await prisma.currency.findFirstOrThrow({ where: { code: 'USD' } });
  logger.log('Currencies created');

  // ── Exchange Rates ──
  const erOfficial = await prisma.exchangeRate.create({
    data: { rate: 60.50, currencyId: usdCurrency.id, type: 'official', date: new Date('2026-05-20'), source: 'BCV', organizationId: org.id },
  });
  const erParalelo = await prisma.exchangeRate.create({
    data: { rate: 72.00, currencyId: usdCurrency.id, type: 'paralelo', date: new Date('2026-05-20'), source: 'dolartoday', organizationId: org.id },
  });
  logger.log('Exchange rates created');

  // ── Taxes ──
  const tax16 = await prisma.tax.create({ data: { name: 'IVA 16%', percentage: 16, formula: 'base * 0.16', organizationId: org.id } });
  const tax8 = await prisma.tax.create({ data: { name: 'IVA 8%', percentage: 8, formula: 'base * 0.08', organizationId: org.id } });
  const tax0 = await prisma.tax.create({ data: { name: 'Exento', percentage: 0, organizationId: org.id } });
  logger.log('Taxes created');

  // ── Categories ──
  const catElec = await prisma.category.create({ data: { name: 'Electrónicos', description: 'Productos electrónicos y tecnología', organizationId: org.id } });
  const catComp = await prisma.category.create({ data: { name: 'Computación', idParent: catElec.id, description: 'Computadoras, laptops y accesorios', organizationId: org.id } });
  const catAudio = await prisma.category.create({ data: { name: 'Audio y Video', idParent: catElec.id, description: 'Parlantes, audífonos, proyectores', organizationId: org.id } });
  const catAcc = await prisma.category.create({ data: { name: 'Accesorios Tecnológicos', idParent: catElec.id, description: 'Cables, cargadores, fundas', organizationId: org.id } });
  const catHogar = await prisma.category.create({ data: { name: 'Hogar', description: 'Artículos para el hogar', organizationId: org.id } });
  const catCocina = await prisma.category.create({ data: { name: 'Cocina', idParent: catHogar.id, description: 'Utensilios y electrodomésticos de cocina', organizationId: org.id } });
  const catBano = await prisma.category.create({ data: { name: 'Baño', idParent: catHogar.id, description: 'Accesorios y productos para el baño', organizationId: org.id } });
  const catRopa = await prisma.category.create({ data: { name: 'Ropa y Moda', organizationId: org.id } });
  await prisma.category.create({ data: { name: 'Deportes', description: 'Artículos deportivos y fitness', organizationId: org.id } });
  await prisma.category.create({ data: { name: 'Alimentos y Bebidas', organizationId: org.id } });
  await prisma.category.create({ data: { name: 'Salud y Belleza', organizationId: org.id } });
  await prisma.category.create({ data: { name: 'Juguetes', organizationId: org.id } });
  logger.log('Categories created');

  // ── Customers ──
  const customer1 = await prisma.customer.create({
    data: { idCardNumber: 'V-12345678', firstName: 'Juan', lastName: 'Pérez', address: 'Av. Principal, Urbanización Las Flores, Caracas', phoneNumber: '0412-555-0101', email: 'juan.perez@email.com', organizationId: org.id },
  });
  await prisma.customer.create({
    data: { idCardNumber: 'V-87654321', firstName: 'María', lastName: 'González', address: 'Calle Sucre #42, Valencia, Edo. Carabobo', phoneNumber: '0414-555-0202', email: 'maria.gonzalez@email.com', organizationId: org.id },
  });
  logger.log('Customers created');

  // ── Suppliers ──
  const supplier1 = await prisma.supplier.create({
    data: { companyName: 'Distribuidora Nacional C.A.', businessName: 'Distribuidora Nacional, C.A.', fiscalAddress: 'Zona Industrial de Caracas, Galpón 5, Dtto. Capital', taxId: 'J-12345678-9', taxWithholdingAgent: true, firstName: 'Carlos', lastName: 'Martínez', address: 'Zona Industrial de Caracas, Galpón 5', phoneNumber: '0212-555-0303', email: 'carlos@distribuidoranacional.com', organizationId: org.id },
  });
  const supplier2 = await prisma.supplier.create({
    data: { companyName: 'Importadora del Caribe SA', businessName: 'Importadora del Caribe, S.A.', fiscalAddress: 'Av. Libertador #350, Chacao, Miranda', taxId: 'J-98765432-1', taxWithholdingAgent: false, firstName: 'Ana', lastName: 'Ramírez', address: 'Av. Libertador #350, Chacao', phoneNumber: '0212-555-0404', email: 'ana@importadoracaribe.com', organizationId: org.id },
  });
  logger.log('Suppliers created');

  // ── Company ──
  await prisma.company.create({
    data: { taxId: 'J-40123456-7', name: 'Cuadra Solutions C.A.', address: 'Av. Abraham Lincoln, Torre Cuadra, Caracas', phoneNumber: '0212-555-0000', email: 'info@cuadra.app', website: 'https://cuadra.app', organizationId: org.id },
  });
  logger.log('Company created');

  // ── Products ──
  const prod1 = await prisma.product.create({ data: { code: 'PROD-001', name: 'Laptop HP ProBook 450', price: 45000, dollarPrice: 750, idTax: tax16.id, available: true, organizationId: org.id } });
  const prod2 = await prisma.product.create({ data: { code: 'PROD-002', name: 'Monitor LG 24" Full HD', price: 12000, dollarPrice: 200, idTax: tax16.id, available: true, organizationId: org.id } });
  const prod3 = await prisma.product.create({ data: { code: 'PROD-003', name: 'Teclado Mecánico Redragon', price: 2500, idTax: tax0.id, available: true, organizationId: org.id } });
  const prod4 = await prisma.product.create({ data: { code: 'PROD-004', name: 'Mouse Inalámbrico Logitech', price: 1800, idTax: tax0.id, available: true, organizationId: org.id } });
  const prod5 = await prisma.product.create({ data: { code: 'PROD-005', name: 'Webcam HD 1080p', price: 3200, dollarPrice: 55, idTax: tax8.id, available: true, organizationId: org.id } });
  const prod6 = await prisma.product.create({ data: { code: 'PROD-006', name: 'USB Cable Type-C 1m', price: 400, idTax: tax0.id, available: true, organizationId: org.id, idCategory: catAcc.id } });
  const prod7 = await prisma.product.create({ data: { code: 'PROD-007', name: 'Cargador Pared 20W USB-C', price: 1800, dollarPrice: 30, idTax: tax8.id, available: true, organizationId: org.id, idCategory: catAcc.id } });
  const prod8 = await prisma.product.create({ data: { code: 'PROD-008', name: 'Olla de Presión 6L', price: 6500, idTax: tax16.id, available: true, organizationId: org.id, idCategory: catCocina.id } });
  const prod9 = await prisma.product.create({ data: { code: 'PROD-009', name: 'Set de Sartenes Antiadherentes', price: 9200, dollarPrice: 155, idTax: tax16.id, available: true, organizationId: org.id, idCategory: catCocina.id } });
  await prisma.product.create({ data: { code: 'PROD-010', name: 'Camiseta Deportiva M/L', price: 1500, idTax: tax0.id, available: true, organizationId: org.id, idCategory: catRopa.id } });
  logger.log('Products created');

  // ── Batches ──
  const batch1 = await prisma.batch.create({ data: { code: 'LOTE-2025-001', description: 'Lote inicial enero 2025', organizationId: org.id } });
  const batch2 = await prisma.batch.create({ data: { code: 'LOTE-2025-002', description: 'Lote marzo 2025', organizationId: org.id } });
  logger.log('Batches created');

  // ── Stocks ──
  await prisma.stock.create({ data: { idProduct: prod1.id, idSupplier: supplier1.id, idBatch: batch1.id, existence: 15, organizationId: org.id } });
  await prisma.stock.create({ data: { idProduct: prod2.id, idSupplier: supplier1.id, idBatch: batch1.id, existence: 30, organizationId: org.id } });
  await prisma.stock.create({ data: { idProduct: prod3.id, idSupplier: supplier2.id, idBatch: batch2.id, existence: 50, organizationId: org.id } });
  await prisma.stock.create({ data: { idProduct: prod4.id, idSupplier: supplier2.id, existence: 3, organizationId: org.id } });
  await prisma.stock.create({ data: { idProduct: prod5.id, idSupplier: supplier1.id, existence: 0, organizationId: org.id } });
  await prisma.stock.create({ data: { idProduct: prod6.id, idSupplier: supplier2.id, existence: 2, organizationId: org.id } });
  await prisma.stock.create({ data: { idProduct: prod7.id, idSupplier: supplier1.id, existence: 4, organizationId: org.id } });
  await prisma.stock.create({ data: { idProduct: prod3.id, idSupplier: supplier1.id, existence: 20, organizationId: org.id } });
  logger.log('Stocks created');

  // ── Purchase Orders ──
  const po1 = await prisma.purchaseOrder.create({
    data: { idSupplier: supplier1.id, code: 'OC-2025-001', date: new Date('2025-01-15'), amount: 75000, amountUsd: 75000 / 72.00, exchangeRate: 72.00, exchangeRateId: erParalelo.id, officialExchangeRate: 60.50, officialExchangeRateId: erOfficial.id, paymentMethod: 1, status: 'ISSUED', organizationId: org.id },
  });
  const po2 = await prisma.purchaseOrder.create({
    data: { idSupplier: supplier2.id, code: 'OC-2025-002', date: new Date('2025-02-01'), amount: 35000, amountUsd: 486.11, exchangeRate: 72.00, paymentMethod: 1, status: 'RECEIVED', organizationId: org.id },
  });
  logger.log('Purchase orders created');

  // ── Purchase Order Details ──
  await prisma.purchaseOrderDet.create({ data: { idPurchaseOrder: po1.id, idProduct: prod1.id, quantity: 5, unitPrice: 9000, unitPriceUsd: 9000 / 72.00, subtotal: 45000, subtotalUsd: 45000 / 72.00, organizationId: org.id } });
  await prisma.purchaseOrderDet.create({ data: { idPurchaseOrder: po1.id, idProduct: prod2.id, quantity: 10, unitPrice: 3000, unitPriceUsd: 3000 / 72.00, subtotal: 30000, subtotalUsd: 30000 / 72.00, organizationId: org.id } });
  await prisma.purchaseOrderDet.create({ data: { idPurchaseOrder: po2.id, idProduct: prod4.id, quantity: 10, receivedQuantity: 10, unitPrice: 1500, unitPriceUsd: 20.83, subtotal: 15000, subtotalUsd: 208.33, organizationId: org.id } });
  await prisma.purchaseOrderDet.create({ data: { idPurchaseOrder: po2.id, idProduct: prod5.id, quantity: 20, receivedQuantity: 20, unitPrice: 1000, unitPriceUsd: 13.89, subtotal: 20000, subtotalUsd: 277.78, organizationId: org.id } });
  logger.log('Purchase order details created');

  // ── Accounts Payable ──
  await prisma.accountsPayable.create({
    data: { idPurchaseOrder: po1.id, dueDate: new Date('2025-02-15'), issueDate: new Date('2025-01-15'), amount: 75000, amountUsd: 75000 / 72.00, exchangeRate: 72.00, status: 1, organizationId: org.id },
  });
  logger.log('Accounts payable created');

  // ── Backfill totalExistence ──
  const products = await prisma.product.findMany({ select: { id: true } });
  for (const p of products) {
    const result = await prisma.stock.aggregate({ where: { idProduct: p.id }, _sum: { existence: true } });
    await prisma.product.update({ where: { id: p.id }, data: { totalExistence: result._sum.existence ?? 0 } });
  }
  logger.log('totalExistence backfilled');

  logger.log('✅ Seed completed successfully');
}

main()
  .then(async () => { await prisma.$disconnect(); })
  .catch(async (e) => { logger.error(e); await prisma.$disconnect(); process.exit(1); });
