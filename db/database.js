const sqlite3 = require('sqlite3').verbose(); // Use .verbose() for more detailed logs
const path = require('path');

// Determine the database path
const dbPath = path.join(__dirname, 'grading_system.db');

// Create or open the database
// sqlite3 uses an asynchronous connection
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error("Error opening database:", err.message);
    } else {
        console.log('Connected to the SQLite database.');
        initializeDatabase(); // Initialize DB after connection is successful
    }
});

function initializeDatabase() {
    console.log('Initializing database schema...');

    // Use db.serialize to ensure statements run sequentially
    db.serialize(() => {
        // Enable foreign key support
        db.run('PRAGMA foreign_keys = ON;', (err) => {
            if (err) console.error("Error enabling foreign keys:", err.message);
        });

        // User Table
        const createUserTable = `
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT DEFAULT 'teacher' CHECK(role IN ('admin', 'teacher'))
        );
        `;
        db.run(createUserTable, (err) => {
            if (err) console.error("Error creating users table:", err.message);
        });

        // Students Table
        const createStudentsTable = `
        CREATE TABLE IF NOT EXISTS students (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            first_name TEXT NOT NULL,
            last_name TEXT NOT NULL,
            email TEXT,
            date_of_birth DATE,
            enrollment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
            UNIQUE (email, user_id)
        );
        `;
        db.run(createStudentsTable, (err) => {
            if (err) console.error("Error creating students table:", err.message);
        });

        // Courses Table
        const createCoursesTable = `
        CREATE TABLE IF NOT EXISTS courses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            course_name TEXT NOT NULL,
            course_code TEXT NOT NULL,
            description TEXT,
            credits INTEGER,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
            UNIQUE (course_code, user_id)
        );
        `;
        db.run(createCoursesTable, (err) => {
            if (err) console.error("Error creating courses table:", err.message);
        });

        // Grades Table
        const createGradesTable = `
        CREATE TABLE IF NOT EXISTS grades (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            student_id INTEGER NOT NULL,
            course_id INTEGER NOT NULL,
            grade REAL,
            assignment_name TEXT,
            date_assigned TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
            FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE,
            FOREIGN KEY (course_id) REFERENCES courses (id) ON DELETE CASCADE,
            UNIQUE (student_id, course_id, assignment_name)
        );
        `;
        db.run(createGradesTable, (err) => {
            if (err) {
                console.error("Error creating grades table:", err.message);
            } else {
                console.log('Database schema initialized successfully.');
            }
        });

        // User Settings Table
        const createUserSettingsTable = `
        CREATE TABLE IF NOT EXISTS user_settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            setting_key TEXT NOT NULL,
            setting_value TEXT,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
            UNIQUE (user_id, setting_key)
        );
        `;
        db.run(createUserSettingsTable, (err) => {
            if (err) console.error("Error creating user_settings table:", err.message);
        });
    });
}

// NOTE: With sqlite3, the `db` object itself is the connection.
// The `initializeDatabase` function is now called internally after connection.
// We just export the db object.
module.exports = { db }; 