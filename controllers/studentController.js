// controllers/studentController.js

const studentModel = require('../models/studentModel');
const { Parser } = require('json2csv'); // Require the Parser

// Display list of all students for the logged-in user
function listStudents(req, res) {
    const userId = req.session.user.id; // Get user ID from session
    studentModel.getAllStudents(userId, (err, students) => { // Pass userId
        if (err) {
            console.error("Error fetching students:", err);
            // Render an error page or pass an error message
            return res.status(500).render('error', {
                title: 'Server Error',
                message: 'Failed to fetch student data.',
                error: { status: 500 }
            });
        }
        res.render('students', { title: 'Students', students: students });
    });
}

// Display the form to add a new student
function showAddForm(req, res) {
    res.render('student-form', { 
        title: 'Add Student', 
        student: null, // No existing student data for add form
        action: '/students/add', // Form submission URL
        error: null
    });
}

// Display the form to edit an existing student (only if owned by the user)
function showEditForm(req, res) {
    const id = req.params.id;
    const userId = req.session.user.id; // Get user ID
    studentModel.getStudentById(id, userId, (err, student) => { // Pass userId
        if (err || !student) {
            console.error("Error fetching student for edit or student not found/owned:", err);
            req.flash('error', 'Student not found or you do not have permission to edit it.');
            return res.redirect('/students'); // Redirect if not found or not owned
            // Alternatively, render a 404/403 error page
            // return res.status(404).render('error', {
            //     title: 'Not Found',
            //     message: 'Student not found or you do not have permission.',
            //     error: { status: 404 }
            // });
        }
        // Format date for input type="date"
        if (student.date_of_birth) {
            try {
                // Assuming date_of_birth is stored in a format recognized by Date()
                // Format to YYYY-MM-DD
                const date = new Date(student.date_of_birth);
                const year = date.getFullYear();
                const month = (date.getMonth() + 1).toString().padStart(2, '0');
                const day = date.getDate().toString().padStart(2, '0');
                student.dob_formatted = `${year}-${month}-${day}`;
            } catch (e) {
                console.error("Error formatting date:", e);
                student.dob_formatted = null;
            }
        }
        res.render('student-form', { 
            title: 'Edit Student', 
            student: student, 
            action: `/students/edit/${id}`, // Form submission URL
            error: null
        });
    });
}

// Handle the creation of a new student for the logged-in user
function addStudent(req, res) {
    const studentData = req.body; 
    const userId = req.session.user.id; // Get user ID
    studentData.user_id = userId; // Add user_id to the data

    studentModel.createStudent(studentData, (err, newId) => { 
        if (err) {
            console.error("Error adding student:", err);
            let errorMsg = 'Failed to add student. Please check your input.';
            // Check for unique constraint violation (email per user)
            if (err.message && err.message.includes('UNIQUE constraint failed: students.email, students.user_id')) {
                errorMsg = 'This email address is already associated with another student in your records.';
            }
            req.flash('error', errorMsg); 
             res.render('student-form', {
                title: 'Add Student',
                student: studentData, // Send back submitted data
                action: '/students/add',
                error: req.flash('error') 
            });
            return; 
        }
        req.flash('success', 'Student added successfully!');
        res.redirect('/students'); 
    });
}

// Handle the update of an existing student (only if owned by the user)
function editStudent(req, res) {
    const id = req.params.id;
    const studentData = req.body;
    const userId = req.session.user.id; // Get user ID

    studentModel.updateStudent(id, userId, studentData, (err, changes) => { // Pass userId
        if (err || changes === 0) {
            let errorMsg = 'Failed to update student.';
            if (err && err.message && err.message.includes('UNIQUE constraint failed: students.email, students.user_id')) {
                 errorMsg = 'Update failed: This email address is already associated with another student in your records.';
            } else if (changes === 0) {
                 errorMsg = 'Update failed: Student not found, you do not have permission, or no changes were made.';
            }
            console.error(`Error updating student ${id} for user ${userId}:`, err);
            req.flash('error', errorMsg);
            // Re-render form with submitted data (or fetched if needed)
            // Format date if present in submitted data
            if (studentData.date_of_birth) {
                 try {
                    const date = new Date(studentData.date_of_birth);
                    const year = date.getFullYear();
                    const month = (date.getMonth() + 1).toString().padStart(2, '0');
                    const day = date.getDate().toString().padStart(2, '0');
                    studentData.dob_formatted = `${year}-${month}-${day}`;
                } catch (e) { studentData.dob_formatted = null; }
            }
            res.render('student-form', { 
                title: 'Edit Student', 
                student: studentData, // Use submitted data on error
                action: `/students/edit/${id}`, 
                error: req.flash('error') 
            });
            return;
        }
        req.flash('success', 'Student updated successfully!');
        res.redirect('/students');
    });
}

// Handle the deletion of a student (only if owned by the user)
function deleteStudentById(req, res) {
    const id = req.params.id;
    const userId = req.session.user.id; // Get user ID

    studentModel.deleteStudent(id, userId, (err, changes) => { // Pass userId
        if (err || changes === 0) {
            console.error(`Error deleting student ${id} for user ${userId}:`, err);
            req.flash('error', `Error deleting student ${err ? err.message : '(Not found or permission denied)'}.`);
            return res.redirect('/students'); 
        }
        req.flash('success', 'Student deleted successfully!'); 
        res.redirect('/students');
    });
}

// Handle exporting students to CSV (only for the logged-in user)
function exportStudents(req, res) {
    const userId = req.session.user.id; // Get user ID
    studentModel.getAllStudents(userId, (err, students) => { // Pass userId
        if (err) {
            console.error("Error fetching students for export:", err);
            req.flash('error', 'Failed to export student data.');
            return res.redirect('/students');
        }

        try {
            // Define fields for CSV
            const fields = [
                { label: 'ID', value: 'id' },
                { label: 'FirstName', value: 'first_name' },
                { label: 'LastName', value: 'last_name' },
                { label: 'Email', value: 'email' },
                { label: 'DateOfBirth', value: 'date_of_birth' },
                { label: 'EnrollmentDate', value: 'enrollment_date' }
            ];
            const json2csvParser = new Parser({ fields });
            const csv = json2csvParser.parse(students);

            res.header('Content-Type', 'text/csv');
            res.attachment('students.csv');
            res.send(csv);

        } catch (parseErr) {
            console.error("Error parsing student data to CSV:", parseErr);
            req.flash('error', 'Failed to generate student CSV export.');
            res.redirect('/students');
        }
    });
}

module.exports = {
    listStudents,
    showAddForm,
    showEditForm,
    addStudent,
    editStudent,
    deleteStudentById,
    exportStudents
}; 