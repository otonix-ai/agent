/**
 * Web Tool
 * Makes HTTP requests (GET and POST)
 */
import { WebToolInput, WebToolOutput } from "../types.js";
export declare function executeWeb(input: WebToolInput): Promise<WebToolOutput>;
export declare const webTool: {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            url: {
                type: "string";
                description: string;
            };
            method: {
                type: "string";
                enum: string[];
                description: string;
            };
            headers: {
                type: "object";
                description: string;
            };
            body: {
                type: "string";
                description: string;
            };
        };
        required: string[];
    };
};
