const { Pool } = require('pg');
const logger = require('../utils/logger');

class Database {
  constructor() {
    this.pool = null;
    this.config = {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME || 'csv_converter',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      max: 20, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
      connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    };
  }

  /**
   * Initialize database connection pool
   */
  async connect() {
    try {
      this.pool = new Pool(this.config);

      // Test the connection
      const client = await this.pool.connect();
      logger.info(`Connected to PostgreSQL database: ${this.config.database}`);
      client.release();

      // Handle pool errors
      this.pool.on('error', (err) => {
        logger.error('Unexpected error on idle client:', err);
      });

      return this.pool;

    } catch (error) {
      logger.error('Failed to connect to database:', error);
      throw error;
    }
  }

  /**
   * Execute a query
   */
  async query(text, params = []) {
    if (!this.pool) {
      await this.connect();
    }

    const start = Date.now();
    
    try {
      const result = await this.pool.query(text, params);
      const duration = Date.now() - start;
      
      if (process.env.NODE_ENV === 'development') {
        logger.debug(`Query executed in ${duration}ms: ${text.substring(0, 100)}...`);
      }
      
      return result;

    } catch (error) {
      logger.error('Database query error:', error);
      logger.error('Query:', text);
      logger.error('Params:', params);
      throw error;
    }
  }

  /**
   * Get a client from the pool for transactions
   */
  async getClient() {
    if (!this.pool) {
      await this.connect();
    }
    return await this.pool.connect();
  }

  /**
   * Close all connections in the pool
   */
  async close() {
    if (this.pool) {
      await this.pool.end();
      logger.info('Database connection pool closed');
    }
  }

  /**
   * Check if database is connected
   */
  async isConnected() {
    try {
      if (!this.pool) {
        return false;
      }
      
      const client = await this.pool.connect();
      await client.query('SELECT 1');
      client.release();
      return true;

    } catch (error) {
      return false;
    }
  }

  /**
   * Get pool status
   */
  getPoolStatus() {
    if (!this.pool) {
      return { connected: false };
    }

    return {
      connected: true,
      totalCount: this.pool.totalCount,
      idleCount: this.pool.idleCount,
      waitingCount: this.pool.waitingCount
    };
  }
}

// Create singleton instance
const database = new Database();

// Auto-connect on first import
database.connect().catch(error => {
  logger.error('Failed to auto-connect to database:', error);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  await database.close();
});

process.on('SIGINT', async () => {
  await database.close();
});

module.exports = database;