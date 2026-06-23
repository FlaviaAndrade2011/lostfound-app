const express = require('express');
const router = express.Router();
const itemsController = require('../controllers/itemsController');
const verifyToken = require('../middleware/authMiddleware');
const verifyStudentToken = require('../middleware/studentAuthMiddleware');

router.get('/', itemsController.getItems);
router.post('/public', itemsController.upload.single('image'), itemsController.addPublicItem);
router.get('/student/mine', verifyStudentToken, itemsController.getStudentItems);
router.put('/student/:id', verifyStudentToken, itemsController.upload.single('image'), itemsController.updateStudentItem);
router.delete('/student/:id', verifyStudentToken, itemsController.deleteStudentItem);
router.post('/', verifyToken, itemsController.upload.single('image'), itemsController.addItem);
router.put('/:id', verifyToken, itemsController.upload.single('image'), itemsController.updateItem);
router.delete('/:id', verifyToken, itemsController.deleteItem);

module.exports = router;