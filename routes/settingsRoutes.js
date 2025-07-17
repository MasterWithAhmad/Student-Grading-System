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

// Factory Reset
router.post('/factory-reset', isAuthenticated, settingsController.factoryReset);
// Delete Account
router.post('/delete-account', isAuthenticated, settingsController.deleteAccount);

module.exports = router; 