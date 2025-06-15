const userService = require('./userService');
const logger = require('../utils/logger');

class ReportService {
  /**
   * Generate age distribution report and print to console
   */
  async generateAgeReport() {
    try {
      const stats = await userService.getAgeStatistics();
      
      if (!stats || parseInt(stats.total_users) === 0) {
        logger.warn('No users found for age distribution report');
        console.log('\n=== AGE DISTRIBUTION REPORT ===');
        console.log('No users found in database');
        console.log('=====================================\n');
        return;
      }

      const totalUsers = parseInt(stats.total_users);
      const under20 = parseInt(stats.under_20) || 0;
      const age20to40 = parseInt(stats.age_20_to_40) || 0;
      const age40to60 = parseInt(stats.age_40_to_60) || 0;
      const over60 = parseInt(stats.over_60) || 0;

      // Calculate percentages
      const under20Percent = Math.round((under20 / totalUsers) * 100);
      const age20to40Percent = Math.round((age20to40 / totalUsers) * 100);
      const age40to60Percent = Math.round((age40to60 / totalUsers) * 100);
      const over60Percent = Math.round((over60 / totalUsers) * 100);

      // Print formatted report to console
      console.log('\n=== AGE DISTRIBUTION REPORT ===');
      console.log('Age-Group        Count    % Distribution');
      console.log('----------------------------------------');
      console.log(`< 20             ${under20.toString().padStart(5)}    ${under20Percent.toString().padStart(2)}%`);
      console.log(`20 to 40         ${age20to40.toString().padStart(5)}    ${age20to40Percent.toString().padStart(2)}%`);
      console.log(`40 to 60         ${age40to60.toString().padStart(5)}    ${age40to60Percent.toString().padStart(2)}%`);
      console.log(`> 60             ${over60.toString().padStart(5)}    ${over60Percent.toString().padStart(2)}%`);
      console.log('----------------------------------------');
      console.log(`Total Users:     ${totalUsers.toString().padStart(5)}   100%`);
      console.log(`Average Age:     ${parseFloat(stats.average_age).toFixed(1)}`);
      console.log(`Age Range:       ${stats.min_age} - ${stats.max_age}`);
      console.log('=====================================\n');

      logger.info('Age distribution report generated successfully');

    } catch (error) {
      logger.error('Error generating age report:', error);
      throw error;
    }
  }

  /**
   * Get age distribution data for API response
   */
  async getAgeDistribution() {
    try {
      const stats = await userService.getAgeStatistics();
      
      if (!stats || parseInt(stats.total_users) === 0) {
        return {
          totalUsers: 0,
          ageGroups: [],
          averageAge: 0,
          ageRange: { min: 0, max: 0 }
        };
      }

      const totalUsers = parseInt(stats.total_users);
      const under20 = parseInt(stats.under_20) || 0;
      const age20to40 = parseInt(stats.age_20_to_40) || 0;
      const age40to60 = parseInt(stats.age_40_to_60) || 0;
      const over60 = parseInt(stats.over_60) || 0;

      const ageGroups = [
        {
          group: '< 20',
          count: under20,
          percentage: Math.round((under20 / totalUsers) * 100)
        },
        {
          group: '20 to 40',
          count: age20to40,
          percentage: Math.round((age20to40 / totalUsers) * 100)
        },
        {
          group: '40 to 60',
          count: age40to60,
          percentage: Math.round((age40to60 / totalUsers) * 100)
        },
        {
          group: '> 60',
          count: over60,
          percentage: Math.round((over60 / totalUsers) * 100)
        }
      ];

      return {
        totalUsers,
        ageGroups,
        averageAge: parseFloat(stats.average_age).toFixed(1),
        ageRange: {
          min: parseInt(stats.min_age),
          max: parseInt(stats.max_age)
        }
      };

    } catch (error) {
      logger.error('Error getting age distribution:', error);
      throw error;
    }
  }

  /**
   * Generate detailed user statistics
   */
  async generateDetailedReport() {
    try {
      const stats = await userService.getAgeStatistics();
      const { users } = await userService.getUsers(10, 0);

      return {
        summary: {
          totalUsers: parseInt(stats.total_users),
          averageAge: parseFloat(stats.average_age).toFixed(1),
          ageRange: {
            min: parseInt(stats.min_age),
            max: parseInt(stats.max_age)
          }
        },
        ageDistribution: await this.getAgeDistribution(),
        sampleUsers: users.slice(0, 5) // First 5 users as sample
      };

    } catch (error) {
      logger.error('Error generating detailed report:', error);
      throw error;
    }
  }
}

module.exports = new ReportService();