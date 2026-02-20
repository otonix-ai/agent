/**
 * Otonix Tool
 * Query the Otonix platform from within the agent's reasoning loop
 */

import {
  OtonixCheckCreditsInput,
  OtonixCheckStatusInput,
  OtonixLogActionInput,
  ToolExecutionError,
  AgentStatusResponse,
  ActionLogResponse,
} from "../types.js";
import { OtonixApiClient } from "../api.js";
import { logger } from "../logger.js";

let apiClient: OtonixApiClient | undefined;

/**
 * Initialize the Otonix tool with an API client
 */
export function initializeOtonixTool(client: OtonixApiClient): void {
  apiClient = client;
}

/**
 * Check current credit balance
 */
export async function checkCredits(
  _input: OtonixCheckCreditsInput
): Promise<{ credits: number; tier: string }> {
  if (!apiClient) {
    throw new ToolExecutionError(
      "otonix",
      "Otonix API client not initialized"
    );
  }

  try {
    logger.debug("Checking agent credits");

    const status = await apiClient.getAgentStatus();

    logger.debug("Credits checked", {
      credits: status.credits,
      tier: status.survivalTier,
    });

    return {
      credits: status.credits,
      tier: status.survivalTier,
    };
  } catch (error) {
    throw new ToolExecutionError(
      "otonix",
      `Failed to check credits: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Check agent status on the platform
 */
export async function checkStatus(
  _input: OtonixCheckStatusInput
): Promise<AgentStatusResponse> {
  if (!apiClient) {
    throw new ToolExecutionError(
      "otonix",
      "Otonix API client not initialized"
    );
  }

  try {
    logger.debug("Checking agent status");

    const status = await apiClient.getAgentStatus();

    logger.debug("Status checked", {
      status: status.status,
      credits: status.credits,
    });

    return status;
  } catch (error) {
    throw new ToolExecutionError(
      "otonix",
      `Failed to check status: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Log an action to the platform
 */
export async function logAction(
  input: OtonixLogActionInput
): Promise<ActionLogResponse> {
  if (!apiClient) {
    throw new ToolExecutionError(
      "otonix",
      "Otonix API client not initialized"
    );
  }

  try {
    logger.debug("Logging action to platform", {
      action: input.action,
      category: input.category,
    });

    const response = await apiClient.logAction({
      action: input.action,
      category: input.category,
      details: input.details,
      autonomous: true,
    });

    logger.debug("Action logged successfully", {
      actionId: response.id,
    });

    return response;
  } catch (error) {
    throw new ToolExecutionError(
      "otonix",
      `Failed to log action: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export const checkCreditsTool = {
  name: "check_credits",
  description: "Check current credit balance and survival tier",
  inputSchema: {
    type: "object" as const,
    properties: {},
    required: [],
  },
};

export const checkStatusTool = {
  name: "check_status",
  description: "Check agent status on the Otonix platform",
  inputSchema: {
    type: "object" as const,
    properties: {},
    required: [],
  },
};

export const logActionTool = {
  name: "log_action",
  description: "Log an action to the Otonix platform",
  inputSchema: {
    type: "object" as const,
    properties: {
      action: {
        type: "string" as const,
        description: "Description of the action performed",
      },
      category: {
        type: "string" as const,
        enum: ["system", "research", "trade", "survival", "communication"],
        description: "Category of the action",
      },
      details: {
        type: "string" as const,
        description: "Additional details about the action (optional)",
      },
    },
    required: ["action", "category"],
  },
};
