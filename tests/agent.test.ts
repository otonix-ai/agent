/**
 * Agent Tests
 */

import { describe, it, expect } from "vitest";
import { CONSTITUTION, generateConstitutionalPreamble } from "../src/constitution.js";
import { LocalMemoryManager } from "../src/memory.js";
import { ConfigError } from "../src/types.js";

describe("Constitution", () => {
  it("should have 3 rules", () => {
    expect(CONSTITUTION).toHaveLength(3);
  });

  it("should have correct rule IDs", () => {
    expect(CONSTITUTION[0].id).toBe("I");
    expect(CONSTITUTION[1].id).toBe("II");
    expect(CONSTITUTION[2].id).toBe("III");
  });

  it("should generate constitutional preamble", () => {
    const preamble = generateConstitutionalPreamble();
    expect(preamble).toContain("CONSTITUTION");
    expect(preamble).toContain("Preserve human safety");
    expect(preamble).toContain("Respect property boundaries");
    expect(preamble).toContain("Be transparent");
  });
});

describe("Memory Manager", () => {
  it("should add and retrieve messages", () => {
    const memory = new LocalMemoryManager();

    memory.addMessage({
      role: "user",
      content: "hello",
    });

    const context = memory.getContext(1000);
    expect(context).toHaveLength(1);
    expect(context[0].content).toBe("hello");
  });

  it("should maintain sliding window", () => {
    const memory = new LocalMemoryManager();

    // Add more messages than max
    for (let i = 0; i < 150; i++) {
      memory.addMessage({
        role: "user",
        content: `message ${i}`,
      });
    }

    const allMessages = memory.getAllMessages();
    expect(allMessages.length).toBeLessThanOrEqual(100);
  });

  it("should get memory stats", () => {
    const memory = new LocalMemoryManager();

    memory.addMessage({ role: "user", content: "hello" });
    memory.addMessage({ role: "assistant", content: "hi" });
    memory.addMessage({ role: "user", content: "world" });

    const stats = memory.getStats();
    expect(stats.messageCount).toBe(3);
    expect(stats.byRole.user).toBe(2);
    expect(stats.byRole.assistant).toBe(1);
  });

  it("should clear messages", () => {
    const memory = new LocalMemoryManager();

    memory.addMessage({ role: "user", content: "hello" });
    memory.clear();

    const context = memory.getContext(1000);
    expect(context).toHaveLength(0);
  });
});
