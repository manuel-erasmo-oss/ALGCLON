const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getSettings = async (req, res) => {
  try {
    const settings = await prisma.settings.findUnique({
      where: { companyId: req.companyId }
    });

    if (!settings) {
      return res.status(404).json({ error: 'Settings not found' });
    }

    const company = await prisma.company.findUnique({
      where: { id: req.companyId },
      select: {
        id: true,
        name: true,
        nit: true,
        address: true,
        phone: true,
        email: true,
        logo: true,
        taxRegime: true,
        currency: true
      }
    });

    res.json({ settings, company });
  } catch (err) {
    console.error('Get settings error:', err);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
};

const updateSettings = async (req, res) => {
  try {
    const existing = await prisma.settings.findUnique({
      where: { companyId: req.companyId }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Settings not found' });
    }

    const {
      invoicePrefix,
      invoiceNextNumber,
      quotePrefix,
      quoteNextNumber,
      defaultTaxRate,
      fiscalYearStart
    } = req.body;

    const settings = await prisma.settings.update({
      where: { companyId: req.companyId },
      data: {
        invoicePrefix: invoicePrefix !== undefined ? invoicePrefix : existing.invoicePrefix,
        invoiceNextNumber:
          invoiceNextNumber !== undefined ? parseInt(invoiceNextNumber) : existing.invoiceNextNumber,
        quotePrefix: quotePrefix !== undefined ? quotePrefix : existing.quotePrefix,
        quoteNextNumber:
          quoteNextNumber !== undefined ? parseInt(quoteNextNumber) : existing.quoteNextNumber,
        defaultTaxRate:
          defaultTaxRate !== undefined ? parseFloat(defaultTaxRate) : existing.defaultTaxRate,
        fiscalYearStart:
          fiscalYearStart !== undefined ? fiscalYearStart : existing.fiscalYearStart
      }
    });

    res.json(settings);
  } catch (err) {
    console.error('Update settings error:', err);
    res.status(500).json({ error: 'Failed to update settings' });
  }
};

const updateCompany = async (req, res) => {
  try {
    const existing = await prisma.company.findUnique({
      where: { id: req.companyId }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Company not found' });
    }

    const { name, nit, address, phone, email, logo, taxRegime, currency } = req.body;

    const company = await prisma.company.update({
      where: { id: req.companyId },
      data: {
        name: name !== undefined ? name : existing.name,
        nit: nit !== undefined ? nit : existing.nit,
        address: address !== undefined ? address : existing.address,
        phone: phone !== undefined ? phone : existing.phone,
        email: email !== undefined ? email : existing.email,
        logo: logo !== undefined ? logo : existing.logo,
        taxRegime: taxRegime !== undefined ? taxRegime : existing.taxRegime,
        currency: currency !== undefined ? currency : existing.currency
      },
      select: {
        id: true,
        name: true,
        nit: true,
        address: true,
        phone: true,
        email: true,
        logo: true,
        taxRegime: true,
        currency: true
      }
    });

    res.json(company);
  } catch (err) {
    console.error('Update company error:', err);
    res.status(500).json({ error: 'Failed to update company' });
  }
};

module.exports = { getSettings, updateSettings, updateCompany };
