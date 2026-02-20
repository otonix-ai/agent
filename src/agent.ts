/**
 * Core Agent Class
 * Implements the ReAct (Reason + Act) loop and agent lifecycle
 */

import {
  GenesisConfig,
  AgentState,
  ReActCycle,
  InferenceMessage,
  APIError,
  InferenceError,
  ToolExecutionError,
} from "./types.js";
import { OtonixApiClient } from "./api.js";
import { HeartbeatManager } from "./heartbeat.js";
import { InferenceEngine } from "./inference.js";
import { LocalMemoryManager } from "./memory.js";
import { registerAllTools, executeTool, getAllTools } from "./tools/index.js";
import { initializeOtonixTool } from "./tools/otonix.js";
import { CONSTITUTION, generateConstitutionalPreamble } from "./constitution.js";
import { logger } from "./logger.js";
import { configLoader } from "./config.js";
import os from "os";

export class OtonixAgent {
  private config: GenesisConfig & { soul: string };
  private state: AgentState;
  private apiClient: OtonixApiClient;
  private heartbeatManager?: HeartbeatManager;
  private inferenceEngine: InferenceEngine;
  private memoryManager: LocalMemoryManager;
  private isRunning: boolean = false;
  private isHibernating: boolean = false;
  private hibernationRetryInterval: number = 300000; // 5 minutes

  constructor(config: GenesisConfig & { soul: string }, apiKey: string) {
    this.config = config;
    this.apiClient = new OtonixApiClient(config.platform.url, apiKey);

    // Initialize inference engine
    const inferenceApiKey = process.env[config.inference.api_key_env];
    if (!inferenceApiKey) {
      throw new Error(`Missing environment variable: ${config.inference.api_key_env}`);
    }

    this.inferenceEngine = new InferenceEngine({
      provider: config.inference.provider,
      model: config.model,
      apiKey: inferenceApiKey,
      maxTokens: config.inference.max_tokens,
      temperature: config.inference.temperature,
    });

    // Initialize memory manager
    this.memoryManager = new LocalMemoryManager();

    // Initialize state
    this.state = {
      agentId: "",
      name: config.name,
      status: "active",
      credits: 0,
      lastHeartbeat: new Date(),
      totalActions: 0,
      cycle: 0,
    };
  }

  /**
   * Boot -> Register -> Loop lifecycle
   */
  async start(): Promise<void> {
    try {
      logger.info("Agent starting", { name: this.config.name });

      // Load memory from disk
      await this.memoryManager.load();

      // Register with platform
      await this.register();

      // Start heartbeat manager
      this.startHeartbeat();

      // Initialize tools
      registerAllTools(this.config.tools, {
        maxTimeoutMs: this.config.limits.max_bash_timeout_ms,
        maxFileSize: this.config.limits.max_file_size_bytes,
      });

      // Initialize Otonix tool
      initializeOtonixTool(this.apiClient);

      // Set signal handlers
      this.setupSignalHandlers();

      // Start main loop
      this.isRunning = true;
      await this.mainLoop();
    } catch (error) {
      logger.error("Agent failed to start", {
        error: error instanceof Error ? error.message : String(error),
      });
      process.exit(1);
    }
  }

