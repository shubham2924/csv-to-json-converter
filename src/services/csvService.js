const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');

class CSVService {
  constructor() {
    this.csvFilePath = process.env.CSV_FILE_PATH || './data/users.csv';
  }

  /**
   * Parse CSV file and convert to JSON objects
   */
  async parseCSVFile() {
    try {
      // Check if file exists
      const filePath = path.resolve(this.csvFilePath);
      await this.validateFile(filePath);

      // Read file content
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const lines = this.splitLines(fileContent);

      if (lines.length < 2) {
        throw new Error('CSV file must contain at least a header row and one data row');
      }

      // Parse header and data
      const headers = this.parseCSVLine(lines[0]);
      this.validateHeaders(headers);

      const users = [];
      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim()) { // Skip empty lines
          const userData = this.parseCSVLine(lines[i]);
          const user = this.convertToJSON(headers, userData);
          users.push(user);
        }
      }

      logger.info(`Successfully parsed ${users.length} users from CSV`);
      return users;

    } catch (error) {
      logger.error('Error parsing CSV file:', error);
      throw error;
    }
  }

  /**
   * Validate file exists and is readable
   */
  async validateFile(filePath) {
    try {
      const stats = await fs.stat(filePath);
      
      if (!stats.isFile()) {
        throw new Error(`Path ${filePath} is not a file`);
      }

      // Check file size (100MB limit by default)
      const maxSizeMB = parseInt(process.env.MAX_FILE_SIZE_MB) || 100;
      const maxSizeBytes = maxSizeMB * 1024 * 1024;
      
      if (stats.size > maxSizeBytes) {
        throw new Error(`File size ${Math.round(stats.size / 1024 / 1024)}MB exceeds limit of ${maxSizeMB}MB`);
      }

    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new Error(`CSV file not found at path: ${filePath}`);
      }
      throw error;
    }
  }

  /**
   * Split file content into lines, handling various line endings
   */
  splitLines(content) {
    return content.split(/\r?\n/);
  }

  /**
   * Parse a single CSV line, handling commas within quoted fields
   */
  parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    let i = 0;

    while (i < line.length) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          // Handle escaped quotes
          current += '"';
          i += 2;
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
          i++;
        }
      } else if (char === ',' && !inQuotes) {
        // Field separator outside quotes
        result.push(current.trim());
        current = '';
        i++;
      } else {
        current += char;
        i++;
      }
    }
    
    // Add the last field
    result.push(current.trim());
    
    return result;
  }

  /**
   * Validate required headers are present
   */
  validateHeaders(headers) {
    const requiredHeaders = ['name.firstName', 'name.lastName', 'age'];
    const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));
    
    if (missingHeaders.length > 0) {
      throw new Error(`Missing required headers: ${missingHeaders.join(', ')}`);
    }
  }

  /**
   * Convert CSV row data to nested JSON object
   */
  convertToJSON(headers, values) {
    if (headers.length !== values.length) {
      throw new Error(`Header count (${headers.length}) doesn't match value count (${values.length})`);
    }

    const result = {};

    for (let i = 0; i < headers.length; i++) {
      const header = headers[i];
      let value = values[i];

      // Convert numeric values
      if (header === 'age' || /\.(age|id|count)$/i.test(header)) {
        value = this.parseNumber(value);
      }

      // Handle nested properties using dot notation
      this.setNestedProperty(result, header, value);
    }

    return result;
  }

  /**
   * Parse string to number, handling edge cases
   */
  parseNumber(value) {
    if (!value || value.trim() === '') {
      return null;
    }
    
    const num = Number(value.trim());
    return isNaN(num) ? value : num;
  }

  /**
   * Set nested property in object using dot notation
   */
  setNestedProperty(obj, path, value) {
    const keys = path.split('.');
    let current = obj;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in current) || typeof current[key] !== 'object' || current[key] === null) {
        current[key] = {};
      }
      current = current[key];
    }

    current[keys[keys.length - 1]] = value;
  }
}

module.exports = new CSVService();