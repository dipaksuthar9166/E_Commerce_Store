const asyncHandler = require('express-async-handler');
const Order = require('../models/Order');
const Shop = require('../models/Shop');

/**
 * @desc    Get today's activity stats for a vendor (hourly sales)
 * @route   GET /api/vendor/stats/today-activity
 * @access  Private (Vendor only)
 */
exports.getTodayActivityStats = asyncHandler(async (req, res) => {
  // पहले से ही व्यावसायिक घंटों (सुबह 8 बजे से रात 10 बजे तक) के लिए एक टेम्पलेट बना लें
  const chartData = Array.from({ length: 15 }, (_, i) => {
    const hour = i + 8;
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 === 0 ? 12 : hour % 12;
    return { name: `${displayHour} ${ampm}`, sales: 0 };
  });

  const shop = await Shop.findOne({ userId: req.user._id }).lean();

  // अगर दुकान नहीं मिलती है, तो शून्य बिक्री वाला डेटा भेजें
  if (!shop) {
    return res.status(200).json(chartData);
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  // MongoDB एग्रीगेशन का उपयोग करके घंटे के हिसाब से बिक्री प्राप्त करें
  const hourlySales = await Order.aggregate([
    {
      $match: {
        shopId: shop._id,
        status: 'delivered',
        updatedAt: { $gte: todayStart, $lte: todayEnd },
      },
    },
    {
      $project: {
        hour: { $hour: { date: '$updatedAt', timezone: 'Asia/Kolkata' } },
        totalAmount: 1,
      },
    },
    {
      $group: { _id: '$hour', sales: { $sum: '$totalAmount' } },
    },
  ]);

  // वास्तविक बिक्री डेटा के साथ टेम्पलेट को अपडेट करें
  if (hourlySales.length > 0) {
    hourlySales.forEach(item => {
      const hourIndex = item._id - 8; // सुबह 8 बजे से इंडेक्स
      if (hourIndex >= 0 && hourIndex < chartData.length) {
        chartData[hourIndex].sales = item.sales;
      }
    });
  }

  res.status(200).json(chartData);
});