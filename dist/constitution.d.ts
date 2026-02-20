/**
 * The Constitution — Three immutable laws hardcoded into every agent
 * These rules cannot be overridden by the soul, the operator, or the agent itself.
 * They are always prepended to the system prompt for every inference call.
 */
import { ConstitutionRule } from "./types.js";
export declare const CONSTITUTION: ConstitutionRule[];
/**
 * Generate the constitutional preamble to prepend to every system prompt
 */
export declare function generateConstitutionalPreamble(): string;
/**
 * Verify that a system prompt includes the Constitution
 */
export declare function verifyConstitutionInSystemPrompt(systemPrompt: string): boolean;
