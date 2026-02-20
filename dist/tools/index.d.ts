/**
 * Tool Registry
 * Central registry of all available tools
 */
import { BashToolInput, BashToolOutput, WebToolInput, WebToolOutput, ReadFileInput, WriteFileInput, ListFilesInput, FileListOutput, OtonixCheckCreditsInput, OtonixCheckStatusInput, OtonixLogActionInput, ToolSchema } from "../types.js";
export type ToolInput = BashToolInput | WebToolInput | ReadFileInput | WriteFileInput | ListFilesInput | OtonixCheckCreditsInput | OtonixCheckStatusInput | OtonixLogActionInput;
export type ToolOutput = BashToolOutput | WebToolOutput | string | FileListOutput | Record<string, unknown>;
/**
 * Tool executor function type
 */
type ToolExecutor = (input: unknown, config?: {
    maxTimeoutMs?: number;
    maxFileSize?: number;
}) => Promise<unknown>;
interface Tool {
    name: string;
    description: string;
    inputSchema: Record<string, unknown>;
    executor: ToolExecutor;
}
/**
 * Register all available tools
 */
export declare function registerAllTools(enabledTools: string[], config?: {
    maxTimeoutMs?: number;
    maxFileSize?: number;
}): ToolSchema[];
/**
 * Execute a tool by name
 */
export declare function executeTool(toolName: string, input: unknown): Promise<unknown>;
/**
 * Get tool schema by name
 */
export declare function getToolSchema(name: string): Tool | undefined;
/**
 * Get all registered tools
 */
export declare function getAllTools(): Tool[];
export {};
