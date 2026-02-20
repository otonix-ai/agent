"use strict";
/**
 * TypeScript type definitions for the Otonix Agent Runtime
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToolExecutionError = exports.InferenceError = exports.APIError = exports.ConfigError = exports.AgentError = void 0;
// ============================================================================
// Error Types
// ============================================================================
class AgentError extends Error {
    constructor(code, message) {
        super(message);
        this.code = code;
        this.name = "AgentError";
    }
}
exports.AgentError = AgentError;
class ConfigError extends AgentError {
    constructor(message) {
        super("CONFIG_ERROR", message);
        this.name = "ConfigError";
    }
}
exports.ConfigError = ConfigError;
class APIError extends AgentError {
    constructor(message, statusCode) {
        super("API_ERROR", message);
        this.statusCode = statusCode;
        this.name = "APIError";
    }
}
exports.APIError = APIError;
class InferenceError extends AgentError {
    constructor(message) {
        super("INFERENCE_ERROR", message);
        this.name = "InferenceError";
    }
}
exports.InferenceError = InferenceError;
class ToolExecutionError extends AgentError {
    constructor(toolName, message) {
        super("TOOL_ERROR", message);
        this.toolName = toolName;
        this.name = "ToolExecutionError";
    }
}
exports.ToolExecutionError = ToolExecutionError;
//# sourceMappingURL=types.js.map