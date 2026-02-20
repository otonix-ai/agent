"use strict";
/**
 * Tool Registry
 * Central registry of all available tools
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerAllTools = registerAllTools;
exports.executeTool = executeTool;
exports.getToolSchema = getToolSchema;
exports.getAllTools = getAllTools;
const bash_js_1 = require("./bash.js");
const web_js_1 = require("./web.js");
const files_js_1 = require("./files.js");
const otonix_js_1 = require("./otonix.js");
const logger_js_1 = require("../logger.js");
const toolRegistry = new Map();
/**
 * Register all available tools
 */
function registerAllTools(enabledTools, config) {
    const tools = [];
    // Bash tool
    if (enabledTools.includes("bash")) {
        toolRegistry.set("bash", {
            name: bash_js_1.bashTool.name,
            description: bash_js_1.bashTool.description,
            inputSchema: bash_js_1.bashTool.inputSchema,
            executor: (input) => (0, bash_js_1.executeBash)(input, config?.maxTimeoutMs),
        });
        tools.push({
            name: bash_js_1.bashTool.name,
            description: bash_js_1.bashTool.description,
            inputSchema: bash_js_1.bashTool.inputSchema,
        });
    }
    // Web tool
    if (enabledTools.includes("web")) {
        toolRegistry.set("web", {
            name: web_js_1.webTool.name,
            description: web_js_1.webTool.description,
            inputSchema: web_js_1.webTool.inputSchema,
            executor: (input) => (0, web_js_1.executeWeb)(input),
        });
        tools.push({
            name: web_js_1.webTool.name,
            description: web_js_1.webTool.description,
            inputSchema: web_js_1.webTool.inputSchema,
        });
    }
    // File read tool
    if (enabledTools.includes("files")) {
        toolRegistry.set("file_read", {
            name: files_js_1.fileReadTool.name,
            description: files_js_1.fileReadTool.description,
            inputSchema: files_js_1.fileReadTool.inputSchema,
            executor: (input) => (0, files_js_1.readFile)(input, config?.maxFileSize),
        });
        tools.push({
            name: files_js_1.fileReadTool.name,
            description: files_js_1.fileReadTool.description,
            inputSchema: files_js_1.fileReadTool.inputSchema,
        });
        // File write tool
        toolRegistry.set("file_write", {
            name: files_js_1.fileWriteTool.name,
            description: files_js_1.fileWriteTool.description,
            inputSchema: files_js_1.fileWriteTool.inputSchema,
            executor: (input) => (0, files_js_1.writeFile)(input, config?.maxFileSize),
        });
        tools.push({
            name: files_js_1.fileWriteTool.name,
            description: files_js_1.fileWriteTool.description,
            inputSchema: files_js_1.fileWriteTool.inputSchema,
        });
        // File list tool
        toolRegistry.set("file_list", {
            name: files_js_1.fileListTool.name,
            description: files_js_1.fileListTool.description,
            inputSchema: files_js_1.fileListTool.inputSchema,
            executor: (input) => (0, files_js_1.listFiles)(input),
        });
        tools.push({
            name: files_js_1.fileListTool.name,
            description: files_js_1.fileListTool.description,
            inputSchema: files_js_1.fileListTool.inputSchema,
        });
    }
    // Otonix tools
    if (enabledTools.includes("otonix")) {
        toolRegistry.set("check_credits", {
            name: otonix_js_1.checkCreditsTool.name,
            description: otonix_js_1.checkCreditsTool.description,
            inputSchema: otonix_js_1.checkCreditsTool.inputSchema,
            executor: (input) => (0, otonix_js_1.checkCredits)(input),
        });
        tools.push({
            name: otonix_js_1.checkCreditsTool.name,
            description: otonix_js_1.checkCreditsTool.description,
            inputSchema: otonix_js_1.checkCreditsTool.inputSchema,
        });
        toolRegistry.set("check_status", {
            name: otonix_js_1.checkStatusTool.name,
            description: otonix_js_1.checkStatusTool.description,
            inputSchema: otonix_js_1.checkStatusTool.inputSchema,
            executor: (input) => (0, otonix_js_1.checkStatus)(input),
        });
        tools.push({
            name: otonix_js_1.checkStatusTool.name,
            description: otonix_js_1.checkStatusTool.description,
            inputSchema: otonix_js_1.checkStatusTool.inputSchema,
        });
        toolRegistry.set("log_action", {
            name: otonix_js_1.logActionTool.name,
            description: otonix_js_1.logActionTool.description,
            inputSchema: otonix_js_1.logActionTool.inputSchema,
            executor: (input) => (0, otonix_js_1.logAction)(input),
        });
        tools.push({
            name: otonix_js_1.logActionTool.name,
            description: otonix_js_1.logActionTool.description,
            inputSchema: otonix_js_1.logActionTool.inputSchema,
        });
    }
    logger_js_1.logger.debug("Tools registered", {
        count: tools.length,
        tools: tools.map((t) => t.name),
    });
    return tools;
}
/**
 * Execute a tool by name
 */
async function executeTool(toolName, input) {
    const tool = toolRegistry.get(toolName);
    if (!tool) {
        throw new Error(`Tool not found: ${toolName}`);
    }
    logger_js_1.logger.debug("Executing tool", { tool: toolName });
    try {
        const result = await tool.executor(input);
        logger_js_1.logger.debug("Tool executed successfully", { tool: toolName });
        return result;
    }
    catch (error) {
        logger_js_1.logger.warn("Tool execution failed", {
            tool: toolName,
            error: error instanceof Error ? error.message : String(error),
        });
        throw error;
    }
}
/**
 * Get tool schema by name
 */
function getToolSchema(name) {
    return toolRegistry.get(name);
}
/**
 * Get all registered tools
 */
function getAllTools() {
    return Array.from(toolRegistry.values());
}
//# sourceMappingURL=index.js.map