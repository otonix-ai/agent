"use strict";
/**
 * Bash Tool
 * Executes shell commands on the VPS
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.bashTool = void 0;
exports.executeBash = executeBash;
const child_process_1 = require("child_process");
const util_1 = require("util");
const types_js_1 = require("../types.js");
const logger_js_1 = require("../logger.js");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
async function executeBash(input, maxTimeoutMs = 30000) {
    const timeout = Math.min(input.timeout_ms || maxTimeoutMs, maxTimeoutMs);
    logger_js_1.logger.debug("Executing bash command", {
        command: input.command,
        cwd: input.cwd,
        timeout,
    });
    try {
        const result = await execAsync(input.command, {
            cwd: input.cwd || process.cwd(),
            timeout,
            maxBuffer: 10 * 1024 * 1024, // 10MB max buffer
        });
        const output = {
            stdout: result.stdout,
            stderr: result.stderr,
            exitCode: 0,
            timedOut: false,
        };
        logger_js_1.logger.debug("Bash command executed successfully", {
            exitCode: output.exitCode,
            stdoutLength: output.stdout.length,
            stderrLength: output.stderr.length,
        });
        return output;
    }
    catch (error) {
        if (error instanceof Error) {
            // Check for timeout
            if (error.message.includes("timed out")) {
                const output = {
                    stdout: "",
                    stderr: `Command timed out after ${timeout}ms`,
                    exitCode: 124,
                    timedOut: true,
                };
                logger_js_1.logger.warn("Bash command timed out", {
                    command: input.command,
                    timeout,
                });
                return output;
            }
            // Handle exec errors
            if ("code" in error && "stdout" in error && "stderr" in error) {
                const output = {
                    stdout: error.stdout || "",
                    stderr: error.stderr || error.message,
                    exitCode: error.code || 1,
                    timedOut: false,
                };
                logger_js_1.logger.debug("Bash command failed", {
                    exitCode: output.exitCode,
                    command: input.command,
                });
                return output;
            }
            throw new types_js_1.ToolExecutionError("bash", `Failed to execute bash command: ${error.message}`);
        }
        throw new types_js_1.ToolExecutionError("bash", `Failed to execute bash command: ${String(error)}`);
    }
}
exports.bashTool = {
    name: "bash",
    description: "Execute shell commands on the VPS",
    inputSchema: {
        type: "object",
        properties: {
            command: {
                type: "string",
                description: "The shell command to execute",
            },
            timeout_ms: {
                type: "number",
                description: "Timeout in milliseconds (optional)",
            },
            cwd: {
                type: "string",
                description: "Working directory for the command (optional)",
            },
        },
        required: ["command"],
    },
};
//# sourceMappingURL=bash.js.map