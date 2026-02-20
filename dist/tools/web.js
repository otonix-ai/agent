"use strict";
/**
 * Web Tool
 * Makes HTTP requests (GET and POST)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.webTool = void 0;
exports.executeWeb = executeWeb;
const undici_1 = require("undici");
const types_js_1 = require("../types.js");
const logger_js_1 = require("../logger.js");
const MAX_RESPONSE_SIZE = 50 * 1024; // 50KB
async function executeWeb(input) {
    const method = input.method || "GET";
    logger_js_1.logger.debug("Making HTTP request", {
        url: input.url,
        method,
    });
    try {
        const url = new URL(input.url);
        const response = await (0, undici_1.request)(input.url, {
            method,
            headers: {
                "User-Agent": "otonix-agent/0.1.0",
                ...input.headers,
            },
            body: input.body,
        });
        let bodyText = "";
        let truncated = false;
        // Read and truncate response body
        const chunks = [];
        for await (const chunk of response.body) {
            const str = chunk.toString();
            chunks.push(str);
            if (chunks.join("").length > MAX_RESPONSE_SIZE) {
                truncated = true;
                break;
            }
        }
        bodyText = chunks.join("").substring(0, MAX_RESPONSE_SIZE);
        const headers = {};
        if (response.headers) {
            for (const [key, value] of Object.entries(response.headers)) {
                headers[key] = String(value);
            }
        }
        const output = {
            status: response.statusCode,
            headers,
            body: truncated
                ? bodyText + `\n... (truncated at ${MAX_RESPONSE_SIZE} bytes)`
                : bodyText,
        };
        logger_js_1.logger.debug("HTTP request completed", {
            url: input.url,
            status: output.status,
            bodySize: output.body.length,
        });
        return output;
    }
    catch (error) {
        throw new types_js_1.ToolExecutionError("web", `HTTP request failed: ${error instanceof Error ? error.message : String(error)}`);
    }
}
exports.webTool = {
    name: "web",
    description: "Make HTTP requests (GET and POST)",
    inputSchema: {
        type: "object",
        properties: {
            url: {
                type: "string",
                description: "The URL to request",
            },
            method: {
                type: "string",
                enum: ["GET", "POST"],
                description: "HTTP method (default: GET)",
            },
            headers: {
                type: "object",
                description: "Optional HTTP headers",
            },
            body: {
                type: "string",
                description: "Optional request body (for POST)",
            },
        },
        required: ["url"],
    },
};
//# sourceMappingURL=web.js.map