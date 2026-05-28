const express = require('express');
const router = express.Router();
const itemsController = require('../controllers/itemsController');
const verifyToken = require('../middleware/authMiddleware');

router.get('/', itemsController.getItems);
router.post('/', verifyToken, itemsController.upload.single('image'), itemsController.addItem);
router.put('/:id', verifyToken, itemsController.upload.single('image'), itemsController.updateItem);
router.delete('/:id', verifyToken, itemsController.deleteItem);

module.exports = router;