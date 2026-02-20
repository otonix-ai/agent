/**
 * Configuration loader
 * Loads genesis.json and SOUL.md files
 */

import fs from "fs/promises";
import path from "path";
import { GenesisConfig, ConfigError } from "./types.js";
import { logger } from "./logger.js";

export class ConfigLoader {
  /**
   * Load genesis.json from the specified path
   */
  async loadGenesisConfig(configPath: string): Promise<GenesisConfig> {
    try {
      const absPath = path.resolve(configPath);
      logger.debug("Loading genesis config", { path: absPath });

      const content = await fs.readFile(absPath, "utf-8");
      const config = JSON.parse(content) as GenesisConfig;

      // Validate required fields
      this.validateConfig(config);

      logger.debug("Genesis config loaded successfully", { name: config.name });
      return config;
    } catch (error) {
      if (error instanceof ConfigError) {
        throw error;
      }
      throw new ConfigError(
        `Failed to load genesis config: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Load SOUL.md file contents
   */
  async loadSoul(soulPath: string): Promise<string> {
    try {
      const absPath = path.resolve(soulPath);
      logger.debug("Loading soul file", { path: absPath });

      const content = await fs.readFile(absPath, "utf-8");

      logger.debug("Soul file loaded successfully", {
        size: content.length,
      });

      return content;
    } catch (error) {
      throw new ConfigError(
        `Failed to load soul file: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Validate genesis config structure
   */
  private validateConfig(config: unknown): void {
    if (!config || typeof config !== "object") {
      throw new ConfigError("Genesis config must be a JSON object");
    }

    const cfg = config as Record<string, unknown>;

    const required = [
      "name",
      "model",
      "heartbeat_interval",
      "soul",
      "tools",
      "platform",
      "inference",
      "limits",
    ];

    for (const field of required) {
      if (!(field in cfg)) {
        throw new ConfigError(`Missing required field: ${field}`);
      }
    }

    // Validate nested objects
    if (typeof cfg.platform !== "object" || !cfg.platform) {
      throw new ConfigError("platform must be an object");
    }

    const platform = cfg.platform as Record<string, unknown>;
    if (!platform.url || !platform.api_key_env) {
      throw new ConfigError("platform must have url and api_key_env");
    }

    if (typeof cfg.inference !== "object" || !cfg.inference) {
      throw new ConfigError("inference must be an object");
    }

    const inference = cfg.inference as Record<string, unknown>;
    if (!inference.provider || !inference.api_key_env) {
      throw new ConfigError("inference must have provider and api_key_env");
    }

    if (!Array.isArray(cfg.tools)) {
      throw new ConfigError("tools must be an array");
    }

    if (typeof cfg.limits !== "object" || !cfg.limits) {
      throw new ConfigError("limits must be an object");
    }
  }
}

export const configLoader = new ConfigLoader();
