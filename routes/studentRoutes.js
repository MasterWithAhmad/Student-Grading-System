// routes/studentRoutes.js
const express = require('express');
const studentController = require('../controllers/studentController');

const router = express.Router();

// GET /students - Display list of students
router.get('/', studentController.listStudents);

// GET /students/add - Show form to add a new student
router.get('/add', studentController.showAddForm);

// POST /students/add - Handle submission for adding a new student
router.post('/add', studentController.addStudent);

// GET /students/edit/:id - Show form to edit a specific student
router.get('/edit/:id', studentController.showEditForm);

// POST /students/edit/:id - Handle submission for updating a student
router.post('/edit/:id', studentController.editStudent);

// POST /students/delete/:id - Handle deletion of a student (using POST for safety)
router.post('/delete/:id', studentController.deleteStudentById);

// GET /students/export - Export student list to CSV
router.get('/export', studentController.exportStudents);

module.exports = router; 