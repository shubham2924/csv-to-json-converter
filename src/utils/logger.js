/**
 * Simple logger utility with different log levels
 */
class Logger {
    constructor() {
      this.levels = {
        ERROR: 0,
        WARN: 1,
        INFO: 2,
        DEBUG: 3
      };
  
      this.currentLevel = this.levels[process.env.LOG_LEVEL?.toUpperCase()] ?? this.levels.INFO;
      this.colors = {
        ERROR: '\x1b[31m', // Red
        WARN: '\x1b[33m',  // Yellow
        INFO: '\x1b[36m',  // Cyan
        DEBUG: '\x1b[37m', // White
        RESET: '\x1b[0m'
      };
    }
  
    /**
     * Format log message with timestamp and level
     */
    formatMessage(level, message, meta = {}) {
      const timestamp = new Date().toISOString();
      const color = this.colors[level];
      const reset = this.colors.RESET;
      
      let logMessage = `${color}[${timestamp}] ${level}:${reset} ${message}`;
      
      if (Object.keys(meta).length > 0) {
        logMessage += `\n${color}Meta:${reset} ${JSON.stringify(meta, null, 2)}`;
      }
  
      return logMessage;
    }
  
    /**
     * Log error messages
     */
    error(message, meta = {}) {
      if (this.currentLevel >= this.levels.ERROR) {
        console.error(this.formatMessage('ERROR', message, meta));
      }
    }
  
    /**
     * Log warning messages
     */
    warn(message, meta = {}) {
      if (this.currentLevel >= this.levels.WARN) {
        console.warn(this.formatMessage('WARN', message, meta));
      }
    }
  
    /**
     * Log info messages
     */
    info(message, meta = {}) {
      if (this.currentLevel >= this.levels.INFO) {
        console.log(this.formatMessage('INFO', message, meta));
      }
    }
  
    /**
     * Log debug messages
     */
    debug(message, meta = {}) {
      if (this.currentLevel >= this.levels.DEBUG) {
        console.log(this.formatMessage('DEBUG', message, meta));
      }
    }
  
    /**
     * Set log level
     */
    setLevel(level) {
      if (this.levels[level.toUpperCase()] !== undefined) {
        this.currentLevel = this.levels[level.toUpperCase()];
      }
    }
  
    /**
     * Log with custom level
     */
    log(level, message, meta = {}) {
      switch (level.toUpperCase()) {
        case 'ERROR':
          this.error(message, meta);
          break;
        case 'WARN':
          this.warn(message, meta);
          break;
        case 'INFO':
          this.info(message, meta);
          break;
        case 'DEBUG':
          this.debug(message, meta);
          break;
        default:
          this.info(message, meta);
      }
    }
  }
  
  // Export singleton instance
  module.exports = new Logger();