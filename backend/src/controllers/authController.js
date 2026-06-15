const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { seedAccountsForCompany } = require('../utils/seedAccounts');

const prisma = new PrismaClient();

function generateToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
}

const register = async (req, res) => {
  try {
    const { email, password, name, companyName, companyNit, companyPhone, companyAddress } = req.body;

    // Check if user already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // Create company + user + settings in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: {
          name: companyName || `${name}'s Company`,
          nit: companyNit || null,
          phone: companyPhone || null,
          address: companyAddress || null,
          email: email
        }
      });

      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          role: 'ADMIN',
          companyId: company.id
        }
      });

      await tx.settings.create({
        data: {
          companyId: company.id,
          invoicePrefix: 'FV',
          invoiceNextNumber: 1,
          quotePrefix: 'CO',
          quoteNextNumber: 1,
          defaultTaxRate: 19,
          fiscalYearStart: '01-01'
        }
      });

      return { company, user };
    });

    // Seed chart of accounts
    await seedAccountsForCompany(result.company.id);

    const token = generateToken(result.user.id);

    res.status(201).json({
      token,
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        role: result.user.role,
        company: {
          id: result.company.id,
          name: result.company.name
        }
      }
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed', detail: err.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
      include: { company: true }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user.id);

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        company: {
          id: user.company.id,
          name: user.company.name,
          nit: user.company.nit,
          currency: user.company.currency
        }
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
};

const me = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { company: true },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        company: {
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
        }
      }
    });

    res.json(user);
  } catch (err) {
    console.error('Me error:', err);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};

module.exports = { register, login, me };
