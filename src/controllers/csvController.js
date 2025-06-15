const csvService = require('../services/csvService');
const userService = require('../services/userService');
const reportService = require('../services/reportService');
const logger = require('../utils/logger');

class CSVController {
  /**
   * Process CSV file and store data in database
   */
  async processCSV(req, res, next) {
    try {
      const startTime = Date.now();
      logger.info('Starting CSV processing...');

      // Parse CSV file
      const users = await csvService.parseCSVFile();
      logger.info(`Parsed ${users.length} users from CSV`);

      // Store users in database
      const result = await userService.batchInsertUsers(users);
      logger.info(`Inserted ${result.insertedCount} users into database`);

      // Generate and print age distribution report
      await reportService.generateAgeReport();

      const processingTime = Date.now() - startTime;
      
      res.status(200).json({
        success: true,
        message: 'CSV processed successfully',
        data: {
          totalRecords: users.length,
          insertedRecords: result.insertedCount,
          processingTimeMs: processingTime
        }
      });

    } catch (error) {
      logger.error('Error processing CSV:', error);
      next(error);
    }
  }

  /**
   * Generate age distribution report
   */
  async generateReport(req, res, next) {
    try {
      const report = await reportService.getAgeDistribution();
      
      res.status(200).json({
        success: true,
        message: 'Age distribution report generated',
        data: report
      });

    } catch (error) {
      logger.error('Error generating report:', error);
      next(error);
    }
  }

  /**
   * Get all users with pagination
   */
  async getUsers(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;

      const result = await userService.getUsers(limit, offset);
      
      res.status(200).json({
        success: true,
        message: 'Users retrieved successfully',
        data: {
          users: result.users,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(result.total / limit),
            totalRecords: result.total,
            limit
          }
        }
      });

    } catch (error) {
      logger.error('Error getting users:', error);
      next(error);
    }
  }

  /**
   * Clear all users from database
   */
  async clearUsers(req, res, next) {
    try {
      const deletedCount = await userService.clearAllUsers();
      
      res.status(200).json({
        success: true,
        message: 'All users cleared successfully',
        data: {
          deletedCount
        }
      });

    } catch (error) {
      logger.error('Error clearing users:', error);
      next(error);
    }
  }
}

module.exports = new CSVController();