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

module.exports = {
    findUserByUsername,
    createUser
}; 