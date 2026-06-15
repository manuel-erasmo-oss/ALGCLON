const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const list = async (req, res) => {
  try {
    const bankAccounts = await prisma.bankAccount.findMany({
      where: { companyId: req.companyId, active: true },
      include: {
        _count: { select: { transactions: true } }
      },
      orderBy: { name: 'asc' }
    });

    // Compute real-time balance from transactions for each account
    const accountsWithBalance = await Promise.all(
      bankAccounts.map(async (acc) => {
        const balance = await computeBalance(acc.id);
        return { ...acc, computedBalance: balance };
      })
    );

    res.json({ data: accountsWithBalance });
  } catch (err) {
    console.error('Banks list error:', err);
    res.status(500).json({ error: 'Failed to fetch bank accounts' });
  }
};

const create = async (req, res) => {
  try {
    const { name, bank, accountNumber, balance = 0, currency = 'COP' } = req.body;

    const bankAccount = await prisma.bankAccount.create({
      data: {
        companyId: req.companyId,
        name,
        bank: bank || null,
        accountNumber: accountNumber || null,
        balance: parseFloat(balance) || 0,
        currency,
        active: true
      }
    });

    // If initial balance is positive, create opening transaction
    if (parseFloat(balance) > 0) {
      await prisma.bankTransaction.create({
        data: {
          bankAccountId: bankAccount.id,
          description: 'Saldo inicial',
          amount: parseFloat(balance),
          type: 'CREDIT',
          reconciled: true,
          reference: 'OPENING'
        }
      });
    }

    res.status(201).json(bankAccount);
  } catch (err) {
    console.error('Bank create error:', err);
    res.status(500).json({ error: 'Failed to create bank account' });
  }
};

const getTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 20, reconciled, dateFrom, dateTo } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Verify bank account belongs to company
    const bankAccount = await prisma.bankAccount.findFirst({
      where: { id: req.params.id, companyId: req.companyId }
    });

    if (!bankAccount) {
      return res.status(404).json({ error: 'Bank account not found' });
    }

    const where = { bankAccountId: req.params.id };
    if (reconciled !== undefined) where.reconciled = reconciled === 'true';
    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date.gte = new Date(dateFrom);
      if (dateTo) where.date.lte = new Date(dateTo);
    }

    const [transactions, total] = await Promise.all([
      prisma.bankTransaction.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
          contact: { select: { id: true, name: true } }
        },
        orderBy: { date: 'desc' }
      }),
      prisma.bankTransaction.count({ where })
    ]);

    const currentBalance = await computeBalance(req.params.id);

    res.json({
      bankAccount: { ...bankAccount, currentBalance },
      data: transactions,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    console.error('Get transactions error:', err);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
};

const addTransaction = async (req, res) => {
  try {
    const bankAccount = await prisma.bankAccount.findFirst({
      where: { id: req.params.id, companyId: req.companyId }
    });

    if (!bankAccount) {
      return res.status(404).json({ error: 'Bank account not found' });
    }

    const { description, amount, type, date, reference, contactId } = req.body;

    const transaction = await prisma.bankTransaction.create({
      data: {
        bankAccountId: req.params.id,
        description,
        amount: parseFloat(amount),
        type,
        date: date ? new Date(date) : new Date(),
        reconciled: false,
        reference: reference || null,
        contactId: contactId || null
      },
      include: {
        contact: { select: { id: true, name: true } }
      }
    });

    res.status(201).json(transaction);
  } catch (err) {
    console.error('Add transaction error:', err);
    res.status(500).json({ error: 'Failed to add transaction' });
  }
};

const reconcileTransaction = async (req, res) => {
  try {
    const transaction = await prisma.bankTransaction.findUnique({
      where: { id: req.params.txId },
      include: { bankAccount: true }
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    if (transaction.bankAccount.companyId !== req.companyId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const updated = await prisma.bankTransaction.update({
      where: { id: req.params.txId },
      data: { reconciled: !transaction.reconciled }
    });

    res.json(updated);
  } catch (err) {
    console.error('Reconcile transaction error:', err);
    res.status(500).json({ error: 'Failed to reconcile transaction' });
  }
};

// Helper: compute current balance from transactions
async function computeBalance(bankAccountId) {
  const result = await prisma.bankTransaction.groupBy({
    by: ['type'],
    where: { bankAccountId },
    _sum: { amount: true }
  });

  let balance = 0;
  result.forEach(r => {
    const amount = r._sum.amount || 0;
    if (r.type === 'CREDIT') balance += amount;
    if (r.type === 'DEBIT') balance -= amount;
  });

  return balance;
}

module.exports = { list, create, getTransactions, addTransaction, reconcileTransaction };
