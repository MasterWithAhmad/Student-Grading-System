const { db } = require('./db/database');
const bcrypt = require('bcrypt'); // Need bcrypt to hash password

// --- User for Seed Data ---
const seedUser = {
    username: 'ahmad', 
    password: '123', // Plain text, will be hashed
    role: 'teacher'
};

// --- Sample Data ---

const students = [
  { first_name: 'Alice', last_name: 'Smith', email: 'alice.s@example.com', date_of_birth: '2005-03-15' },
  { first_name: 'Bob', last_name: 'Johnson', email: 'b.johnson@example.com', date_of_birth: '2006-07-22' },
  { first_name: 'Charlie', last_name: 'Brown', email: 'charlie@example.com', date_of_birth: '2005-11-01' },
  { first_name: 'Diana', last_name: 'Ross', email: 'diana.r@example.com', date_of_birth: '2006-01-30' },
  { first_name: 'Ethan', last_name: 'Hunt', email: 'ethan.h@example.com', date_of_birth: '2005-09-10' }
];

const courses = [
  { course_name: 'Introduction to Programming', course_code: 'CS101', description: 'Fundamentals of programming using JavaScript.', credits: 3 },
  { course_name: 'Calculus I', course_code: 'MA101', description: 'Limits, derivatives, and integrals.', credits: 4 },
  { course_name: 'World History', course_code: 'HI101', description: 'Survey of world history from ancient times to the present.', credits: 3 },
  { course_name: 'Introduction to Chemistry', course_code: 'CH101', description: 'Basic principles of chemistry.', credits: 4 }
];

// NOTE: Assumes student IDs and course IDs will be 1, 2, 3, ... relative to the *user's* data.
// This assumption is fragile if data is not cleared or other users exist.
const grades = [
  { student_id_relative: 1, course_id_relative: 1, grade: 88, assignment_name: 'Midterm Exam' },
  { student_id_relative: 1, course_id_relative: 1, grade: 92, assignment_name: 'Final Project' },
  { student_id_relative: 1, course_id_relative: 2, grade: 75 }, 
  { student_id_relative: 2, course_id_relative: 1, grade: 95 },
  { student_id_relative: 2, course_id_relative: 3, grade: 82 },
  { student_id_relative: 3, course_id_relative: 1, grade: 65 },
  { student_id_relative: 3, course_id_relative: 2, grade: 70 },
  { student_id_relative: 3, course_id_relative: 3, grade: 58 },
  { student_id_relative: 4, course_id_relative: 2, grade: 91 },
  { student_id_relative: 4, course_id_relative: 4, grade: 85 },
  { student_id_relative: 5, course_id_relative: 1, grade: 78 },
  { student_id_relative: 5, course_id_relative: 4, grade: 72 }, 
];

// --- Seeding Logic ---

