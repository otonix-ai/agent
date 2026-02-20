/**
 * Memory Manager
 * Maintains conversation history and persists to disk
 */

import fs from "fs/promises";
import path from "path";
import { InferenceMessage, MemoryManager } from "./types.js";
import { logger } from "./logger.js";

export class LocalMemoryManager implements MemoryManager {
  private messages: InferenceMessage[] = [];
  private maxMessages: number = 100;
  private memoryDir: string;
  private memoryFile: string;

  constructor(workingDir?: string) {
    this.memoryDir = path.join(workingDir || process.cwd(), ".otonix");
    this.memoryFile = path.join(this.memoryDir, "memory.json");
  }

  /**
   * Add a message to memory
   */
  addMessage(msg: InferenceMessage): void {
    this.messages.push(msg);

    // Keep only the most recent messages (sliding window)
    if (this.messages.length > this.maxMessages) {
      this.messages = this.messages.slice(-this.maxMessages);
    }

    logger.debug("Message added to memory", {
      role: msg.role,
      toolName: msg.toolName,
      messageCount: this.messages.length,
    });
  }

  /**
   * Get context window of messages up to maxTokens
   * This is a simplified implementation; in production, you'd actually count tokens
   */
  getContext(maxTokens: number): InferenceMessage[] {
    // Simple heuristic: assume ~4 characters = 1 token
    let tokenCount = 0;
    const context: InferenceMessage[] = [];

    // Go backwards and collect messages until we hit the token limit
    for (let i = this.messages.length - 1; i >= 0; i--) {
      const msg = this.messages[i];
      const estimatedTokens = Math.ceil(msg.content.length / 4);

      if (tokenCount + estimatedTokens > maxTokens) {
        break;
      }

      context.unshift(msg);
      tokenCount += estimatedTokens;
    }

    logger.debug("Context window generated", {
      messageCount: context.length,
      estimatedTokens: tokenCount,
    });

    return context;
  }

  /**
   * Save memory to disk
   */
  async save(): Promise<void> {
    try {
      await fs.mkdir(this.memoryDir, { recursive: true });

      const data = {
        version: 1,
        timestamp: new Date().toISOString(),
        messages: this.messages,
      };

      await fs.writeFile(this.memoryFile, JSON.stringify(data, null, 2));

      logger.debug("Memory saved to disk", {
        messageCount: this.messages.length,
        path: this.memoryFile,
      });
    } catch (error) {
      logger.warn("Failed to save memory", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Load memory from disk
   */
  async load(): Promise<void> {
    try {
      const content = await fs.readFile(this.memoryFile, "utf-8");
      const data = JSON.parse(content) as {
        messages: InferenceMessage[];
      };

      this.messages = data.messages || [];

      logger.debug("Memory loaded from disk", {
        messageCount: this.messages.length,
        path: this.memoryFile,
      });
    } catch (error) {
      // File doesn't exist or is invalid, start fresh
      logger.debug("Memory file not found or invalid, starting fresh", {
        path: this.memoryFile,
      });
      this.messages = [];
    }
  }

  /**
   * Clear all messages
   */
  clear(): void {
    this.messages = [];
    logger.debug("Memory cleared");
  }

  /**
   * Get all messages (for debugging)
   */
  getAllMessages(): InferenceMessage[] {
    return [...this.messages];
  }

  /**
   * Get memory statistics
   */
  getStats(): {
    messageCount: number;
    byRole: Record<string, number>;
  } {
    const byRole: Record<string, number> = {};

    for (const msg of this.messages) {
      byRole[msg.role] = (byRole[msg.role] || 0) + 1;
    }

    return {
      messageCount: this.messages.length,
      byRole,
    };
  }
}
