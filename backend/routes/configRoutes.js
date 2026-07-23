const express = require('express');
const router = express.Router();
const Config = require('../models/Config');

// Public route to get platform configuration (banners, etc.)
router.get('/', async (req, res) => {
  try {
    const config = await Config.findOne();
    if (!config) {
      return res.status(200).json({ banners: [] });
    }
    // Only return public-safe config data
    res.status(200).json({ banners: config.banners });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
