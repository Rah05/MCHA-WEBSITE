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

module.exports = { deleteProduct, updatePriceAvailability };
