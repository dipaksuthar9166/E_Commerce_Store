const User = require('../models/User');
const Shop = require('../models/Shop');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');

// Generate JWT token
const generateToken = (userId) => {
  if (!process.env.JWT_SECRET) {
    console.error('FATAL ERROR: JWT_SECRET is not defined.');
    throw new Error('JWT_SECRET is not defined. Server cannot start.');
  }
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
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
    const allowedRoles = ['customer', 'vendor', 'delivery'];
    const userRole = (role && allowedRoles.includes(role)) ? role : 'customer';

    const user = await User.create({
      name,
      email,
      password,
      role: userRole,
      phone: phone || undefined,
      vehicleType: vehicleType || undefined,
    });

    // Create shop if vendor
    if (user.role === 'vendor') {
      await Shop.create({
        userId: user._id,
        shopName,
        address,
        isActive: false, // Default to inactive, admin must approve
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

    // Check if user exists and is active
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (!user.isActive) {
      return res.status(401).json({ message: 'Account is inactive. Please contact support.' });
    }

    // Match password
    if (await user.comparePassword(password)) {
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

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            // We send a success-like response even if the user doesn't exist
            // to prevent email enumeration attacks.
            return res.status(200).json({ message: 'If a user with that email exists, a password reset link has been sent.' });
        }

        // 1. Generate the random reset token
        const resetToken = crypto.randomBytes(32).toString('hex');

        // 2. Hash token and set to passwordResetToken field
        user.passwordResetToken = crypto
            .createHash('sha256')
            .update(resetToken)
            .digest('hex');

        // 3. Set token expiry to 10 minutes
        user.passwordResetExpires = Date.now() + 10 * 60 * 1000;

        await user.save({ validateBeforeSave: false }); // We skip validation because we are not changing the password yet

        // 4. Create reset URL
        // In a real app, you'd get the frontend URL from environment variables
        const resetUrl = `${req.protocol}://${req.get('host')}/reset-password/${resetToken}`;
        
        const message = `
            <h1>You have requested a password reset</h1>
            <p>Please click on the link below to reset your password:</p>
            <a href="${resetUrl}" clicktracking=off>${resetUrl}</a>
            <p>This link will expire in 10 minutes.</p>
            <p>If you did not request this, please ignore this email.</p>
        `;

        try {
            await sendEmail({
                email: user.email,
                subject: 'Your password reset token (valid for 10 min)',
                html: message,
            });

            res.status(200).json({ message: 'A password reset link has been sent to your email.' });

        } catch (err) {
            console.error('EMAIL ERROR', err);
            user.passwordResetToken = undefined;
            user.passwordResetExpires = undefined;
            await user.save({ validateBeforeSave: false });
            res.status(500).json({ message: 'There was an error sending the email. Please try again later.' });
        }

    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};


// @desc    Reset password
// @route   PUT /api/auth/reset-password/:token
// @access  Public
exports.resetPassword = async (req, res) => {
    try {
        // 1. Get user based on the token
        const hashedToken = crypto
            .createHash('sha256')
            .update(req.params.token)
            .digest('hex');

        const user = await User.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpires: { $gt: Date.now() },
        });

        // 2. If token has not expired, and there is a user, set the new password
        if (!user) {
            return res.status(400).json({ message: 'Token is invalid or has expired.' });
        }

        // 3. Set new password
        user.password = req.body.password;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save();

        // 4. Log the user in, send JWT
        const token = generateToken(user._id);
        res.status(200).json({
            message: 'Password reset successful.',
            token,
             _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
        });

    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};
