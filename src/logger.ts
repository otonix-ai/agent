/**
 * Structured JSON logging module
 * All logs are emitted to stdout in structured JSON format
 */

import { LogLevel, LogEntry } from "./types.js";

class Logger {
  private minLevel: LogLevel = "info";
  private readonly levels: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  };

  constructor(minLevel?: LogLevel) {
    if (minLevel) {
      this.minLevel = minLevel;
    }
  }

  private log(level: LogLevel, msg: string, meta?: Record<string, unknown>): void {
    if (this.levels[level] < this.levels[this.minLevel]) {
      return;
    }

    const entry: LogEntry = {
      level,
      msg,
      ts: new Date().toISOString(),
      ...(meta || {}),
    };

    console.log(JSON.stringify(entry));
  }

  debug(msg: string, meta?: Record<string, unknown>): void {
    this.log("debug", msg, meta);
  }

  info(msg: string, meta?: Record<string, unknown>): void {
    this.log("info", msg, meta);
  }

  warn(msg: string, meta?: Record<string, unknown>): void {
    this.log("warn", msg, meta);
  }

  error(msg: string, meta?: Record<string, unknown>): void {
    this.log("error", msg, meta);
  }

  setMinLevel(level: LogLevel): void {
    this.minLevel = level;
  }
}

// Global logger instance
export const logger = new Logger();

export default logger;
