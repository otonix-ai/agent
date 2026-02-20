/**
 * Otonix Platform API Client
 * Handles registration, heartbeats, action logging, and status queries
 */

import { request as undiciFetch } from "undici";
import {
  RegisterRequest,
  RegisterResponse,
  HeartbeatResponse,
  ActionLogRequest,
  ActionLogResponse,
  AgentStatusResponse,
  APIError,
} from "./types.js";
import { logger } from "./logger.js";

export class OtonixApiClient {
  private baseUrl: string;
  private apiKey: string;
  private agentId?: string;

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl.replace(/\/$/, ""); // Remove trailing slash
    this.apiKey = apiKey;
  }

  setAgentId(id: string): void {
    this.agentId = id;
  }

  /**
   * Register a new agent with the Otonix platform
   */
  async registerAgent(
    req: RegisterRequest
  ): Promise<RegisterResponse> {
    try {
      logger.debug("Registering agent with Otonix platform", {
        name: req.name,
        model: req.model,
      });

      const url = new URL(this.baseUrl);
      const response = await undiciFetch(`${this.baseUrl}/api/agents/register`, {
        method: "POST",
        headers: {
          "X-API-Key": this.apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(req),
      });

      const body = await response.body.text();
      const data = JSON.parse(body) as RegisterResponse;

      if (response.statusCode !== 201) {
        throw new APIError(
          `Agent registration failed: ${body}`,
          response.statusCode
        );
      }

      this.agentId = data.agent.id;
      logger.info("Agent registered successfully", {
        agentId: data.agent.id,
        name: data.agent.name,
      });

      return data;
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      throw new APIError(
        `Registration failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Send a heartbeat to the Otonix platform
   */
  async sendHeartbeat(): Promise<HeartbeatResponse> {
    if (!this.agentId) {
      throw new APIError("Agent not registered: agentId is not set");
    }

    try {
      logger.debug("Sending heartbeat", { agentId: this.agentId });

      const response = await undiciFetch(
        `${this.baseUrl}/api/agents/${this.agentId}/heartbeat`,
        {
          method: "POST",
          headers: {
            "X-API-Key": this.apiKey,
          },
        }
      );

      const body = await response.body.text();
      const data = JSON.parse(body) as HeartbeatResponse;

      if (response.statusCode !== 200) {
        logger.warn("Heartbeat failed", {
          statusCode: response.statusCode,
          body,
        });
        throw new APIError(`Heartbeat failed: ${body}`, response.statusCode);
      }

      logger.debug("Heartbeat sent successfully", {
        agentId: this.agentId,
      });

      return data;
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      throw new APIError(
        `Heartbeat failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Log an action to the Otonix platform
   */
  async logAction(
    actionRequest: ActionLogRequest
  ): Promise<ActionLogResponse> {
    if (!this.agentId) {
      throw new APIError("Agent not registered: agentId is not set");
    }

    try {
      logger.debug("Logging action", {
        agentId: this.agentId,
        action: actionRequest.action,
        category: actionRequest.category,
      });

      const response = await undiciFetch(
        `${this.baseUrl}/api/agents/${this.agentId}/actions`,
        {
          method: "POST",
          headers: {
            "X-API-Key": this.apiKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(actionRequest),
        }
      );

      const body = await response.body.text();
      const data = JSON.parse(body) as ActionLogResponse;

      if (response.statusCode !== 201) {
        throw new APIError(`Action logging failed: ${body}`, response.statusCode);
      }

      logger.debug("Action logged successfully", {
        actionId: data.id,
      });

      return data;
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      throw new APIError(
        `Action logging failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get agent status from the Otonix platform
   */
  async getAgentStatus(): Promise<AgentStatusResponse> {
    if (!this.agentId) {
      throw new APIError("Agent not registered: agentId is not set");
    }

    try {
      logger.debug("Fetching agent status", { agentId: this.agentId });

      const response = await undiciFetch(
        `${this.baseUrl}/api/agents/${this.agentId}`,
        {
          method: "GET",
          headers: {
            "X-API-Key": this.apiKey,
          },
        }
      );

      const body = await response.body.text();
      const data = JSON.parse(body) as AgentStatusResponse;

      if (response.statusCode !== 200) {
        throw new APIError(`Failed to get agent status: ${body}`, response.statusCode);
      }

      logger.debug("Agent status retrieved", {
        agentId: this.agentId,
        status: data.status,
        credits: data.credits,
      });

      return data;
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      throw new APIError(
        `Failed to get agent status: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}

export { undiciFetch as request };
