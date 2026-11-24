/**
 * Public shop catalog (SCRUM-89). Mounted at /api/products in server.js.
 *
 *   GET /api/products       every product that is for sale
 *   GET /api/products/:id   one product that is for sale
 *
 * Anyone can call these, signed in or not. The one thing that changes with who is
 * asking is the wholesale price:
 *
 *   - Guests and customers never receive it. The field is left out of the response
 *     entirely rather than hidden by the frontend, because anything sent to the browser
 *     can be read in DevTools.
 *   - Approved wholesale accounts, admins, and staff receive it as `wholesalePrice`.
 *
 * "Approved" means an admin has switched the account to the `wholesale` role. The role
 * is read from the database on every request (see loadUser in middleware/auth.js), so
 * approving or removing a business takes effect on its very next request.
 *
 * Every product also says whether it is sold wholesale (`soldWholesale`), without the
 * price, so the shop can show a "wholesale available, ask us" note to everyone.
 *
 * The admin products page uses /api/admin/products instead, which also returns hidden
 * products. This file only ever shows products with is_available = TRUE.
 */
const pool = require('../db/pool');
const { ROLES } = require('../middleware/auth');

// Who can see wholesale prices.
const CAN_SEE_WHOLESALE = [ROLES.WHOLESALE, ROLES.ADMIN, ROLES.STAFF];

const CATALOG_COLUMNS = `id, name, description, category, price, wholesale_price, stock, stock_label, image_url`;

function parseId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id >= 1 ? id : null;
}

function canSeeWholesale(user) {
  return Boolean(user && CAN_SEE_WHOLESALE.includes(user.role));
}

/** Shapes a `products` row for the shop. wholesalePrice is only added when allowed. */
function toCatalogProduct(row, showWholesale) {
  const product = {
    id: row.id,
    name: row.name,
    description: row.description,
    category: row.category,
    price: row.price,
    stock: row.stock,
    stockLabel: row.stock_label,
    imageUrl: row.image_url,
    soldWholesale: row.wholesale_price !== null,
  };
  if (showWholesale) {
    product.wholesalePrice = row.wholesale_price;
  }
  return product;
}

/**
 * Sets the response headers that keep wholesale prices out of shared caches.
 *
 * The same URL returns different data depending on who asks, so `Vary: Authorization`
 * tells any cache in between not to hand one person's response to another. A response
 * that does contain wholesale prices is also marked no-store, so it is never kept.
 */
function setCacheHeaders(res, showWholesale) {
  res.set('Vary', 'Authorization');
  if (showWholesale) {
    res.set('Cache-Control', 'private, no-store');
  }
}

// GET /api/products
// Returns { pricing, products }. pricing is 'wholesale' when wholesalePrice is included,
// otherwise 'retail', so the frontend knows which view it got without guessing.
async function listCatalog(req, res, next) {
  const showWholesale = canSeeWholesale(req.user);
  try {
    const [rows] = await pool.query(
      `SELECT ${CATALOG_COLUMNS} FROM products WHERE is_available = TRUE ORDER BY category, name`
    );
    setCacheHeaders(res, showWholesale);
    return res.json({
      pricing: showWholesale ? 'wholesale' : 'retail',
      products: rows.map((row) => toCatalogProduct(row, showWholesale)),
    });
  } catch (err) {
    return next(err);
  }
}

// GET /api/products/:id
// Returns { pricing, product }. A hidden product is a 404, the same as one that doesn't exist.
async function getCatalogProduct(req, res, next) {
  const id = parseId(req.params.id);
  if (!id) {
    return res.status(400).json({ error: 'Invalid product id' });
  }

  const showWholesale = canSeeWholesale(req.user);
  try {
    const [rows] = await pool.query(
      `SELECT ${CATALOG_COLUMNS} FROM products WHERE id = ? AND is_available = TRUE`,
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    setCacheHeaders(res, showWholesale);
    return res.json({
      pricing: showWholesale ? 'wholesale' : 'retail',
      product: toCatalogProduct(rows[0], showWholesale),
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = { CAN_SEE_WHOLESALE, listCatalog, getCatalogProduct };
