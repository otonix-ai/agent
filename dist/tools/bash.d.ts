/**
 * Bash Tool
 * Executes shell commands on the VPS
 */
import { BashToolInput, BashToolOutput } from "../types.js";
export declare function executeBash(input: BashToolInput, maxTimeoutMs?: number): Promise<BashToolOutput>;
export declare const bashTool: {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            command: {
                type: "string";
                description: string;
            };
            timeout_ms: {
                type: "number";
                description: string;
            };
            cwd: {
                type: "string";
                description: string;
            };
        };
        required: string[];
    };
};
