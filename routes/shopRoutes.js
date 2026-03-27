const express = require('express');
const router = express.Router();
const shopController = require('../controllers/shopController');
const { authenticate, verifyAdmin } = require('../middleware/authMiddleware');

router.get('/', authenticate, verifyAdmin, shopController.getShops);
router.post('/', authenticate, verifyAdmin, shopController.createShop);
router.put('/:id', authenticate, verifyAdmin, shopController.updateShop);
router.delete('/:id', authenticate, verifyAdmin, shopController.deleteShop);

module.exports = router;
