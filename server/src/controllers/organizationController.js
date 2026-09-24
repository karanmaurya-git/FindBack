const Organization = require('../models/Organization');
const Item = require('../models/Item');
const User = require('../models/User');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');

// Get all active organizations
exports.getOrganizations = async (req, res, next) => {
  try {
    const orgs = await Organization.find({ isActive: true })
      .populate('admin', 'name email')
      .sort({ name: 1 });
    return ApiResponse.success(res, 'Organizations retrieved', orgs);
  } catch (error) {
    next(error);
  }
};

// Get organization details and stats
exports.getOrganizationById = async (req, res, next) => {
  try {
    const org = await Organization.findById(req.params.id)
      .populate('admin', 'name email')
      .populate('moderators', 'name email')
      .populate('members', 'name email avatar');

    if (!org) return next(ApiError.notFound('Organization not found'));

    // Count items and claims
    const [totalItems, returnedItems] = await Promise.all([
      Item.countDocuments({ organization: org._id }),
      Item.countDocuments({ organization: org._id, status: 'returned' }),
    ]);

    org.stats.totalItems = totalItems;
    org.stats.returnedItems = returnedItems;
    org.stats.activeMembers = org.members.length;

    return ApiResponse.success(res, 'Organization details retrieved', org);
  } catch (error) {
    next(error);
  }
};

// Create organization (Admin or org representative)
exports.createOrganization = async (req, res, next) => {
  try {
    const { name, type, description, location } = req.body;

    const org = await Organization.create({
      name,
      type,
      description,
      admin: req.user._id,
      location: location || { type: 'Point', coordinates: [0, 0] },
      members: [req.user._id],
    });

    // Update user's organization
    await User.findByIdAndUpdate(req.user._id, { organization: org._id });

    return ApiResponse.created(res, 'Organization registered successfully', org);
  } catch (error) {
    next(error);
  }
};

// Join organization
exports.joinOrganization = async (req, res, next) => {
  try {
    const org = await Organization.findById(req.params.id);
    if (!org) return next(ApiError.notFound('Organization not found'));

    if (!org.members.includes(req.user._id)) {
      org.members.push(req.user._id);
      await org.save();
    }

    await User.findByIdAndUpdate(req.user._id, { organization: org._id });
    return ApiResponse.success(res, `Joined ${org.name}`);
  } catch (error) {
    next(error);
  }
};
