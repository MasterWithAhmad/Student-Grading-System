require('dotenv').config();
const express = require('express');
const path = require('path');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const expressLayouts = require('express-ejs-layouts'); // Require the middleware
const authRoutes = require('./routes/authRoutes'); // Import auth routes
const studentRoutes = require('./routes/studentRoutes'); // Import student routes
const courseRoutes = require('./routes/courseRoutes'); // Import course routes
const gradeRoutes = require('./routes/gradeRoutes'); // Import grade routes
const reportRoutes = require('./routes/reportRoutes'); // Import report routes
const { isAuthenticated } = require('./middleware/authMiddleware'); // Import auth middleware
const dashboardController = require('./controllers/dashboardController'); // Import dashboard controller
const flash = require('connect-flash'); // Require connect-flash

const app = express();
const PORT = process.env.PORT || 3000;

// --- Database Setup ---
// initializeDatabase(); // Initialization is now handled within db/database.js

// --- Middleware ---
// Use EJS layouts BEFORE setting the view engine
app.use(expressLayouts);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('layout', 'layout'); // Keep this - express-ejs-layouts uses it

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true })); // For parsing form data
app.use(express.json()); // For parsing application/json

// Session configuration (MUST come before flash)
app.use(session({
    store: new SQLiteStore({
        db: 'sessions.db', // Database file name
        dir: './db' // Directory to store the session database file
    }),
    secret: process.env.SESSION_SECRET || 'a default secret for safety',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
        httpOnly: true, // Prevent client-side access to the cookie
        maxAge: 24 * 60 * 60 * 1000 // Cookie expiry (e.g., 1 day)
    }
}));

// Flash middleware (MUST come after session)
app.use(flash());

// Middleware to make session, flash messages, and current path available in templates
app.use((req, res, next) => {
    res.locals.user = req.session.user;
    res.locals.success_msg = req.flash('success');
    res.locals.error_msg = req.flash('error');
    res.locals.currentPath = req.path; // Add current path to locals
    next();
});

// --- Routes ---
app.use('/auth', authRoutes); // Authentication routes (don't require login)

// Apply isAuthenticated middleware to all subsequent routes
// app.use(isAuthenticated); // Apply to all routes below - OR apply per route

// Basic route for the dashboard (protected)
app.get('/', isAuthenticated, dashboardController.showDashboard); // Use dashboard controller

// Mount feature routes (protected)
app.use('/students', isAuthenticated, studentRoutes);
app.use('/courses', isAuthenticated, courseRoutes);
app.use('/grades', isAuthenticated, gradeRoutes);
app.use('/reports', isAuthenticated, reportRoutes);

// --- Server Start ---
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
}); 