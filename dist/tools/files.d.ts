/**
 * Files Tool
 * Read, write, and list files
 */
import { ReadFileInput, WriteFileInput, ListFilesInput, FileListOutput } from "../types.js";
/**
 * Read a file
 */
export declare function readFile(input: ReadFileInput, maxFileSize?: number): Promise<string>;
/**
 * Write a file
 */
export declare function writeFile(input: WriteFileInput, maxFileSize?: number): Promise<void>;
/**
 * List files in a directory
 */
export declare function listFiles(input: ListFilesInput): Promise<FileListOutput>;
export declare const fileReadTool: {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            path: {
                type: "string";
                description: string;
            };
        };
        required: string[];
    };
};
export declare const fileWriteTool: {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            path: {
                type: "string";
                description: string;
            };
            content: {
                type: "string";
                description: string;
            };
        };
        required: string[];
    };
};
export declare const fileListTool: {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            directory: {
                type: "string";
                description: string;
            };
        };
        required: string[];
    };
};
