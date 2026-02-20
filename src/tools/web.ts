/**
 * Web Tool
 * Makes HTTP requests (GET and POST)
 */

import { request } from "undici";
import { WebToolInput, WebToolOutput, ToolExecutionError } from "../types.js";
import { logger } from "../logger.js";

const MAX_RESPONSE_SIZE = 50 * 1024; // 50KB

export async function executeWeb(input: WebToolInput): Promise<WebToolOutput> {
  const method = input.method || "GET";

  logger.debug("Making HTTP request", {
    url: input.url,
    method,
  });

  try {
    const url = new URL(input.url);
    const response = await request(input.url, {
      method,
      headers: {
        "User-Agent": "otonix-agent/0.1.0",
        ...input.headers,
      },
      body: input.body,
    });

    let bodyText = "";
    let truncated = false;

    // Read and truncate response body
    const chunks: string[] = [];
    for await (const chunk of response.body) {
      const str = chunk.toString();
      chunks.push(str);

      if (chunks.join("").length > MAX_RESPONSE_SIZE) {
        truncated = true;
        break;
      }
    }

    bodyText = chunks.join("").substring(0, MAX_RESPONSE_SIZE);

    const headers: Record<string, string> = {};
    if (response.headers) {
      for (const [key, value] of Object.entries(response.headers)) {
        headers[key] = String(value);
      }
    }

    const output: WebToolOutput = {
      status: response.statusCode,
      headers,
      body: truncated
        ? bodyText + `\n... (truncated at ${MAX_RESPONSE_SIZE} bytes)`
        : bodyText,
    };

    logger.debug("HTTP request completed", {
      url: input.url,
      status: output.status,
      bodySize: output.body.length,
    });

    return output;
  } catch (error) {
    throw new ToolExecutionError(
      "web",
      `HTTP request failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export const webTool = {
  name: "web",
  description: "Make HTTP requests (GET and POST)",
  inputSchema: {
    type: "object" as const,
    properties: {
      url: {
        type: "string" as const,
        description: "The URL to request",
      },
      method: {
        type: "string" as const,
        enum: ["GET", "POST"],
        description: "HTTP method (default: GET)",
      },
      headers: {
        type: "object" as const,
        description: "Optional HTTP headers",
      },
      body: {
        type: "string" as const,
        description: "Optional request body (for POST)",
      },
    },
    required: ["url"],
  },
};
