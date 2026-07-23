const Coupon = require('../models/Coupon');
const Shop = require('../models/Shop');

// @desc    Get all coupons for vendor's shop
// @route   GET /api/coupons/vendor
// @access  Private (vendor)
exports.getVendorCoupons = async (req, res) => {
  try {
    const shop = await Shop.findOne({ userId: req.user._id });
    if (!shop) {
      return res.status(404).json({ message: 'No shop found for this vendor' });
    }

    const coupons = await Coupon.find({ shopId: shop._id }).sort({ createdAt: -1 });
    res.status(200).json(coupons);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Create a new coupon
// @route   POST /api/coupons/vendor
// @access  Private (vendor)
exports.createCoupon = async (req, res) => {
  try {
    const shop = await Shop.findOne({ userId: req.user._id });
    if (!shop) {
      return res.status(404).json({ message: 'No shop found for this vendor' });
    }

    const { code, discountType, discountValue, minOrderAmount, maxDiscount, validFrom, validUntil, isActive } = req.body;

    if (!code || !discountType || discountValue === undefined || !validUntil) {
      return res.status(400).json({ message: 'Please provide all required fields (code, discountType, discountValue, validUntil)' });
    }

    const existingCoupon = await Coupon.findOne({ shopId: shop._id, code: code.toUpperCase() });
    if (existingCoupon) {
      return res.status(400).json({ message: 'Coupon code already exists for your shop' });
    }

    const coupon = await Coupon.create({
      shopId: shop._id,
      code: code.toUpperCase(),
      discountType,
      discountValue: Number(discountValue),
      minOrderAmount: Number(minOrderAmount || 0),
      maxDiscount: maxDiscount ? Number(maxDiscount) : null,
      validFrom: validFrom ? new Date(validFrom) : new Date(),
      validUntil: new Date(validUntil),
      isActive: isActive !== undefined ? isActive : true
    });

    res.status(201).json(coupon);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update a coupon
// @route   PUT /api/coupons/vendor/:id
// @access  Private (vendor)
exports.updateCoupon = async (req, res) => {
  try {
    const shop = await Shop.findOne({ userId: req.user._id });
    if (!shop) {
      return res.status(404).json({ message: 'No shop found for this vendor' });
    }

    const coupon = await Coupon.findOne({ _id: req.params.id, shopId: shop._id });
    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found' });
    }

    const { code, discountType, discountValue, minOrderAmount, maxDiscount, validFrom, validUntil, isActive } = req.body;

    if (code) coupon.code = code.toUpperCase();
    if (discountType) coupon.discountType = discountType;
    if (discountValue !== undefined) coupon.discountValue = Number(discountValue);
    if (minOrderAmount !== undefined) coupon.minOrderAmount = Number(minOrderAmount);
    if (maxDiscount !== undefined) coupon.maxDiscount = Number(maxDiscount);
    if (validFrom) coupon.validFrom = new Date(validFrom);
    if (validUntil) coupon.validUntil = new Date(validUntil);
    if (isActive !== undefined) coupon.isActive = isActive;

    await coupon.save();
    res.status(200).json(coupon);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete a coupon
// @route   DELETE /api/coupons/vendor/:id
// @access  Private (vendor)
exports.deleteCoupon = async (req, res) => {
  try {
    const shop = await Shop.findOne({ userId: req.user._id });
    if (!shop) {
      return res.status(404).json({ message: 'No shop found for this vendor' });
    }

    const coupon = await Coupon.findOneAndDelete({ _id: req.params.id, shopId: shop._id });
    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found' });
    }

    res.status(200).json({ message: 'Coupon deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Validate and apply a coupon (Customer)
// @route   POST /api/coupons/validate
// @access  Private (customer)
exports.validateCoupon = async (req, res) => {
  try {
    const { code, shopId, orderAmount } = req.body;

    if (!code || !shopId || orderAmount === undefined) {
      return res.status(400).json({ message: 'Missing required parameters' });
    }

    const coupon = await Coupon.findOne({ code: code.toUpperCase(), shopId: shopId });

    if (!coupon) {
      return res.status(404).json({ message: 'Invalid coupon code' });
    }

    if (!coupon.isActive) {
      return res.status(400).json({ message: 'This coupon is no longer active' });
    }

    const now = new Date();
    if (now < coupon.validFrom || now > coupon.validUntil) {
      return res.status(400).json({ message: 'This coupon is expired or not yet valid' });
    }

    if (orderAmount < coupon.minOrderAmount) {
      return res.status(400).json({ message: `Minimum order amount of ₹${coupon.minOrderAmount} required for this coupon` });
    }

    let discountAmount = 0;
    if (coupon.discountType === 'fixed') {
      discountAmount = coupon.discountValue;
    } else if (coupon.discountType === 'percent') {
      discountAmount = (orderAmount * coupon.discountValue) / 100;
      if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
        discountAmount = coupon.maxDiscount;
      }
    }

    // Ensure discount doesn't exceed order amount
    discountAmount = Math.min(discountAmount, orderAmount);

    res.status(200).json({
      success: true,
      couponCode: coupon.code,
      discountAmount,
      finalAmount: orderAmount - discountAmount
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
