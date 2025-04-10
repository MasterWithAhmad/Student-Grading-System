/**
 * Middleware to check if the user is authenticated.
 * If authenticated, calls the next middleware/route handler.
 * If not authenticated, redirects to the login page.
 */
function isAuthenticated(req, res, next) {
    if (req.session.user) {
        // User is logged in
        return next(); // Ensure we exit the function here
    } else {
        // User is not logged in, redirect to login page
        // Optional: Save the intended URL to redirect back after login
        // req.session.returnTo = req.originalUrl;
        return res.redirect('/auth/login'); // Ensure we exit the function here
    }
}

/**
 * Middleware to check if the user has a specific role (e.g., 'admin').
 * Assumes isAuthenticated middleware has already run.
 * @param {string} role - The required role.
 */
function hasRole(role) {
    return (req, res, next) => {
        if (req.session.user && req.session.user.role === role) {
            return next(); // Ensure we exit the function here
        } else {
            // User does not have the required role
            res.status(403);
            // Render a specific forbidden page or send a simple message
            return res.render('error', { 
                title: 'Forbidden', 
                message: 'You do not have permission to access this resource.',
                error: { status: 403 } 
            }); 
            // Or: return res.status(403).send('Forbidden: You do not have permission to access this resource.');
        }
    };
}


module.exports = {
    isAuthenticated,
    hasRole
}; 