/**
 * Core Agent Class
 * Implements the ReAct (Reason + Act) loop and agent lifecycle
 */
import { GenesisConfig } from "./types.js";
export declare class OtonixAgent {
    private config;
    private state;
    private apiClient;
    private heartbeatManager?;
    private inferenceEngine;
    private memoryManager;
    private isRunning;
    private isHibernating;
    private hibernationRetryInterval;
    constructor(config: GenesisConfig & {
        soul: string;
    }, apiKey: string);
    /**
     * Boot -> Register -> Loop lifecycle
     */
    start(): Promise<void>;
    /**
     * Register agent with Otonix platform
     */
    private register;
    /**
     * Start heartbeat manager
     */
    private startHeartbeat;
    /**
     * Main ReAct loop
     */
    private mainLoop;
    /**
     * Single ReAct cycle: Observe -> Think -> Act -> Reflect -> Report
     */
    private reactCycle;
    /**
     * Observe environment and platform state
     */
    private observe;
    /**
     * Build system prompt with Constitution + Soul
     */
    private buildSystemPrompt;
    /**
     * Build inference message history
     */
    private buildMessages;
    /**
     * Report action to platform
     */
    private reportAction;
    /**
     * Check hibernation status and resume if possible
     */
    private checkHibernationStatus;
    /**
     * Setup signal handlers for graceful shutdown
     */
    private setupSignalHandlers;
}
