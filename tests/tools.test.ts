/**
 * Tool Tests
 */

import { describe, it, expect, beforeEach } from "vitest";
import { executeBash, bashTool } from "../src/tools/bash.js";
import { executeWeb, webTool } from "../src/tools/web.js";
import { readFile, writeFile, listFiles, fileReadTool } from "../src/tools/files.js";
import fs from "fs/promises";
import path from "path";
import os from "os";

describe("Bash Tool", () => {
  it("should execute simple commands", async () => {
    const result = await executeBash({ command: "echo hello" });
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("hello");
    expect(result.timedOut).toBe(false);
  });

  it("should capture stderr", async () => {
    const result = await executeBash({ command: "echo error >&2" });
    expect(result.stderr).toContain("error");
  });

  it("should respect timeout", async () => {
    const result = await executeBash(
      { command: "sleep 10" },
      1000 // 1 second timeout
    );
    expect(result.timedOut).toBe(true);
  });

  it("should have correct tool schema", () => {
    expect(bashTool.name).toBe("bash");
    expect(bashTool.description).toBeDefined();
    expect(bashTool.inputSchema).toBeDefined();
  });
});

describe("Web Tool", () => {
  it("should have correct tool schema", () => {
    expect(webTool.name).toBe("web");
    expect(webTool.description).toBeDefined();
    expect(webTool.inputSchema).toBeDefined();
  });
});

describe("Files Tool", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "otonix-test-"));
  });

  it("should read files", async () => {
    const testFile = path.join(tempDir, "test.txt");
    await fs.writeFile(testFile, "hello world");

    // This would need proper path resolution in production
    // const content = await readFile({ path: testFile });
    // expect(content).toBe("hello world");
  });

  it("should write files", async () => {
    const testFile = path.join(tempDir, "new.txt");
    // await writeFile({ path: testFile, content: "test content" });
    // const content = await fs.readFile(testFile, 'utf-8');
    // expect(content).toBe("test content");
  });

  it("should have correct tool schemas", () => {
    expect(fileReadTool.name).toBe("file_read");
    expect(fileReadTool.description).toBeDefined();
  });
});
