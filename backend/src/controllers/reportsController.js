const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Utility: get date range for current month
function currentMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  return { start, end };
}

// Utility: get start of N months ago
function monthsAgo(n) {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

const dashboard = async (req, res) => {
  try {
    const companyId = req.companyId;
    const { start, end } = currentMonthRange();

    // KPIs for current month
    const [
      invoicedThisMonth,
      paidThisMonth,
      pendingInvoices,
      overdueInvoices,
      totalContacts,
      totalProducts
    ] = await Promise.all([
      // Total invoiced this month (SENT + PAID invoices)
      prisma.invoice.aggregate({
        where: {
          companyId,
          type: 'INVOICE',
          date: { gte: start, lte: end },
          status: { in: ['SENT', 'PAID', 'OVERDUE'] }
        },
        _sum: { total: true },
        _count: true
      }),

      // Total paid this month
      prisma.invoice.aggregate({
        where: {
          companyId,
          type: 'INVOICE',
          date: { gte: start, lte: end },
          status: 'PAID'
        },
        _sum: { total: true },
        _count: true
      }),

      // Pending (SENT)
      prisma.invoice.aggregate({
        where: {
          companyId,
          type: 'INVOICE',
          status: 'SENT'
        },
        _sum: { total: true },
        _count: true
      }),

      // Overdue
      prisma.invoice.aggregate({
        where: {
          companyId,
          type: 'INVOICE',
          status: 'OVERDUE'
        },
        _sum: { total: true },
        _count: true
      }),

      prisma.contact.count({ where: { companyId, active: true } }),
      prisma.product.count({ where: { companyId, active: true } })
    ]);

    // Last 6 months chart data
    const chartData = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date();
      monthStart.setMonth(monthStart.getMonth() - i);
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);
      monthEnd.setDate(0);
      monthEnd.setHours(23, 59, 59, 999);

      const [invoiced, paid] = await Promise.all([
        prisma.invoice.aggregate({
          where: {
            companyId,
            type: 'INVOICE',
            date: { gte: monthStart, lte: monthEnd },
            status: { in: ['SENT', 'PAID', 'OVERDUE'] }
          },
          _sum: { total: true }
        }),
        prisma.invoice.aggregate({
          where: {
            companyId,
            type: 'INVOICE',
            date: { gte: monthStart, lte: monthEnd },
            status: 'PAID'
          },
          _sum: { total: true }
        })
      ]);

      chartData.push({
        month: monthStart.toLocaleString('es-CO', { month: 'short', year: 'numeric' }),
        monthDate: monthStart.toISOString().slice(0, 7),
        invoiced: invoiced._sum.total || 0,
        paid: paid._sum.total || 0
      });
    }

    // Recent invoices
    const recentInvoices = await prisma.invoice.findMany({
      where: { companyId, type: 'INVOICE' },
      include: { contact: { select: { id: true, name: true } } },
      orderBy: { date: 'desc' },
      take: 5
    });

    res.json({
      kpis: {
        invoicedThisMonth: {
          amount: invoicedThisMonth._sum.total || 0,
          count: invoicedThisMonth._count || 0
        },
        paidThisMonth: {
          amount: paidThisMonth._sum.total || 0,
          count: paidThisMonth._count || 0
        },
        pending: {
          amount: pendingInvoices._sum.total || 0,
          count: pendingInvoices._count || 0
        },
        overdue: {
          amount: overdueInvoices._sum.total || 0,
          count: overdueInvoices._count || 0
        },
        totalContacts,
        totalProducts
      },
      chartData,
      recentInvoices
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: 'Failed to generate dashboard' });
  }
};

