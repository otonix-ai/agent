"use strict";
/**
 * LLM Inference Module
 * Supports both Anthropic Claude and OpenAI models with tool calling
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InferenceEngine = void 0;
exports.createInferenceEngine = createInferenceEngine;
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const openai_1 = __importDefault(require("openai"));
const types_js_1 = require("./types.js");
const logger_js_1 = require("./logger.js");
class InferenceEngine {
    constructor(config) {
        this.config = config;
        if (config.provider === "anthropic") {
            this.anthropicClient = new sdk_1.default({
                apiKey: config.apiKey,
            });
        }
        else if (config.provider === "openai") {
            this.openaiClient = new openai_1.default({
                apiKey: config.apiKey,
            });
        }
    }
    /**
     * Run inference with the configured LLM provider
     */
    async inference(systemPrompt, messages, tools) {
        if (this.config.provider === "anthropic") {
            return this.inferenceAnthropic(systemPrompt, messages, tools);
        }
        else if (this.config.provider === "openai") {
            return this.inferenceOpenAI(systemPrompt, messages, tools);
        }
        else {
            throw new types_js_1.InferenceError(`Unknown provider: ${this.config.provider}`);
        }
    }
    /**
     * Anthropic Claude inference
     */
    async inferenceAnthropic(systemPrompt, messages, tools) {
        if (!this.anthropicClient) {
            throw new types_js_1.InferenceError("Anthropic client not initialized");
        }
        try {
            logger_js_1.logger.debug("Running Anthropic inference", {
                model: this.config.model,
                messageCount: messages.length,
                hasTools: !!tools && tools.length > 0,
            });
            const response = await this.anthropicClient.messages.create({
                model: this.config.model,
                max_tokens: this.config.maxTokens,
                temperature: this.config.temperature,
                system: systemPrompt,
                messages: messages.map((msg) => ({
                    role: msg.role,
                    content: msg.content,
                })),
                ...(tools && tools.length > 0 ? { tools: tools } : {}),
            });
            let textContent = "";
            const toolCalls = [];
            for (const block of response.content) {
                if (block.type === "text") {
                    textContent = block.text;
                }
                else if (block.type === "tool_use") {
                    toolCalls.push({
                        id: block.id,
                        name: block.name,
                        input: block.input,
                    });
                }
            }
            logger_js_1.logger.debug("Anthropic inference complete", {
                inputTokens: response.usage.input_tokens,
                outputTokens: response.usage.output_tokens,
                toolCalls: toolCalls.length,
            });
            return {
                content: textContent,
                toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
                usage: {
                    inputTokens: response.usage.input_tokens,
                    outputTokens: response.usage.output_tokens,
                },
            };
        }
        catch (error) {
            throw new types_js_1.InferenceError(`Anthropic inference failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * OpenAI Chat GPT inference
     */
    async inferenceOpenAI(systemPrompt, messages, tools) {
        if (!this.openaiClient) {
            throw new types_js_1.InferenceError("OpenAI client not initialized");
        }
        try {
            logger_js_1.logger.debug("Running OpenAI inference", {
                model: this.config.model,
                messageCount: messages.length,
                hasTools: !!tools && tools.length > 0,
            });
            const createParams = {
                model: this.config.model,
                max_tokens: this.config.maxTokens,
                temperature: this.config.temperature,
                messages: [
                    { role: "system", content: systemPrompt },
                    ...messages.map((msg) => ({
                        role: msg.role,
                        content: msg.content,
                    })),
                ],
                stream: false,
            };
            if (tools && tools.length > 0) {
                createParams.tools = tools.map((tool) => ({
                    type: "function",
                    function: {
                        name: tool.name,
                        description: tool.description,
                        parameters: tool.input_schema,
                    },
                }));
            }
            const response = (await this.openaiClient.chat.completions.create(createParams));
            let textContent = "";
            const toolCalls = [];
            const message = response.choices[0]?.message;
            if (message?.content) {
                textContent = message.content;
            }
            if (message?.tool_calls) {
                for (const tc of message.tool_calls) {
                    if (tc.type === "function") {
                        toolCalls.push({
                            id: tc.id,
                            name: tc.function.name,
                            input: JSON.parse(tc.function.arguments),
                        });
                    }
                }
            }
            logger_js_1.logger.debug("OpenAI inference complete", {
                inputTokens: response.usage?.prompt_tokens || 0,
                outputTokens: response.usage?.completion_tokens || 0,
                toolCalls: toolCalls.length,
            });
            return {
                content: textContent,
                toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
                usage: {
                    inputTokens: response.usage?.prompt_tokens || 0,
                    outputTokens: response.usage?.completion_tokens || 0,
                },
            };
        }
        catch (error) {
            throw new types_js_1.InferenceError(`OpenAI inference failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}
exports.InferenceEngine = InferenceEngine;
/**
 * Create an inference engine from config
 */
function createInferenceEngine(config) {
    return new InferenceEngine(config);
}
//# sourceMappingURL=inference.js.map