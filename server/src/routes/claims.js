const express = require('express');
const router = express.Router();
const claimController = require('../controllers/claimController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/', claimController.submitClaim);
router.get('/', claimController.getMyClaims);
router.get('/:id', claimController.getClaimById);
router.put('/:id/review', claimController.reviewClaim);
router.put('/:id/confirm-return', claimController.confirmReturn);
router.get('/:id/qr-code', claimController.getHandoverQrCode);
router.post('/:id/scan-qr', claimController.scanHandoverQr);

module.exports = router;
