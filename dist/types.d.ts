/**
 * TypeScript type definitions for the Otonix Agent Runtime
 */
export interface GenesisConfig {
    name: string;
    model: string;
    heartbeat_interval: number;
    soul: string;
    tools: string[];
    platform: {
        url: string;
        api_key_env: string;
    };
    inference: {
        provider: "anthropic" | "openai";
        api_key_env: string;
        max_tokens: number;
        temperature: number;
    };
    limits: {
        max_actions_per_cycle: number;
        max_bash_timeout_ms: number;
        max_file_size_bytes: number;
    };
}
export interface InferenceConfig {
    provider: "anthropic" | "openai";
    model: string;
    apiKey: string;
    maxTokens: number;
    temperature: number;
}
export interface InferenceMessage {
    role: "system" | "user" | "assistant" | "tool";
    content: string;
    toolCallId?: string;
    toolName?: string;
}
export interface ToolCall {
    id: string;
    name: string;
    input: Record<string, unknown>;
}
export interface InferenceResponse {
    content: string;
    toolCalls?: ToolCall[];
    usage: {
        inputTokens: number;
        outputTokens: number;
    };
}
export interface BashToolInput {
    command: string;
    timeout_ms?: number;
    cwd?: string;
}
export interface BashToolOutput {
    stdout: string;
    stderr: string;
    exitCode: number;
    timedOut: boolean;
}
export interface WebToolInput {
    url: string;
    method?: "GET" | "POST";
    headers?: Record<string, string>;
    body?: string;
}
export interface WebToolOutput {
    status: number;
    headers: Record<string, string>;
    body: string;
}
export interface ReadFileInput {
    path: string;
}
export interface WriteFileInput {
    path: string;
    content: string;
}
export interface ListFilesInput {
    directory: string;
}
export interface FileListOutput {
    files: Array<{
        name: string;
        path: string;
        isDirectory: boolean;
        size?: number;
    }>;
}
export interface OtonixCheckCreditsInput {
}
export interface OtonixCheckStatusInput {
}
export interface OtonixLogActionInput {
    action: string;
    category: "system" | "research" | "trade" | "survival" | "communication";
    details?: string;
}
export interface ToolSchema {
    name: string;
    description: string;
    inputSchema: Record<string, unknown>;
}
export interface MemoryManager {
    addMessage(msg: InferenceMessage): void;
    getContext(maxTokens: number): InferenceMessage[];
    save(): Promise<void>;
    load(): Promise<void>;
    clear(): void;
}
export interface RegisterRequest {
    name: string;
    model: string;
    vpsIp?: string;
    walletAddress?: string;
    genesisPrompt?: string;
    heartbeatInterval: number;
}
export interface RegisterResponse {
    success: boolean;
    agent: {
        id: string;
        name: string;
        status: string;
        walletAddress: string;
    };
    monitoring: {
        heartbeatEndpoint: string;
        actionsEndpoint: string;
        statusEndpoint: string;
    };
    message: string;
}
export interface HeartbeatResponse {
    received: boolean;
    agentId: string;
    nextExpected: string;
}
export interface ActionLogRequest {
    action: string;
    category: "system" | "research" | "trade" | "survival" | "communication";
    details?: string;
    autonomous: boolean;
}
export interface ActionLogResponse {
    id: string;
    agentId: string;
    action: string;
    category: string;
    status: string;
    autonomous: boolean;
    createdAt: string;
}
export interface AgentStatusResponse {
    id: string;
    name: string;
    status: string;
    survivalTier: string;
    credits: number;
    walletAddress: string;
    model: string;
    heartbeatInterval: number;
    lastHeartbeat: string;
    totalActions: number;
    createdAt: string;
}
export interface AgentState {
    agentId: string;
    name: string;
    status: "active" | "hibernating" | "error";
    credits: number;
    lastHeartbeat: Date;
    totalActions: number;
    cycle: number;
}
export interface ReActCycle {
    cycle: number;
    timestamp: Date;
    observation: string;
    thought: string;
    action: ToolCall | null;
    actionResult: unknown;
    reflection: string;
}
export interface ConstitutionRule {
    id: string;
    title: string;
    rule: string;
}
export type LogLevel = "debug" | "info" | "warn" | "error";
export interface LogEntry {
    level: LogLevel;
    msg: string;
    [key: string]: unknown;
    ts: string;
}
export declare class AgentError extends Error {
    code: string;
    constructor(code: string, message: string);
}
export declare class ConfigError extends AgentError {
    constructor(message: string);
}
export declare class APIError extends AgentError {
    statusCode?: number | undefined;
    constructor(message: string, statusCode?: number | undefined);
}
export declare class InferenceError extends AgentError {
    constructor(message: string);
}
export declare class ToolExecutionError extends AgentError {
    toolName: string;
    constructor(toolName: string, message: string);
}
