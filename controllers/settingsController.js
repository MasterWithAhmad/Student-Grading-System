const userModel = require('../models/userModel');
const userSettingsModel = require('../models/userSettingsModel');
const bcrypt = require('bcrypt');

// Render the settings page with user profile and settings
function showSettingsPage(req, res) {
    const userId = req.session.user.id;
    userModel.findUserById(userId, (err, user) => {
        if (err || !user) {
            return res.status(404).render('error', { title: 'Not Found', message: 'User not found', error: { status: 404 } });
        }
        userSettingsModel.getAllUserSettings(userId, (err, settings) => {
            if (err) settings = [];
            // Convert settings array to object for easy access
            const settingsObj = {};
            settings.forEach(s => { settingsObj[s.setting_key] = s.setting_value; });
            res.render('settings', {
                title: 'Settings',
                user,
                settings: settingsObj,
                success: req.flash('success'),
                error: req.flash('error')
            });
        });
    });
}

// Handle profile update (username and password)
function updateProfile(req, res) {
    const userId = req.session.user.id;
    const { username, password, confirmPassword } = req.body;
    // Validate password match (should be handled client-side, but double-check)
    if (password && password !== confirmPassword) {
        req.flash('error', 'Passwords do not match.');
        return res.redirect('/settings');
    }
    // Update username
    userModel.updateUserProfile(userId, { username }, (err, changes) => {
        if (err) {
            req.flash('error', 'Failed to update profile. Username may already be taken.');
            return res.redirect('/settings');
        }
        // If password provided, hash and update
        if (password) {
            bcrypt.hash(password, 10, (err, hashedPassword) => {
                if (err) {
                    req.flash('error', 'Failed to update password.');
                    return res.redirect('/settings');
                }
                userModel.updateUserPassword(userId, hashedPassword, (err2) => {
                    if (err2) {
                        req.flash('error', 'Failed to update password.');
                    } else {
                        req.flash('success', 'Profile and password updated successfully!');
                        req.session.user.username = username;
                    }
                    return res.redirect('/settings');
                });
            });
        } else {
            req.flash('success', 'Profile updated successfully!');
            req.session.user.username = username;
            return res.redirect('/settings');
        }
    });
}

// Handle user setting update (e.g., theme)
function updateSetting(req, res) {
    const userId = req.session.user.id;
    const { key, value } = req.body;
    userSettingsModel.setUserSetting(userId, key, value, (err) => {
        if (err) {
            req.flash('error', 'Failed to update setting.');
        } else {
            req.flash('success', 'Setting updated successfully!');
        }
        res.redirect('/settings');
    });
}

module.exports = {
    showSettingsPage,
    updateProfile,
    updateSetting
}; 