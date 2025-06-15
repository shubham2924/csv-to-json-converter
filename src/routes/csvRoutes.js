const express = require('express');
const csvController = require('../controllers/csvController');
const { validateRequest } = require('../middleware/validateRequest');

const router = express.Router();

/**
 * @route POST /api/csv/process
 * @desc Process CSV file and store in database
 * @access Public
 */
router.post('/process', validateRequest, csvController.processCSV.bind(csvController));

/**
 * @route GET /api/csv/report
 * @desc Generate age distribution report
 * @access Public
 */
router.get('/report', csvController.generateReport.bind(csvController));

/**
 * @route GET /api/csv/users
 * @desc Get all users with pagination
 * @access Public
 */
router.get('/users', csvController.getUsers.bind(csvController));

/**
 * @route DELETE /api/csv/users
 * @desc Clear all users from database
 * @access Public
 */
router.delete('/users', csvController.clearUsers.bind(csvController));

module.exports = router;