const express = require('express');
const router = express.Router();
const { getProducts, getProductById } = require('../controllers/productController');

// पब्लिक रूट जो प्रोडक्ट्स को फ़ेच करेगा
router.route('/').get(getProducts);
router.get('/:id', getProductById);

module.exports = router;