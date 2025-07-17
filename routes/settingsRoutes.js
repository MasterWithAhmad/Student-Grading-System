const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { ensureAuthenticated } = require('../middleware/authMiddleware');

// Show settings page
router.get('/', ensureAuthenticated, settingsController.showSettingsPage);

// Update profile
router.post('/profile', ensureAuthenticated, settingsController.updateProfile);

// Update a user setting (e.g., theme)
router.post('/setting', ensureAuthenticated, settingsController.updateSetting);

module.exports = router; 