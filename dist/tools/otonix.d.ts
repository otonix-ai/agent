/**
 * Otonix Tool
 * Query the Otonix platform from within the agent's reasoning loop
 */
import { OtonixCheckCreditsInput, OtonixCheckStatusInput, OtonixLogActionInput, AgentStatusResponse, ActionLogResponse } from "../types.js";
import { OtonixApiClient } from "../api.js";
/**
 * Initialize the Otonix tool with an API client
 */
export declare function initializeOtonixTool(client: OtonixApiClient): void;
/**
 * Check current credit balance
 */
export declare function checkCredits(_input: OtonixCheckCreditsInput): Promise<{
    credits: number;
    tier: string;
}>;
/**
 * Check agent status on the platform
 */
export declare function checkStatus(_input: OtonixCheckStatusInput): Promise<AgentStatusResponse>;
/**
 * Log an action to the platform
 */
export declare function logAction(input: OtonixLogActionInput): Promise<ActionLogResponse>;
export declare const checkCreditsTool: {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {};
        required: never[];
    };
};
export declare const checkStatusTool: {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {};
        required: never[];
    };
};
export declare const logActionTool: {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            action: {
                type: "string";
                description: string;
            };
            category: {
                type: "string";
                enum: string[];
                description: string;
            };
            details: {
                type: "string";
                description: string;
            };
        };
        required: string[];
    };
};
