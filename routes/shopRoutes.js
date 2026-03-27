const express = require('express');
const router = express.Router();
const shopController = require('../controllers/shopController');
const { authenticate, verifyAdmin } = require('../middleware/authMiddleware');

router.get('/', authenticate, verifyAdmin, shopController.getShops);
router.post('/', authenticate, verifyAdmin, shopController.createShop);

module.exports = router;
