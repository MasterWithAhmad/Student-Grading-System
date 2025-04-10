// routes/reportRoutes.js
const express = require('express');
const reportController = require('../controllers/reportController');

const router = express.Router();

// GET /reports - Display report dashboard
router.get('/', reportController.renderReportDashboard);

// Add other report routes later

module.exports = router; 