// controllers/reportController.js

const gradeModel = require('../models/gradeModel');
const { db } = require('../db/database'); // For custom aggregation queries
const async = require('async');

function renderReportDashboard(req, res) {
    const userId = req.session.user.id; // Get user ID

    async.parallel({
        // Calculate user-specific overall grade distribution
        gradeDistribution: (cb) => {
            const sql = `
                SELECT 
                    CASE 
                        WHEN grade >= 90 THEN 'A'
                        WHEN grade >= 80 THEN 'B'
                        WHEN grade >= 70 THEN 'C'
                        WHEN grade >= 60 THEN 'D'
                        ELSE 'F' 
                    END as grade_letter,
                    COUNT(*) as count
                FROM grades
                WHERE grade IS NOT NULL AND user_id = ? -- Filter by user
                GROUP BY grade_letter
                ORDER BY grade_letter;
            `;
            db.all(sql, [userId], (err, rows) => { // Pass userId
                if (err) return cb(err);
                const labels = rows.map(r => r.grade_letter);
                const data = rows.map(r => r.count);
                cb(null, { labels, data });
            });
        },
        // Calculate user-specific average grade per course
        avgGradePerCourse: (cb) => {
            const sql = `
                SELECT 
                    c.course_name,
                    AVG(g.grade) as average_grade
                FROM grades g
                JOIN courses c ON g.course_id = c.id AND c.user_id = g.user_id -- Ensure course belongs to user
                WHERE g.grade IS NOT NULL AND g.user_id = ? -- Filter grades by user
                GROUP BY g.course_id, c.course_name
                ORDER BY c.course_name;
            `;
            db.all(sql, [userId], (err, rows) => { // Pass userId
                if (err) return cb(err);
                const labels = rows.map(r => r.course_name);
                const data = rows.map(r => r.average_grade ? r.average_grade.toFixed(1) : 0); 
                cb(null, { labels, data });
            });
        },
        // Calculate user-specific Student Performance Overview
        studentPerformance: (cb) => {
            const sql = `
                SELECT 
                    s.id AS student_id,
                    s.first_name || ' ' || s.last_name AS student_name,
                    COUNT(DISTINCT g.course_id) as courses_count,
                    AVG(g.grade) as average_grade
                FROM students s
                -- Left join grades that belong to the same user
                LEFT JOIN grades g ON s.id = g.student_id AND g.user_id = s.user_id 
                WHERE s.user_id = ? -- Filter students by user
                GROUP BY s.id, s.first_name, s.last_name
                ORDER BY s.last_name, s.first_name;
            `;
            db.all(sql, [userId], (err, rows) => { // Pass userId
                if (err) return cb(err);
                const formattedRows = rows.map(row => ({ 
                    ...row, 
                    average_grade: row.average_grade ? row.average_grade.toFixed(1) : 'N/A'
                }));
                cb(null, formattedRows);
            });
        }
        // Add more report queries here if needed (e.g., top students, etc.)

    }, (err, results) => {
        if (err) {
            console.error(`Error fetching report data for user ${userId}:`, err);
            return res.status(500).render('error', {
                title: 'Server Error',
                message: 'Failed to load report data.',
                error: { status: 500 }
            });
        }

        // Pass the prepared chart data to the view
        res.render('reports', { 
            title: 'Reports', 
            gradeDistributionData: results.gradeDistribution,
            avgGradePerCourseData: results.avgGradePerCourse,
            studentPerformanceData: results.studentPerformance
        });
    });
}

module.exports = {
    renderReportDashboard
}; 