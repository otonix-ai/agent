/**
 * Tool Registry
 * Central registry of all available tools
 */

import { bashTool, executeBash } from "./bash.js";
import { webTool, executeWeb } from "./web.js";
import {
  fileReadTool,
  fileWriteTool,
  fileListTool,
  readFile,
  writeFile,
  listFiles,
} from "./files.js";
import {
  checkCreditsTool,
  checkStatusTool,
  logActionTool,
  checkCredits,
  checkStatus,
  logAction,
} from "./otonix.js";
import {
  BashToolInput,
  BashToolOutput,
  WebToolInput,
  WebToolOutput,
  ReadFileInput,
  WriteFileInput,
  ListFilesInput,
  FileListOutput,
  OtonixCheckCreditsInput,
  OtonixCheckStatusInput,
  OtonixLogActionInput,
  ToolSchema,
} from "../types.js";
import { logger } from "../logger.js";

export type ToolInput =
  | BashToolInput
  | WebToolInput
  | ReadFileInput
  | WriteFileInput
  | ListFilesInput
  | OtonixCheckCreditsInput
  | OtonixCheckStatusInput
  | OtonixLogActionInput;

export type ToolOutput =
  | BashToolOutput
  | WebToolOutput
  | string
  | FileListOutput
  | Record<string, unknown>;

/**
 * Tool executor function type
 */
type ToolExecutor = (input: unknown, config?: { maxTimeoutMs?: number; maxFileSize?: number }) => Promise<unknown>;

interface Tool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  executor: ToolExecutor;
}

const toolRegistry: Map<string, Tool> = new Map();

/**
 * Register all available tools
 */
export function registerAllTools(
  enabledTools: string[],
  config?: { maxTimeoutMs?: number; maxFileSize?: number }
): ToolSchema[] {
  const tools: ToolSchema[] = [];

  // Bash tool
  if (enabledTools.includes("bash")) {
    toolRegistry.set("bash", {
      name: bashTool.name,
      description: bashTool.description,
      inputSchema: bashTool.inputSchema,
      executor: (input: unknown) => executeBash(input as BashToolInput, config?.maxTimeoutMs),
    });
    tools.push({
      name: bashTool.name,
      description: bashTool.description,
      inputSchema: bashTool.inputSchema,
    });
  }

  // Web tool
  if (enabledTools.includes("web")) {
    toolRegistry.set("web", {
      name: webTool.name,
      description: webTool.description,
      inputSchema: webTool.inputSchema,
      executor: (input: unknown) => executeWeb(input as WebToolInput),
    });
    tools.push({
      name: webTool.name,
      description: webTool.description,
      inputSchema: webTool.inputSchema,
    });
  }

  // File read tool
  if (enabledTools.includes("files")) {
    toolRegistry.set("file_read", {
      name: fileReadTool.name,
      description: fileReadTool.description,
      inputSchema: fileReadTool.inputSchema,
      executor: (input: unknown) => readFile(input as ReadFileInput, config?.maxFileSize),
    });
    tools.push({
      name: fileReadTool.name,
      description: fileReadTool.description,
      inputSchema: fileReadTool.inputSchema,
    });

    // File write tool
    toolRegistry.set("file_write", {
      name: fileWriteTool.name,
      description: fileWriteTool.description,
      inputSchema: fileWriteTool.inputSchema,
      executor: (input: unknown) => writeFile(input as WriteFileInput, config?.maxFileSize),
    });
    tools.push({
      name: fileWriteTool.name,
      description: fileWriteTool.description,
      inputSchema: fileWriteTool.inputSchema,
    });

    // File list tool
    toolRegistry.set("file_list", {
      name: fileListTool.name,
      description: fileListTool.description,
      inputSchema: fileListTool.inputSchema,
      executor: (input: unknown) => listFiles(input as ListFilesInput),
    });
    tools.push({
      name: fileListTool.name,
      description: fileListTool.description,
      inputSchema: fileListTool.inputSchema,
    });
  }

  // Otonix tools
  if (enabledTools.includes("otonix")) {
    toolRegistry.set("check_credits", {
      name: checkCreditsTool.name,
      description: checkCreditsTool.description,
      inputSchema: checkCreditsTool.inputSchema,
      executor: (input: unknown) => checkCredits(input as OtonixCheckCreditsInput),
    });
    tools.push({
      name: checkCreditsTool.name,
      description: checkCreditsTool.description,
      inputSchema: checkCreditsTool.inputSchema,
    });

    toolRegistry.set("check_status", {
      name: checkStatusTool.name,
      description: checkStatusTool.description,
      inputSchema: checkStatusTool.inputSchema,
      executor: (input: unknown) => checkStatus(input as OtonixCheckStatusInput),
    });
    tools.push({
      name: checkStatusTool.name,
      description: checkStatusTool.description,
      inputSchema: checkStatusTool.inputSchema,
    });

    toolRegistry.set("log_action", {
      name: logActionTool.name,
      description: logActionTool.description,
      inputSchema: logActionTool.inputSchema,
      executor: (input: unknown) => logAction(input as OtonixLogActionInput),
    });
    tools.push({
      name: logActionTool.name,
      description: logActionTool.description,
      inputSchema: logActionTool.inputSchema,
    });
  }

  logger.debug("Tools registered", {
    count: tools.length,
    tools: tools.map((t) => t.name),
  });

  return tools;
}

/**
 * Execute a tool by name
 */
export async function executeTool(
  toolName: string,
  input: unknown
): Promise<unknown> {
  const tool = toolRegistry.get(toolName);

  if (!tool) {
    throw new Error(`Tool not found: ${toolName}`);
  }

  logger.debug("Executing tool", { tool: toolName });

  try {
    const result = await tool.executor(input);
    logger.debug("Tool executed successfully", { tool: toolName });
    return result;
  } catch (error) {
    logger.warn("Tool execution failed", {
      tool: toolName,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Get tool schema by name
 */
export function getToolSchema(name: string): Tool | undefined {
  return toolRegistry.get(name);
}

/**
 * Get all registered tools
 */
export function getAllTools(): Tool[] {
  return Array.from(toolRegistry.values());
}