const incomeStatement = async (req, res) => {
  try {
    const companyId = req.companyId;
    const { from, to } = req.query;

    const dateFrom = from ? new Date(from) : new Date(new Date().getFullYear(), 0, 1);
    const dateTo = to ? new Date(to) : new Date();

    // Get all income and expense accounts
    const accounts = await prisma.account.findMany({
      where: {
        companyId,
        type: { in: ['INCOME', 'EXPENSE'] },
        active: true
      },
      orderBy: { code: 'asc' }
    });

    // Get journal entry lines for these accounts in the date range
    const entries = await prisma.journalEntryLine.findMany({
      where: {
        accountId: { in: accounts.map(a => a.id) },
        entry: {
          companyId,
          date: { gte: dateFrom, lte: dateTo }
        }
      },
      include: {
        account: true,
        entry: { select: { date: true, description: true } }
      }
    });

    // Aggregate by account
    const accountTotals = {};
    entries.forEach(line => {
      const acc = line.account;
      if (!accountTotals[acc.id]) {
        accountTotals[acc.id] = {
          id: acc.id,
          code: acc.code,
          name: acc.name,
          type: acc.type,
          total: 0
        };
      }
      // For INCOME: credit increases (positive), debit decreases (negative)
      // For EXPENSE: debit increases (positive), credit decreases (negative)
      if (acc.type === 'INCOME') {
        accountTotals[acc.id].total += line.credit - line.debit;
      } else {
        accountTotals[acc.id].total += line.debit - line.credit;
      }
    });

    const incomeAccounts = Object.values(accountTotals).filter(a => a.type === 'INCOME');
    const expenseAccounts = Object.values(accountTotals).filter(a => a.type === 'EXPENSE');

    const totalIncome = incomeAccounts.reduce((sum, a) => sum + a.total, 0);
    const totalExpenses = expenseAccounts.reduce((sum, a) => sum + a.total, 0);
    const netIncome = totalIncome - totalExpenses;

    // Also include invoice data as cross-check
    const invoiceData = await prisma.invoice.aggregate({
      where: {
        companyId,
        type: 'INVOICE',
        status: 'PAID',
        date: { gte: dateFrom, lte: dateTo }
      },
      _sum: { subtotal: true, taxAmount: true, total: true },
      _count: true
    });

    res.json({
      period: { from: dateFrom, to: dateTo },
      income: {
        accounts: incomeAccounts,
        total: totalIncome,
        invoicedTotal: invoiceData._sum.subtotal || 0
      },
      expenses: {
        accounts: expenseAccounts,
        total: totalExpenses
      },
      netIncome,
      paidInvoicesCount: invoiceData._count || 0
    });
  } catch (err) {
    console.error('Income statement error:', err);
    res.status(500).json({ error: 'Failed to generate income statement' });
  }
};

const balanceSheet = async (req, res) => {
  try {
    const companyId = req.companyId;
    const { date } = req.query;
    const asOf = date ? new Date(date) : new Date();

    // Get all balance sheet accounts (ASSET, LIABILITY, EQUITY)
    const accounts = await prisma.account.findMany({
      where: {
        companyId,
        type: { in: ['ASSET', 'LIABILITY', 'EQUITY'] },
        active: true
      },
      orderBy: { code: 'asc' }
    });

    // Get journal lines up to this date
    const entries = await prisma.journalEntryLine.findMany({
      where: {
        accountId: { in: accounts.map(a => a.id) },
        entry: {
          companyId,
          date: { lte: asOf }
        }
      },
      include: { account: true }
    });

    // Aggregate balances
    const balances = {};
    accounts.forEach(acc => {
      balances[acc.id] = { ...acc, computedBalance: 0 };
    });

    entries.forEach(line => {
      const acc = line.account;
      if (!balances[acc.id]) return;

      if (['ASSET'].includes(acc.type)) {
        balances[acc.id].computedBalance += line.debit - line.credit;
      } else {
        balances[acc.id].computedBalance += line.credit - line.debit;
      }
    });

    const assets = Object.values(balances).filter(a => a.type === 'ASSET');
    const liabilities = Object.values(balances).filter(a => a.type === 'LIABILITY');
    const equity = Object.values(balances).filter(a => a.type === 'EQUITY');

    const totalAssets = assets.reduce((sum, a) => sum + a.computedBalance, 0);
    const totalLiabilities = liabilities.reduce((sum, a) => sum + a.computedBalance, 0);
    const totalEquity = equity.reduce((sum, a) => sum + a.computedBalance, 0);

    res.json({
      asOf,
      assets: { accounts: assets, total: totalAssets },
      liabilities: { accounts: liabilities, total: totalLiabilities },
      equity: { accounts: equity, total: totalEquity },
      liabilitiesAndEquity: totalLiabilities + totalEquity,
      balanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01
    });
  } catch (err) {
    console.error('Balance sheet error:', err);
    res.status(500).json({ error: 'Failed to generate balance sheet' });
  }
};

