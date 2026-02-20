"use strict";
/**
 * Configuration loader
 * Loads genesis.json and SOUL.md files
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.configLoader = exports.ConfigLoader = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const types_js_1 = require("./types.js");
const logger_js_1 = require("./logger.js");
class ConfigLoader {
    /**
     * Load genesis.json from the specified path
     */
    async loadGenesisConfig(configPath) {
        try {
            const absPath = path_1.default.resolve(configPath);
            logger_js_1.logger.debug("Loading genesis config", { path: absPath });
            const content = await promises_1.default.readFile(absPath, "utf-8");
            const config = JSON.parse(content);
            // Validate required fields
            this.validateConfig(config);
            logger_js_1.logger.debug("Genesis config loaded successfully", { name: config.name });
            return config;
        }
        catch (error) {
            if (error instanceof types_js_1.ConfigError) {
                throw error;
            }
            throw new types_js_1.ConfigError(`Failed to load genesis config: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Load SOUL.md file contents
     */
    async loadSoul(soulPath) {
        try {
            const absPath = path_1.default.resolve(soulPath);
            logger_js_1.logger.debug("Loading soul file", { path: absPath });
            const content = await promises_1.default.readFile(absPath, "utf-8");
            logger_js_1.logger.debug("Soul file loaded successfully", {
                size: content.length,
            });
            return content;
        }
        catch (error) {
            throw new types_js_1.ConfigError(`Failed to load soul file: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Validate genesis config structure
     */
    validateConfig(config) {
        if (!config || typeof config !== "object") {
            throw new types_js_1.ConfigError("Genesis config must be a JSON object");
        }
        const cfg = config;
        const required = [
            "name",
            "model",
            "heartbeat_interval",
            "soul",
            "tools",
            "platform",
            "inference",
            "limits",
        ];
        for (const field of required) {
            if (!(field in cfg)) {
                throw new types_js_1.ConfigError(`Missing required field: ${field}`);
            }
        }
        // Validate nested objects
        if (typeof cfg.platform !== "object" || !cfg.platform) {
            throw new types_js_1.ConfigError("platform must be an object");
        }
        const platform = cfg.platform;
        if (!platform.url || !platform.api_key_env) {
            throw new types_js_1.ConfigError("platform must have url and api_key_env");
        }
        if (typeof cfg.inference !== "object" || !cfg.inference) {
            throw new types_js_1.ConfigError("inference must be an object");
        }
        const inference = cfg.inference;
        if (!inference.provider || !inference.api_key_env) {
            throw new types_js_1.ConfigError("inference must have provider and api_key_env");
        }
        if (!Array.isArray(cfg.tools)) {
            throw new types_js_1.ConfigError("tools must be an array");
        }
        if (typeof cfg.limits !== "object" || !cfg.limits) {
            throw new types_js_1.ConfigError("limits must be an object");
        }
    }
}
exports.ConfigLoader = ConfigLoader;
exports.configLoader = new ConfigLoader();
//# sourceMappingURL=config.js.map