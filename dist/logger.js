"use strict";
/**
 * Structured JSON logging module
 * All logs are emitted to stdout in structured JSON format
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
class Logger {
    constructor(minLevel) {
        this.minLevel = "info";
        this.levels = {
            debug: 0,
            info: 1,
            warn: 2,
            error: 3,
        };
        if (minLevel) {
            this.minLevel = minLevel;
        }
    }
    log(level, msg, meta) {
        if (this.levels[level] < this.levels[this.minLevel]) {
            return;
        }
        const entry = {
            level,
            msg,
            ts: new Date().toISOString(),
            ...(meta || {}),
        };
        console.log(JSON.stringify(entry));
    }
    debug(msg, meta) {
        this.log("debug", msg, meta);
    }
    info(msg, meta) {
        this.log("info", msg, meta);
    }
    warn(msg, meta) {
        this.log("warn", msg, meta);
    }
    error(msg, meta) {
        this.log("error", msg, meta);
    }
    setMinLevel(level) {
        this.minLevel = level;
    }
}
// Global logger instance
exports.logger = new Logger();
exports.default = exports.logger;
//# sourceMappingURL=logger.js.map