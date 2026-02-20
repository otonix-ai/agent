"use strict";
/**
 * Files Tool
 * Read, write, and list files
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fileListTool = exports.fileWriteTool = exports.fileReadTool = void 0;
exports.readFile = readFile;
exports.writeFile = writeFile;
exports.listFiles = listFiles;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const types_js_1 = require("../types.js");
const logger_js_1 = require("../logger.js");
const MAX_FILE_SIZE = 1024 * 1024; // 1MB default
const WORKING_DIR = process.cwd();
/**
 * Safely resolve a file path within the working directory
 */
function resolvePath(filePath) {
    const resolved = path_1.default.resolve(WORKING_DIR, filePath);
    const normalized = path_1.default.normalize(resolved);
    // Ensure path is within working directory
    if (!normalized.startsWith(WORKING_DIR)) {
        throw new types_js_1.ToolExecutionError("files", `Access denied: path outside working directory: ${filePath}`);
    }
    return normalized;
}
/**
 * Read a file
 */
async function readFile(input, maxFileSize) {
    const maxSize = maxFileSize || MAX_FILE_SIZE;
    const resolvedPath = resolvePath(input.path);
    logger_js_1.logger.debug("Reading file", { path: input.path });
    try {
        const stat = await promises_1.default.stat(resolvedPath);
        if (stat.isDirectory()) {
            throw new types_js_1.ToolExecutionError("files", `Path is a directory, not a file: ${input.path}`);
        }
        if (stat.size > maxSize) {
            throw new types_js_1.ToolExecutionError("files", `File too large: ${stat.size} bytes (max: ${maxSize})`);
        }
        const content = await promises_1.default.readFile(resolvedPath, "utf-8");
        logger_js_1.logger.debug("File read successfully", {
            path: input.path,
            size: content.length,
        });
        return content;
    }
    catch (error) {
        if (error instanceof types_js_1.ToolExecutionError) {
            throw error;
        }
        if (error instanceof Error && "code" in error && error.code === "ENOENT") {
            throw new types_js_1.ToolExecutionError("files", `File not found: ${input.path}`);
        }
        throw new types_js_1.ToolExecutionError("files", `Failed to read file: ${error instanceof Error ? error.message : String(error)}`);
    }
}
/**
 * Write a file
 */
async function writeFile(input, maxFileSize) {
    const maxSize = maxFileSize || MAX_FILE_SIZE;
    const resolvedPath = resolvePath(input.path);
    if (input.content.length > maxSize) {
        throw new types_js_1.ToolExecutionError("files", `Content too large: ${input.content.length} bytes (max: ${maxSize})`);
    }
    logger_js_1.logger.debug("Writing file", {
        path: input.path,
        size: input.content.length,
    });
    try {
        // Create parent directory if needed
        const dir = path_1.default.dirname(resolvedPath);
        await promises_1.default.mkdir(dir, { recursive: true });
        await promises_1.default.writeFile(resolvedPath, input.content, "utf-8");
        logger_js_1.logger.debug("File written successfully", { path: input.path });
    }
    catch (error) {
        throw new types_js_1.ToolExecutionError("files", `Failed to write file: ${error instanceof Error ? error.message : String(error)}`);
    }
}
/**
 * List files in a directory
 */
async function listFiles(input) {
    const resolvedPath = resolvePath(input.directory);
    logger_js_1.logger.debug("Listing directory", { path: input.directory });
    try {
        const stat = await promises_1.default.stat(resolvedPath);
        if (!stat.isDirectory()) {
            throw new types_js_1.ToolExecutionError("files", `Path is not a directory: ${input.directory}`);
        }
        const entries = await promises_1.default.readdir(resolvedPath, { withFileTypes: true });
        const files = await Promise.all(entries.map(async (entry) => {
            const entryPath = path_1.default.join(resolvedPath, entry.name);
            try {
                const stat = await promises_1.default.stat(entryPath);
                return {
                    name: entry.name,
                    path: path_1.default.relative(WORKING_DIR, entryPath),
                    isDirectory: entry.isDirectory(),
                    size: entry.isDirectory() ? undefined : stat.size,
                };
            }
            catch (error) {
                logger_js_1.logger.warn("Failed to stat file", {
                    path: entry.name,
                    error: error instanceof Error ? error.message : String(error),
                });
                return {
                    name: entry.name,
                    path: path_1.default.relative(WORKING_DIR, entryPath),
                    isDirectory: entry.isDirectory(),
                };
            }
        }));
        logger_js_1.logger.debug("Directory listed successfully", {
            path: input.directory,
            count: files.length,
        });
        return { files };
    }
    catch (error) {
        if (error instanceof types_js_1.ToolExecutionError) {
            throw error;
        }
        if (error instanceof Error && "code" in error && error.code === "ENOENT") {
            throw new types_js_1.ToolExecutionError("files", `Directory not found: ${input.directory}`);
        }
        throw new types_js_1.ToolExecutionError("files", `Failed to list directory: ${error instanceof Error ? error.message : String(error)}`);
    }
}
exports.fileReadTool = {
    name: "file_read",
    description: "Read the contents of a file",
    inputSchema: {
        type: "object",
        properties: {
            path: {
                type: "string",
                description: "Path to the file to read",
            },
        },
        required: ["path"],
    },
};
exports.fileWriteTool = {
    name: "file_write",
    description: "Write content to a file",
    inputSchema: {
        type: "object",
        properties: {
            path: {
                type: "string",
                description: "Path to the file to write",
            },
            content: {
                type: "string",
                description: "Content to write",
            },
        },
        required: ["path", "content"],
    },
};
exports.fileListTool = {
    name: "file_list",
    description: "List files in a directory",
    inputSchema: {
        type: "object",
        properties: {
            directory: {
                type: "string",
                description: "Path to the directory",
            },
        },
        required: ["directory"],
    },
};
//# sourceMappingURL=files.js.map