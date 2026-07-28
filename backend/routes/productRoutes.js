const express = require('express');
const router = express.Router();
const { getProducts, getProductById, getRelatedProducts, getProductImage, getProductImageByIndex } = require('../controllers/productController');

// Public product routes
router.route('/').get(getProducts);
router.get('/:id/related', getRelatedProducts);
router.get('/:id/image', getProductImage); // New route for serving primary image
router.get('/:id/images/:index', getProductImageByIndex); // New route for serving specific images by index
router.get('/:id', getProductById);

module.exports = router;