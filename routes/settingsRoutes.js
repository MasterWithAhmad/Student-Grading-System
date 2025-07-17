const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { isAuthenticated } = require('../middleware/authMiddleware');

// Show settings page
router.get('/', isAuthenticated, settingsController.showSettingsPage);

// Update profile
router.post('/profile', isAuthenticated, settingsController.updateProfile);

// Update a user setting (e.g., theme)
router.post('/setting', isAuthenticated, settingsController.updateSetting);

module.exports = router; 