db.serialize(async () => {
  console.log('Starting database seeding...');

  // Optional: Clear existing data for the seed user only (safer than clearing all)
  // Requires fetching user ID first if uncommented.
  // console.log('Clearing existing data for user:', seedUser.username);
  // const seedUserId = await getUserId(seedUser.username);
  // if (seedUserId) {
  //   db.run('DELETE FROM grades WHERE user_id = ?', [seedUserId]);
  //   db.run('DELETE FROM students WHERE user_id = ?', [seedUserId]);
  //   db.run('DELETE FROM courses WHERE user_id = ?', [seedUserId]);
  // } else {
  //   console.log('Seed user not found, skipping clear.');
  // }

  // --- Insert/Get Seed User ---
  let seedUserId = null;
  try {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(seedUser.password, saltRounds);
    
    // Try inserting the user, ignore if username already exists
    await new Promise((resolve, reject) => {
      const userStmt = db.prepare('INSERT OR IGNORE INTO users (username, password, role) VALUES (?, ?, ?)');
      userStmt.run(seedUser.username, hashedPassword, seedUser.role, function(err) {
        if (err) {
          console.error('Error preparing/running user insert:', err.message);
          return reject(err);
        }
        console.log(`User '${seedUser.username}' processed. Inserted ID: ${this.lastID}, Changes: ${this.changes}`);
        userStmt.finalize(resolve);
      });
    });

    // Fetch the user's ID (whether just inserted or already existed)
    seedUserId = await getUserId(seedUser.username);

    if (!seedUserId) {
      throw new Error(`Failed to find or create seed user '${seedUser.username}'`);
    }
    console.log(`Using user ID ${seedUserId} for seeding data.`);

  } catch (err) {
    console.error('Failed to setup seed user:', err.message);
    db.close();
    return; // Stop seeding if user setup fails
  }

  // --- Insert Data with User ID ---

  // Keep track of inserted IDs (more robust than assuming 1, 2, 3...)
  const insertedStudentIds = {}; 
  const insertedCourseIds = {};

  // Insert Students
  console.log('Inserting students...');
  const studentStmt = db.prepare('INSERT INTO students (user_id, first_name, last_name, email, date_of_birth) VALUES (?, ?, ?, ?, ?)');
  for (let i = 0; i < students.length; i++) {
    const s = students[i];
    await new Promise((resolve, reject) => {
       studentStmt.run(seedUserId, s.first_name, s.last_name, s.email, s.date_of_birth, function(err) {
          if (err) {
            console.error('Error inserting student:', s.first_name, err.message);
            // Decide if you want to stop or continue on error
          } else {
            insertedStudentIds[i + 1] = this.lastID; // Store actual ID mapped to original relative ID (1-based)
          }
          resolve(); // Resolve even on error to continue seeding other data types
      });
    });
  }
  studentStmt.finalize();

  // Insert Courses
  console.log('Inserting courses...');
  const courseStmt = db.prepare('INSERT INTO courses (user_id, course_name, course_code, description, credits) VALUES (?, ?, ?, ?, ?)');
  for (let i = 0; i < courses.length; i++) {
    const c = courses[i];
     await new Promise((resolve, reject) => {
        courseStmt.run(seedUserId, c.course_name, c.course_code, c.description, c.credits, function(err) {
            if (err) {
                console.error('Error inserting course:', c.course_name, err.message);
            } else {
                insertedCourseIds[i + 1] = this.lastID; // Store actual ID
            }
             resolve();
        });
    });
  }
  courseStmt.finalize();

  // Insert Grades
  console.log('Inserting grades...');
  const gradeStmt = db.prepare('INSERT INTO grades (user_id, student_id, course_id, grade, assignment_name) VALUES (?, ?, ?, ?, ?)');
  for (const g of grades) {
    // Look up the actual IDs based on the relative IDs from the sample data
    const actualStudentId = insertedStudentIds[g.student_id_relative];
    const actualCourseId = insertedCourseIds[g.course_id_relative];

    if (!actualStudentId || !actualCourseId) {
        console.warn(`Skipping grade insert: Cannot find actual ID for relative student ${g.student_id_relative} or course ${g.course_id_relative}. This might happen if student/course insertion failed.`);
        continue; // Skip this grade if prerequisite IDs weren't found
    }

     await new Promise((resolve, reject) => {
        gradeStmt.run(seedUserId, actualStudentId, actualCourseId, g.grade, g.assignment_name, (err) => {
            if (err) {
                console.error(`Error inserting grade for student ${actualStudentId}, course ${actualCourseId}:`, err.message);
            }
             resolve();
        });
    });
  }
  gradeStmt.finalize((err) => {
      if (err) {
          console.error("Finalize error for grades:", err.message);
      }
      console.log('Database seeding completed for user:', seedUser.username);
      
      // Close the database connection
      db.close((closeErr) => {
        if (closeErr) {
          console.error('Error closing database connection:', closeErr.message);
        } else {
          console.log('Database connection closed.');
        }
      });
  });
});

// Helper function to get user ID
async function getUserId(username) {
  return new Promise((resolve, reject) => {
    db.get('SELECT id FROM users WHERE username = ?', [username], (err, row) => {
      if (err) {
        console.error('Error fetching user ID:', err.message);
        return reject(err);
      }
      resolve(row ? row.id : null);
    });
  });
} 