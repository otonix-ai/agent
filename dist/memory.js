"use strict";
/**
 * Memory Manager
 * Maintains conversation history and persists to disk
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalMemoryManager = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const logger_js_1 = require("./logger.js");
class LocalMemoryManager {
    constructor(workingDir) {
        this.messages = [];
        this.maxMessages = 100;
        this.memoryDir = path_1.default.join(workingDir || process.cwd(), ".otonix");
        this.memoryFile = path_1.default.join(this.memoryDir, "memory.json");
    }
    /**
     * Add a message to memory
     */
    addMessage(msg) {
        this.messages.push(msg);
        // Keep only the most recent messages (sliding window)
        if (this.messages.length > this.maxMessages) {
            this.messages = this.messages.slice(-this.maxMessages);
        }
        logger_js_1.logger.debug("Message added to memory", {
            role: msg.role,
            toolName: msg.toolName,
            messageCount: this.messages.length,
        });
    }
    /**
     * Get context window of messages up to maxTokens
     * This is a simplified implementation; in production, you'd actually count tokens
     */
    getContext(maxTokens) {
        // Simple heuristic: assume ~4 characters = 1 token
        let tokenCount = 0;
        const context = [];
        // Go backwards and collect messages until we hit the token limit
        for (let i = this.messages.length - 1; i >= 0; i--) {
            const msg = this.messages[i];
            const estimatedTokens = Math.ceil(msg.content.length / 4);
            if (tokenCount + estimatedTokens > maxTokens) {
                break;
            }
            context.unshift(msg);
            tokenCount += estimatedTokens;
        }
        logger_js_1.logger.debug("Context window generated", {
            messageCount: context.length,
            estimatedTokens: tokenCount,
        });
        return context;
    }
    /**
     * Save memory to disk
     */
    async save() {
        try {
            await promises_1.default.mkdir(this.memoryDir, { recursive: true });
            const data = {
                version: 1,
                timestamp: new Date().toISOString(),
                messages: this.messages,
            };
            await promises_1.default.writeFile(this.memoryFile, JSON.stringify(data, null, 2));
            logger_js_1.logger.debug("Memory saved to disk", {
                messageCount: this.messages.length,
                path: this.memoryFile,
            });
        }
        catch (error) {
            logger_js_1.logger.warn("Failed to save memory", {
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }
    /**
     * Load memory from disk
     */
    async load() {
        try {
            const content = await promises_1.default.readFile(this.memoryFile, "utf-8");
            const data = JSON.parse(content);
            this.messages = data.messages || [];
            logger_js_1.logger.debug("Memory loaded from disk", {
                messageCount: this.messages.length,
                path: this.memoryFile,
            });
        }
        catch (error) {
            // File doesn't exist or is invalid, start fresh
            logger_js_1.logger.debug("Memory file not found or invalid, starting fresh", {
                path: this.memoryFile,
            });
            this.messages = [];
        }
    }
    /**
     * Clear all messages
     */
    clear() {
        this.messages = [];
        logger_js_1.logger.debug("Memory cleared");
    }
    /**
     * Get all messages (for debugging)
     */
    getAllMessages() {
        return [...this.messages];
    }
    /**
     * Get memory statistics
     */
    getStats() {
        const byRole = {};
        for (const msg of this.messages) {
            byRole[msg.role] = (byRole[msg.role] || 0) + 1;
        }
        return {
            messageCount: this.messages.length,
            byRole,
        };
    }
}
exports.LocalMemoryManager = LocalMemoryManager;
//# sourceMappingURL=memory.js.map