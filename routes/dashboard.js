// routes/dashboard.js
const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const authMiddleware = require('../middleware/authMiddleware');

// Proteksi endpoint ini
router.get('/stats', authMiddleware, dashboardController.getStats);

module.exports = router;