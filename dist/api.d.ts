/**
 * Otonix Platform API Client
 * Handles registration, heartbeats, action logging, and status queries
 */
import { request as undiciFetch } from "undici";
import { RegisterRequest, RegisterResponse, HeartbeatResponse, ActionLogRequest, ActionLogResponse, AgentStatusResponse } from "./types.js";
export declare class OtonixApiClient {
    private baseUrl;
    private apiKey;
    private agentId?;
    constructor(baseUrl: string, apiKey: string);
    setAgentId(id: string): void;
    /**
     * Register a new agent with the Otonix platform
     */
    registerAgent(req: RegisterRequest): Promise<RegisterResponse>;
    /**
     * Send a heartbeat to the Otonix platform
     */
    sendHeartbeat(): Promise<HeartbeatResponse>;
    /**
     * Log an action to the Otonix platform
     */
    logAction(actionRequest: ActionLogRequest): Promise<ActionLogResponse>;
    /**
     * Get agent status from the Otonix platform
     */
    getAgentStatus(): Promise<AgentStatusResponse>;
}
export { undiciFetch as request };
