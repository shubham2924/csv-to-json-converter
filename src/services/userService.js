const db = require('../database/connection');
const logger = require('../utils/logger');

class UserService {
  /**
   * Insert users in batches for better performance
   */
  async batchInsertUsers(users) {
    const batchSize = parseInt(process.env.BATCH_SIZE) || 1000;
    let insertedCount = 0;
    
    try {
      await db.query('BEGIN');

      for (let i = 0; i < users.length; i += batchSize) {
        const batch = users.slice(i, i + batchSize);
        const result = await this.insertUserBatch(batch);
        insertedCount += result.rowCount;
        
        logger.info(`Processed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(users.length / batchSize)}`);
      }

      await db.query('COMMIT');
      logger.info(`Successfully inserted ${insertedCount} users`);

      return { insertedCount };

    } catch (error) {
      await db.query('ROLLBACK');
      logger.error('Error in batch insert, rolling back:', error);
      throw error;
    }
  }

  /**
   * Insert a batch of users using parameterized query
   */
  async insertUserBatch(users) {
    const values = [];
    const placeholders = [];
    let paramIndex = 1;

    for (const user of users) {
      const { name, age, address, additionalInfo } = this.prepareUserData(user);
      
      values.push(name, age, address, additionalInfo);
      placeholders.push(`($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3})`);
      paramIndex += 4;
    }

    const query = `
      INSERT INTO users (name, age, address, additional_info)
      VALUES ${placeholders.join(', ')}
    `;

    return await db.query(query, values);
  }

  /**
   * Prepare user data for database insertion
   */
  prepareUserData(user) {
    // Extract mandatory fields
    const firstName = user.name?.firstName || '';
    const lastName = user.name?.lastName || '';
    const name = `${firstName} ${lastName}`.trim();
    const age = user.age || 0;

    // Extract address (can be null)
    const address = user.address ? JSON.stringify(user.address) : null;

    // Prepare additional info (everything except mandatory fields)
    const additionalInfo = { ...user };
    delete additionalInfo.name;
    delete additionalInfo.age;
    delete additionalInfo.address;

    // Only include additional_info if there are extra fields
    const additionalInfoJson = Object.keys(additionalInfo).length > 0 
      ? JSON.stringify(additionalInfo) 
      : null;

    return {
      name,
      age,
      address,
      additionalInfo: additionalInfoJson
    };
  }

  /**
   * Get users with pagination
   */
  async getUsers(limit = 10, offset = 0) {
    const countQuery = 'SELECT COUNT(*) FROM users';
    const dataQuery = `
      SELECT id, name, age, address, additional_info, 
             created_at, updated_at
      FROM users 
      ORDER BY id 
      LIMIT $1 OFFSET $2
    `;

    const [countResult, dataResult] = await Promise.all([
      db.query(countQuery),
      db.query(dataQuery, [limit, offset])
    ]);

    return {
      users: dataResult.rows,
      total: parseInt(countResult.rows[0].count)
    };
  }

  /**
   * Get user by ID
   */
  async getUserById(id) {
    const query = `
      SELECT id, name, age, address, additional_info, 
             created_at, updated_at
      FROM users 
      WHERE id = $1
    `;

    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Clear all users from database
   */
  async clearAllUsers() {
    const query = 'DELETE FROM users';
    const result = await db.query(query);
    logger.info(`Cleared ${result.rowCount} users from database`);
    return result.rowCount;
  }

  /**
   * Get age statistics for reporting
   */
  async getAgeStatistics() {
    const query = `
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN age < 20 THEN 1 END) as under_20,
        COUNT(CASE WHEN age >= 20 AND age < 40 THEN 1 END) as age_20_to_40,
        COUNT(CASE WHEN age >= 40 AND age < 60 THEN 1 END) as age_40_to_60,
        COUNT(CASE WHEN age >= 60 THEN 1 END) as over_60,
        AVG(age) as average_age,
        MIN(age) as min_age,
        MAX(age) as max_age
      FROM users
      WHERE age IS NOT NULL AND age > 0
    `;

    const result = await db.query(query);
    return result.rows[0];
  }

  /**
   * Update user by ID
   */
  async updateUser(id, userData) {
    const { name, age, address, additionalInfo } = this.prepareUserData(userData);
    
    const query = `
      UPDATE users 
      SET name = $1, age = $2, address = $3, additional_info = $4, updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING id, name, age, address, additional_info, created_at, updated_at
    `;

    const result = await db.query(query, [name, age, address, additionalInfo, id]);
    return result.rows[0] || null;
  }

  /**
   * Delete user by ID
   */
  async deleteUser(id) {
    const query = 'DELETE FROM users WHERE id = $1';
    const result = await db.query(query, [id]);
    return result.rowCount > 0;
  }
}

module.exports = new UserService();