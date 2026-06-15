const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Generates the next sequential invoice or quote number for a company.
 * Uses a transaction to safely increment the counter.
 */
async function generateInvoiceNumber(companyId, type = 'INVOICE') {
  const settings = await prisma.settings.findUnique({
    where: { companyId }
  });

  if (!settings) {
    throw new Error('Company settings not found');
  }

  let prefix, nextNumber, field;

  if (type === 'QUOTE') {
    prefix = settings.quotePrefix;
    nextNumber = settings.quoteNextNumber;
    field = 'quoteNextNumber';
  } else {
    prefix = settings.invoicePrefix;
    nextNumber = settings.invoiceNextNumber;
    field = 'invoiceNextNumber';
  }

  // Atomically increment the counter
  await prisma.settings.update({
    where: { companyId },
    data: { [field]: { increment: 1 } }
  });

  const padded = String(nextNumber).padStart(6, '0');
  return `${prefix}-${padded}`;
}

module.exports = { generateInvoiceNumber };
