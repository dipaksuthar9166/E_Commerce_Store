const Banner = require('../models/Banner');
const Shop = require('../models/Shop'); // Added for vendor-specific logic
const { removeImageBackground } = require('../utils/backgroundRemover');

// 1. CUSTOMER PUBLIC ROUTE: Get Active Banners for Home Slider
exports.getActiveBanners = async (req, res) => {
  try {
    // Fetches all active banners irrespective of status case ('approved' or 'Approved')
    const banners = await Banner.find({
      isActive: true,
      $or: [
        { status: { $regex: /^approved$/i } },
        { status: { $exists: false } }, // For backward compatibility
      ],
    }).sort({ createdAt: -1 });

    res.status(200).json(banners);
  } catch (error) {
    console.error('Error fetching active banners:', error);
    res.status(500).json({ message: 'Server error while fetching banners' });
  }
};

// 2. VENDOR PRIVATE ROUTE: Get Vendor's Own Banners
exports.getVendorBanners = async (req, res) => {
  try {
    const shop = await Shop.findOne({ userId: req.user._id });
    if (!shop) {
      // If there's no shop, it might be an old banner with vendorId. Fallback for safety.
      const vendorId = req.user._id || req.user.id;
      const banners = await Banner.find({ vendorId }).sort({ createdAt: -1 });
      return res.status(200).json(banners);
    }
    const banners = await Banner.find({ shopId: shop._id }).sort({ createdAt: -1 });
    res.status(200).json(banners);
  } catch (error) {
    console.error('Error fetching vendor banners:', error);
    res.status(500).json({ message: 'Failed to fetch vendor banners' });
  }
};

// 3. VENDOR PRIVATE ROUTE: Create New Banner
exports.createBanner = async (req, res) => {
  try {
    const shop = await Shop.findOne({ userId: req.user._id });
    if (!shop) {
      return res.status(404).json({ message: 'No shop found for this vendor. Cannot create banner.' });
    }

    const { title, subtitle, imagePath, buttonText, targetUrl, theme } = req.body;

    if (!title || !imagePath) {
      return res.status(400).json({ message: 'Title and Image URL are required' });
    }

    // Remove background from the image URL
    const processedImagePath = await removeImageBackground(imagePath);

    const newBanner = new Banner({
      shopId: shop._id,
      title,
      subtitle,
      imagePath: processedImagePath,
      buttonText: buttonText || 'Shop Now',
      targetUrl: targetUrl || '/',
      theme: Number.isFinite(Number(theme)) ? Math.min(4, Math.max(0, Number(theme))) : 0,
      status: 'approved',
      isActive: true,
    });

    await newBanner.save();
    res.status(201).json(newBanner);
  } catch (error) {
    console.error('Error creating banner:', error);
    res.status(500).json({ message: 'Failed to create banner' });
  }
};

// 4. VENDOR PRIVATE ROUTE: Update Banner
exports.updateBanner = async (req, res) => {
  try {
    const shop = await Shop.findOne({ userId: req.user._id });
    if (!shop) {
      return res.status(403).json({ message: 'Not authorized to update this banner' });
    }

    const { id } = req.params;
    const banner = await Banner.findById(id);
    if (!banner || banner.shopId.toString() !== shop._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this banner' });
    }

    // If a new image path is provided, process it
    if (req.body.imagePath && req.body.imagePath !== banner.imagePath) {
      req.body.imagePath = await removeImageBackground(req.body.imagePath);
    }

    const updatedBanner = await Banner.findByIdAndUpdate(
      id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    res.status(200).json(updatedBanner);
  } catch (error) {
    console.error('Error updating banner:', error);
    res.status(500).json({ message: 'Failed to update banner' });
  }
};

// 5. VENDOR PRIVATE ROUTE: Delete Banner
exports.deleteBanner = async (req, res) => {
  try {
    const shop = await Shop.findOne({ userId: req.user._id });
    if (!shop) {
      return res.status(403).json({ message: 'Not authorized to delete this banner' });
    }

    const { id } = req.params;
    const banner = await Banner.findById(id);
    if (!banner || banner.shopId.toString() !== shop._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this banner' });
    }

    await Banner.findByIdAndDelete(id);
    res.status(200).json({ message: 'Banner deleted successfully' });
  } catch (error) {
    console.error('Error deleting banner:', error);
    res.status(500).json({ message: 'Failed to delete banner' });
  }
};