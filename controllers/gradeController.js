// controllers/gradeController.js

const gradeModel = require('../models/gradeModel');
const studentModel = require('../models/studentModel'); // Need student list for forms
const courseModel = require('../models/courseModel'); // Need course list for forms
const async = require('async'); // For running parallel tasks
const { Parser } = require('json2csv');

// Display list of all grades for the logged-in user
function listGrades(req, res) {
    const userId = req.session.user.id; // Get user ID
    gradeModel.getAllGrades(userId, (err, grades) => { // Pass userId
        if (err) {
            console.error(`Error fetching grades for user ${userId}:`, err);
            req.flash('error', 'Failed to fetch grade data.');
            return res.render('grades', { title: 'Grades', grades: [] }); 
        }
        res.render('grades', { title: 'Grades', grades: grades });
    });
}

// Helper function to fetch user-specific data needed for the grade form
function getFormData(userId, callback) { // Accept userId
    async.parallel({
        students: (cb) => studentModel.getAllStudents(userId, cb), // Pass userId
        courses: (cb) => courseModel.getAllCourses(userId, cb) // Pass userId
    }, (err, results) => {
        if (err) {
            console.error(`Error fetching data for grade form for user ${userId}:`, err);
            return callback(err, null);
        }
        callback(null, results); // { students: [...], courses: [...] }
    });
}

// Display the form to add a new grade (for the logged-in user)
function showAddForm(req, res) {
    const userId = req.session.user.id; // Get user ID
    getFormData(userId, (err, formData) => { // Pass userId
        if (err || !formData) {
             req.flash('error', 'Failed to load data for grade form.');
             return res.redirect('/grades');
        }
        const formErrorMsg = req.flash('formError');
        res.render('grade-form', { 
            title: 'Add Grade', 
            grade: null, 
            students: formData.students,
            courses: formData.courses,
            action: '/grades/add',
            error: formErrorMsg 
        });
    });
}

// Display the form to edit an existing grade (only if owned by the user)
function showEditForm(req, res) {
    const id = req.params.id;
    const userId = req.session.user.id; // Get user ID

    async.parallel({
        grade: (cb) => gradeModel.getGradeById(id, userId, cb), // Pass userId
        students: (cb) => studentModel.getAllStudents(userId, cb), // Pass userId
        courses: (cb) => courseModel.getAllCourses(userId, cb) // Pass userId
    }, (err, results) => {
        // Check if grade was found and belongs to the user
        if (err || !results || !results.grade) { 
            const errorMsg = err ? 'Failed to load data for edit form.' : 'Grade not found or permission denied.';
            console.error(`Error fetching data for grade edit form (Grade ID: ${id}, User ID: ${userId}):`, err);
            req.flash('error', errorMsg);
             return res.redirect('/grades');
        }
         
        const formErrorMsg = req.flash('formError');
        res.render('grade-form', { 
            title: 'Edit Grade', 
            grade: results.grade, 
            students: results.students,
            courses: results.courses,
            action: `/grades/edit/${id}`,
            error: formErrorMsg
        });
    });
}

// Handle the creation of a new grade for the logged-in user (POST)
function addGrade(req, res) {
    const gradeData = req.body; 
    const userId = req.session.user.id; // Get user ID
    gradeData.user_id = userId; // Add user_id to the data

    if (!gradeData.student_id || !gradeData.course_id || gradeData.grade === '' || gradeData.grade === null) {
        req.flash('formError', 'Student, Course, and Grade fields are required.');
        // TODO: Optionally flash back submitted data to repopulate form
        return res.redirect('/grades/add');
    }
    
    // Optional: Add server-side check to ensure student_id and course_id belong to the user
    // This adds complexity but increases security if IDs could be manipulated client-side.
    // Example: Check if studentModel.getStudentById(gradeData.student_id, userId) returns a student.

    gradeModel.createGrade(gradeData, (err, newId) => {
        if (err) {
            console.error(`Error adding grade for user ${userId}:`, err);
            let errorMsg = `Failed to add grade. ${err.message}`;
            if (err.message && err.message.includes('UNIQUE constraint failed: grades.student_id, grades.course_id, grades.assignment_name')) {
                 errorMsg = 'A grade for this student, course, and assignment name already exists.';
            } else if (err.message && err.message.includes('FOREIGN KEY constraint failed')) {
                errorMsg = 'Failed to add grade. The selected student or course may no longer exist or belong to you.';
            }
            req.flash('formError', errorMsg); 
            return res.redirect('/grades/add'); 
        }
        req.flash('success', 'Grade added successfully!');
        res.redirect('/grades');
    });
}

