const express = require('express');
const router = express.Router();
const organizationController = require('../controllers/organizationController');
const { protect } = require('../middleware/auth');

router.get('/', organizationController.getOrganizations);
router.get('/:id', organizationController.getOrganizationById);
router.post('/', protect, organizationController.createOrganization);
router.post('/:id/join', protect, organizationController.joinOrganization);

module.exports = router;
