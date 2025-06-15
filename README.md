# CSV to JSON Converter API

A production-ready Node.js application that converts CSV files to JSON format and stores the data in PostgreSQL with automatic age distribution reporting.

## Features

- **Custom CSV Parser**: Built from scratch without external CSV parsing libraries
- **Nested Object Support**: Handles complex properties with dot notation (e.g., `name.firstName`, `address.city`)
- **PostgreSQL Integration**: Stores processed data with optimized schema
- **Age Distribution Reports**: Automatic console reporting with statistics
- **High Performance**: Batch processing for large files (50,000+ records)
- **Production Ready**: Error handling, logging, validation, and security middleware
- **RESTful API**: Complete CRUD operations with pagination

## Project Structure

```
csv-to-json-api/
├── src/
│   ├── app.js                 # Main application entry point
│   ├── controllers/           # Request handlers
│   │   └── csvController.js
│   ├── services/              # Business logic
│   │   ├── csvService.js      # Custom CSV parsing logic
│   │   ├── userService.js     # Database operations
│   │   └── reportService.js   # Age distribution reporting
│   ├── database/              # Database configuration
│   │   ├── connection.js      # PostgreSQL connection pool
│   │   └── migrate.js         # Database migrations
│   ├── middleware/            # Express middleware
│   │   ├── errorHandler.js    # Error handling
│   │   └── validateRequest.js # Request validation
│   ├── routes/                # API routes
│   │   └── csvRoutes.js
│   └── utils/                 # Utilities
│       └── logger.js          # Custom logger
├── data/
│   └── users.csv             # Sample CSV file
├── .env.example              # Environment variables template
├── package.json              # Dependencies and scripts
└── README.md                 # This file
```

## Installation


1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials and configuration
   ```

3. **Set up PostgreSQL database**
   ```bash
   # Create database
   createdb csv_converter
   
   # Run migrations
   npm run migrate
   ```

4. **Start the application**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## Environment Configuration

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=csv_converter
DB_USER=postgres
DB_PASSWORD=postgres

# CSV File Configuration
CSV_FILE_PATH=./data/users.csv

# Application Configuration
MAX_FILE_SIZE_MB=100
BATCH_SIZE=1000
LOG_LEVEL=INFO
```

## Database Schema

The application creates a `users` table with the following structure:

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR NOT NULL,              -- firstName + lastName
  age INTEGER NOT NULL,               -- Required field
  address JSONB NULL,                 -- Address object as JSON
  additional_info JSONB NULL,         -- All other fields as JSON
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## API Endpoints

### Process CSV File
```http
POST /api/csv/process

GET /api/csv/users

GET /api/csv/report