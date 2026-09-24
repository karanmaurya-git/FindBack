const Item = require('../models/Item');
const Activity = require('../models/Activity');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');
const { parsePagination, buildPagination } = require('../utils/helpers');
const { uploadToCloudinary } = require('../config/cloudinary');
const SmartMatchEngine = require('../ai/matchEngine');
const fs = require('fs');

// Create a lost or found report
exports.createItem = async (req, res, next) => {
  try {
    const {
      type,
      name,
      category,
      subcategory,
      brand,
      model,
      color,
      description,
      identifyingFeatures,
      serialNumber,
      lostDate,
      foundDate,
      approximateTime,
      rewardOffered,
      rewardAmount,
      rewardDescription,
      organization,
      currentPossession,
      latitude,
      longitude,
      address,
      landmark,
      area,
    } = req.body;

    const images = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          if (process.env.CLOUDINARY_CLOUD_NAME) {
            const uploaded = await uploadToCloudinary(file.path, 'findback/items');
            images.push({ public_id: uploaded.public_id, url: uploaded.url });
          } else {
            // Local dev fallback URL
            images.push({ public_id: file.filename, url: `/uploads/${file.filename}` });
          }
        } catch (err) {
          console.error('Image upload failed, using fallback:', err.message);
          images.push({ public_id: file.filename, url: `/uploads/${file.filename}` });
        } finally {
          // Cleanup local file if uploaded
          if (fs.existsSync(file.path) && process.env.CLOUDINARY_CLOUD_NAME) {
            fs.unlinkSync(file.path);
          }
        }
      }
    }

    // Coordinates setup
    const coordinates = [0, 0];
    if (longitude !== undefined && latitude !== undefined) {
      coordinates[0] = parseFloat(longitude) || 0;
      coordinates[1] = parseFloat(latitude) || 0;
    }

    const item = await Item.create({
      user: req.user._id,
      type,
      name,
      category,
      subcategory,
      brand,
      model,
      color,
      description,
      identifyingFeatures,
      serialNumber,
      images,
      location: {
        type: 'Point',
        coordinates,
        address,
        landmark,
        area: area || landmark || (address ? address.split(',')[0] : 'General vicinity'),
      },
      lostDate: lostDate ? new Date(lostDate) : undefined,
      foundDate: foundDate ? new Date(foundDate) : undefined,
      approximateTime,
      reward: {
        offered: rewardOffered === 'true' || rewardOffered === true,
        amount: parseFloat(rewardAmount) || 0,
        description: rewardDescription || '',
      },
      organization: organization || undefined,
      currentPossession,
      status: 'active',
    });

    // Create item activity log
    await Activity.create({
      item: item._id,
      user: req.user._id,
      action: 'reported',
      description: `Reported as ${type} item`,
    });

    // Run SmartMatch AI asynchronously in background
    const io = req.app.get('io');
    setTimeout(() => {
      SmartMatchEngine.processItem(item._id, io);
    }, 500);

    return ApiResponse.created(res, `${type === 'lost' ? 'Lost' : 'Found'} item reported successfully`, item);
  } catch (error) {
    next(error);
  }
};

// Explore / Query Items with full filters, search, and pagination
exports.getItems = async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const {
      type,
      category,
      search,
      status,
      color,
      brand,
      organization,
      sort = 'newest',
      startDate,
      endDate,
    } = req.query;

    const filter = {
      // Default to public visibility unless specified
      visibility: { $in: ['public', 'organization'] },
    };

    if (type && ['lost', 'found'].includes(type)) {
      filter.type = type;
    }

    if (category) {
      filter.category = category;
    }

    if (status) {
      filter.status = status;
    } else {
      // By default exclude returned or rejected items from general explore
      filter.status = { $nin: ['returned', 'rejected', 'closed'] };
    }

    if (color) {
      filter.color = new RegExp(color, 'i');
    }

    if (brand) {
      filter.brand = new RegExp(brand, 'i');
    }

    if (organization) {
      filter.organization = organization;
    }

    // Date range filter
    if (startDate || endDate) {
      const dateField = type === 'found' ? 'foundDate' : 'lostDate';
      filter[dateField] = {};
      if (startDate) filter[dateField].$gte = new Date(startDate);
      if (endDate) filter[dateField].$lte = new Date(endDate);
    }

    // Text search query
    if (search && search.trim()) {
      filter.$text = { $search: search.trim() };
    }

    // Sort setup
    let sortOptions = { createdAt: -1 };
    if (sort === 'oldest') sortOptions = { createdAt: 1 };
    if (sort === 'relevance' && search) sortOptions = { score: { $meta: 'textScore' } };

    const [items, total] = await Promise.all([
      Item.find(filter)
        .select('-serialNumber') // Never expose serial number publicly
        .populate('category', 'name icon slug')
        .populate('user', 'name avatar isVerified')
        .populate('organization', 'name type')
        .sort(sortOptions)
        .skip(skip)
        .limit(limit),
      Item.countDocuments(filter),
    ]);

    const pagination = buildPagination(page, limit, total);
    return ApiResponse.paginated(res, 'Items retrieved successfully', items, pagination);
  } catch (error) {
    next(error);
  }
};

