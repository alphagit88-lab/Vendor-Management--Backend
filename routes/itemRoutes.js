const express = require('express');
const router = express.Router();
const itemController = require('../controllers/itemController');
const { authenticate, verifyAdmin } = require('../middleware/authMiddleware');

router.get('/', authenticate, verifyAdmin, itemController.getItems);
router.post('/', authenticate, verifyAdmin, itemController.createItem);

module.exports = router;
