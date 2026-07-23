const express = require('express');
const router = express.Router();
const { getProducts, getProductById, getRelatedProducts } = require('../controllers/productController');

// Public product routes
router.route('/').get(getProducts);
router.get('/:id/related', getRelatedProducts);
router.get('/:id', getProductById);

module.exports = router;