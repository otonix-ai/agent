/**
 * Bash Tool
 * Executes shell commands on the VPS
 */

import { exec } from "child_process";
import { promisify } from "util";
import {
  BashToolInput,
  BashToolOutput,
  ToolExecutionError,
} from "../types.js";
import { logger } from "../logger.js";

const execAsync = promisify(exec);

export async function executeBash(
  input: BashToolInput,
  maxTimeoutMs: number = 30000
): Promise<BashToolOutput> {
  const timeout = Math.min(input.timeout_ms || maxTimeoutMs, maxTimeoutMs);

  logger.debug("Executing bash command", {
    command: input.command,
    cwd: input.cwd,
    timeout,
  });

  try {
    const result = await execAsync(input.command, {
      cwd: input.cwd || process.cwd(),
      timeout,
      maxBuffer: 10 * 1024 * 1024, // 10MB max buffer
    });

    const output: BashToolOutput = {
      stdout: result.stdout,
      stderr: result.stderr,
      exitCode: 0,
      timedOut: false,
    };

    logger.debug("Bash command executed successfully", {
      exitCode: output.exitCode,
      stdoutLength: output.stdout.length,
      stderrLength: output.stderr.length,
    });

    return output;
  } catch (error) {
    if (error instanceof Error) {
      // Check for timeout
      if (error.message.includes("timed out")) {
        const output: BashToolOutput = {
          stdout: "",
          stderr: `Command timed out after ${timeout}ms`,
          exitCode: 124,
          timedOut: true,
        };

        logger.warn("Bash command timed out", {
          command: input.command,
          timeout,
        });

        return output;
      }

      // Handle exec errors
      if ("code" in error && "stdout" in error && "stderr" in error) {
        const output: BashToolOutput = {
          stdout: (error.stdout as string) || "",
          stderr: (error.stderr as string) || error.message,
          exitCode: (error.code as number) || 1,
          timedOut: false,
        };

        logger.debug("Bash command failed", {
          exitCode: output.exitCode,
          command: input.command,
        });

        return output;
      }

      throw new ToolExecutionError(
        "bash",
        `Failed to execute bash command: ${error.message}`
      );
    }

    throw new ToolExecutionError(
      "bash",
      `Failed to execute bash command: ${String(error)}`
    );
  }
}

export const bashTool = {
  name: "bash",
  description: "Execute shell commands on the VPS",
  inputSchema: {
    type: "object" as const,
    properties: {
      command: {
        type: "string" as const,
        description: "The shell command to execute",
      },
      timeout_ms: {
        type: "number" as const,
        description: "Timeout in milliseconds (optional)",
      },
      cwd: {
        type: "string" as const,
        description: "Working directory for the command (optional)",
      },
    },
    required: ["command"],
  },
};
