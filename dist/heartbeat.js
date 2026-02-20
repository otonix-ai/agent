"use strict";
/**
 * Heartbeat Manager
 * Sends periodic heartbeats to the Otonix platform
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.HeartbeatManager = void 0;
const logger_js_1 = require("./logger.js");
class HeartbeatManager {
    constructor(agentId, intervalSeconds, apiClient) {
        this.failureCount = 0;
        this.maxConsecutiveFailures = 3;
        this.agentId = agentId;
        this.intervalSeconds = intervalSeconds;
        this.apiClient = apiClient;
    }
    /**
     * Start sending periodic heartbeats
     */
    start() {
        logger_js_1.logger.info("Starting heartbeat manager", {
            agentId: this.agentId,
            intervalSeconds: this.intervalSeconds,
        });
        // Send first heartbeat immediately
        this.sendHeartbeat();
        // Then schedule periodic heartbeats
        this.intervalHandle = setInterval(() => {
            this.sendHeartbeat();
        }, this.intervalSeconds * 1000);
    }
    /**
     * Stop sending heartbeats
     */
    stop() {
        if (this.intervalHandle) {
            clearInterval(this.intervalHandle);
            this.intervalHandle = undefined;
            logger_js_1.logger.info("Heartbeat manager stopped");
        }
    }
    /**
     * Send a single heartbeat
     */
    async sendHeartbeat() {
        try {
            const response = await this.apiClient.sendHeartbeat();
            this.failureCount = 0;
            logger_js_1.logger.debug("Heartbeat sent and acknowledged", {
                agentId: this.agentId,
                nextExpected: response.nextExpected,
            });
        }
        catch (error) {
            this.failureCount++;
            const msg = error instanceof Error ? error.message : String(error);
            logger_js_1.logger.warn("Heartbeat failed", {
                agentId: this.agentId,
                failureCount: this.failureCount,
                error: msg,
            });
            if (this.failureCount >= this.maxConsecutiveFailures) {
                logger_js_1.logger.warn("Heartbeat failures exceeded threshold", {
                    agentId: this.agentId,
                    failures: this.failureCount,
                    maxAllowed: this.maxConsecutiveFailures,
                });
                // Don't crash, just log warning and continue
                this.failureCount = 0; // Reset to avoid spam
            }
        }
    }
    /**
     * Get current failure count
     */
    getFailureCount() {
        return this.failureCount;
    }
}
exports.HeartbeatManager = HeartbeatManager;
//# sourceMappingURL=heartbeat.js.map