const { db } = require('../db/database');

// Helper function to run JOIN queries and attach student/course names
function getGradesWithDetails(sql, params, callback) {
    const fullSql = `
        SELECT 
            g.*, 
            s.first_name || ' ' || s.last_name AS student_name, 
            c.course_name, 
            c.course_code
        FROM grades g
        JOIN students s ON g.student_id = s.id
        JOIN courses c ON g.course_id = c.id
        ${sql}  -- Append specific WHERE or ORDER clauses here
    `;
    db.all(fullSql, params, (err, rows) => {
        if (err) {
            console.error("Error getting grades with details:", err.message);
            return callback(err, []);
        }
        callback(null, rows);
    });
}

/**
 * Get all grades for a specific user, including student and course details.
 * @param {number} userId - The ID of the logged-in user.
 * @param {function(Error|null, Array<object>)} callback 
 */
function getAllGrades(userId, callback) {
    const sql = `
        SELECT 
            g.*, 
            s.first_name || ' ' || s.last_name AS student_name, 
            c.course_name, 
            c.course_code
        FROM grades g
        JOIN students s ON g.student_id = s.id AND s.user_id = g.user_id -- Ensure student belongs to same user
        JOIN courses c ON g.course_id = c.id AND c.user_id = g.user_id -- Ensure course belongs to same user
        WHERE g.user_id = ?
        ORDER BY g.date_assigned DESC, s.last_name, c.course_name
    `;
    db.all(sql, [userId], (err, rows) => {
        if (err) {
            console.error(`Error getting all grades for user ${userId}:`, err.message);
            return callback(err, []);
        }
        callback(null, rows);
    });
}

/**
 * Get a single grade entry by ID, ensuring it belongs to the specified user.
 * @param {number} id 
 * @param {number} userId - The ID of the logged-in user.
 * @param {function(Error|null, object|null)} callback 
 */
function getGradeById(id, userId, callback) {
    const sql = `
        SELECT 
            g.*, 
            s.first_name || ' ' || s.last_name AS student_name, 
            c.course_name, 
            c.course_code
        FROM grades g
        JOIN students s ON g.student_id = s.id AND s.user_id = g.user_id
        JOIN courses c ON g.course_id = c.id AND c.user_id = g.user_id
        WHERE g.id = ? AND g.user_id = ?
    `;
    db.get(sql, [id, userId], (err, row) => {
        if (err) {
            console.error(`Error getting grade ${id} for user ${userId}:`, err.message);
            return callback(err, null);
        }
        callback(null, row || null); // Return row or null if not found/owned
    });
}

/**
 * Create a new grade entry associated with a specific user.
 * Note: Assumes student_id and course_id provided already belong to the user (controller should verify).
 * @param {object} gradeData - { user_id, student_id, course_id, grade, assignment_name }
 * @param {function(Error|null, number|null)} callback - Returns error or the ID of the new grade.
 */
function createGrade(gradeData, callback) {
    const { user_id, student_id, course_id, grade, assignment_name } = gradeData;
    if (!user_id || !student_id || !course_id) {
         return callback(new Error("user_id, student_id, and course_id are required to create a grade"), null);
    }
    const sql = `INSERT INTO grades (user_id, student_id, course_id, grade, assignment_name) VALUES (?, ?, ?, ?, ?)`;
    db.run(sql, [user_id, student_id, course_id, grade, assignment_name || null], function(err) {
        if (err) {
            console.error(`Error creating grade for user ${user_id}:`, err.message);
            return callback(err, null);
        }
        callback(null, this.lastID);
    });
}

/**
 * Update an existing grade entry, ensuring it belongs to the specified user.
 * Note: Assumes student_id and course_id provided already belong to the user (controller should verify).
 * @param {number} id
 * @param {number} userId - The ID of the logged-in user.
 * @param {object} gradeData - { student_id, course_id, grade, assignment_name }
 * @param {function(Error|null, number)} callback - Returns error or number of rows changed.
 */
function updateGrade(id, userId, gradeData, callback) {
    const { student_id, course_id, grade, assignment_name } = gradeData;
     if (!student_id || !course_id) {
         return callback(new Error("student_id and course_id are required to update a grade"), 0);
    }
    const sql = `UPDATE grades 
                 SET student_id = ?, course_id = ?, grade = ?, assignment_name = ? 
                 WHERE id = ? AND user_id = ?`;
    db.run(sql, [student_id, course_id, grade, assignment_name || null, id, userId], function(err) {
        if (err) {
            console.error(`Error updating grade ${id} for user ${userId}:`, err.message);
            return callback(err, 0);
        }
        callback(null, this.changes); // 0 if not found/owned
    });
}

/**
 * Delete a grade entry by ID, ensuring it belongs to the specified user.
 * @param {number} id
 * @param {number} userId - The ID of the logged-in user.
 * @param {function(Error|null, number)} callback - Returns error or number of rows deleted.
 */
function deleteGrade(id, userId, callback) {
    const sql = `DELETE FROM grades WHERE id = ? AND user_id = ?`;
    db.run(sql, [id, userId], function(err) {
        if (err) {
            console.error(`Error deleting grade ${id} for user ${userId}:`, err.message);
            return callback(err, 0);
        }
        callback(null, this.changes); // 0 if not found/owned
    });
}


module.exports = {
    getAllGrades,
    getGradeById,
    createGrade,
    updateGrade,
    deleteGrade
    // We might add functions like getGradesByStudent or getGradesByCourse later if needed for reports
}; 