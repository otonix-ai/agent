/**
 * Heartbeat Manager
 * Sends periodic heartbeats to the Otonix platform
 */
import { OtonixApiClient } from "./api.js";
export declare class HeartbeatManager {
    private agentId;
    private intervalSeconds;
    private apiClient;
    private intervalHandle?;
    private failureCount;
    private maxConsecutiveFailures;
    constructor(agentId: string, intervalSeconds: number, apiClient: OtonixApiClient);
    /**
     * Start sending periodic heartbeats
     */
    start(): void;
    /**
     * Stop sending heartbeats
     */
    stop(): void;
    /**
     * Send a single heartbeat
     */
    private sendHeartbeat;
    /**
     * Get current failure count
     */
    getFailureCount(): number;
}
