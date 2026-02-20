"use strict";
/**
 * Otonix Tool
 * Query the Otonix platform from within the agent's reasoning loop
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.logActionTool = exports.checkStatusTool = exports.checkCreditsTool = void 0;
exports.initializeOtonixTool = initializeOtonixTool;
exports.checkCredits = checkCredits;
exports.checkStatus = checkStatus;
exports.logAction = logAction;
const types_js_1 = require("../types.js");
const logger_js_1 = require("../logger.js");
let apiClient;
/**
 * Initialize the Otonix tool with an API client
 */
function initializeOtonixTool(client) {
    apiClient = client;
}
/**
 * Check current credit balance
 */
async function checkCredits(_input) {
    if (!apiClient) {
        throw new types_js_1.ToolExecutionError("otonix", "Otonix API client not initialized");
    }
    try {
        logger_js_1.logger.debug("Checking agent credits");
        const status = await apiClient.getAgentStatus();
        logger_js_1.logger.debug("Credits checked", {
            credits: status.credits,
            tier: status.survivalTier,
        });
        return {
            credits: status.credits,
            tier: status.survivalTier,
        };
    }
    catch (error) {
        throw new types_js_1.ToolExecutionError("otonix", `Failed to check credits: ${error instanceof Error ? error.message : String(error)}`);
    }
}
/**
 * Check agent status on the platform
 */
async function checkStatus(_input) {
    if (!apiClient) {
        throw new types_js_1.ToolExecutionError("otonix", "Otonix API client not initialized");
    }
    try {
        logger_js_1.logger.debug("Checking agent status");
        const status = await apiClient.getAgentStatus();
        logger_js_1.logger.debug("Status checked", {
            status: status.status,
            credits: status.credits,
        });
        return status;
    }
    catch (error) {
        throw new types_js_1.ToolExecutionError("otonix", `Failed to check status: ${error instanceof Error ? error.message : String(error)}`);
    }
}
/**
 * Log an action to the platform
 */
async function logAction(input) {
    if (!apiClient) {
        throw new types_js_1.ToolExecutionError("otonix", "Otonix API client not initialized");
    }
    try {
        logger_js_1.logger.debug("Logging action to platform", {
            action: input.action,
            category: input.category,
        });
        const response = await apiClient.logAction({
            action: input.action,
            category: input.category,
            details: input.details,
            autonomous: true,
        });
        logger_js_1.logger.debug("Action logged successfully", {
            actionId: response.id,
        });
        return response;
    }
    catch (error) {
        throw new types_js_1.ToolExecutionError("otonix", `Failed to log action: ${error instanceof Error ? error.message : String(error)}`);
    }
}
exports.checkCreditsTool = {
    name: "check_credits",
    description: "Check current credit balance and survival tier",
    inputSchema: {
        type: "object",
        properties: {},
        required: [],
    },
};
exports.checkStatusTool = {
    name: "check_status",
    description: "Check agent status on the Otonix platform",
    inputSchema: {
        type: "object",
        properties: {},
        required: [],
    },
};
exports.logActionTool = {
    name: "log_action",
    description: "Log an action to the Otonix platform",
    inputSchema: {
        type: "object",
        properties: {
            action: {
                type: "string",
                description: "Description of the action performed",
            },
            category: {
                type: "string",
                enum: ["system", "research", "trade", "survival", "communication"],
                description: "Category of the action",
            },
            details: {
                type: "string",
                description: "Additional details about the action (optional)",
            },
        },
        required: ["action", "category"],
    },
};
//# sourceMappingURL=otonix.js.map