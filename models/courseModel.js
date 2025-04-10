const { db } = require('../db/database');

/**
 * Get all courses for a specific user.
 * @param {number} userId - The ID of the logged-in user.
 * @param {function(Error|null, Array<object>)} callback 
 */
function getAllCourses(userId, callback) {
    const sql = `SELECT * FROM courses WHERE user_id = ? ORDER BY course_name`;
    db.all(sql, [userId], (err, rows) => {
        if (err) {
            console.error(`Error getting all courses for user ${userId}:`, err.message);
            return callback(err, []);
        }
        callback(null, rows);
    });
}

/**
 * Get a single course by ID, ensuring it belongs to the specified user.
 * @param {number} id 
 * @param {number} userId - The ID of the logged-in user.
 * @param {function(Error|null, object|null)} callback 
 */
function getCourseById(id, userId, callback) {
    const sql = `SELECT * FROM courses WHERE id = ? AND user_id = ?`;
    db.get(sql, [id, userId], (err, row) => {
        if (err) {
            console.error(`Error getting course ${id} for user ${userId}:`, err.message);
            return callback(err, null);
        }
        callback(null, row || null); // Return row or null if not found/owned
    });
}

/**
 * Create a new course associated with a specific user.
 * @param {object} courseData - { user_id, course_name, course_code, description, credits }
 * @param {function(Error|null, number|null)} callback - Returns error or the ID of the new course.
 */
function createCourse(courseData, callback) {
    const { user_id, course_name, course_code, description, credits } = courseData;
    if (!user_id) {
        return callback(new Error("user_id is required to create a course"), null);
    }
    const sql = `INSERT INTO courses (user_id, course_name, course_code, description, credits) VALUES (?, ?, ?, ?, ?)`;
    db.run(sql, [user_id, course_name, course_code, description || null, credits || null], function(err) {
        if (err) {
            console.error(`Error creating course for user ${userId}:`, err.message);
            return callback(err, null);
        }
        callback(null, this.lastID);
    });
}

/**
 * Update an existing course, ensuring it belongs to the specified user.
 * @param {number} id
 * @param {number} userId - The ID of the logged-in user.
 * @param {object} courseData - { course_name, course_code, description, credits }
 * @param {function(Error|null, number)} callback - Returns error or number of rows changed.
 */
function updateCourse(id, userId, courseData, callback) {
    const { course_name, course_code, description, credits } = courseData;
    const sql = `UPDATE courses 
                 SET course_name = ?, course_code = ?, description = ?, credits = ? 
                 WHERE id = ? AND user_id = ?`;
    db.run(sql, [course_name, course_code, description || null, credits || null, id, userId], function(err) {
        if (err) {
            console.error(`Error updating course ${id} for user ${userId}:`, err.message);
            return callback(err, 0);
        }
        callback(null, this.changes); // Number of rows updated (0 if not found/owned)
    });
}

/**
 * Delete a course by ID, ensuring it belongs to the specified user.
 * @param {number} id
 * @param {number} userId - The ID of the logged-in user.
 * @param {function(Error|null, number)} callback - Returns error or number of rows deleted.
 */
function deleteCourse(id, userId, callback) {
    const sql = `DELETE FROM courses WHERE id = ? AND user_id = ?`;
    db.run(sql, [id, userId], function(err) {
        if (err) {
            console.error(`Error deleting course ${id} for user ${userId}:`, err.message);
            // FK constraint failure will be caught here if grades exist for this user's course
            return callback(err, 0);
        }
        callback(null, this.changes); // Number of rows deleted (0 if not found/owned)
    });
}

module.exports = {
    getAllCourses,
    getCourseById,
    createCourse,
    updateCourse,
    deleteCourse
}; 