const cashFlow = async (req, res) => {
  try {
    const companyId = req.companyId;
    const { from, to } = req.query;

    const dateFrom = from ? new Date(from) : new Date(new Date().getFullYear(), 0, 1);
    const dateTo = to ? new Date(to) : new Date();

    // Cash inflows: paid invoices
    const inflows = await prisma.invoice.findMany({
      where: {
        companyId,
        type: 'INVOICE',
        status: 'PAID',
        date: { gte: dateFrom, lte: dateTo }
      },
      select: {
        id: true,
        number: true,
        date: true,
        total: true,
        contact: { select: { name: true } }
      },
      orderBy: { date: 'asc' }
    });

    // Bank transactions as cash flow
    const bankCredits = await prisma.bankTransaction.aggregate({
      where: {
        bankAccount: { companyId },
        type: 'CREDIT',
        date: { gte: dateFrom, lte: dateTo }
      },
      _sum: { amount: true },
      _count: true
    });

    const bankDebits = await prisma.bankTransaction.aggregate({
      where: {
        bankAccount: { companyId },
        type: 'DEBIT',
        date: { gte: dateFrom, lte: dateTo }
      },
      _sum: { amount: true },
      _count: true
    });

    const totalInflows = inflows.reduce((sum, inv) => sum + inv.total, 0);
    const netCash = (bankCredits._sum.amount || 0) - (bankDebits._sum.amount || 0);

    res.json({
      period: { from: dateFrom, to: dateTo },
      operatingActivities: {
        inflows: {
          invoicePayments: totalInflows,
          invoiceCount: inflows.length,
          items: inflows
        },
        bankActivity: {
          credits: bankCredits._sum.amount || 0,
          debits: bankDebits._sum.amount || 0,
          net: netCash
        }
      },
      totalInflows,
      totalOutflows: bankDebits._sum.amount || 0,
      netCashFlow: netCash
    });
  } catch (err) {
    console.error('Cash flow error:', err);
    res.status(500).json({ error: 'Failed to generate cash flow report' });
  }
};

const accountsReceivable = async (req, res) => {
  try {
    const companyId = req.companyId;
    const now = new Date();

    const invoices = await prisma.invoice.findMany({
      where: {
        companyId,
        type: 'INVOICE',
        status: { in: ['SENT', 'OVERDUE'] }
      },
      include: {
        contact: { select: { id: true, name: true, email: true, phone: true } }
      },
      orderBy: { dueDate: 'asc' }
    });

    // Aging buckets: current (not due), 1-30, 31-60, 61-90, 90+
    const aging = {
      current: { invoices: [], total: 0 },
      days1_30: { invoices: [], total: 0 },
      days31_60: { invoices: [], total: 0 },
      days61_90: { invoices: [], total: 0 },
      days90plus: { invoices: [], total: 0 }
    };

    invoices.forEach(inv => {
      const daysPastDue = inv.dueDate
        ? Math.floor((now - new Date(inv.dueDate)) / (1000 * 60 * 60 * 24))
        : 0;

      const item = {
        id: inv.id,
        number: inv.number,
        date: inv.date,
        dueDate: inv.dueDate,
        total: inv.total,
        daysPastDue,
        contact: inv.contact
      };

      if (daysPastDue <= 0) {
        aging.current.invoices.push(item);
        aging.current.total += inv.total;
      } else if (daysPastDue <= 30) {
        aging.days1_30.invoices.push(item);
        aging.days1_30.total += inv.total;
      } else if (daysPastDue <= 60) {
        aging.days31_60.invoices.push(item);
        aging.days31_60.total += inv.total;
      } else if (daysPastDue <= 90) {
        aging.days61_90.invoices.push(item);
        aging.days61_90.total += inv.total;
      } else {
        aging.days90plus.invoices.push(item);
        aging.days90plus.total += inv.total;
      }
    });

    const grandTotal = invoices.reduce((sum, inv) => sum + inv.total, 0);

    res.json({
      asOf: now,
      aging,
      grandTotal,
      totalCount: invoices.length
    });
  } catch (err) {
    console.error('Accounts receivable error:', err);
    res.status(500).json({ error: 'Failed to generate accounts receivable report' });
  }
};

