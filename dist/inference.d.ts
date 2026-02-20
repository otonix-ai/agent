/**
 * LLM Inference Module
 * Supports both Anthropic Claude and OpenAI models with tool calling
 */
import { InferenceConfig, InferenceMessage, InferenceResponse } from "./types.js";
export declare class InferenceEngine {
    private config;
    private anthropicClient?;
    private openaiClient?;
    constructor(config: InferenceConfig);
    /**
     * Run inference with the configured LLM provider
     */
    inference(systemPrompt: string, messages: InferenceMessage[], tools?: Array<{
        name: string;
        description: string;
        input_schema: unknown;
    }>): Promise<InferenceResponse>;
    /**
     * Anthropic Claude inference
     */
    private inferenceAnthropic;
    /**
     * OpenAI Chat GPT inference
     */
    private inferenceOpenAI;
}
/**
 * Create an inference engine from config
 */
export declare function createInferenceEngine(config: InferenceConfig): InferenceEngine;
