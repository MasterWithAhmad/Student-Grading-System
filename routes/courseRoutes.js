// routes/courseRoutes.js
const express = require('express');
const courseController = require('../controllers/courseController');

const router = express.Router();

// GET /courses - Display list of courses
router.get('/', courseController.listCourses);

// GET /courses/add - Show form to add a new course
router.get('/add', courseController.showAddForm);

// POST /courses/add - Handle submission for adding a new course
router.post('/add', courseController.addCourse);

// GET /courses/edit/:id - Show form to edit a specific course
router.get('/edit/:id', courseController.showEditForm);

// POST /courses/edit/:id - Handle submission for updating a course
router.post('/edit/:id', courseController.editCourse);

// POST /courses/delete/:id - Handle deletion of a course (using POST)
router.post('/delete/:id', courseController.deleteCourseById);

// GET /courses/export - Export course list to CSV
router.get('/export', courseController.exportCourses);

module.exports = router; 