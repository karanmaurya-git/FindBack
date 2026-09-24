const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

// POST /api/uploads/image  (multipart/form-data, field name "image")
// Used for standalone images that aren't part of an item report,
// e.g. profile avatars and chat attachments.
router.post('/image', protect, upload.single('image'), uploadController.uploadImage);

module.exports = router;