// Get single item by ID
exports.getItemById = async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.id)
      .select('-serialNumber') // Hide serial number by default
      .populate('category', 'name icon slug subcategories')
      .populate('user', 'name avatar isVerified createdAt')
      .populate('organization', 'name type');

    if (!item) {
      return next(ApiError.notFound('Item not found'));
    }

    // Increment view count
    item.viewCount = (item.viewCount || 0) + 1;
    await item.save();

    // Fetch activities for item timeline
    const activities = await Activity.find({ item: item._id })
      .populate('user', 'name')
      .sort({ createdAt: 1 });

    return ApiResponse.success(res, 'Item details retrieved', {
      item,
      timeline: activities,
    });
  } catch (error) {
    next(error);
  }
};

// Get nearby items using MongoDB Geospatial 2dsphere
exports.getNearbyItems = async (req, res, next) => {
  try {
    const { longitude, latitude, maxDistance = 10, type, category } = req.query;

    if (!longitude || !latitude) {
      return next(ApiError.badRequest('Longitude and latitude are required for nearby query'));
    }

    const lon = parseFloat(longitude);
    const lat = parseFloat(latitude);
    const maxMeters = parseFloat(maxDistance) * 1000; // km to meters

    const query = {
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [lon, lat],
          },
          $maxDistance: maxMeters,
        },
      },
      status: { $nin: ['returned', 'rejected', 'closed'] },
    };

    if (type) query.type = type;
    if (category) query.category = category;

    const items = await Item.find(query)
      .select('-serialNumber')
      .populate('category', 'name icon')
      .populate('user', 'name isVerified')
      .limit(30);

    return ApiResponse.success(res, 'Nearby items retrieved', items);
  } catch (error) {
    next(error);
  }
};

// Get items posted by logged-in user
exports.getMyItems = async (req, res, next) => {
  try {
    const { type } = req.query;
    const query = { user: req.user._id };
    if (type) query.type = type;

    const items = await Item.find(query)
      .populate('category', 'name icon')
      .sort({ createdAt: -1 });

    return ApiResponse.success(res, 'My items retrieved', items);
  } catch (error) {
    next(error);
  }
};

// Update an item (Owner or Admin only)
exports.updateItem = async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return next(ApiError.notFound('Item not found'));

    const isOwner = item.user.toString() === req.user._id.toString();
    const isAdmin = ['admin', 'moderator'].includes(req.user.role);

    if (!isOwner && !isAdmin) {
      return next(ApiError.forbidden('You do not have permission to modify this item'));
    }

    const updatableFields = [
      'name', 'category', 'subcategory', 'brand', 'model', 'color',
      'description', 'identifyingFeatures', 'lostDate', 'foundDate',
      'approximateTime', 'currentPossession', 'status'
    ];

    updatableFields.forEach(field => {
      if (req.body[field] !== undefined) {
        item[field] = req.body[field];
      }
    });

    await item.save();

    await Activity.create({
      item: item._id,
      user: req.user._id,
      action: 'updated',
      description: 'Item details updated',
    });

    return ApiResponse.success(res, 'Item updated successfully', item);
  } catch (error) {
    next(error);
  }
};

// Delete an item
exports.deleteItem = async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return next(ApiError.notFound('Item not found'));

    const isOwner = item.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return next(ApiError.forbidden('You do not have permission to delete this item'));
    }

    await item.deleteOne();
    return ApiResponse.success(res, 'Item removed successfully');
  } catch (error) {
    next(error);
  }
};
