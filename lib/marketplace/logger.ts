// lib/marketplace/logger.ts
type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: Record<string, unknown>;
  duration?: number;
}

class MarketplaceLogger {
  private formatEntry(
    level: LogLevel, 
    message: string, 
    data?: Record<string, unknown>, 
    duration?: number
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...(data && { data }),
      ...(duration !== undefined && { duration }),
    };
  }

  private log(entry: LogEntry): void {
    const prefix = `[Marketplace][${entry.level.toUpperCase()}]`;
    
    switch (entry.level) {
      case 'error':
        console.error(prefix, entry.message, entry);
        break;
      case 'warn':
        console.warn(prefix, entry.message, entry);
        break;
      case 'debug':
        if (process.env.NODE_ENV === 'development') {
          console.debug(prefix, entry.message, entry);
        }
        break;
      default:
        console.log(prefix, entry.message, entry);
    }
  }

  info(message: string, data?: Record<string, unknown>): void {
    this.log(this.formatEntry('info', message, data));
  }

  warn(message: string, data?: Record<string, unknown>): void {
    this.log(this.formatEntry('warn', message, data));
  }

  error(message: string, error?: Error, data?: Record<string, unknown>): void {
    this.log(this.formatEntry('error', message, { 
      ...data, 
      errorMessage: error?.message,
      errorStack: error?.stack,
    }));
  }

  debug(message: string, data?: Record<string, unknown>): void {
    this.log(this.formatEntry('debug', message, data));
  }

  performance(message: string, durationMs: number, data?: Record<string, unknown>): void {
    this.log(this.formatEntry('info', message, data, durationMs));
  }
}

export const logger = new MarketplaceLogger();