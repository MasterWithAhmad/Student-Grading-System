// routes/gradeRoutes.js
const express = require('express');
const gradeController = require('../controllers/gradeController');

const router = express.Router();

// GET /grades - Display list of grades
router.get('/', gradeController.listGrades);

// GET /grades/add - Show form to add a new grade
router.get('/add', gradeController.showAddForm);

// POST /grades/add - Handle submission for adding a new grade
router.post('/add', gradeController.addGrade);

// GET /grades/edit/:id - Show form to edit a specific grade
router.get('/edit/:id', gradeController.showEditForm);

// POST /grades/edit/:id - Handle submission for updating a grade
router.post('/edit/:id', gradeController.editGrade);

// POST /grades/delete/:id - Handle deletion of a grade
router.post('/delete/:id', gradeController.deleteGradeById);

// GET /grades/export - Export grade list to CSV
// router.get('/export', gradeController.exportGrades);

module.exports = router; 