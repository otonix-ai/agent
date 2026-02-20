/**
 * LLM Inference Module
 * Supports both Anthropic Claude and OpenAI models with tool calling
 */

import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import {
  InferenceConfig,
  InferenceMessage,
  InferenceResponse,
  InferenceError,
} from "./types.js";
import { logger } from "./logger.js";

export class InferenceEngine {
  private config: InferenceConfig;
  private anthropicClient?: Anthropic;
  private openaiClient?: OpenAI;

  constructor(config: InferenceConfig) {
    this.config = config;

    if (config.provider === "anthropic") {
      this.anthropicClient = new Anthropic({
        apiKey: config.apiKey,
      });
    } else if (config.provider === "openai") {
      this.openaiClient = new OpenAI({
        apiKey: config.apiKey,
      });
    }
  }

  /**
   * Run inference with the configured LLM provider
   */
  async inference(
    systemPrompt: string,
    messages: InferenceMessage[],
    tools?: Array<{ name: string; description: string; input_schema: unknown }>
  ): Promise<InferenceResponse> {
    if (this.config.provider === "anthropic") {
      return this.inferenceAnthropic(systemPrompt, messages, tools);
    } else if (this.config.provider === "openai") {
      return this.inferenceOpenAI(systemPrompt, messages, tools);
    } else {
      throw new InferenceError(
        `Unknown provider: ${this.config.provider}`
      );
    }
  }

  /**
   * Anthropic Claude inference
   */
  private async inferenceAnthropic(
    systemPrompt: string,
    messages: InferenceMessage[],
    tools?: Array<{ name: string; description: string; input_schema: unknown }>
  ): Promise<InferenceResponse> {
    if (!this.anthropicClient) {
      throw new InferenceError("Anthropic client not initialized");
    }

    try {
      logger.debug("Running Anthropic inference", {
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
          role: msg.role as "user" | "assistant",
          content: msg.content,
        })),
        ...(tools && tools.length > 0 ? { tools: tools as Anthropic.Tool[] } : {}),
      });

      let textContent = "";
      const toolCalls = [];

      for (const block of response.content) {
        if (block.type === "text") {
          textContent = block.text;
        } else if (block.type === "tool_use") {
          toolCalls.push({
            id: block.id,
            name: block.name,
            input: block.input as Record<string, unknown>,
          });
        }
      }

      logger.debug("Anthropic inference complete", {
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
    } catch (error) {
      throw new InferenceError(
        `Anthropic inference failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * OpenAI Chat GPT inference
   */
  private async inferenceOpenAI(
    systemPrompt: string,
    messages: InferenceMessage[],
    tools?: Array<{ name: string; description: string; input_schema: unknown }>
  ): Promise<InferenceResponse> {
    if (!this.openaiClient) {
      throw new InferenceError("OpenAI client not initialized");
    }

    try {
      logger.debug("Running OpenAI inference", {
        model: this.config.model,
        messageCount: messages.length,
        hasTools: !!tools && tools.length > 0,
      });

      const createParams: Record<string, unknown> = {
        model: this.config.model,
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
        messages: [
          { role: "system", content: systemPrompt },
          ...messages.map((msg) => ({
            role: msg.role as "user" | "assistant" | "system",
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

      const response = (await this.openaiClient.chat.completions.create(
        createParams as unknown as Parameters<typeof this.openaiClient.chat.completions.create>[0]
      )) as OpenAI.Chat.ChatCompletion;

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
              input: JSON.parse(tc.function.arguments) as Record<
                string,
                unknown
              >,
            });
          }
        }
      }

      logger.debug("OpenAI inference complete", {
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
    } catch (error) {
      throw new InferenceError(
        `OpenAI inference failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}

/**
 * Create an inference engine from config
 */
export function createInferenceEngine(config: InferenceConfig): InferenceEngine {
  return new InferenceEngine(config);
}
