const express = require('express');
const router = express.Router();
const matchController = require('../controllers/matchController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', matchController.getMyMatches);
router.get('/:id', matchController.getMatchById);
router.put('/:id/dismiss', matchController.dismissMatch);

module.exports = router;
