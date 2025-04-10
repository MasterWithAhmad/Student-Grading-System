const bcrypt = require('bcrypt');
const userModel = require('../models/userModel');

// Render the registration form
function renderRegisterForm(req, res) {
    res.render('register', { 
        title: 'Register', 
        error: null, 
        formData: {}, 
        layout: 'auth-layout' // Use the auth layout
    });
}

// Handle user registration
async function registerUser(req, res) {
    const { username, password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
        return res.render('register', { 
            title: 'Register', 
            error: 'Passwords do not match', 
            formData: { username }, 
            layout: 'auth-layout' // Use the auth layout on error
        });
    }

    try {
        // Check if user already exists (using callback)
        userModel.findUserByUsername(username, async (err, existingUser) => {
            if (err) {
                console.error('Registration Find Error:', err);
                return res.render('register', { 
                    title: 'Register', 
                    error: 'An unexpected error occurred during check.', 
                    formData: { username }, 
                    layout: 'auth-layout' // Use the auth layout on error
                });
            }
            if (existingUser) {
                return res.render('register', { 
                    title: 'Register', 
                    error: 'Username already taken', 
                    formData: { username }, 
                    layout: 'auth-layout' // Use the auth layout on error
                });
            }

            // Hash the password (bcrypt is already async)
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(password, saltRounds);

            // Create user (using callback)
            userModel.createUser(username, hashedPassword, 'teacher', (createErr, userId) => {
                if (createErr || !userId) {
                    console.error('Registration Create Error:', createErr);
                    const message = createErr && createErr.code === 'SQLITE_CONSTRAINT' 
                                    ? 'Username already exists.' 
                                    : 'Registration failed. Please try again.';
                    return res.render('register', { 
                        title: 'Register', 
                        error: message, 
                        formData: { username }, 
                        layout: 'auth-layout' // Use the auth layout on error
                    });
                }

                // Optional: Log the user in immediately after registration
                req.session.user = { id: userId, username: username, role: 'teacher' }; 
                req.session.save(saveErr => {
                    if (saveErr) {
                        console.error('Session Save Error after Register:', saveErr);
                        // Proceed to redirect even if session save fails, but log it
                    }
                    res.redirect('/'); // Redirect to dashboard
                });
            });
        });
    } catch (hashError) {
        // Catch hashing errors separately
        console.error('Password Hashing Error:', hashError);
        res.render('register', { 
            title: 'Register', 
            error: 'An error occurred during registration setup.', 
            formData: { username }, 
            layout: 'auth-layout' // Use the auth layout on error
        });
    }
}

// Render the login form
function renderLoginForm(req, res) {
    res.render('login', { 
        title: 'Login', 
        error: null, 
        formData: {}, 
        layout: 'auth-layout' // Use the auth layout
    });
}

// Handle user login
async function loginUser(req, res) {
    const { username, password } = req.body;

    try {
        // Find user (using callback)
        userModel.findUserByUsername(username, async (err, user) => {
            if (err) {
                console.error('Login Find Error:', err);
                return res.render('login', { 
                    title: 'Login', 
                    error: 'An unexpected error occurred.', 
                    formData: { username }, 
                    layout: 'auth-layout' // Use the auth layout on error
                 });
            }

            if (!user) {
                return res.render('login', { 
                    title: 'Login', 
                    error: 'Invalid username or password', 
                    formData: { username }, 
                    layout: 'auth-layout' // Use the auth layout on error
                });
            }

            // Compare the provided password with the stored hash (bcrypt is async)
            const match = await bcrypt.compare(password, user.password);

            if (match) {
                // Passwords match - Store user info in session
                req.session.user = { id: user.id, username: user.username, role: user.role };
                req.session.save(saveErr => {
                    if (saveErr) {
                        console.error('Session Save Error:', saveErr);
                        return res.render('login', { 
                            title: 'Login', 
                            error: 'Login failed during session setup. Please try again.', 
                            formData: { username }, 
                            layout: 'auth-layout' // Use the auth layout on error
                        });
                    }
                    res.redirect('/'); // Redirect to dashboard
                });
            } else {
                // Passwords don't match
                res.render('login', { 
                    title: 'Login', 
                    error: 'Invalid username or password', 
                    formData: { username }, 
                    layout: 'auth-layout' // Use the auth layout on error
                });
            }
        });
    } catch (compareError) {
        // Catch password comparison errors
        console.error('Password Compare Error:', compareError);
        res.render('login', { 
            title: 'Login', 
            error: 'An error occurred during login.', 
            formData: { username }, 
            layout: 'auth-layout' // Use the auth layout on error
        });
    }
}

// Handle user logout
function logoutUser(req, res) {
    req.session.destroy(err => {
        if (err) {
            console.error('Logout Error:', err);
            // Handle error appropriately, maybe redirect with an error message
            return res.redirect('/'); 
        }
        res.clearCookie('connect.sid'); // Optional: Clear the session cookie
        res.redirect('/auth/login'); // Redirect to login page after logout
    });
}

module.exports = {
    renderRegisterForm,
    registerUser,
    renderLoginForm,
    loginUser,
    logoutUser
}; 