// controllers/courseController.js

const courseModel = require('../models/courseModel');
const { Parser } = require('json2csv');

// Display list of all courses for the logged-in user
function listCourses(req, res) {
    const userId = req.session.user.id; // Get user ID
    courseModel.getAllCourses(userId, (err, courses) => { // Pass userId
        if (err) {
            console.error("Error fetching courses for user:", userId, err);
            return res.status(500).render('error', {
                title: 'Server Error',
                message: 'Failed to fetch course data.',
                error: { status: 500 }
            });
        }
        res.render('courses', { title: 'Courses', courses: courses });
    });
}

// Display the form to add a new course
function showAddForm(req, res) {
    res.render('course-form', { 
        title: 'Add Course', 
        course: null, 
        action: '/courses/add',
        error: null
    });
}

// Display the form to edit an existing course (only if owned by the user)
function showEditForm(req, res) {
    const id = req.params.id;
    const userId = req.session.user.id; // Get user ID
    courseModel.getCourseById(id, userId, (err, course) => { // Pass userId
        if (err || !course) {
            console.error(`Error fetching course ${id} for edit for user ${userId}:`, err);
            req.flash('error', 'Course not found or you do not have permission to edit it.');
            return res.redirect('/courses'); // Redirect if not found/owned
        }
        res.render('course-form', { 
            title: 'Edit Course', 
            course: course, 
            action: `/courses/edit/${id}`,
            error: null
        });
    });
}

// Handle the creation of a new course for the logged-in user (POST)
function addCourse(req, res) {
    const courseData = req.body; 
    const userId = req.session.user.id; // Get user ID
    courseData.user_id = userId; // Add user_id to the data

    courseModel.createCourse(courseData, (err, newId) => {
        if (err) {
            console.error(`Error adding course for user ${userId}:`, err);
            let errorMessage = 'Failed to add course. Please check your input.';
            // Check for unique constraint violation (course_code per user)
            if (err.message && err.message.includes('UNIQUE constraint failed: courses.course_code, courses.user_id')) {
                errorMessage = 'Failed to add course. This Course Code is already used in your records.';
            }
            req.flash('error', errorMessage); 
            return res.render('course-form', {
                title: 'Add Course',
                course: courseData, // Send back submitted data
                action: '/courses/add',
                error: req.flash('error') 
            });
        }
        req.flash('success', 'Course added successfully!');
        res.redirect('/courses');
    });
}

// Handle the update of an existing course (only if owned by the user) (POST)
function editCourse(req, res) {
    const id = req.params.id;
    const courseData = req.body;
    const userId = req.session.user.id; // Get user ID

    courseModel.updateCourse(id, userId, courseData, (err, changes) => { // Pass userId
        if (err || changes === 0) {
            let errorMessage = 'Failed to update course.';
            // Check for unique constraint violation (course_code per user)
            if (err && err.message && err.message.includes('UNIQUE constraint failed: courses.course_code, courses.user_id')) {
                errorMessage = 'Update failed: This Course Code is already used in your records.';
            } else if (changes === 0) {
                 errorMessage = 'Update failed: Course not found, you do not have permission, or no changes were made.';
            }
            console.error(`Error updating course ${id} for user ${userId}:`, err);
            req.flash('error', errorMessage); 
            // Re-render form with submitted data
            res.render('course-form', { 
                title: 'Edit Course', 
                course: courseData, // Use submitted data on error
                action: `/courses/edit/${id}`, 
                error: req.flash('error')
            });
            return;
        }
        req.flash('success', 'Course updated successfully!');
        res.redirect('/courses');
    });
}

// Handle the deletion of a course (only if owned by the user) (POST)
function deleteCourseById(req, res) {
    const id = req.params.id;
    const userId = req.session.user.id; // Get user ID

    courseModel.deleteCourse(id, userId, (err, changes) => { // Pass userId
        let errorMsg = null;
        if (err) {
            console.error(`Error deleting course ${id} for user ${userId}:`, err);
             // FK constraint likely means grades exist for this course owned by the user
            if (err.code === 'SQLITE_CONSTRAINT' && err.message.includes('FOREIGN KEY constraint failed')) {
                errorMsg = 'Cannot delete course: associated grades exist for this course in your records. Delete the grades first.';
            } else {
                 errorMsg = `Error deleting course: ${err.message}`;
            }
        } else if (changes === 0) {
             errorMsg = 'Error deleting course: Course not found or permission denied.';
        }

        if (errorMsg) {
            req.flash('error', errorMsg); 
        } else {
            req.flash('success', 'Course deleted successfully!');
        }
        res.redirect('/courses');
    });
}

// Handle exporting courses to CSV (only for the logged-in user)
function exportCourses(req, res) {
    const userId = req.session.user.id; // Get user ID
    courseModel.getAllCourses(userId, (err, courses) => { // Pass userId
        if (err) {
            console.error(`Error fetching courses for export for user ${userId}:`, err);
            req.flash('error', 'Failed to export course data.');
            return res.redirect('/courses');
        }
        try {
            const fields = [
                { label: 'ID', value: 'id' },
                { label: 'Code', value: 'course_code' },
                { label: 'Name', value: 'course_name' },
                { label: 'Credits', value: 'credits' },
                { label: 'Description', value: 'description' }
            ];
            const json2csvParser = new Parser({ fields });
            const csv = json2csvParser.parse(courses);

            res.header('Content-Type', 'text/csv');
            res.attachment('courses.csv');
            res.send(csv);
        } catch (parseErr) {
            console.error(`Error parsing course data to CSV for user ${userId}:`, parseErr);
            req.flash('error', 'Failed to generate course CSV export.');
            res.redirect('/courses');
        }
    });
}

module.exports = {
    listCourses,
    showAddForm,
    showEditForm,
    addCourse,
    editCourse,
    deleteCourseById,
    exportCourses
}; 