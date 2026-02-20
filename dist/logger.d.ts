/**
 * Structured JSON logging module
 * All logs are emitted to stdout in structured JSON format
 */
import { LogLevel } from "./types.js";
declare class Logger {
    private minLevel;
    private readonly levels;
    constructor(minLevel?: LogLevel);
    private log;
    debug(msg: string, meta?: Record<string, unknown>): void;
    info(msg: string, meta?: Record<string, unknown>): void;
    warn(msg: string, meta?: Record<string, unknown>): void;
    error(msg: string, meta?: Record<string, unknown>): void;
    setMinLevel(level: LogLevel): void;
}
export declare const logger: Logger;
export default logger;
