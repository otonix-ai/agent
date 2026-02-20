"use strict";
/**
 * Otonix Platform API Client
 * Handles registration, heartbeats, action logging, and status queries
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.request = exports.OtonixApiClient = void 0;
const undici_1 = require("undici");
Object.defineProperty(exports, "request", { enumerable: true, get: function () { return undici_1.request; } });
const types_js_1 = require("./types.js");
const logger_js_1 = require("./logger.js");
class OtonixApiClient {
    constructor(baseUrl, apiKey) {
        this.baseUrl = baseUrl.replace(/\/$/, ""); // Remove trailing slash
        this.apiKey = apiKey;
    }
    setAgentId(id) {
        this.agentId = id;
    }
    /**
     * Register a new agent with the Otonix platform
     */
    async registerAgent(req) {
        try {
            logger_js_1.logger.debug("Registering agent with Otonix platform", {
                name: req.name,
                model: req.model,
            });
            const url = new URL(this.baseUrl);
            const response = await (0, undici_1.request)(`${this.baseUrl}/api/agents/register`, {
                method: "POST",
                headers: {
                    "X-API-Key": this.apiKey,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(req),
            });
            const body = await response.body.text();
            const data = JSON.parse(body);
            if (response.statusCode !== 201) {
                throw new types_js_1.APIError(`Agent registration failed: ${body}`, response.statusCode);
            }
            this.agentId = data.agent.id;
            logger_js_1.logger.info("Agent registered successfully", {
                agentId: data.agent.id,
                name: data.agent.name,
            });
            return data;
        }
        catch (error) {
            if (error instanceof types_js_1.APIError) {
                throw error;
            }
            throw new types_js_1.APIError(`Registration failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Send a heartbeat to the Otonix platform
     */
    async sendHeartbeat() {
        if (!this.agentId) {
            throw new types_js_1.APIError("Agent not registered: agentId is not set");
        }
        try {
            logger_js_1.logger.debug("Sending heartbeat", { agentId: this.agentId });
            const response = await (0, undici_1.request)(`${this.baseUrl}/api/agents/${this.agentId}/heartbeat`, {
                method: "POST",
                headers: {
                    "X-API-Key": this.apiKey,
                },
            });
            const body = await response.body.text();
            const data = JSON.parse(body);
            if (response.statusCode !== 200) {
                logger_js_1.logger.warn("Heartbeat failed", {
                    statusCode: response.statusCode,
                    body,
                });
                throw new types_js_1.APIError(`Heartbeat failed: ${body}`, response.statusCode);
            }
            logger_js_1.logger.debug("Heartbeat sent successfully", {
                agentId: this.agentId,
            });
            return data;
        }
        catch (error) {
            if (error instanceof types_js_1.APIError) {
                throw error;
            }
            throw new types_js_1.APIError(`Heartbeat failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Log an action to the Otonix platform
     */
    async logAction(actionRequest) {
        if (!this.agentId) {
            throw new types_js_1.APIError("Agent not registered: agentId is not set");
        }
        try {
            logger_js_1.logger.debug("Logging action", {
                agentId: this.agentId,
                action: actionRequest.action,
                category: actionRequest.category,
            });
            const response = await (0, undici_1.request)(`${this.baseUrl}/api/agents/${this.agentId}/actions`, {
                method: "POST",
                headers: {
                    "X-API-Key": this.apiKey,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(actionRequest),
            });
            const body = await response.body.text();
            const data = JSON.parse(body);
            if (response.statusCode !== 201) {
                throw new types_js_1.APIError(`Action logging failed: ${body}`, response.statusCode);
            }
            logger_js_1.logger.debug("Action logged successfully", {
                actionId: data.id,
            });
            return data;
        }
        catch (error) {
            if (error instanceof types_js_1.APIError) {
                throw error;
            }
            throw new types_js_1.APIError(`Action logging failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Get agent status from the Otonix platform
     */
    async getAgentStatus() {
        if (!this.agentId) {
            throw new types_js_1.APIError("Agent not registered: agentId is not set");
        }
        try {
            logger_js_1.logger.debug("Fetching agent status", { agentId: this.agentId });
            const response = await (0, undici_1.request)(`${this.baseUrl}/api/agents/${this.agentId}`, {
                method: "GET",
                headers: {
                    "X-API-Key": this.apiKey,
                },
            });
            const body = await response.body.text();
            const data = JSON.parse(body);
            if (response.statusCode !== 200) {
                throw new types_js_1.APIError(`Failed to get agent status: ${body}`, response.statusCode);
            }
            logger_js_1.logger.debug("Agent status retrieved", {
                agentId: this.agentId,
                status: data.status,
                credits: data.credits,
            });
            return data;
        }
        catch (error) {
            if (error instanceof types_js_1.APIError) {
                throw error;
            }
            throw new types_js_1.APIError(`Failed to get agent status: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}
exports.OtonixApiClient = OtonixApiClient;
//# sourceMappingURL=api.js.map