const accountsPayable = async (req, res) => {
  try {
    const companyId = req.companyId;
    const now = new Date();

    // For accounts payable, we look at supplier-related transactions
    // In this system: credit notes or manually tracked supplier invoices
    // We'll use bank transactions of type DEBIT linked to suppliers
    const supplierContacts = await prisma.contact.findMany({
      where: {
        companyId,
        type: { in: ['SUPPLIER', 'BOTH'] },
        active: true
      },
      select: { id: true, name: true, email: true, phone: true }
    });

    const supplierIds = supplierContacts.map(c => c.id);

    // Get outstanding transactions (debits to suppliers not yet reconciled)
    const pendingTransactions = await prisma.bankTransaction.findMany({
      where: {
        bankAccount: { companyId },
        contactId: { in: supplierIds },
        type: 'DEBIT',
        reconciled: false
      },
      include: {
        contact: { select: { id: true, name: true } },
        bankAccount: { select: { name: true } }
      },
      orderBy: { date: 'asc' }
    });

    // Group by supplier
    const bySupplier = {};
    pendingTransactions.forEach(tx => {
      const sid = tx.contactId;
      if (!bySupplier[sid]) {
        bySupplier[sid] = {
          contact: tx.contact,
          transactions: [],
          total: 0
        };
      }
      bySupplier[sid].transactions.push(tx);
      bySupplier[sid].total += tx.amount;
    });

    const grandTotal = pendingTransactions.reduce((sum, tx) => sum + tx.amount, 0);

    res.json({
      asOf: now,
      suppliers: Object.values(bySupplier),
      grandTotal,
      totalTransactions: pendingTransactions.length,
      supplierCount: supplierContacts.length
    });
  } catch (err) {
    console.error('Accounts payable error:', err);
    res.status(500).json({ error: 'Failed to generate accounts payable report' });
  }
};

const taxReport = async (req, res) => {
  try {
    const companyId = req.companyId;
    const { from, to } = req.query;

    const dateFrom = from ? new Date(from) : new Date(new Date().getFullYear(), 0, 1);
    const dateTo = to ? new Date(to) : new Date();

    // Get paid invoices with tax info
    const invoices = await prisma.invoice.findMany({
      where: {
        companyId,
        type: 'INVOICE',
        status: { in: ['SENT', 'PAID', 'OVERDUE'] },
        date: { gte: dateFrom, lte: dateTo }
      },
      include: {
        items: true,
        contact: { select: { id: true, name: true, identification: true } }
      },
      orderBy: { date: 'asc' }
    });

    // Group by tax rate
    const byTaxRate = {};
    let totalTaxCollected = 0;
    let totalSubtotal = 0;
    let totalAmount = 0;

    invoices.forEach(inv => {
      totalSubtotal += inv.subtotal;
      totalTaxCollected += inv.taxAmount;
      totalAmount += inv.total;

      inv.items.forEach(item => {
        const rate = item.taxRate || 0;
        if (!byTaxRate[rate]) {
          byTaxRate[rate] = { rate, taxableBase: 0, taxAmount: 0, invoiceCount: 0 };
        }
        const lineBase = item.quantity * item.price;
        byTaxRate[rate].taxableBase += lineBase;
        byTaxRate[rate].taxAmount += lineBase * (rate / 100);
      });
    });

    // Mark unique invoice IDs counted per rate
    invoices.forEach(inv => {
      const ratesSeen = new Set();
      inv.items.forEach(item => {
        const rate = item.taxRate || 0;
        if (!ratesSeen.has(rate)) {
          if (byTaxRate[rate]) byTaxRate[rate].invoiceCount++;
          ratesSeen.add(rate);
        }
      });
    });

    res.json({
      period: { from: dateFrom, to: dateTo },
      summary: {
        totalSubtotal,
        totalTaxCollected,
        totalAmount,
        invoiceCount: invoices.length
      },
      byTaxRate: Object.values(byTaxRate).sort((a, b) => a.rate - b.rate),
      invoices: invoices.map(inv => ({
        id: inv.id,
        number: inv.number,
        date: inv.date,
        status: inv.status,
        contact: inv.contact,
        subtotal: inv.subtotal,
        taxAmount: inv.taxAmount,
        total: inv.total
      }))
    });
  } catch (err) {
    console.error('Tax report error:', err);
    res.status(500).json({ error: 'Failed to generate tax report' });
  }
};

module.exports = {
  dashboard,
  incomeStatement,
  balanceSheet,
  cashFlow,
  accountsReceivable,
  accountsPayable,
  taxReport
};
