const fs = require('fs');
const { uploadToCloudinary } = require('../config/cloudinary');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');

// Uploads a single standalone image (profile avatar, chat attachment, etc.)
// and returns its public URL. Falls back to a locally-served URL when
// Cloudinary isn't configured, same pattern used for item images.
exports.uploadImage = async (req, res, next) => {
  try {
    if (!req.file) return next(ApiError.badRequest('No image file provided'));

    const folder = req.body.folder === 'avatars' ? 'findback/avatars' : 'findback/chat';

    let result;
    try {
      if (process.env.CLOUDINARY_CLOUD_NAME) {
        const uploaded = await uploadToCloudinary(req.file.path, folder);
        result = { url: uploaded.url, public_id: uploaded.public_id };
      } else {
        result = { url: `/uploads/${req.file.filename}`, public_id: req.file.filename };
      }
    } catch (err) {
      console.error('Image upload failed, using local fallback:', err.message);
      result = { url: `/uploads/${req.file.filename}`, public_id: req.file.filename };
    } finally {
      if (fs.existsSync(req.file.path) && process.env.CLOUDINARY_CLOUD_NAME) {
        fs.unlinkSync(req.file.path);
      }
    }

    return ApiResponse.success(res, 'Image uploaded successfully', result);
  } catch (error) {
    next(error);
  }
};
