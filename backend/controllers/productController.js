const pool = require('../db/pool');

function parseId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id >= 1 ? id : null;
}

// DELETE /api/admin/products/:id (SCRUM-65)
// Never-ordered product: row is deleted.
// Ordered product: order_items FK blocks the delete, so we archive it
// (is_available = FALSE) as the schema comment says.
async function deleteProduct(req, res, next) {
  const id = parseId(req.params.id);
  if (!id) {
    return res.status(400).json({ error: 'Invalid product id' });
  }

  try {
    try {
      const [result] = await pool.query('DELETE FROM products WHERE id = ?', [id]);
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Product not found' });
      }
      return res.json({ id, action: 'deleted' });
    } catch (err) {
      if (err.code !== 'ER_ROW_IS_REFERENCED_2') throw err;
      await pool.query('UPDATE products SET is_available = FALSE WHERE id = ?', [id]);
      return res.json({ id, action: 'archived' });
    }
  } catch (err) {
    return next(err);
  }
}

// PATCH /api/admin/products/:id/price-availability (SCRUM-66)
// Body: any of { price, stock, stockLabel, isAvailable }. Only these fields can change.
async function updatePriceAvailability(req, res, next) {
  const id = parseId(req.params.id);
  if (!id) {
    return res.status(400).json({ error: 'Invalid product id' });
  }

  const { price, stock, stockLabel, isAvailable } = req.body || {};
  const fields = [];
  const values = [];

  if (price !== undefined) {
    if (typeof price !== 'number' || !Number.isFinite(price) || price < 0) {
      return res.status(400).json({ error: 'Price must be a number, 0 or more' });
    }
    fields.push('price = ?');
    values.push(price);
  }
  if (stock !== undefined) {
    if (!Number.isInteger(stock) || stock < 0) {
      return res.status(400).json({ error: 'Stock must be a whole number, 0 or more' });
    }
    fields.push('stock = ?');
    values.push(stock);
  }
  if (stockLabel !== undefined) {
    if (stockLabel !== null && (typeof stockLabel !== 'string' || stockLabel.length > 50)) {
      return res.status(400).json({ error: 'Stock label must be text up to 50 characters' });
    }
    fields.push('stock_label = ?');
    values.push(stockLabel);
  }
  if (isAvailable !== undefined) {
    if (typeof isAvailable !== 'boolean') {
      return res.status(400).json({ error: 'isAvailable must be true or false' });
    }
    fields.push('is_available = ?');
    values.push(isAvailable);
  }

  if (fields.length === 0) {
    return res.status(400).json({ error: 'Nothing to update' });
  }

  try {
    await pool.query(`UPDATE products SET ${fields.join(', ')} WHERE id = ?`, [...values, id]);
    const [rows] = await pool.query(
      'SELECT id, name, price, stock, stock_label, is_available FROM products WHERE id = ?',
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    const p = rows[0];
    return res.json({
      product: {
        id: p.id,
        name: p.name,
        price: p.price,
        stock: p.stock,
        stockLabel: p.stock_label,
        isAvailable: Boolean(p.is_available),
      },
    });
  } catch (err) {
    return next(err);
  }
}

// ---------------------------------------------------------------------------
// Add and edit products (SCRUM-63, SCRUM-64)
// ---------------------------------------------------------------------------

// Largest value DECIMAL(10,2) can hold.
const MAX_PRICE = 99999999.99;
// Largest value an INT column can hold.
const MAX_STOCK = 2147483647;

const PRODUCT_COLUMNS = `id, name, description, category, price, wholesale_price, stock, stock_label,
  image_url, is_available, created_at, updated_at`;

/** Shapes a `products` row for the admin frontend (camelCase, includes wholesale price). */
function toAdminProduct(row) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    category: row.category,
    price: row.price,
    wholesalePrice: row.wholesale_price,
    stock: row.stock,
    stockLabel: row.stock_label,
    imageUrl: row.image_url,
    isAvailable: Boolean(row.is_available),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function isPrice(value) {
  return (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    value >= 0 &&
    value <= MAX_PRICE &&
    Math.abs(Math.round(value * 100) - value * 100) < 1e-6 // at most 2 decimal places
  );
}

/** Text that is trimmed and must not be empty. Returns the trimmed text, or null if invalid. */
function requiredText(value, maxLength) {
  if (typeof value !== 'string') return null;
  const text = value.trim();
  return text.length >= 1 && text.length <= maxLength ? text : null;
}

/**
 * Optional text: null, or text up to maxLength. An empty or blank string is saved as null.
 * Returns { ok, value }.
 */
function optionalText(value, maxLength) {
  if (value === null) return { ok: true, value: null };
  if (typeof value !== 'string') return { ok: false };
  const text = value.trim();
  if (text.length > maxLength) return { ok: false };
  return { ok: true, value: text === '' ? null : text };
}

function isHttpUrl(text) {
  try {
    const url = new URL(text);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

// Each editable field: its database column and how to check it.
// check(value) returns { value } when valid or { error } when not.
const PRODUCT_FIELDS = {
  name: {
    column: 'name',
    check: (v) => {
      const text = requiredText(v, 150);
      return text ? { value: text } : { error: 'Name is required (up to 150 characters)' };
    },
  },
  category: {
    column: 'category',
    check: (v) => {
      const text = requiredText(v, 50);
      return text ? { value: text } : { error: 'Category is required (up to 50 characters)' };
    },
  },
  description: {
    column: 'description',
    check: (v) => {
      const r = optionalText(v, 5000);
      return r.ok ? { value: r.value } : { error: 'Description must be text up to 5000 characters' };
    },
  },
  price: {
    column: 'price',
    check: (v) =>
      isPrice(v) ? { value: v } : { error: 'Price must be a number from 0 to 99999999.99 with at most 2 decimals' },
  },
  wholesalePrice: {
    column: 'wholesale_price',
    check: (v) =>
      v === null || isPrice(v)
        ? { value: v }
        : { error: 'Wholesale price must be null (not sold wholesale) or a number with at most 2 decimals' },
  },
  stock: {
    column: 'stock',
    check: (v) =>
      Number.isInteger(v) && v >= 0 && v <= MAX_STOCK
        ? { value: v }
        : { error: 'Stock must be a whole number, 0 or more' },
  },
  stockLabel: {
    column: 'stock_label',
    check: (v) => {
      const r = optionalText(v, 50);
      return r.ok ? { value: r.value } : { error: 'Stock label must be text up to 50 characters' };
    },
  },
  imageUrl: {
    column: 'image_url',
    check: (v) => {
      const r = optionalText(v, 500);
      if (!r.ok || (r.value !== null && !isHttpUrl(r.value))) {
        return { error: 'Image URL must be an http(s) link up to 500 characters' };
      }
      return { value: r.value };
    },
  },
  isAvailable: {
    column: 'is_available',
    check: (v) => (typeof v === 'boolean' ? { value: v } : { error: 'isAvailable must be true or false' }),
  },
};

const REQUIRED_ON_CREATE = ['name', 'category', 'price'];

/**
 * Checks a request body against PRODUCT_FIELDS.
 * Returns { error } for the first problem, or { columns, values } ready for SQL.
 * Unknown fields are rejected so a typo (e.g. "retail" instead of "price") isn't silently ignored.
 */
function readProductBody(body, { requireAll }) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { error: 'Send the product as a JSON object' };
  }
  const unknown = Object.keys(body).filter((key) => !PRODUCT_FIELDS[key]);
  if (unknown.length > 0) {
    return { error: `Unknown field: ${unknown.join(', ')}` };
  }
  if (requireAll) {
    const missing = REQUIRED_ON_CREATE.filter((key) => body[key] === undefined);
    if (missing.length > 0) {
      return { error: `Missing required field: ${missing.join(', ')}` };
    }
  }

  const columns = [];
  const values = [];
  for (const [key, field] of Object.entries(PRODUCT_FIELDS)) {
    if (body[key] === undefined) continue;
    const result = field.check(body[key]);
    if (result.error) return { error: result.error };
    columns.push(field.column);
    values.push(result.value);
  }
  return { columns, values };
}

async function findProduct(id) {
  const [rows] = await pool.query(`SELECT ${PRODUCT_COLUMNS} FROM products WHERE id = ?`, [id]);
  return rows[0] ? toAdminProduct(rows[0]) : null;
}

const DUPLICATE_NAME = { error: 'A product with this name already exists' };

// GET /api/admin/products
// Every product, including hidden ones and wholesale prices (admin only).
async function listProducts(req, res, next) {
  try {
    const [rows] = await pool.query(`SELECT ${PRODUCT_COLUMNS} FROM products ORDER BY category, name`);
    return res.json({ products: rows.map(toAdminProduct) });
  } catch (err) {
    return next(err);
  }
}

// GET /api/admin/products/:id
// One product, for filling in the edit form.
async function getProduct(req, res, next) {
  const id = parseId(req.params.id);
  if (!id) {
    return res.status(400).json({ error: 'Invalid product id' });
  }
  try {
    const product = await findProduct(id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    return res.json({ product });
  } catch (err) {
    return next(err);
  }
}

// POST /api/admin/products (SCRUM-63)
// Body: { name, category, price } are required. Optional: description, wholesalePrice,
// stock (default 0), stockLabel, imageUrl, isAvailable (default true).
// Returns 201 { product }, 400 for invalid input, 409 if the name is taken.
async function createProduct(req, res, next) {
  const parsed = readProductBody(req.body, { requireAll: true });
  if (parsed.error) {
    return res.status(400).json({ error: parsed.error });
  }

  try {
    const placeholders = parsed.columns.map(() => '?').join(', ');
    const [result] = await pool.query(
      `INSERT INTO products (${parsed.columns.join(', ')}) VALUES (${placeholders})`,
      parsed.values
    );
    return res.status(201).json({ product: await findProduct(result.insertId) });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json(DUPLICATE_NAME);
    }
    return next(err);
  }
}

// PATCH /api/admin/products/:id (SCRUM-64)
// Body: any of the fields createProduct accepts. Only the fields sent are changed.
// Returns 200 { product }, 400 for invalid input, 404 if missing, 409 if the new name is taken.
async function updateProduct(req, res, next) {
  const id = parseId(req.params.id);
  if (!id) {
    return res.status(400).json({ error: 'Invalid product id' });
  }

  const parsed = readProductBody(req.body, { requireAll: false });
  if (parsed.error) {
    return res.status(400).json({ error: parsed.error });
  }
  if (parsed.columns.length === 0) {
    return res.status(400).json({ error: 'Nothing to update' });
  }

  try {
    const assignments = parsed.columns.map((column) => `${column} = ?`).join(', ');
    await pool.query(`UPDATE products SET ${assignments} WHERE id = ?`, [...parsed.values, id]);
    const product = await findProduct(id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    return res.json({ product });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json(DUPLICATE_NAME);
    }
    return next(err);
  }
}

module.exports = {
  deleteProduct,
  updatePriceAvailability,
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
};
