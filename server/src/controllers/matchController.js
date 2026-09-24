const Match = require('../models/Match');
const Item = require('../models/Item');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');

// Get matches for logged-in user's items
exports.getMyMatches = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Find all items belonging to user
    const myItemIds = await Item.find({ user: userId }).distinct('_id');

    // Find matches where either lostItem or foundItem belongs to this user
    const matches = await Match.find({
      $or: [
        { lostItem: { $in: myItemIds } },
        { foundItem: { $in: myItemIds } },
      ],
      dismissedBy: { $ne: userId },
    })
      .populate({
        path: 'lostItem',
        select: 'name category brand model color description images location lostDate status user',
        populate: [
          { path: 'category', select: 'name icon' },
          { path: 'user', select: 'name isVerified' },
        ],
      })
      .populate({
        path: 'foundItem',
        select: 'name category brand model color description images location foundDate status user',
        populate: [
          { path: 'category', select: 'name icon' },
          { path: 'user', select: 'name isVerified' },
        ],
      })
      .sort({ similarityScore: -1, createdAt: -1 });

    return ApiResponse.success(res, 'AI matches retrieved successfully', matches);
  } catch (error) {
    next(error);
  }
};

// Get single match details
exports.getMatchById = async (req, res, next) => {
  try {
    const match = await Match.findById(req.params.id)
      .populate({
        path: 'lostItem',
        populate: [
          { path: 'category', select: 'name icon' },
          { path: 'user', select: 'name avatar isVerified' },
        ],
      })
      .populate({
        path: 'foundItem',
        populate: [
          { path: 'category', select: 'name icon' },
          { path: 'user', select: 'name avatar isVerified' },
        ],
      });

    if (!match) return next(ApiError.notFound('Match record not found'));

    // Check ownership
    const isParticipant =
      match.lostItem.user._id.toString() === req.user._id.toString() ||
      match.foundItem.user._id.toString() === req.user._id.toString() ||
      ['admin', 'moderator'].includes(req.user.role);

    if (!isParticipant) {
      return next(ApiError.forbidden('You do not have permission to view this match'));
    }

    return ApiResponse.success(res, 'Match details retrieved', match);
  } catch (error) {
    next(error);
  }
};

// Dismiss a match suggestion for this user
exports.dismissMatch = async (req, res, next) => {
  try {
    const match = await Match.findById(req.params.id);
    if (!match) return next(ApiError.notFound('Match not found'));

    if (!match.dismissedBy.includes(req.user._id)) {
      match.dismissedBy.push(req.user._id);
      await match.save();
    }

    return ApiResponse.success(res, 'Match dismissed from your suggestions');
  } catch (error) {
    next(error);
  }
};
