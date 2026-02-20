#!/usr/bin/env node
"use strict";
/**
 * CLI Entry Point
 * Otonix Agent CLI interface
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const agent_js_1 = require("./agent.js");
const config_js_1 = require("./config.js");
const logger_js_1 = require("./logger.js");
const api_js_1 = require("./api.js");
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const packageJson = {
    version: "0.1.0",
    name: "otonix-agent",
};
const program = new commander_1.Command();
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
        logger_js_1.logger.info("Otonix Agent starting", {
            version: packageJson.version,
            configPath: options.config,
        });
        // Load config
        const config = await config_js_1.configLoader.loadGenesisConfig(options.config);
        // Load soul
        const soulPath = config.soul;
        const soul = await config_js_1.configLoader.loadSoul(soulPath);
        // Get API key
        const apiKey = process.env[config.platform.api_key_env];
        if (!apiKey) {
            throw new Error(`Missing environment variable: ${config.platform.api_key_env}`);
        }
        // Create and start agent
        const agent = new agent_js_1.OtonixAgent({ ...config, soul }, apiKey);
        await agent.start();
    }
    catch (error) {
        logger_js_1.logger.error("Failed to start agent", {
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
        const config = await config_js_1.configLoader.loadGenesisConfig(options.config);
        const apiKey = process.env[config.platform.api_key_env];
        if (!apiKey) {
            throw new Error(`Missing environment variable: ${config.platform.api_key_env}`);
        }
        const apiClient = new api_js_1.OtonixApiClient(config.platform.url, apiKey);
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
    }
    catch (error) {
        logger_js_1.logger.error("Failed to get status", {
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
        logger_js_1.logger.info("Validating configuration", { configPath: options.config });
        const config = await config_js_1.configLoader.loadGenesisConfig(options.config);
        const soul = await config_js_1.configLoader.loadSoul(config.soul);
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
        logger_js_1.logger.info("Configuration is valid");
    }
    catch (error) {
        logger_js_1.logger.error("Configuration validation failed", {
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
        const config = await config_js_1.configLoader.loadGenesisConfig(options.config);
        const memoryDir = path_1.default.join(process.cwd(), ".otonix");
        const memoryFile = path_1.default.join(memoryDir, "memory.json");
        // Load existing memory
        let memory = { messages: [] };
        try {
            const content = await promises_1.default.readFile(memoryFile, "utf-8");
            memory = JSON.parse(content);
        }
        catch {
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
        await promises_1.default.mkdir(memoryDir, { recursive: true });
        await promises_1.default.writeFile(memoryFile, JSON.stringify(memory, null, 2));
        console.log("✓ Message queued to agent context");
        logger_js_1.logger.info("Message queued", { agentName: config.name });
    }
    catch (error) {
        logger_js_1.logger.error("Failed to queue message", {
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
//# sourceMappingURL=index.js.map