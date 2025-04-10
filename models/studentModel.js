const { db } = require('../db/database');

/**
 * Get all students for a specific user.
 * @param {number} userId - The ID of the logged-in user.
 * @param {function(Error|null, Array<object>)} callback 
 */
function getAllStudents(userId, callback) {
    const sql = `SELECT * FROM students WHERE user_id = ? ORDER BY last_name, first_name`;
    db.all(sql, [userId], (err, rows) => {
        if (err) {
            console.error("Error getting all students for user:", userId, err.message);
            return callback(err, []);
        }
        callback(null, rows);
    });
}

/**
 * Get a single student by ID, ensuring it belongs to the specified user.
 * @param {number} id 
 * @param {number} userId - The ID of the logged-in user.
 * @param {function(Error|null, object|null)} callback 
 */
function getStudentById(id, userId, callback) {
    const sql = `SELECT * FROM students WHERE id = ? AND user_id = ?`;
    db.get(sql, [id, userId], (err, row) => {
        if (err) {
            console.error(`Error getting student ${id} for user ${userId}:`, err.message);
            return callback(err, null);
        }
        callback(null, row || null); // Return row or null if not found/not owned
    });
}

/**
 * Create a new student associated with a specific user.
 * @param {object} studentData - { user_id, first_name, last_name, email, date_of_birth }
 * @param {function(Error|null, number|null)} callback - Returns error or the ID of the new student.
 */
function createStudent(studentData, callback) {
    // Ensure user_id is provided
    const { user_id, first_name, last_name, email, date_of_birth } = studentData;
    if (!user_id) {
        return callback(new Error("user_id is required to create a student"), null);
    }
    const sql = `INSERT INTO students (user_id, first_name, last_name, email, date_of_birth) VALUES (?, ?, ?, ?, ?)`;
    db.run(sql, [user_id, first_name, last_name, email, date_of_birth || null], function(err) {
        if (err) {
            console.error("Error creating student for user:", user_id, err.message);
            return callback(err, null);
        }
        callback(null, this.lastID);
    });
}

/**
 * Update an existing student, ensuring it belongs to the specified user.
 * @param {number} id
 * @param {number} userId - The ID of the logged-in user.
 * @param {object} studentData - { first_name, last_name, email, date_of_birth }
 * @param {function(Error|null, number)} callback - Returns error or number of rows changed (should be 1).
 */
function updateStudent(id, userId, studentData, callback) {
    const { first_name, last_name, email, date_of_birth } = studentData;
    const sql = `UPDATE students 
                 SET first_name = ?, last_name = ?, email = ?, date_of_birth = ? 
                 WHERE id = ? AND user_id = ?`;
    db.run(sql, [first_name, last_name, email, date_of_birth || null, id, userId], function(err) {
        if (err) {
            console.error(`Error updating student ${id} for user ${userId}:`, err.message);
            return callback(err, 0);
        }
        callback(null, this.changes); // Number of rows updated (0 if not found/owned)
    });
}

/**
 * Delete a student by ID, ensuring it belongs to the specified user.
 * @param {number} id
 * @param {number} userId - The ID of the logged-in user.
 * @param {function(Error|null, number)} callback - Returns error or number of rows deleted (should be 1).
 */
function deleteStudent(id, userId, callback) {
    const sql = `DELETE FROM students WHERE id = ? AND user_id = ?`;
    db.run(sql, [id, userId], function(err) {
        if (err) {
            console.error(`Error deleting student ${id} for user ${userId}:`, err.message);
            return callback(err, 0);
        }
        callback(null, this.changes); // Number of rows deleted (0 if not found/owned)
    });
}

module.exports = {
    getAllStudents,
    getStudentById,
    createStudent,
    updateStudent,
    deleteStudent
}; 