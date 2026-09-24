const User = require('../models/User');
const Item = require('../models/Item');
const Claim = require('../models/Claim');
const Match = require('../models/Match');
const SavedItem = require('../models/SavedItem');
const Notification = require('../models/Notification');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Report = require('../models/Report');
const Activity = require('../models/Activity');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');
const { sanitizeUser } = require('../utils/helpers');

// Update profile
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, phone, organization, avatar } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) return next(ApiError.notFound('User not found'));

    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (organization !== undefined) user.organization = organization || null;
    if (avatar) user.avatar = avatar;

    await user.save();
    return ApiResponse.success(res, 'Profile updated successfully', sanitizeUser(user));
  } catch (error) {
    next(error);
  }
};

// Update password
exports.updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return next(ApiError.badRequest('Current password is incorrect'));
    }

    user.password = newPassword;
    await user.save();

    return ApiResponse.success(res, 'Password changed successfully');
  } catch (error) {
    next(error);
  }
};

// Get User Dashboard stats and counts
exports.getDashboardStats = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const [lostCount, foundCount, claimsCount, returnedCount, recentLost, recentFound] = await Promise.all([
      Item.countDocuments({ user: userId, type: 'lost' }),
      Item.countDocuments({ user: userId, type: 'found' }),
      Claim.countDocuments({ claimant: userId }),
      Item.countDocuments({ user: userId, status: 'returned' }),
      Item.find({ user: userId, type: 'lost' }).sort({ createdAt: -1 }).limit(5),
      Item.find({ user: userId, type: 'found' }).sort({ createdAt: -1 }).limit(5),
    ]);

    return ApiResponse.success(res, 'Dashboard stats retrieved', {
      stats: {
        lostItems: lostCount,
        foundItems: foundCount,
        activeClaims: claimsCount,
        returned: returnedCount,
      },
      recentLost,
      recentFound,
    });
  } catch (error) {
    next(error);
  }
};

// Toggle save item bookmark
exports.toggleSaveItem = async (req, res, next) => {
  try {
    const { itemId } = req.params;
    const user = await User.findById(req.user._id);

    const isSaved = user.savedItems.some(id => id.toString() === itemId);

    if (isSaved) {
      user.savedItems = user.savedItems.filter(id => id.toString() !== itemId);
      await user.save();
      return ApiResponse.success(res, 'Item removed from saved items', { saved: false });
    } else {
      user.savedItems.push(itemId);
      await user.save();
      return ApiResponse.success(res, 'Item saved to bookmarks', { saved: true });
    }
  } catch (error) {
    next(error);
  }
};

// Permanently delete the logged-in user's account and cascade-clean
// everything tied to it (items, claims, matches, chats, notifications, etc.)
exports.deleteAccount = async (req, res, next) => {
  try {
    const { password, confirmation } = req.body;
    const userId = req.user._id;

    if (confirmation !== 'DELETE') {
      return next(ApiError.badRequest('Please type DELETE to confirm account deletion'));
    }

    const user = await User.findById(userId).select('+password');
    if (!user) return next(ApiError.notFound('User not found'));

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return next(ApiError.badRequest('Password is incorrect'));
    }

    // 1. Find every item this user reported (lost + found)
    const items = await Item.find({ user: userId }).select('_id');
    const itemIds = items.map((i) => i._id);

    // 2. Find conversations this user is part of
    const conversations = await Conversation.find({ participants: userId }).select('_id');
    const conversationIds = conversations.map((c) => c._id);

    // 3. Cascade delete everything that references the user or their items
    await Promise.all([
      Match.deleteMany({ $or: [{ lostItem: { $in: itemIds } }, { foundItem: { $in: itemIds } }] }),
      Claim.deleteMany({ $or: [{ claimant: userId }, { item: { $in: itemIds } }] }),
      SavedItem.deleteMany({ $or: [{ user: userId }, { item: { $in: itemIds } }] }),
      Notification.deleteMany({ recipient: userId }),
      Message.deleteMany({ $or: [{ sender: userId }, { conversation: { $in: conversationIds } }] }),
      Conversation.deleteMany({ _id: { $in: conversationIds } }),
      Report.deleteMany({ reporter: userId }),
      Activity.deleteMany({ $or: [{ user: userId }, { item: { $in: itemIds } }] }),
    ]);

    // Remove this user's items from everyone else's saved bookmarks list
    await User.updateMany({ savedItems: { $in: itemIds } }, { $pull: { savedItems: { $in: itemIds } } });

    // 4. Delete the items themselves, then the user
    await Item.deleteMany({ user: userId });
    await User.findByIdAndDelete(userId);

    return ApiResponse.success(res, 'Account and all associated data deleted successfully');
  } catch (error) {
    next(error);
  }
};

// Get saved items
exports.getSavedItems = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'savedItems',
      populate: { path: 'category', select: 'name icon' },
    });

    return ApiResponse.success(res, 'Saved items retrieved', user.savedItems || []);
  } catch (error) {
    next(error);
  }
};
