const db = require('./connection');
const logger = require('../utils/logger');

class Migration {
  /**
   * Create users table with required structure
   */
  async createUsersTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR NOT NULL,
        age INTEGER NOT NULL,
        address JSONB NULL,
        additional_info JSONB NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    try {
      await db.query(query);
      logger.info('Users table created successfully');
    } catch (error) {
      logger.error('Error creating users table:', error);
      throw error;
    }
  }

  /**
   * Create indexes for better performance
   */
  async createIndexes() {
    const indexes = [
      {
        name: 'idx_users_age',
        query: 'CREATE INDEX IF NOT EXISTS idx_users_age ON users(age);'
      },
      {
        name: 'idx_users_name',
        query: 'CREATE INDEX IF NOT EXISTS idx_users_name ON users(name);'
      },
      {
        name: 'idx_users_created_at',
        query: 'CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);'
      },
      {
        name: 'idx_users_address_gin',
        query: 'CREATE INDEX IF NOT EXISTS idx_users_address_gin ON users USING GIN(address);'
      },
      {
        name: 'idx_users_additional_info_gin',
        query: 'CREATE INDEX IF NOT EXISTS idx_users_additional_info_gin ON users USING GIN(additional_info);'
      }
    ];

    try {
      for (const index of indexes) {
        await db.query(index.query);
        logger.info(`Index ${index.name} created successfully`);
      }
    } catch (error) {
      logger.error('Error creating indexes:', error);
      throw error;
    }
  }

  /**
   * Create triggers for automatic updated_at timestamp
   */
  async createTriggers() {
    const triggerFunction = `
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `;

    const trigger = `
      CREATE TRIGGER update_users_updated_at 
        BEFORE UPDATE ON users 
        FOR EACH ROW 
        EXECUTE FUNCTION update_updated_at_column();
    `;

    try {
      await db.query(triggerFunction);
      logger.info('Trigger function created successfully');

      // Drop trigger if exists and recreate
      await db.query('DROP TRIGGER IF EXISTS update_users_updated_at ON users;');
      await db.query(trigger);
      logger.info('Trigger created successfully');
    } catch (error) {
      logger.error('Error creating triggers:', error);
      throw error;
    }
  }

  /**
   * Run all migrations
   */
  async runMigrations() {
    try {
      logger.info('Starting database migrations...');

      await this.createUsersTable();
      await this.createIndexes();
      await this.createTriggers();

      logger.info('All migrations completed successfully');
    } catch (error) {
      logger.error('Migration failed:', error);
      throw error;
    }
  }

  /**
   * Drop all tables (for development/testing)
   */
  async dropTables() {
    const query = 'DROP TABLE IF EXISTS users CASCADE;';
    
    try {
      await db.query(query);
      logger.info('All tables dropped successfully');
    } catch (error) {
      logger.error('Error dropping tables:', error);
      throw error;
    }
  }

  /**
   * Reset database (drop and recreate)
   */
  async resetDatabase() {
    try {
      logger.info('Resetting database...');
      await this.dropTables();
      await this.runMigrations();
      logger.info('Database reset completed');
    } catch (error) {
      logger.error('Database reset failed:', error);
      throw error;
    }
  }

  /**
   * Check if tables exist
   */
  async checkTables() {
    const query = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'users';
    `;

    try {
      const result = await db.query(query);
      return result.rows.length > 0;
    } catch (error) {
      logger.error('Error checking tables:', error);
      return false;
    }
  }
}

// CLI usage
if (require.main === module) {
  const migration = new Migration();
  
  const command = process.argv[2];
  
  const executeCommand = async () => {
    try {
      switch (command) {
        case 'up':
          await migration.runMigrations();
          break;
        case 'down':
          await migration.dropTables();
          break;
        case 'reset':
          await migration.resetDatabase();
          break;
        case 'check':
          const exists = await migration.checkTables();
          console.log(`Tables exist: ${exists}`);
          break;
        default:
          console.log('Usage: node migrate.js [up|down|reset|check]');
          console.log('  up    - Run migrations');
          console.log('  down  - Drop tables');
          console.log('  reset - Drop and recreate tables');
          console.log('  check - Check if tables exist');
      }
    } catch (error) {
      console.error('Migration command failed:', error);
      process.exit(1);
    } finally {
      await db.close();
      process.exit(0);
    }
  };

  executeCommand();
}

module.exports = Migration;