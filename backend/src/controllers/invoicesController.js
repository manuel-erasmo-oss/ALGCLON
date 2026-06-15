const { PrismaClient } = require('@prisma/client');
const { generateInvoiceNumber } = require('../utils/generateNumber');

const prisma = new PrismaClient();

const list = async (req, res) => {
  try {
    const { status, type, contactId, dateFrom, dateTo, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = { companyId: req.companyId };

    if (status) where.status = status;
    if (type) where.type = type;
    if (contactId) where.contactId = contactId;

    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date.gte = new Date(dateFrom);
      if (dateTo) where.date.lte = new Date(dateTo);
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
          contact: { select: { id: true, name: true, email: true } },
          _count: { select: { items: true } }
        },
        orderBy: { date: 'desc' }
      }),
      prisma.invoice.count({ where })
    ]);

    res.json({
      data: invoices,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    console.error('Invoices list error:', err);
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
};

const create = async (req, res) => {
  try {
    const { contactId, type = 'INVOICE', date, dueDate, notes, items } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'At least one item is required' });
    }

    // Calculate totals
    let subtotal = 0;
    let taxAmount = 0;

    const processedItems = items.map(item => {
      const qty = parseFloat(item.quantity) || 1;
      const price = parseFloat(item.price) || 0;
      const taxRate = parseFloat(item.taxRate) || 0;
      const lineTotal = qty * price;
      const lineTax = lineTotal * (taxRate / 100);

      subtotal += lineTotal;
      taxAmount += lineTax;

      return {
        productId: item.productId || null,
        description: item.description,
        quantity: qty,
        price,
        taxRate,
        total: lineTotal + lineTax
      };
    });

    const total = subtotal + taxAmount;

    // Generate sequential number
    const number = await generateInvoiceNumber(req.companyId, type === 'QUOTE' ? 'QUOTE' : 'INVOICE');

    // Create invoice with items in a transaction
    const invoice = await prisma.$transaction(async (tx) => {
      const inv = await tx.invoice.create({
        data: {
          companyId: req.companyId,
          contactId: contactId || null,
          number,
          type,
          date: date ? new Date(date) : new Date(),
          dueDate: dueDate ? new Date(dueDate) : null,
          status: 'DRAFT',
          subtotal,
          taxAmount,
          total,
          notes: notes || null,
          items: {
            create: processedItems
          }
        },
        include: {
          items: { include: { product: true } },
          contact: true
        }
      });

      // Auto-create journal entry for INVOICE type (not QUOTE)
      if (type === 'INVOICE' && contactId) {
        await createInvoiceJournalEntry(tx, req.companyId, inv);
      }

      return inv;
    });

    res.status(201).json(invoice);
  } catch (err) {
    console.error('Invoice create error:', err);
    res.status(500).json({ error: 'Failed to create invoice', detail: err.message });
  }
};

