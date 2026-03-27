const express = require('express');
const router = express.Router();
const itemController = require('../controllers/itemController');
const { authenticate, verifyAdmin } = require('../middleware/authMiddleware');

router.get('/', authenticate, verifyAdmin, itemController.getItems);
router.post('/', authenticate, verifyAdmin, itemController.createItem);
router.put('/:id', authenticate, verifyAdmin, itemController.updateItem);
router.delete('/:id', authenticate, verifyAdmin, itemController.deleteItem);

module.exports = router;
