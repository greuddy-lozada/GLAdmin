import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // ── Roles ──
  const masterRole = await prisma.role.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, name: 'Master', slug: 'master' },
  });
  const adminRole = await prisma.role.upsert({
    where: { id: 2 },
    update: {},
    create: { id: 2, name: 'Administrador', slug: 'admin' },
  });
  const employeeRole = await prisma.role.upsert({
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
      firstName: 'Greuddy',
      lastName: 'Lozada',
      userName: 'glozada',
      password,
      email: 'admin@gladmin.com',
      idRole: 1,
      available: true,
    },
  });
  console.log('Admin user created');

  // ── Currencies ──
  const currencies = [
    { id: 1, code: 'DOP', name: 'Peso Dominicano', symbol: 'RD$' },
    { id: 2, code: 'USD', name: 'Dólar Americano', symbol: 'US$' },
    { id: 3, code: 'EUR', name: 'Euro', symbol: '€' },
  ];
  for (const c of currencies) {
    await prisma.currency.upsert({
      where: { id: c.id },
      update: {},
      create: c,
    });
  }
  console.log('Currencies created');

  // ── Taxes ──
  const itbis = await prisma.tax.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, name: 'ITBIS 18%', percentage: 18, formula: 'monto * 0.18' },
  });
  const exento = await prisma.tax.upsert({
    where: { id: 2 },
    update: {},
    create: { id: 2, name: 'Exento', percentage: 0 },
  });
  console.log('Taxes created');

  // ── Customers ──
  await prisma.customer.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      idCardNumber: '001-1234567-8',
      firstName: 'Juan',
      lastName: 'Pérez',
      address: 'Calle Principal #42, Santo Domingo',
      phoneNumber: '809-555-0101',
      email: 'juan.perez@email.com',
    },
  });
  await prisma.customer.upsert({
    where: { id: 2 },
    update: {},
    create: {
      id: 2,
      idCardNumber: '002-8765432-1',
      firstName: 'María',
      lastName: 'González',
      address: 'Av. Independencia #100, Santiago',
      phoneNumber: '809-555-0202',
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
      documentNumber: '101-12345-6',
      companyName: 'Distribuidora Nacional SRL',
      firstName: 'Carlos',
      lastName: 'Martínez',
      address: 'Zona Industrial de Herrera, Nave 5',
      phoneNumber: '809-555-0303',
      email: 'carlos@distribuidoranacional.com',
    },
  });
  await prisma.supplier.upsert({
    where: { id: 2 },
    update: {},
    create: {
      id: 2,
      documentNumber: '102-98765-4',
      companyName: 'Importadora del Caribe SA',
      firstName: 'Ana',
      lastName: 'Ramírez',
      address: 'Av. 27 de Febrero #350, Santo Domingo',
      phoneNumber: '809-555-0404',
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
      documentNumber: '101-23456-7',
      name: 'GLAdmin Solutions SRL',
      address: 'Av. Abraham Lincoln #500, Santo Domingo',
      phoneNumber: '809-555-0000',
      email: 'info@gladmin.com',
      website: 'https://gladmin.com',
    },
  });
  console.log('Company created');

  // ── Products ──
  await prisma.product.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, code: 'PROD-001', name: 'Laptop HP ProBook 450', price: 45000, dollarPrice: 750, idTax: 1, observation: 'Garantía 1 año', available: true },
  });
  await prisma.product.upsert({
    where: { id: 2 },
    update: {},
    create: { id: 2, code: 'PROD-002', name: 'Monitor LG 24" Full HD', price: 12000, dollarPrice: 200, idTax: 1, available: true },
  });
  await prisma.product.upsert({
    where: { id: 3 },
    update: {},
    create: { id: 3, code: 'PROD-003', name: 'Teclado Mecánico Redragon', price: 2500, idTax: 1, available: true },
  });
  await prisma.product.upsert({
    where: { id: 4 },
    update: {},
    create: { id: 4, code: 'PROD-004', name: 'Mouse Inalámbrico Logitech', price: 1800, idTax: 1, available: true },
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
    create: { id: 1, idProduct: 1, idSupplier: 1, idBatch: 1, existence: 15, available: true },
  });
  await prisma.stock.upsert({
    where: { id: 2 },
    update: {},
    create: { id: 2, idProduct: 2, idSupplier: 1, idBatch: 1, existence: 30, available: true },
  });
  await prisma.stock.upsert({
    where: { id: 3 },
    update: {},
    create: { id: 3, idProduct: 3, idSupplier: 2, idBatch: 2, existence: 50, available: true },
  });
  console.log('Stocks created');

  // ── Stock Details ──
  await prisma.stockDet.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, idStock: 1, type: 1, quantity: 15, observation: 'Entrada inicial' },
  });
  await prisma.stockDet.upsert({
    where: { id: 2 },
    update: {},
    create: { id: 2, idStock: 2, type: 1, quantity: 30, observation: 'Entrada inicial' },
  });
  await prisma.stockDet.upsert({
    where: { id: 3 },
    update: {},
    create: { id: 3, idStock: 3, type: 1, quantity: 50, observation: 'Entrada inicial' },
  });
  console.log('Stock details created');

  // ── Purchase Order ──
  await prisma.purchaseOrder.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      idSupplier: 1,
      code: 'OC-2025-001',
      date: new Date('2025-01-15'),
      amount: 75000,
      paymentMethod: 1,
      status: 2,
    },
  });
  console.log('Purchase order created');

  // ── Purchase Order Details ──
  await prisma.purchaseOrderDet.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, idPurchaseOrder: 1, idProduct: 1, quantity: 5, subtotal: 45000, observation: 'Para oficina principal' },
  });
  await prisma.purchaseOrderDet.upsert({
    where: { id: 2 },
    update: {},
    create: { id: 2, idPurchaseOrder: 1, idProduct: 2, quantity: 10, subtotal: 30000 },
  });
  console.log('Purchase order details created');

  // ── Foreign Exchange ──
  await prisma.foreignExchange.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, value: 60.50, idCurrency: 2 },
  });
  console.log('Foreign exchange rates created');

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
