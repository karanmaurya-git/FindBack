const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.post('/', reportController.submitReport);
router.get('/', authorize('admin', 'moderator'), reportController.getReports);
router.put('/:id', authorize('admin', 'moderator'), reportController.reviewReport);

module.exports = router;
