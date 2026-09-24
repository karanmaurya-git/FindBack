const Category = require('../models/Category');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');

// Get all active categories
exports.getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ name: 1 });
    return ApiResponse.success(res, 'Categories retrieved', categories);
  } catch (error) {
    next(error);
  }
};

// Create category (Admin only)
exports.createCategory = async (req, res, next) => {
  try {
    const { name, icon, description, subcategories } = req.body;
    const category = await Category.create({ name, icon, description, subcategories });
    return ApiResponse.created(res, 'Category created successfully', category);
  } catch (error) {
    next(error);
  }
};

// Update category (Admin only)
exports.updateCategory = async (req, res, next) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!category) return next(ApiError.notFound('Category not found'));
    return ApiResponse.success(res, 'Category updated', category);
  } catch (error) {
    next(error);
  }
};

// Delete category (Admin only)
exports.deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) return next(ApiError.notFound('Category not found'));
    return ApiResponse.success(res, 'Category removed');
  } catch (error) {
    next(error);
  }
};
