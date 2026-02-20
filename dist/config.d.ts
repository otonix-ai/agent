/**
 * Configuration loader
 * Loads genesis.json and SOUL.md files
 */
import { GenesisConfig } from "./types.js";
export declare class ConfigLoader {
    /**
     * Load genesis.json from the specified path
     */
    loadGenesisConfig(configPath: string): Promise<GenesisConfig>;
    /**
     * Load SOUL.md file contents
     */
    loadSoul(soulPath: string): Promise<string>;
    /**
     * Validate genesis config structure
     */
    private validateConfig;
}
export declare const configLoader: ConfigLoader;
