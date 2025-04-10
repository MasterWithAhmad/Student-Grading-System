const express = require('express');
const authController = require('../controllers/authController');

const router = express.Router();

// Registration Routes
router.get('/register', authController.renderRegisterForm);
router.post('/register', authController.registerUser);

// Login Routes
router.get('/login', authController.renderLoginForm);
router.post('/login', authController.loginUser);

// Logout Route
router.get('/logout', authController.logoutUser);

module.exports = router; 