const getOne = async (req, res) => {
  try {
    const invoice = await prisma.invoice.findFirst({
      where: { id: req.params.id, companyId: req.companyId },
      include: {
        items: {
          include: { product: { select: { id: true, name: true, unit: true } } }
        },
        contact: true,
        journalEntries: {
          include: { lines: { include: { account: true } } }
        }
      }
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    res.json(invoice);
  } catch (err) {
    console.error('Invoice getOne error:', err);
    res.status(500).json({ error: 'Failed to fetch invoice' });
  }
};

const update = async (req, res) => {
  try {
    const existing = await prisma.invoice.findFirst({
      where: { id: req.params.id, companyId: req.companyId }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    if (existing.status !== 'DRAFT') {
      return res.status(400).json({ error: 'Only DRAFT invoices can be edited' });
    }

    const { contactId, type, date, dueDate, notes, items } = req.body;

    let updateData = {
      contactId: contactId !== undefined ? (contactId || null) : existing.contactId,
      type: type || existing.type,
      date: date ? new Date(date) : existing.date,
      dueDate: dueDate ? new Date(dueDate) : existing.dueDate,
      notes: notes !== undefined ? notes : existing.notes
    };

    if (items && items.length > 0) {
      let subtotal = 0;
      let taxAmount = 0;

      const processedItems = items.map(item => {
        const qty = parseFloat(item.quantity) || 1;
        const price = parseFloat(item.price) || 0;
        const taxRate = parseFloat(item.taxRate) || 0;
        const lineTotal = qty * price;
        const lineTax = lineTotal * (taxRate / 100);

        subtotal += lineTotal;
        taxAmount += lineTax;

        return {
          productId: item.productId || null,
          description: item.description,
          quantity: qty,
          price,
          taxRate,
          total: lineTotal + lineTax
        };
      });

      updateData.subtotal = subtotal;
      updateData.taxAmount = taxAmount;
      updateData.total = subtotal + taxAmount;

      // Delete old items and recreate
      await prisma.invoiceItem.deleteMany({ where: { invoiceId: existing.id } });
      updateData.items = { create: processedItems };
    }

    const invoice = await prisma.invoice.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        items: { include: { product: true } },
        contact: true
      }
    });

    res.json(invoice);
  } catch (err) {
    console.error('Invoice update error:', err);
    res.status(500).json({ error: 'Failed to update invoice' });
  }
};

const send = async (req, res) => {
  try {
    const existing = await prisma.invoice.findFirst({
      where: { id: req.params.id, companyId: req.companyId }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    if (!['DRAFT'].includes(existing.status)) {
      return res.status(400).json({ error: 'Only DRAFT invoices can be sent' });
    }

    const invoice = await prisma.invoice.update({
      where: { id: req.params.id },
      data: { status: 'SENT' }
    });

    res.json(invoice);
  } catch (err) {
    console.error('Invoice send error:', err);
    res.status(500).json({ error: 'Failed to send invoice' });
  }
};

const pay = async (req, res) => {
  try {
    const existing = await prisma.invoice.findFirst({
      where: { id: req.params.id, companyId: req.companyId },
      include: { items: true }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    if (!['SENT', 'OVERDUE'].includes(existing.status)) {
      return res.status(400).json({ error: 'Only SENT or OVERDUE invoices can be marked as paid' });
    }

    const invoice = await prisma.$transaction(async (tx) => {
      const updated = await tx.invoice.update({
        where: { id: req.params.id },
        data: { status: 'PAID' }
      });

      // Create payment journal entry
      await createPaymentJournalEntry(tx, req.companyId, existing);

      return updated;
    });

    res.json(invoice);
  } catch (err) {
    console.error('Invoice pay error:', err);
    res.status(500).json({ error: 'Failed to mark invoice as paid' });
  }
};

const cancel = async (req, res) => {
  try {
    const existing = await prisma.invoice.findFirst({
      where: { id: req.params.id, companyId: req.companyId }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    if (existing.status === 'PAID') {
      return res.status(400).json({ error: 'Paid invoices cannot be cancelled' });
    }

    const invoice = await prisma.invoice.update({
      where: { id: req.params.id },
      data: { status: 'CANCELLED' }
    });

    res.json(invoice);
  } catch (err) {
    console.error('Invoice cancel error:', err);
    res.status(500).json({ error: 'Failed to cancel invoice' });
  }
};

const remove = async (req, res) => {
  try {
    const existing = await prisma.invoice.findFirst({
      where: { id: req.params.id, companyId: req.companyId }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    if (existing.status !== 'DRAFT') {
      return res.status(400).json({ error: 'Only DRAFT invoices can be deleted' });
    }

    await prisma.invoice.delete({ where: { id: req.params.id } });

    res.json({ message: 'Invoice deleted successfully' });
  } catch (err) {
    console.error('Invoice delete error:', err);
    res.status(500).json({ error: 'Failed to delete invoice' });
  }
};

// Helper: find account by code for this company
async function findAccount(tx, companyId, code) {
  const account = await tx.account.findFirst({
    where: { companyId, code }
  });
  return account;
}

// Helper: create journal entry when invoice is created
async function createInvoiceJournalEntry(tx, companyId, invoice) {
  try {
    const clientsAccount = await findAccount(tx, companyId, '1305'); // Clientes
    const incomeAccount = await findAccount(tx, companyId, '4135');  // Comercio al por mayor
    const ivaAccount = await findAccount(tx, companyId, '2408');     // IVA por pagar

    if (!clientsAccount || !incomeAccount) return;

    const lines = [];

    // Debit clients account (full total)
    lines.push({
      accountId: clientsAccount.id,
      debit: invoice.total,
      credit: 0,
      description: `Factura ${invoice.number}`
    });

    // Credit income account (subtotal)
    lines.push({
      accountId: incomeAccount.id,
      debit: 0,
      credit: invoice.subtotal,
      description: `Ingresos factura ${invoice.number}`
    });

    // Credit IVA account (tax amount) if applicable
    if (invoice.taxAmount > 0 && ivaAccount) {
      lines.push({
        accountId: ivaAccount.id,
        debit: 0,
        credit: invoice.taxAmount,
        description: `IVA factura ${invoice.number}`
      });
    }

    await tx.journalEntry.create({
      data: {
        companyId,
        invoiceId: invoice.id,
        date: invoice.date,
        description: `Factura de venta ${invoice.number}`,
        reference: invoice.number,
        lines: { create: lines }
      }
    });

    // Update account balances
    await tx.account.update({
      where: { id: clientsAccount.id },
      data: { balance: { increment: invoice.total } }
    });
    await tx.account.update({
      where: { id: incomeAccount.id },
      data: { balance: { increment: invoice.subtotal } }
    });
    if (invoice.taxAmount > 0 && ivaAccount) {
      await tx.account.update({
        where: { id: ivaAccount.id },
        data: { balance: { increment: invoice.taxAmount } }
      });
    }
  } catch (err) {
    console.error('Error creating invoice journal entry:', err);
    // Don't throw — journal entries are supplementary
  }
}

// Helper: create journal entry when invoice is paid
async function createPaymentJournalEntry(tx, companyId, invoice) {
  try {
    const bankAccount = await findAccount(tx, companyId, '1110');   // Bancos
    const clientsAccount = await findAccount(tx, companyId, '1305'); // Clientes

    if (!bankAccount || !clientsAccount) return;

    await tx.journalEntry.create({
      data: {
        companyId,
        invoiceId: invoice.id,
        date: new Date(),
        description: `Pago recibido factura ${invoice.number}`,
        reference: invoice.number,
        lines: {
          create: [
            {
              accountId: bankAccount.id,
              debit: invoice.total,
              credit: 0,
              description: `Pago factura ${invoice.number}`
            },
            {
              accountId: clientsAccount.id,
              debit: 0,
              credit: invoice.total,
              description: `Cancelación cartera ${invoice.number}`
            }
          ]
        }
      }
    });

    // Update balances
    await tx.account.update({
      where: { id: bankAccount.id },
      data: { balance: { increment: invoice.total } }
    });
    await tx.account.update({
      where: { id: clientsAccount.id },
      data: { balance: { decrement: invoice.total } }
    });
  } catch (err) {
    console.error('Error creating payment journal entry:', err);
  }
}

module.exports = { list, create, getOne, update, send, pay, cancel, remove };
