/**
 * Heartbeat Manager
 * Sends periodic heartbeats to the Otonix platform
 */

import { OtonixApiClient } from "./api.js";
import { logger } from "./logger.js";

export class HeartbeatManager {
  private agentId: string;
  private intervalSeconds: number;
  private apiClient: OtonixApiClient;
  private intervalHandle?: NodeJS.Timeout;
  private failureCount: number = 0;
  private maxConsecutiveFailures: number = 3;

  constructor(
    agentId: string,
    intervalSeconds: number,
    apiClient: OtonixApiClient
  ) {
    this.agentId = agentId;
    this.intervalSeconds = intervalSeconds;
    this.apiClient = apiClient;
  }

  /**
   * Start sending periodic heartbeats
   */
  start(): void {
    logger.info("Starting heartbeat manager", {
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
  stop(): void {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = undefined;
      logger.info("Heartbeat manager stopped");
    }
  }

  /**
   * Send a single heartbeat
   */
  private async sendHeartbeat(): Promise<void> {
    try {
      const response = await this.apiClient.sendHeartbeat();
      this.failureCount = 0;
      logger.debug("Heartbeat sent and acknowledged", {
        agentId: this.agentId,
        nextExpected: response.nextExpected,
      });
    } catch (error) {
      this.failureCount++;
      const msg =
        error instanceof Error ? error.message : String(error);
      logger.warn("Heartbeat failed", {
        agentId: this.agentId,
        failureCount: this.failureCount,
        error: msg,
      });

      if (this.failureCount >= this.maxConsecutiveFailures) {
        logger.warn("Heartbeat failures exceeded threshold", {
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
  getFailureCount(): number {
    return this.failureCount;
  }
}
