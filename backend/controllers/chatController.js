const Message = require('../models/Message');
const Shop = require('../models/Shop');
const User = require('../models/User');

// --- Customer APIs ---

// @desc    Get chat history between a user and a shop
// @route   GET /api/chat/customer/:shopId
// @access  Private (User)
exports.getCustomerChatHistory = async (req, res) => {
  try {
    const shopId = req.params.shopId;
    const userId = req.user._id;
    const chatId = `${userId}_${shopId}`;

    const messages = await Message.find({ chatId }).sort({ createdAt: 1 });
    
    // Mark as read messages sent by Shop to User
    await Message.updateMany(
      { chatId, senderModel: 'Shop', isRead: false },
      { $set: { isRead: true } }
    );

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// --- Vendor APIs ---

// @desc    Get list of users who have chatted with the shop
// @route   GET /api/chat/vendor/conversations
// @access  Private (Vendor)
exports.getVendorConversations = async (req, res) => {
  try {
    const shopId = req.shop._id;
    
    // Find all distinct chatIds for this shop
    // chatIds are like `${userId}_${shopId}`
    const chatIds = await Message.distinct('chatId', { chatId: { $regex: `_${shopId}$` } });
    
    const conversations = [];

    for (let chatId of chatIds) {
      const userId = chatId.split('_')[0];
      
      const user = await User.findById(userId).select('name email avatar');
      if (!user) continue;

      const lastMessage = await Message.findOne({ chatId }).sort({ createdAt: -1 });
      const unreadCount = await Message.countDocuments({ chatId, senderModel: 'User', isRead: false });

      conversations.push({
        chatId,
        user,
        lastMessage,
        unreadCount,
      });
    }

    // Sort by last message time
    conversations.sort((a, b) => {
      const timeA = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : 0;
      const timeB = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : 0;
      return timeB - timeA;
    });

    res.json(conversations);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get chat history between a shop and a specific user
// @route   GET /api/chat/vendor/:userId
// @access  Private (Vendor)
exports.getVendorChatHistory = async (req, res) => {
  try {
    const shopId = req.shop._id;
    const userId = req.params.userId;
    const chatId = `${userId}_${shopId}`;

    const messages = await Message.find({ chatId }).sort({ createdAt: 1 });
    
    // Mark as read messages sent by User to Shop
    await Message.updateMany(
      { chatId, senderModel: 'User', isRead: false },
      { $set: { isRead: true } }
    );

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};
