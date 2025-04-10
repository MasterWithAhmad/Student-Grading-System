const studentModel = require('../models/studentModel');
const courseModel = require('../models/courseModel');
const gradeModel = require('../models/gradeModel');
const { db } = require('../db/database'); // Direct access for simple counts
const async = require('async');

function showDashboard(req, res) {
    const userId = req.session.user.id; // Get user ID

    async.parallel({
        studentCount: (cb) => {
            db.get("SELECT COUNT(*) as count FROM students WHERE user_id = ?", [userId], (err, row) => {
                cb(err, row ? row.count : 0);
            });
        },
        courseCount: (cb) => {
            db.get("SELECT COUNT(*) as count FROM courses WHERE user_id = ?", [userId], (err, row) => {
                cb(err, row ? row.count : 0);
            });
        },
        gradeCount: (cb) => {
            db.get("SELECT COUNT(*) as count FROM grades WHERE user_id = ?", [userId], (err, row) => {
                cb(err, row ? row.count : 0);
            });
        },
        overallAverageGrade: (cb) => {
            // Calculate average only for grades belonging to the user
            db.get("SELECT AVG(grade) as avg_grade FROM grades WHERE grade IS NOT NULL AND user_id = ?", [userId], (err, row) => {
                cb(err, row && row.avg_grade ? row.avg_grade.toFixed(1) : 'N/A');
            });
        },
        recentGrades: (cb) => {
            // Get user-specific grades, limit to 5 most recent
            gradeModel.getAllGrades(userId, (err, grades) => { // Pass userId
                cb(err, grades ? grades.slice(0, 5) : []);
            });
        }
    }, (err, results) => {
        if (err) {
            console.error(`Error fetching dashboard data for user ${userId}:`, err);
            // Render dashboard with placeholders/error state
            return res.render('index', {
                title: 'Dashboard',
                stats: null,
                recentGrades: [],
                error: 'Failed to load dashboard data.'
            });
        }

        res.render('index', {
            title: 'Dashboard',
            stats: {
                students: results.studentCount,
                courses: results.courseCount,
                grades: results.gradeCount,
                average: results.overallAverageGrade
            },
            recentGrades: results.recentGrades,
            error: null
        });
    });
}

module.exports = {
    showDashboard
}; 