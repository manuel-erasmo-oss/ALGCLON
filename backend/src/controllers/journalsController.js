const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const list = async (req, res) => {
  try {
    const { page = 1, limit = 20, dateFrom, dateTo, reference } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = { companyId: req.companyId };

    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date.gte = new Date(dateFrom);
      if (dateTo) where.date.lte = new Date(dateTo);
    }

    if (reference) {
      where.reference = { contains: reference };
    }

    const [entries, total] = await Promise.all([
      prisma.journalEntry.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
          lines: {
            include: {
              account: { select: { id: true, code: true, name: true, type: true } }
            }
          },
          invoice: { select: { id: true, number: true, type: true } }
        },
        orderBy: { date: 'desc' }
      }),
      prisma.journalEntry.count({ where })
    ]);

    res.json({
      data: entries,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    console.error('Journal list error:', err);
    res.status(500).json({ error: 'Failed to fetch journal entries' });
  }
};

const create = async (req, res) => {
  try {
    const { description, date, reference, lines } = req.body;

    if (!lines || lines.length < 2) {
      return res.status(400).json({ error: 'At least two journal lines are required' });
    }

    // Validate that debits equal credits
    const totalDebits = lines.reduce((sum, l) => sum + (parseFloat(l.debit) || 0), 0);
    const totalCredits = lines.reduce((sum, l) => sum + (parseFloat(l.credit) || 0), 0);

    if (Math.abs(totalDebits - totalCredits) > 0.01) {
      return res.status(400).json({
        error: 'Journal entry is not balanced',
        totalDebits,
        totalCredits,
        difference: totalDebits - totalCredits
      });
    }

    if (totalDebits === 0) {
      return res.status(400).json({ error: 'Journal entry cannot have zero amounts' });
    }

    // Validate all accounts exist and belong to this company
    const accountIds = [...new Set(lines.map(l => l.accountId))];
    const accounts = await prisma.account.findMany({
      where: { id: { in: accountIds }, companyId: req.companyId, active: true }
    });

    if (accounts.length !== accountIds.length) {
      return res.status(400).json({ error: 'One or more account IDs are invalid' });
    }

    const accountMap = {};
    accounts.forEach(a => { accountMap[a.id] = a; });

    const entry = await prisma.$transaction(async (tx) => {
      const created = await tx.journalEntry.create({
        data: {
          companyId: req.companyId,
          date: date ? new Date(date) : new Date(),
          description,
          reference: reference || null,
          lines: {
            create: lines.map(l => ({
              accountId: l.accountId,
              debit: parseFloat(l.debit) || 0,
              credit: parseFloat(l.credit) || 0,
              description: l.description || null
            }))
          }
        },
        include: {
          lines: {
            include: { account: true }
          }
        }
      });

      // Update account balances
      for (const line of lines) {
        const debit = parseFloat(line.debit) || 0;
        const credit = parseFloat(line.credit) || 0;
        const account = accountMap[line.accountId];

        // For ASSET and EXPENSE accounts: debit increases, credit decreases
        // For LIABILITY, EQUITY, INCOME: credit increases, debit decreases
        let balanceChange = 0;
        if (['ASSET', 'EXPENSE'].includes(account.type)) {
          balanceChange = debit - credit;
        } else {
          balanceChange = credit - debit;
        }

        if (balanceChange !== 0) {
          await tx.account.update({
            where: { id: line.accountId },
            data: { balance: { increment: balanceChange } }
          });
        }
      }

      return created;
    });

    res.status(201).json(entry);
  } catch (err) {
    console.error('Journal create error:', err);
    res.status(500).json({ error: 'Failed to create journal entry', detail: err.message });
  }
};

const getOne = async (req, res) => {
  try {
    const entry = await prisma.journalEntry.findFirst({
      where: { id: req.params.id, companyId: req.companyId },
      include: {
        lines: {
          include: {
            account: { select: { id: true, code: true, name: true, type: true } }
          }
        },
        invoice: { select: { id: true, number: true, type: true, status: true } }
      }
    });

    if (!entry) {
      return res.status(404).json({ error: 'Journal entry not found' });
    }

    res.json(entry);
  } catch (err) {
    console.error('Journal getOne error:', err);
    res.status(500).json({ error: 'Failed to fetch journal entry' });
  }
};

module.exports = { list, create, getOne };
