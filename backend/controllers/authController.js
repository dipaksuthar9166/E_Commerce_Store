const User = require('../models/User');
const Shop = require('../models/Shop');
const jwt = require('jsonwebtoken');

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'fallback_secret_key', {
    expiresIn: '30d',
  });
};

exports.register = async (req, res) => {
  try {
    const { name, email, password, role, shopName, address, phone, vehicleType } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Validate vendor requirements
    if (role === 'vendor' && (!shopName || !address)) {
      return res.status(400).json({ message: 'Shop name and address are required for vendors' });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'customer',
      phone: phone || undefined,
      vehicleType: vehicleType || undefined,
    });

    // Create shop if vendor
    if (user.role === 'vendor') {
      await Shop.create({
        userId: user._id,
        shopName,
        address,
        isActive: true,
      });
    }

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });

    // Match password
    if (user && (await user.comparePassword(password))) {
      let shopName = undefined;
      if (user.role === 'vendor') {
        const shop = await Shop.findOne({ userId: user._id });
        if (shop) shopName = shop.shopName;
      }

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        shopName,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};
