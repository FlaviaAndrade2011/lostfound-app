const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const verifyToken = require('../middleware/authMiddleware');
const verifyStudentToken = require('../middleware/studentAuthMiddleware');

router.get('/', verifyToken, studentController.listStudents);
router.post('/', verifyToken, studentController.createStudent);
router.get('/:matricula', verifyToken, studentController.getStudent);
router.put('/:matricula', verifyToken, studentController.updateStudent);
router.delete('/:matricula', verifyToken, studentController.deleteStudent);
router.put('/:matricula/profile', verifyStudentToken, studentController.updateStudent);
router.get('/:matricula/profile', verifyStudentToken, studentController.getStudent);

module.exports = router;