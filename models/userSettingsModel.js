const { db } = require('../db/database');

/**
 * Get a setting for a user by key.
 * @param {number} userId - The user's ID.
 * @param {string} key - The setting key.
 * @param {function(Error|null, object|null)} callback
 */
function getUserSetting(userId, key, callback) {
    const sql = 'SELECT * FROM user_settings WHERE user_id = ? AND setting_key = ?';
    db.get(sql, [userId, key], (err, row) => {
        if (err) return callback(err, null);
        callback(null, row || null);
    });
}

/**
 * Set (insert or update) a setting for a user.
 * @param {number} userId - The user's ID.
 * @param {string} key - The setting key.
 * @param {string} value - The setting value.
 * @param {function(Error|null)} callback
 */
function setUserSetting(userId, key, value, callback) {
    const sql = `INSERT INTO user_settings (user_id, setting_key, setting_value)
                 VALUES (?, ?, ?)
                 ON CONFLICT(user_id, setting_key) DO UPDATE SET setting_value = excluded.setting_value`;
    db.run(sql, [userId, key, value], function(err) {
        callback(err);
    });
}

/**
 * Get all settings for a user.
 * @param {number} userId
 * @param {function(Error|null, object[]|null)} callback
 */
function getAllUserSettings(userId, callback) {
    const sql = 'SELECT setting_key, setting_value FROM user_settings WHERE user_id = ?';
    db.all(sql, [userId], (err, rows) => {
        if (err) return callback(err, null);
        callback(null, rows);
    });
}

module.exports = {
    getUserSetting,
    setUserSetting,
    getAllUserSettings
}; 