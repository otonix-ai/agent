/**
 * Files Tool
 * Read, write, and list files
 */

import fs from "fs/promises";
import path from "path";
import {
  ReadFileInput,
  WriteFileInput,
  ListFilesInput,
  FileListOutput,
  ToolExecutionError,
} from "../types.js";
import { logger } from "../logger.js";

const MAX_FILE_SIZE = 1024 * 1024; // 1MB default
const WORKING_DIR = process.cwd();

/**
 * Safely resolve a file path within the working directory
 */
function resolvePath(filePath: string): string {
  const resolved = path.resolve(WORKING_DIR, filePath);
  const normalized = path.normalize(resolved);

  // Ensure path is within working directory
  if (!normalized.startsWith(WORKING_DIR)) {
    throw new ToolExecutionError(
      "files",
      `Access denied: path outside working directory: ${filePath}`
    );
  }

  return normalized;
}

/**
 * Read a file
 */
export async function readFile(
  input: ReadFileInput,
  maxFileSize?: number
): Promise<string> {
  const maxSize = maxFileSize || MAX_FILE_SIZE;
  const resolvedPath = resolvePath(input.path);

  logger.debug("Reading file", { path: input.path });

  try {
    const stat = await fs.stat(resolvedPath);

    if (stat.isDirectory()) {
      throw new ToolExecutionError(
        "files",
        `Path is a directory, not a file: ${input.path}`
      );
    }

    if (stat.size > maxSize) {
      throw new ToolExecutionError(
        "files",
        `File too large: ${stat.size} bytes (max: ${maxSize})`
      );
    }

    const content = await fs.readFile(resolvedPath, "utf-8");

    logger.debug("File read successfully", {
      path: input.path,
      size: content.length,
    });

    return content;
  } catch (error) {
    if (error instanceof ToolExecutionError) {
      throw error;
    }

    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      throw new ToolExecutionError(
        "files",
        `File not found: ${input.path}`
      );
    }

    throw new ToolExecutionError(
      "files",
      `Failed to read file: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Write a file
 */
export async function writeFile(input: WriteFileInput, maxFileSize?: number): Promise<void> {
  const maxSize = maxFileSize || MAX_FILE_SIZE;
  const resolvedPath = resolvePath(input.path);

  if (input.content.length > maxSize) {
    throw new ToolExecutionError(
      "files",
      `Content too large: ${input.content.length} bytes (max: ${maxSize})`
    );
  }

  logger.debug("Writing file", {
    path: input.path,
    size: input.content.length,
  });

  try {
    // Create parent directory if needed
    const dir = path.dirname(resolvedPath);
    await fs.mkdir(dir, { recursive: true });

    await fs.writeFile(resolvedPath, input.content, "utf-8");

    logger.debug("File written successfully", { path: input.path });
  } catch (error) {
    throw new ToolExecutionError(
      "files",
      `Failed to write file: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * List files in a directory
 */
export async function listFiles(input: ListFilesInput): Promise<FileListOutput> {
  const resolvedPath = resolvePath(input.directory);

  logger.debug("Listing directory", { path: input.directory });

  try {
    const stat = await fs.stat(resolvedPath);

    if (!stat.isDirectory()) {
      throw new ToolExecutionError(
        "files",
        `Path is not a directory: ${input.directory}`
      );
    }

    const entries = await fs.readdir(resolvedPath, { withFileTypes: true });

    const files = await Promise.all(
      entries.map(async (entry) => {
        const entryPath = path.join(resolvedPath, entry.name);

        try {
          const stat = await fs.stat(entryPath);
          return {
            name: entry.name,
            path: path.relative(WORKING_DIR, entryPath),
            isDirectory: entry.isDirectory(),
            size: entry.isDirectory() ? undefined : stat.size,
          };
        } catch (error) {
          logger.warn("Failed to stat file", {
            path: entry.name,
            error: error instanceof Error ? error.message : String(error),
          });
          return {
            name: entry.name,
            path: path.relative(WORKING_DIR, entryPath),
            isDirectory: entry.isDirectory(),
          };
        }
      })
    );

    logger.debug("Directory listed successfully", {
      path: input.directory,
      count: files.length,
    });

    return { files };
  } catch (error) {
    if (error instanceof ToolExecutionError) {
      throw error;
    }

    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      throw new ToolExecutionError(
        "files",
        `Directory not found: ${input.directory}`
      );
    }

    throw new ToolExecutionError(
      "files",
      `Failed to list directory: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export const fileReadTool = {
  name: "file_read",
  description: "Read the contents of a file",
  inputSchema: {
    type: "object" as const,
    properties: {
      path: {
        type: "string" as const,
        description: "Path to the file to read",
      },
    },
    required: ["path"],
  },
};

export const fileWriteTool = {
  name: "file_write",
  description: "Write content to a file",
  inputSchema: {
    type: "object" as const,
    properties: {
      path: {
        type: "string" as const,
        description: "Path to the file to write",
      },
      content: {
        type: "string" as const,
        description: "Content to write",
      },
    },
    required: ["path", "content"],
  },
};

export const fileListTool = {
  name: "file_list",
  description: "List files in a directory",
  inputSchema: {
    type: "object" as const,
    properties: {
      directory: {
        type: "string" as const,
        description: "Path to the directory",
      },
    },
    required: ["directory"],
  },
};