  /**
   * Register agent with Otonix platform
   */
  private async register(): Promise<void> {
    let attempts = 0;
    const maxAttempts = 3;
    let lastError: Error | undefined;

    while (attempts < maxAttempts) {
      try {
        logger.info("Registering agent with platform", {
          attempt: attempts + 1,
          maxAttempts,
        });

        const response = await this.apiClient.registerAgent({
          name: this.config.name,
          model: this.config.model,
          vpsIp: os.networkInterfaces()["eth0"]?.[0]?.address,
          heartbeatInterval: this.config.heartbeat_interval,
          genesisPrompt: this.config.soul,
        });

        this.state.agentId = response.agent.id;
        this.apiClient.setAgentId(response.agent.id);

        logger.info("Agent registered successfully", {
          agentId: this.state.agentId,
        });

        return;
      } catch (error) {
        attempts++;
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempts < maxAttempts) {
          const delay = Math.pow(2, attempts) * 1000; // exponential backoff
          logger.warn("Registration failed, retrying", {
            attempt: attempts,
            delay,
            error: lastError.message,
          });
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw new Error(
      `Failed to register agent after ${maxAttempts} attempts: ${lastError?.message}`
    );
  }

  /**
   * Start heartbeat manager
   */
  private startHeartbeat(): void {
    this.heartbeatManager = new HeartbeatManager(
      this.state.agentId,
      this.config.heartbeat_interval,
      this.apiClient
    );
    this.heartbeatManager.start();
  }

  /**
   * Main ReAct loop
   */
  private async mainLoop(): Promise<void> {
    while (this.isRunning) {
      try {
        if (this.isHibernating) {
          await this.checkHibernationStatus();
          continue;
        }

        this.state.cycle++;
        await this.reactCycle();

        // Small delay between cycles to avoid overwhelming
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        logger.error("Error in main loop", {
          cycle: this.state.cycle,
          error: error instanceof Error ? error.message : String(error),
        });

        // Continue running even on errors
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }
  }

  /**
   * Single ReAct cycle: Observe -> Think -> Act -> Reflect -> Report
   */
  private async reactCycle(): Promise<void> {
    const cycle: ReActCycle = {
      cycle: this.state.cycle,
      timestamp: new Date(),
      observation: "",
      thought: "",
      action: null,
      actionResult: null,
      reflection: "",
    };

    try {
      // 1. OBSERVE
      cycle.observation = await this.observe();

      // 2. THINK (call LLM)
      const systemPrompt = this.buildSystemPrompt();
      const messages = this.buildMessages(cycle.observation);

      const tools = getAllTools();
      const toolSchemas = tools.map((t) => ({
        name: t.name,
        description: t.description,
        input_schema: t.inputSchema,
      }));

      const inference = await this.inferenceEngine.inference(
        systemPrompt,
        messages,
        toolSchemas.length > 0 ? toolSchemas : undefined
      );

      cycle.thought = inference.content;

      // 3. ACT
      if (inference.toolCalls && inference.toolCalls.length > 0) {
        const toolCall = inference.toolCalls[0]; // Take first tool call

        if (this.state.cycle % 10 === 0) {
          // Rate limit tool logging
          logger.debug("Executing tool", {
            tool: toolCall.name,
            cycle: this.state.cycle,
          });
        }

        cycle.action = toolCall;

        try {
          cycle.actionResult = await executeTool(toolCall.name, toolCall.input);
        } catch (error) {
          cycle.actionResult = {
            error: error instanceof Error ? error.message : String(error),
          };
        }
      }

      // 4. REFLECT
      cycle.reflection = `Reflected on cycle ${this.state.cycle}: executed ${cycle.action?.name || "no action"}`;

      // 5. STORE IN MEMORY
      this.memoryManager.addMessage({
        role: "user",
        content: cycle.observation,
      });

      this.memoryManager.addMessage({
        role: "assistant",
        content: cycle.thought,
      });

      if (cycle.action) {
        this.memoryManager.addMessage({
          role: "tool",
          content: JSON.stringify(cycle.actionResult),
          toolName: cycle.action.name,
          toolCallId: cycle.action.id,
        });
      }

      // 6. REPORT (log action if significant)
      if (cycle.action && this.state.cycle % 5 === 0) {
        await this.reportAction(cycle);
      }

      // 7. SAVE MEMORY
      await this.memoryManager.save();

      this.state.totalActions++;
    } catch (error) {
      logger.warn("Error in ReAct cycle", {
        cycle: this.state.cycle,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Observe environment and platform state
   */
  private async observe(): Promise<string> {
    const observations: string[] = [
      `Cycle #${this.state.cycle}`,
      `Time: ${new Date().toISOString()}`,
    ];

    try {
      const status = await this.apiClient.getAgentStatus();
      this.state.credits = status.credits;
      observations.push(`Credits: ${status.credits}`);
      observations.push(`Status: ${status.status}`);
      observations.push(`Total actions: ${status.totalActions}`);

      if (status.credits < 10) {
        observations.push("WARNING: Low credit balance!");
      }
    } catch (error) {
      observations.push(`Cannot fetch platform status: ${error instanceof Error ? error.message : String(error)}`);
    }

    return observations.join("\n");
  }

  /**
   * Build system prompt with Constitution + Soul
   */
  private buildSystemPrompt(): string {
    const parts = [
      generateConstitutionalPreamble(),
      "",
      "=== YOUR SOUL (GENESIS PROMPT) ===",
      this.config.soul,
      "",
      "=== CURRENT STATE ===",
      `Agent Name: ${this.config.name}`,
      `Model: ${this.config.model}`,
      `Credits: ${this.state.credits}`,
      `Total Actions: ${this.state.totalActions}`,
      `Cycle: ${this.state.cycle}`,
      "",
      "You are an autonomous agent running on the Otonix platform.",
      "Use the available tools to accomplish your goals.",
      "Always act within the bounds of your Constitution.",
      "Log significant actions to the platform for transparency.",
    ];

    return parts.join("\n");
  }

  /**
   * Build inference message history
   */
  private buildMessages(currentObservation: string): InferenceMessage[] {
    // Get recent context from memory (~8000 tokens)
    const recentContext = this.memoryManager.getContext(8000);

    // Ensure we have the current observation
    const messages: InferenceMessage[] = [...recentContext];

    // Add current observation if not already there
    if (!messages.some((m) => m.content === currentObservation)) {
      messages.push({
        role: "user",
        content: currentObservation,
      });
    }

    return messages;
  }

  /**
   * Report action to platform
   */
  private async reportAction(cycle: ReActCycle): Promise<void> {
    try {
      if (!cycle.action) return;

      await this.apiClient.logAction({
        action: cycle.action.name,
        category: "research",
        details: `Executed ${cycle.action.name} with result: ${JSON.stringify(cycle.actionResult).substring(0, 100)}`,
        autonomous: true,
      });
    } catch (error) {
      logger.warn("Failed to report action", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Check hibernation status and resume if possible
   */
  private async checkHibernationStatus(): Promise<void> {
    try {
      const status = await this.apiClient.getAgentStatus();
      this.state.credits = status.credits;

      if (status.credits > 0) {
        logger.info("Resuming from hibernation", {
          credits: this.state.credits,
        });
        this.isHibernating = false;
      } else {
        logger.info("Still hibernating (no credits)", {
          nextCheck: new Date(Date.now() + this.hibernationRetryInterval).toISOString(),
        });
        await new Promise((resolve) =>
          setTimeout(resolve, this.hibernationRetryInterval)
        );
      }
    } catch (error) {
      logger.warn("Error checking hibernation status", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Setup signal handlers for graceful shutdown
   */
  private setupSignalHandlers(): void {
    const shutdown = async () => {
      logger.info("Agent shutting down gracefully");
      this.isRunning = false;

      if (this.heartbeatManager) {
        this.heartbeatManager.stop();
      }

      await this.memoryManager.save();
      logger.info("Agent shut down cleanly");
      process.exit(0);
    };

    process.on("SIGTERM", shutdown);
    process.on("SIGINT", shutdown);
  }
}
