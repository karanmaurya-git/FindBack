const User = require('../models/User');
const Item = require('../models/Item');
const Claim = require('../models/Claim');
const Report = require('../models/Report');
const Category = require('../models/Category');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');
const { parsePagination, buildPagination } = require('../utils/helpers');

// Platform Statistics & Overview
exports.getPlatformStats = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalReports,
      lostReports,
      foundReports,
      activeClaims,
      returnedItems,
      pendingReports,
    ] = await Promise.all([
      User.countDocuments(),
      Item.countDocuments(),
      Item.countDocuments({ type: 'lost' }),
      Item.countDocuments({ type: 'found' }),
      Claim.countDocuments({ claimStatus: { $in: ['pending', 'under_verification', 'approved'] } }),
      Item.countDocuments({ status: 'returned' }),
      Report.countDocuments({ status: 'pending' }),
    ]);

    return ApiResponse.success(res, 'Admin stats retrieved', {
      totalUsers,
      totalReports,
      lostReports,
      foundReports,
      activeClaims,
      returnedItems,
      pendingReports,
    });
  } catch (error) {
    next(error);
  }
};

// Analytics charts data (Lost vs Found, Reports over time, Categories breakdown)
exports.getAnalytics = async (req, res, next) => {
  try {
    // Category distribution
    const categoryStats = await Item.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          lostCount: { $sum: { $cond: [{ $eq: ['$type', 'lost'] }, 1, 0] } },
          foundCount: { $sum: { $cond: [{ $eq: ['$type', 'found'] }, 1, 0] } },
        },
      },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'categoryInfo',
        },
      },
      { $unwind: '$categoryInfo' },
      {
        $project: {
          name: '$categoryInfo.name',
          count: 1,
          lostCount: 1,
          foundCount: 1,
        },
      },
      { $sort: { count: -1 } },
      { $limit: 8 },
    ]);

    // Status breakdown
    const statusStats = await Item.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    // Monthly reports trend (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyTrends = await Item.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          lost: { $sum: { $cond: [{ $eq: ['$type', 'lost'] }, 1, 0] } },
          found: { $sum: { $cond: [{ $eq: ['$type', 'found'] }, 1, 0] } },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    return ApiResponse.success(res, 'Analytics charts data', {
      categoryStats,
      statusStats,
      monthlyTrends,
    });
  } catch (error) {
    next(error);
  }
};

// Manage Users (Search, Role filter, Pagination)
exports.getUsers = async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const { role, search, status } = req.query;

    const query = {};
    if (role) query.role = role;
    if (status === 'active') query.isActive = true;
    if (status === 'inactive') query.isActive = false;
    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(query).select('-password').sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(query),
    ]);

    const pagination = buildPagination(page, limit, total);
    return ApiResponse.paginated(res, 'Users retrieved', users, pagination);
  } catch (error) {
    next(error);
  }
};

// Update User (Role, active status, verification)
exports.updateUser = async (req, res, next) => {
  try {
    const { role, isActive, isVerified } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return next(ApiError.notFound('User not found'));

    if (role && ['user', 'moderator', 'admin'].includes(role)) user.role = role;
    if (isActive !== undefined) user.isActive = isActive;
    if (isVerified !== undefined) user.isVerified = isVerified;

    await user.save();
    return ApiResponse.success(res, 'User updated successfully', user);
  } catch (error) {
    next(error);
  }
};

// Manage Items for Admin
exports.getItems = async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const { type, status, search } = req.query;

    const query = {};
    if (type) query.type = type;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { brand: new RegExp(search, 'i') },
      ];
    }

    const [items, total] = await Promise.all([
      Item.find(query)
        .populate('user', 'name email')
        .populate('category', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Item.countDocuments(query),
    ]);

    const pagination = buildPagination(page, limit, total);
    return ApiResponse.paginated(res, 'Items retrieved', items, pagination);
  } catch (error) {
    next(error);
  }
};

// Manage Claims for Admin
exports.getClaims = async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const { status } = req.query;

    const query = {};
    if (status) query.claimStatus = status;

    const [claims, total] = await Promise.all([
      Claim.find(query)
        .populate('claimant', 'name email')
        .populate({
          path: 'item',
          populate: { path: 'user', select: 'name email' },
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Claim.countDocuments(query),
    ]);

    const pagination = buildPagination(page, limit, total);
    return ApiResponse.paginated(res, 'Claims retrieved', claims, pagination);
  } catch (error) {
    next(error);
  }
};
