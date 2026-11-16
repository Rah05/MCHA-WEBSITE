const pool = require('../db/pool');

// DELETE /api/admin/products/:id (SCRUM-65)
// Never-ordered product: row is deleted.
// Ordered product: order_items FK blocks the delete, so we archive it
// (is_available = FALSE) as the schema comment says.
async function deleteProduct(req, res, next) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
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

module.exports = { deleteProduct };
