const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const list = async (req, res) => {
  try {
    const { category, active, search, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = { companyId: req.companyId };

    if (active !== undefined) where.active = active === 'true';
    if (category) where.categoryId = category;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } }
      ];
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: { category: true },
        orderBy: { name: 'asc' }
      }),
      prisma.product.count({ where })
    ]);

    res.json({
      data: products,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    console.error('Products list error:', err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
};

const create = async (req, res) => {
  try {
    const { name, description, price, cost, stock, categoryId, unit, taxRate } = req.body;

    // Validate or create category
    if (categoryId) {
      const cat = await prisma.category.findFirst({
        where: { id: categoryId, companyId: req.companyId }
      });
      if (!cat) {
        return res.status(400).json({ error: 'Category not found' });
      }
    }

    const product = await prisma.product.create({
      data: {
        companyId: req.companyId,
        name,
        description: description || null,
        price: parseFloat(price) || 0,
        cost: parseFloat(cost) || 0,
        stock: parseFloat(stock) || 0,
        categoryId: categoryId || null,
        unit: unit || 'UND',
        taxRate: parseFloat(taxRate) || 0,
        active: true
      },
      include: { category: true }
    });

    res.status(201).json(product);
  } catch (err) {
    console.error('Product create error:', err);
    res.status(500).json({ error: 'Failed to create product' });
  }
};

const getOne = async (req, res) => {
  try {
    const product = await prisma.product.findFirst({
      where: { id: req.params.id, companyId: req.companyId },
      include: { category: true }
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(product);
  } catch (err) {
    console.error('Product getOne error:', err);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
};

const update = async (req, res) => {
  try {
    const existing = await prisma.product.findFirst({
      where: { id: req.params.id, companyId: req.companyId }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const { name, description, price, cost, stock, categoryId, unit, taxRate, active } = req.body;

    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: {
        name: name ?? existing.name,
        description: description !== undefined ? description : existing.description,
        price: price !== undefined ? parseFloat(price) : existing.price,
        cost: cost !== undefined ? parseFloat(cost) : existing.cost,
        stock: stock !== undefined ? parseFloat(stock) : existing.stock,
        categoryId: categoryId !== undefined ? categoryId : existing.categoryId,
        unit: unit ?? existing.unit,
        taxRate: taxRate !== undefined ? parseFloat(taxRate) : existing.taxRate,
        active: active !== undefined ? Boolean(active) : existing.active
      },
      include: { category: true }
    });

    res.json(product);
  } catch (err) {
    console.error('Product update error:', err);
    res.status(500).json({ error: 'Failed to update product' });
  }
};

const remove = async (req, res) => {
  try {
    const existing = await prisma.product.findFirst({
      where: { id: req.params.id, companyId: req.companyId }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Product not found' });
    }

    await prisma.product.update({
      where: { id: req.params.id },
      data: { active: false }
    });

    res.json({ message: 'Product deactivated successfully' });
  } catch (err) {
    console.error('Product delete error:', err);
    res.status(500).json({ error: 'Failed to delete product' });
  }
};

module.exports = { list, create, getOne, update, remove };
