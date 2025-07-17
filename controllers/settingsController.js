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

// Factory Reset: delete all user data except account
function factoryReset(req, res) {
    const userId = req.session.user.id;
    const { factoryResetConfirm } = req.body;
    if (!factoryResetConfirm || factoryResetConfirm.trim().toUpperCase() !== 'RESET') {
        req.flash('error', 'You must type RESET to confirm factory reset.');
        return res.redirect('/settings');
    }
    const db = require('../db/database').db;
    db.serialize(() => {
        db.run('DELETE FROM grades WHERE user_id = ?', [userId]);
        db.run('DELETE FROM courses WHERE user_id = ?', [userId]);
        db.run('DELETE FROM students WHERE user_id = ?', [userId]);
        db.run('DELETE FROM user_settings WHERE user_id = ?', [userId], (err) => {
            if (err) {
                req.flash('error', 'Failed to perform factory reset.');
            } else {
                req.flash('success', 'Factory reset successful. All your data except your account has been deleted.');
            }
            res.redirect('/settings');
        });
    });
}

// Delete Account: delete user and all related data
function deleteAccount(req, res) {
    const userId = req.session.user.id;
    const { deleteAccountConfirm } = req.body;
    if (!deleteAccountConfirm || deleteAccountConfirm.trim().toUpperCase() !== 'DELETE') {
        req.flash('error', 'You must type DELETE to confirm account deletion.');
        return res.redirect('/settings');
    }
    const db = require('../db/database').db;
    db.run('DELETE FROM users WHERE id = ?', [userId], function(err) {
        if (err) {
            req.flash('error', 'Failed to delete account.');
            return res.redirect('/settings');
        }
        req.session.destroy(() => {
            res.redirect('/auth/login');
        });
    });
}

module.exports = {
    showSettingsPage,
    updateProfile,
    updateSetting,
    factoryReset,
    deleteAccount
}; 