const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const PUC_ACCOUNTS = [
  // ACTIVOS
  { code: '1', name: 'ACTIVOS', type: 'ASSET', parentCode: null },
  { code: '11', name: 'EFECTIVO Y EQUIVALENTES', type: 'ASSET', parentCode: '1' },
  { code: '1105', name: 'Caja', type: 'ASSET', parentCode: '11' },
  { code: '1110', name: 'Bancos', type: 'ASSET', parentCode: '11' },
  { code: '13', name: 'DEUDORES', type: 'ASSET', parentCode: '1' },
  { code: '1305', name: 'Clientes', type: 'ASSET', parentCode: '13' },
  { code: '15', name: 'INVENTARIOS', type: 'ASSET', parentCode: '1' },
  { code: '1505', name: 'Mercancías', type: 'ASSET', parentCode: '15' },
  // PASIVOS
  { code: '2', name: 'PASIVOS', type: 'LIABILITY', parentCode: null },
  { code: '21', name: 'OBLIGACIONES FINANCIERAS', type: 'LIABILITY', parentCode: '2' },
  { code: '22', name: 'PROVEEDORES', type: 'LIABILITY', parentCode: '2' },
  { code: '2205', name: 'Proveedores nacionales', type: 'LIABILITY', parentCode: '22' },
  { code: '24', name: 'IMPUESTOS POR PAGAR', type: 'LIABILITY', parentCode: '2' },
  { code: '2408', name: 'IVA por pagar', type: 'LIABILITY', parentCode: '24' },
  // PATRIMONIO
  { code: '3', name: 'PATRIMONIO', type: 'EQUITY', parentCode: null },
  { code: '31', name: 'CAPITAL SOCIAL', type: 'EQUITY', parentCode: '3' },
  { code: '3105', name: 'Capital social', type: 'EQUITY', parentCode: '31' },
  { code: '37', name: 'RESULTADOS DEL EJERCICIO', type: 'EQUITY', parentCode: '3' },
  { code: '3705', name: 'Utilidad del ejercicio', type: 'EQUITY', parentCode: '37' },
  // INGRESOS
  { code: '4', name: 'INGRESOS', type: 'INCOME', parentCode: null },
  { code: '41', name: 'OPERACIONALES', type: 'INCOME', parentCode: '4' },
  { code: '4135', name: 'Comercio al por mayor', type: 'INCOME', parentCode: '41' },
  // GASTOS
  { code: '5', name: 'GASTOS', type: 'EXPENSE', parentCode: null },
  { code: '51', name: 'OPERACIONALES DE ADMINISTRACIÓN', type: 'EXPENSE', parentCode: '5' },
  { code: '5105', name: 'Gastos de personal', type: 'EXPENSE', parentCode: '51' },
];

async function seedAccountsForCompany(companyId) {
  // Check if accounts already exist
  const existing = await prisma.account.count({ where: { companyId } });
  if (existing > 0) {
    console.log(`Company ${companyId} already has accounts seeded.`);
    return;
  }

  // First pass: create all accounts without parents
  const createdMap = {};

  for (const acc of PUC_ACCOUNTS) {
    const created = await prisma.account.create({
      data: {
        companyId,
        code: acc.code,
        name: acc.name,
        type: acc.type,
        active: true,
        balance: 0
      }
    });
    createdMap[acc.code] = created.id;
  }

  // Second pass: set parent relationships
  for (const acc of PUC_ACCOUNTS) {
    if (acc.parentCode && createdMap[acc.parentCode] && createdMap[acc.code]) {
      await prisma.account.update({
        where: { id: createdMap[acc.code] },
        data: { parentId: createdMap[acc.parentCode] }
      });
    }
  }

  console.log(`Seeded ${PUC_ACCOUNTS.length} accounts for company ${companyId}`);
  return createdMap;
}

// If run directly, seed for all companies
async function main() {
  const companies = await prisma.company.findMany();
  if (companies.length === 0) {
    console.log('No companies found. Register a company first.');
    return;
  }
  for (const company of companies) {
    await seedAccountsForCompany(company.id);
  }
}

if (require.main === module) {
  main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
}

module.exports = { seedAccountsForCompany, PUC_ACCOUNTS };
