/**
 * Memory Manager
 * Maintains conversation history and persists to disk
 */
import { InferenceMessage, MemoryManager } from "./types.js";
export declare class LocalMemoryManager implements MemoryManager {
    private messages;
    private maxMessages;
    private memoryDir;
    private memoryFile;
    constructor(workingDir?: string);
    /**
     * Add a message to memory
     */
    addMessage(msg: InferenceMessage): void;
    /**
     * Get context window of messages up to maxTokens
     * This is a simplified implementation; in production, you'd actually count tokens
     */
    getContext(maxTokens: number): InferenceMessage[];
    /**
     * Save memory to disk
     */
    save(): Promise<void>;
    /**
     * Load memory from disk
     */
    load(): Promise<void>;
    /**
     * Clear all messages
     */
    clear(): void;
    /**
     * Get all messages (for debugging)
     */
    getAllMessages(): InferenceMessage[];
    /**
     * Get memory statistics
     */
    getStats(): {
        messageCount: number;
        byRole: Record<string, number>;
    };
}
