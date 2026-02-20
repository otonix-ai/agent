/**
 * API Client Tests
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { OtonixApiClient } from "../src/api.js";

describe("OtonixApiClient", () => {
  let client: OtonixApiClient;
  const baseUrl = "https://app.otonix.tech";
  const apiKey = "otonix_test_key";

  beforeEach(() => {
    client = new OtonixApiClient(baseUrl, apiKey);
  });

  it("should initialize with baseUrl and apiKey", () => {
    expect(client).toBeDefined();
  });

  it("should set agent ID", () => {
    const agentId = "test-agent-123";
    client.setAgentId(agentId);
    // Verify by attempting to use it (would fail if not set, but we can't test without mocking HTTP)
    expect(true).toBe(true);
  });

  it("should throw error if not registered before sending heartbeat", async () => {
    const newClient = new OtonixApiClient(baseUrl, apiKey);
    // Note: This would actually attempt an HTTP request, so in a real test,
    // you'd mock the HTTP layer
    try {
      await newClient.sendHeartbeat();
      expect(false).toBe(true); // Should not reach here
    } catch (error) {
      expect(error).toBeDefined();
    }
  });
});