// Handle the update of an existing grade (only if owned by the user) (POST)
function editGrade(req, res) {
    const id = req.params.id;
    const gradeData = req.body;
    const userId = req.session.user.id; // Get user ID

    if (!gradeData.student_id || !gradeData.course_id || gradeData.grade === '' || gradeData.grade === null) {
         req.flash('formError', 'Student, Course, and Grade fields are required.');
         // TODO: Optionally flash back submitted data
         return res.redirect(`/grades/edit/${id}`);
    }
    
    // Optional: Add server-side check for student_id/course_id ownership here too.

    gradeModel.updateGrade(id, userId, gradeData, (err, changes) => { // Pass userId
        if (err || changes === 0) {
            console.error(`Error updating grade ${id} for user ${userId}:`, err);
            let errorMsg = `Failed to update grade.`;
             if (err && err.message && err.message.includes('UNIQUE constraint failed: grades.student_id, grades.course_id, grades.assignment_name')) {
                 errorMsg = 'Update failed: A grade for this student, course, and assignment name already exists.';
            } else if (err && err.message && err.message.includes('FOREIGN KEY constraint failed')) {
                errorMsg = 'Update failed: The selected student or course may no longer exist or belong to you.';
            } else if (changes === 0) {
                 errorMsg = 'Update failed: Grade not found, permission denied, or no changes were made.';
            }
            req.flash('formError', errorMsg);
            return res.redirect(`/grades/edit/${id}`);
        }
        req.flash('success', 'Grade updated successfully!');
        res.redirect('/grades');
    });
}

// Handle the deletion of a grade (only if owned by the user) (POST)
function deleteGradeById(req, res) {
    const id = req.params.id;
    const userId = req.session.user.id; // Get user ID

    gradeModel.deleteGrade(id, userId, (err, changes) => { // Pass userId
        if (err || changes === 0) {
            console.error(`Error deleting grade ${id} for user ${userId}:`, err);
            req.flash('error', `Error deleting grade ${err ? err.message : '(Not found or permission denied)'}.`);
        } else {
            req.flash('success', 'Grade deleted successfully!');
        }
        res.redirect('/grades');
    });
}

// Handle exporting grades to CSV (only for the logged-in user)
function exportGrades(req, res) {
    const userId = req.session.user.id; // Get user ID
    gradeModel.getAllGrades(userId, (err, grades) => { // Pass userId (ensure model returns joined data)
        if (err) {
            console.error(`Error fetching grades for export for user ${userId}:`, err);
            req.flash('error', 'Failed to export grade data.');
            return res.redirect('/grades');
        }
        try {
            // Ensure the model provides these fields correctly, especially joined ones
            const fields = [
                { label: 'GradeID', value: 'id' },
                { label: 'StudentID', value: 'student_id' },
                { label: 'StudentName', value: 'student_name' }, // Joined
                { label: 'CourseID', value: 'course_id' },
                { label: 'CourseCode', value: 'course_code' }, // Joined
                { label: 'CourseName', value: 'course_name' }, // Joined
                { label: 'Assignment', value: 'assignment_name' },
                { label: 'Grade', value: 'grade' },
                { label: 'DateAssigned', value: 'date_assigned' }
            ];
            const json2csvParser = new Parser({ fields });
            const csv = json2csvParser.parse(grades);

            res.header('Content-Type', 'text/csv');
            res.attachment('grades.csv');
            res.send(csv);
        } catch (parseErr) {
            console.error(`Error parsing grade data to CSV for user ${userId}:`, parseErr);
            req.flash('error', 'Failed to generate grade CSV export.');
            res.redirect('/grades');
        }
    });
}

module.exports = {
    listGrades,
    showAddForm,
    showEditForm,
    addGrade,
    editGrade,
    deleteGradeById,
    exportGrades // Ensure this is exported
}; 