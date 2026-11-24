// Public shop catalog routes (SCRUM-89). Mounted at /api/products in server.js.
// Open to everyone. identifyUser only decides whether wholesale prices are included;
// it never turns a request away.
const express = require('express');
const { identifyUser } = require('../middleware/auth');
const { listCatalog, getCatalogProduct } = require('../controllers/catalogController');

const router = express.Router();

router.get('/', identifyUser, listCatalog); // GET /api/products
router.get('/:id', identifyUser, getCatalogProduct); // GET /api/products/:id

module.exports = router;
