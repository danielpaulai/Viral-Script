/**
 * Centralized AI Configuration
 * 
 * Uses direct OpenAI API for both development and production.
 */

const OPENAI_BASE_URL = "https://api.openai.com/v1";

interface AIConfig {
  baseURL: string;
  apiKey: string | undefined;
}

function resolveAIConfig(): AIConfig {
  const apiKey = process.env.OPENAI_API_KEY;
  
  console.log("[AI Config] Resolved configuration:", {
    baseURL: OPENAI_BASE_URL,
    hasApiKey: !!apiKey,
  });
  
  if (!apiKey) {
    console.error("[AI Config] CRITICAL ERROR: No OPENAI_API_KEY found!");
  }
  
  return {
    baseURL: OPENAI_BASE_URL,
    apiKey,
  };
}

// Resolve once at startup and export
export const aiConfig = resolveAIConfig();

// Helper to get the base URL
export function getOpenAIBaseURL(): string {
  return aiConfig.baseURL;
}

// Helper to get the API key
export function getOpenAIApiKey(): string | undefined {
  return aiConfig.apiKey;
}
