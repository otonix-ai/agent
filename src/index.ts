#!/usr/bin/env node

/**
 * CLI Entry Point
 * Otonix Agent CLI interface
 */

import { Command } from "commander";
import { OtonixAgent } from "./agent.js";
import { configLoader } from "./config.js";
import { logger } from "./logger.js";
import { OtonixApiClient } from "./api.js";
import fs from "fs/promises";
import path from "path";

const packageJson = {
  version: "0.1.0",
  name: "otonix-agent",
};

const program = new Command();

program
  .name("otonix-agent")
  .description("Autonomous AI agent runtime for the Otonix sovereign compute platform")
  .version(packageJson.version);

/**
 * Main run command
 */
program
  .command("run")
  .description("Start the agent (main command)")
  .option("-c, --config <path>", "Path to genesis.json config file", "genesis.json")
  .action(async (options) => {
    try {
      logger.info("Otonix Agent starting", {
        version: packageJson.version,
        configPath: options.config,
      });

      // Load config
      const config = await configLoader.loadGenesisConfig(options.config);

      // Load soul
      const soulPath = config.soul;
      const soul = await configLoader.loadSoul(soulPath);

      // Get API key
      const apiKey = process.env[config.platform.api_key_env];
      if (!apiKey) {
        throw new Error(
          `Missing environment variable: ${config.platform.api_key_env}`
        );
      }

      // Create and start agent
      const agent = new OtonixAgent({ ...config, soul }, apiKey);
      await agent.start();
    } catch (error) {
      logger.error("Failed to start agent", {
        error: error instanceof Error ? error.message : String(error),
      });
      process.exit(1);
    }
  });

/**
 * Status command
 */
program
  .command("status")
  .description("Check agent status on the platform")
  .option("-a, --agent-id <id>", "Agent ID (if not set, use config)")
  .option("-c, --config <path>", "Path to genesis.json config file", "genesis.json")
  .action(async (options) => {
    try {
      const config = await configLoader.loadGenesisConfig(options.config);

      const apiKey = process.env[config.platform.api_key_env];
      if (!apiKey) {
        throw new Error(
          `Missing environment variable: ${config.platform.api_key_env}`
        );
      }

      const apiClient = new OtonixApiClient(config.platform.url, apiKey);

      if (options.agentId) {
        apiClient.setAgentId(options.agentId);
      }

      const status = await apiClient.getAgentStatus();

      console.log("\n=== AGENT STATUS ===");
      console.log(`Name: ${status.name}`);
      console.log(`ID: ${status.id}`);
      console.log(`Status: ${status.status}`);
      console.log(`Model: ${status.model}`);
      console.log(`Credits: ${status.credits}`);
      console.log(`Survival Tier: ${status.survivalTier}`);
      console.log(`Total Actions: ${status.totalActions}`);
      console.log(`Last Heartbeat: ${status.lastHeartbeat}`);
      console.log(`Created: ${status.createdAt}`);
      console.log("");
    } catch (error) {
      logger.error("Failed to get status", {
        error: error instanceof Error ? error.message : String(error),
      });
      process.exit(1);
    }
  });

/**
 * Validate command
 */
program
  .command("validate")
  .description("Validate config without starting")
  .option("-c, --config <path>", "Path to genesis.json config file", "genesis.json")
  .action(async (options) => {
    try {
      logger.info("Validating configuration", { configPath: options.config });

      const config = await configLoader.loadGenesisConfig(options.config);
      const soul = await configLoader.loadSoul(config.soul);

      console.log("\n=== CONFIG VALIDATION ===");
      console.log(`✓ Config file: ${options.config}`);
      console.log(`✓ Agent name: ${config.name}`);
      console.log(`✓ Model: ${config.model}`);
      console.log(`✓ Soul file: ${config.soul}`);
      console.log(`✓ Soul size: ${soul.length} bytes`);
      console.log(`✓ Tools: ${config.tools.join(", ")}`);
      console.log(`✓ Platform: ${config.platform.url}`);
      console.log(`✓ Inference provider: ${config.inference.provider}`);
      console.log(`✓ All required fields present`);
      console.log("");

      logger.info("Configuration is valid");
    } catch (error) {
      logger.error("Configuration validation failed", {
        error: error instanceof Error ? error.message : String(error),
      });
      process.exit(1);
    }
  });

/**
 * Send command (queue message to agent)
 */
program
  .command("send <message>")
  .description("Send a message/instruction to the agent's context")
  .option("-c, --config <path>", "Path to genesis.json config file", "genesis.json")
  .action(async (message, options) => {
    try {
      const config = await configLoader.loadGenesisConfig(options.config);
      const memoryDir = path.join(process.cwd(), ".otonix");
      const memoryFile = path.join(memoryDir, "memory.json");

      // Load existing memory
      let memory = { messages: [] as unknown[] };
      try {
        const content = await fs.readFile(memoryFile, "utf-8");
        memory = JSON.parse(content);
      } catch {
        // Memory file doesn't exist, start fresh
      }

      // Add message
      if (!Array.isArray(memory.messages)) {
        memory.messages = [];
      }

      memory.messages.push({
        role: "user",
        content: message,
      });

      // Save memory
      await fs.mkdir(memoryDir, { recursive: true });
      await fs.writeFile(memoryFile, JSON.stringify(memory, null, 2));

      console.log("✓ Message queued to agent context");
      logger.info("Message queued", { agentName: config.name });
    } catch (error) {
      logger.error("Failed to queue message", {
        error: error instanceof Error ? error.message : String(error),
      });
      process.exit(1);
    }
  });

/**
 * Version command
 */
program
  .command("version")
  .description("Show version")
  .action(() => {
    console.log(packageJson.version);
  });

program.parse(process.argv);

// Show help if no command
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
