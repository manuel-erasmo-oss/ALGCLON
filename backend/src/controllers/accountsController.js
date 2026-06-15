const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Build a tree from a flat list of accounts
function buildTree(accounts) {
  const map = {};
  const roots = [];

  accounts.forEach(acc => {
    map[acc.id] = { ...acc, children: [] };
  });

  accounts.forEach(acc => {
    if (acc.parentId && map[acc.parentId]) {
      map[acc.parentId].children.push(map[acc.id]);
    } else if (!acc.parentId) {
      roots.push(map[acc.id]);
    }
  });

  return roots;
}

const list = async (req, res) => {
  try {
    const { flat, type, active } = req.query;

    const where = { companyId: req.companyId };
    if (type) where.type = type;
    if (active !== undefined) where.active = active === 'true';

    const accounts = await prisma.account.findMany({
      where,
      orderBy: { code: 'asc' }
    });

    if (flat === 'true') {
      return res.json({ data: accounts });
    }

    // Return as a hierarchy tree
    const tree = buildTree(accounts);
    res.json({ data: tree });
  } catch (err) {
    console.error('Accounts list error:', err);
    res.status(500).json({ error: 'Failed to fetch accounts' });
  }
};

const create = async (req, res) => {
  try {
    const { code, name, type, parentId } = req.body;

    // Check for duplicate code in this company
    const existing = await prisma.account.findFirst({
      where: { companyId: req.companyId, code }
    });

    if (existing) {
      return res.status(409).json({ error: `Account code ${code} already exists` });
    }

    // Validate parent if provided
    if (parentId) {
      const parent = await prisma.account.findFirst({
        where: { id: parentId, companyId: req.companyId }
      });
      if (!parent) {
        return res.status(400).json({ error: 'Parent account not found' });
      }
    }

    const account = await prisma.account.create({
      data: {
        companyId: req.companyId,
        code,
        name,
        type,
        parentId: parentId || null,
        balance: 0,
        active: true
      }
    });

    res.status(201).json(account);
  } catch (err) {
    console.error('Account create error:', err);
    res.status(500).json({ error: 'Failed to create account' });
  }
};

const update = async (req, res) => {
  try {
    const existing = await prisma.account.findFirst({
      where: { id: req.params.id, companyId: req.companyId }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Account not found' });
    }

    const { name, type, parentId, active } = req.body;

    const account = await prisma.account.update({
      where: { id: req.params.id },
      data: {
        name: name ?? existing.name,
        type: type ?? existing.type,
        parentId: parentId !== undefined ? (parentId || null) : existing.parentId,
        active: active !== undefined ? Boolean(active) : existing.active
      }
    });

    res.json(account);
  } catch (err) {
    console.error('Account update error:', err);
    res.status(500).json({ error: 'Failed to update account' });
  }
};

const remove = async (req, res) => {
  try {
    const existing = await prisma.account.findFirst({
      where: { id: req.params.id, companyId: req.companyId }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Account not found' });
    }

    // Check if account has journal entries
    const lineCount = await prisma.journalEntryLine.count({
      where: { accountId: req.params.id }
    });

    if (lineCount > 0) {
      // Soft delete by deactivating instead of hard delete
      await prisma.account.update({
        where: { id: req.params.id },
        data: { active: false }
      });
      return res.json({ message: 'Account deactivated (has journal entries)' });
    }

    // Check if has children
    const childCount = await prisma.account.count({
      where: { parentId: req.params.id }
    });

    if (childCount > 0) {
      return res.status(400).json({ error: 'Cannot delete account with child accounts' });
    }

    await prisma.account.delete({ where: { id: req.params.id } });
    res.json({ message: 'Account deleted successfully' });
  } catch (err) {
    console.error('Account delete error:', err);
    res.status(500).json({ error: 'Failed to delete account' });
  }
};

module.exports = { list, create, update, remove };
