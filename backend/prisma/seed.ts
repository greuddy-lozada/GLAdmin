import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

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
    create: { id: 2, name: 'Administrador', slug: 'admin' },
  });
  await prisma.role.upsert({
    where: { id: 3 },
    update: {},
    create: { id: 3, name: 'Empleado', slug: 'employee' },
  });
  console.log('Roles created');

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
  console.log('Admin user created');

  // ── Currencies ──
  for (const c of [
    { id: 1, code: 'VED', name: 'Bolívar Soberano', symbol: 'Bs.' },
    { id: 2, code: 'USD', name: 'Dólar Americano', symbol: 'US$' },
    { id: 3, code: 'EUR', name: 'Euro', symbol: '€' },
  ]) {
    await prisma.currency.upsert({ where: { id: c.id }, update: {}, create: c });
  }
  console.log('Currencies created');

  // ── Exchange Rates ──
  await prisma.exchangeRate.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, rate: 60.50, currencyId: 2, type: 'official', date: new Date('2026-05-20'), source: 'BCV' },
  });
  await prisma.exchangeRate.upsert({
    where: { id: 2 },
    update: {},
    create: { id: 2, rate: 72.00, currencyId: 2, type: 'paralelo', date: new Date('2026-05-20'), source: 'dolartoday' },
  });
  console.log('Exchange rates created');

  // ── Taxes (Venezuela: IVA) ──
  await prisma.tax.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, name: 'IVA 16%', percentage: 16, formula: 'base * 0.16' },
  });
  await prisma.tax.upsert({
    where: { id: 2 },
    update: {},
    create: { id: 2, name: 'IVA 8%', percentage: 8, formula: 'base * 0.08' },
  });
  await prisma.tax.upsert({
    where: { id: 3 },
    update: {},
    create: { id: 3, name: 'Exento', percentage: 0 },
  });
  console.log('Taxes created');

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
    },
  });
  console.log('Customers created');

  // ── Suppliers ──
  await prisma.supplier.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      documentNumber: 'J-12345678-9',
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
    },
  });
  await prisma.supplier.upsert({
    where: { id: 2 },
    update: {},
    create: {
      id: 2,
      documentNumber: 'J-98765432-1',
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
    },
  });
  console.log('Suppliers created');

  // ── Company ──
  await prisma.company.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      documentNumber: 'J-40123456-7',
      name: 'GLAdmin Solutions C.A.',
      address: 'Av. Abraham Lincoln, Torre GLAdmin, Caracas',
      phoneNumber: '0212-555-0000',
      email: 'info@gladmin.com',
      website: 'https://gladmin.com',
    },
  });
  console.log('Company created');

  // ── Products (prices in VED) ──
  await prisma.product.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, code: 'PROD-001', name: 'Laptop HP ProBook 450', price: 45000, dollarPrice: 750, idTax: 1, available: true },
  });
  await prisma.product.upsert({
    where: { id: 2 },
    update: {},
    create: { id: 2, code: 'PROD-002', name: 'Monitor LG 24" Full HD', price: 12000, dollarPrice: 200, idTax: 1, available: true },
  });
  await prisma.product.upsert({
    where: { id: 3 },
    update: {},
    create: { id: 3, code: 'PROD-003', name: 'Teclado Mecánico Redragon', price: 2500, idTax: 3, available: true },
  });
  await prisma.product.upsert({
    where: { id: 4 },
    update: {},
    create: { id: 4, code: 'PROD-004', name: 'Mouse Inalámbrico Logitech', price: 1800, idTax: 3, available: true },
  });
  await prisma.product.upsert({
    where: { id: 5 },
    update: {},
    create: { id: 5, code: 'PROD-005', name: 'Webcam HD 1080p', price: 3200, dollarPrice: 55, idTax: 2, available: true },
  });
  console.log('Products created');

  // ── Batches ──
  await prisma.batch.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, code: 'LOTE-2025-001', description: 'Lote inicial enero 2025' },
  });
  await prisma.batch.upsert({
    where: { id: 2 },
    update: {},
    create: { id: 2, code: 'LOTE-2025-002', description: 'Lote marzo 2025' },
  });
  console.log('Batches created');

  // ── Stocks ──
  await prisma.stock.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, idProduct: 1, idSupplier: 1, idBatch: 1, existence: 15 },
  });
  await prisma.stock.upsert({
    where: { id: 2 },
    update: {},
    create: { id: 2, idProduct: 2, idSupplier: 1, idBatch: 1, existence: 30 },
  });
  await prisma.stock.upsert({
    where: { id: 3 },
    update: {},
    create: { id: 3, idProduct: 3, idSupplier: 2, idBatch: 2, existence: 50 },
  });
  console.log('Stocks created');

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
    },
  });
  console.log('Purchase order created');

  // ── Purchase Order Details (multi-currency) ──
  await prisma.purchaseOrderDet.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, idPurchaseOrder: 1, idProduct: 1, quantity: 5, unitPrice: 9000, unitPriceUsd: 9000 / 72.00, subtotal: 45000, subtotalUsd: 45000 / 72.00 },
  });
  await prisma.purchaseOrderDet.upsert({
    where: { id: 2 },
    update: {},
    create: { id: 2, idPurchaseOrder: 1, idProduct: 2, quantity: 10, unitPrice: 3000, unitPriceUsd: 3000 / 72.00, subtotal: 30000, subtotalUsd: 30000 / 72.00 },
  });
  console.log('Purchase order details created');

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
    },
  });
  console.log('Accounts payable created');

  console.log('✅ Seed completed successfully');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
