const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const list = async (req, res) => {
  try {
    const { type, search, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      companyId: req.companyId,
      active: true
    };

    if (type) where.type = type;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { identification: { contains: search } }
      ];
    }

    const [contacts, total] = await Promise.all([
      prisma.contact.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { name: 'asc' }
      }),
      prisma.contact.count({ where })
    ]);

    res.json({
      data: contacts,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    console.error('Contacts list error:', err);
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
};

const create = async (req, res) => {
  try {
    const { name, email, phone, type, identification, address, city, notes } = req.body;

    const contact = await prisma.contact.create({
      data: {
        companyId: req.companyId,
        name,
        email: email || null,
        phone: phone || null,
        type: type || 'CLIENT',
        identification: identification || null,
        address: address || null,
        city: city || null,
        notes: notes || null
      }
    });

    res.status(201).json(contact);
  } catch (err) {
    console.error('Contact create error:', err);
    res.status(500).json({ error: 'Failed to create contact' });
  }
};

const getOne = async (req, res) => {
  try {
    const contact = await prisma.contact.findFirst({
      where: { id: req.params.id, companyId: req.companyId }
    });

    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    // Get transaction summary
    const invoices = await prisma.invoice.findMany({
      where: { contactId: contact.id, companyId: req.companyId },
      select: {
        id: true,
        number: true,
        type: true,
        date: true,
        dueDate: true,
        status: true,
        total: true
      },
      orderBy: { date: 'desc' },
      take: 10
    });

    const totals = await prisma.invoice.groupBy({
      by: ['status'],
      where: { contactId: contact.id, companyId: req.companyId, type: 'INVOICE' },
      _sum: { total: true }
    });

    const summary = {
      totalInvoiced: 0,
      totalPaid: 0,
      totalPending: 0
    };

    totals.forEach(t => {
      const amount = t._sum.total || 0;
      summary.totalInvoiced += amount;
      if (t.status === 'PAID') summary.totalPaid += amount;
      if (['SENT', 'OVERDUE'].includes(t.status)) summary.totalPending += amount;
    });

    res.json({ ...contact, recentInvoices: invoices, summary });
  } catch (err) {
    console.error('Contact getOne error:', err);
    res.status(500).json({ error: 'Failed to fetch contact' });
  }
};

const update = async (req, res) => {
  try {
    const existing = await prisma.contact.findFirst({
      where: { id: req.params.id, companyId: req.companyId }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    const { name, email, phone, type, identification, address, city, notes } = req.body;

    const contact = await prisma.contact.update({
      where: { id: req.params.id },
      data: {
        name: name ?? existing.name,
        email: email !== undefined ? email : existing.email,
        phone: phone !== undefined ? phone : existing.phone,
        type: type ?? existing.type,
        identification: identification !== undefined ? identification : existing.identification,
        address: address !== undefined ? address : existing.address,
        city: city !== undefined ? city : existing.city,
        notes: notes !== undefined ? notes : existing.notes
      }
    });

    res.json(contact);
  } catch (err) {
    console.error('Contact update error:', err);
    res.status(500).json({ error: 'Failed to update contact' });
  }
};

const remove = async (req, res) => {
  try {
    const existing = await prisma.contact.findFirst({
      where: { id: req.params.id, companyId: req.companyId }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    // Soft delete
    await prisma.contact.update({
      where: { id: req.params.id },
      data: { active: false }
    });

    res.json({ message: 'Contact deactivated successfully' });
  } catch (err) {
    console.error('Contact delete error:', err);
    res.status(500).json({ error: 'Failed to delete contact' });
  }
};

module.exports = { list, create, getOne, update, remove };
