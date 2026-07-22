const User = require('../models/User');

exports.getWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('wishlist');
    res.json(user.wishlist);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.toggleWishlist = async (req, res) => {
  try {
    const { productId } = req.params;
    const user = await User.findById(req.user._id);

    const index = user.wishlist.indexOf(productId);
    if (index > -1) {
      user.wishlist.splice(index, 1);
    } else {
      user.wishlist.push(productId);
    }

    await user.save();
    res.json(user.wishlist);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getAddresses = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json(user.addresses);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.addAddress = async (req, res) => {
  try {
    const { type, address, city, postalCode, isDefault } = req.body;
    const user = await User.findById(req.user._id);
    
    if (isDefault) {
      user.addresses.forEach(a => a.isDefault = false);
    }
    
    user.addresses.push({ type, address, city, postalCode, isDefault });
    await user.save();
    res.json(user.addresses);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.updateAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    const { type, address, city, postalCode, isDefault } = req.body;
    const user = await User.findById(req.user._id);
    
    const addressDoc = user.addresses.id(addressId);
    if (!addressDoc) {
      return res.status(404).json({ message: 'Address not found' });
    }
    
    if (isDefault) {
      user.addresses.forEach(a => a.isDefault = false);
    }
    
    addressDoc.type = type || addressDoc.type;
    addressDoc.address = address || addressDoc.address;
    addressDoc.city = city || addressDoc.city;
    addressDoc.postalCode = postalCode || addressDoc.postalCode;
    if (isDefault !== undefined) {
      addressDoc.isDefault = isDefault;
    }
    
    await user.save();
    res.json(user.addresses);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.deleteAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    const user = await User.findById(req.user._id);
    
    user.addresses = user.addresses.filter(a => a._id.toString() !== addressId);
    await user.save();
    res.json(user.addresses);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
