const { db } = require('../db/database');

/**
 * Finds a user by their username asynchronously.
 * @param {string} username - The username to search for.
 * @param {function(Error|null, object|null)} callback - The callback function.
 */
function findUserByUsername(username, callback) {
    const sql = 'SELECT * FROM users WHERE username = ?';
    db.get(sql, [username], (err, row) => {
        if (err) {
            console.error('Error finding user by username:', err);
            return callback(err, null);
        }
        // If row is undefined (no user found), pass null as the user
        callback(null, row || null);
    });
}

/**
 * Creates a new user in the database asynchronously.
 * @param {string} username - The username for the new user.
 * @param {string} hashedPassword - The hashed password for the new user.
 * @param {string} [role='teacher'] - The role for the new user.
 * @param {function(Error|null, number|null)} callback - Callback with error or the ID of the new user.
 */
function createUser(username, hashedPassword, role = 'teacher', callback) {
    const sql = 'INSERT INTO users (username, password, role) VALUES (?, ?, ?)';
    // Use `function` keyword for `this` context provided by sqlite3
    db.run(sql, [username, hashedPassword, role], function(err) { 
        if (err) {
            // Handle potential errors, e.g., unique constraint violation
            if (err.code === 'SQLITE_CONSTRAINT') { // More general constraint check
                console.error('Constraint violation (e.g., username already exists):', username);
                // Pass a specific error or null for the ID, and maybe an error message
                return callback(err, null); 
            } else {
                console.error('Error creating user:', err);
                return callback(err, null);
            }
        }
        // `this.lastID` contains the ID of the inserted row
        callback(null, this.lastID); 
    });
}

/**
 * Finds a user by their ID asynchronously.
 * @param {number} id - The user ID to search for.
 * @param {function(Error|null, object|null)} callback - The callback function.
 */
function findUserById(id, callback) {
    const sql = 'SELECT * FROM users WHERE id = ?';
    db.get(sql, [id], (err, row) => {
        if (err) {
            console.error('Error finding user by ID:', err);
            return callback(err, null);
        }
        callback(null, row || null);
    });
}

/**
 * Updates a user's profile (username, role) by ID.
 * @param {number} id - The user ID.
 * @param {object} updates - The fields to update (username, role).
 * @param {function(Error|null, number|null)} callback - Callback with error or number of changes.
 */
function updateUserProfile(id, updates, callback) {
    const fields = [];
    const values = [];
    if (updates.username) {
        fields.push('username = ?');
        values.push(updates.username);
    }
    if (updates.role) {
        fields.push('role = ?');
        values.push(updates.role);
    }
    if (fields.length === 0) return callback(null, 0);
    values.push(id);
    const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
    db.run(sql, values, function(err) {
        if (err) return callback(err, null);
        callback(null, this.changes);
    });
}

/**
 * Updates a user's password by ID.
 * @param {number} id - The user ID.
 * @param {string} hashedPassword - The new hashed password.
 * @param {function(Error|null, number|null)} callback - Callback with error or number of changes.
 */
function updateUserPassword(id, hashedPassword, callback) {
    const sql = 'UPDATE users SET password = ? WHERE id = ?';
    db.run(sql, [hashedPassword, id], function(err) {
        if (err) return callback(err, null);
        callback(null, this.changes);
    });
}

module.exports = {
    findUserByUsername,
    createUser,
    findUserById,
    updateUserProfile,
    updateUserPassword
}; 