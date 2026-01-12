/**
 * Centralized AI Configuration
 * 
 * PERMANENT FIX: This module ensures production ALWAYS uses the correct AI integrations URL.
 * 
 * Logic:
 * 1. Default to production URL (https://integrations.replit.com/api/openai/v1)
 * 2. Only use localhost if ALL of these are true:
 *    - REPLIT_DEV_DOMAIN is set (we're in a dev workspace, not a deployment)
 *    - NODE_ENV is "development" 
 *    - The base URL actually contains "localhost"
 * 3. Log clear warnings if configuration seems wrong
 */

const PRODUCTION_AI_URL = "https://integrations.replit.com/api/openai/v1";

interface AIConfig {
  baseURL: string;
  apiKey: string | undefined;
  isProduction: boolean;
  isDevelopment: boolean;
}

function resolveAIConfig(): AIConfig {
  const envBaseURL = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL || "";
  const apiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
  
  // Check for development environment signals
  const hasDevDomain = !!process.env.REPLIT_DEV_DOMAIN;
  const isNodeDevMode = process.env.NODE_ENV === "development";
  const hasLocalhostURL = envBaseURL.includes("localhost");
  
  // We're in development ONLY if we have the dev domain AND NODE_ENV is development
  const isDevelopment = hasDevDomain && isNodeDevMode;
  
  // Use localhost ONLY if we're definitely in development AND the URL is localhost
  const shouldUseLocalhost = isDevelopment && hasLocalhostURL;
  
  // ALWAYS default to production unless we're definitely in dev
  const baseURL = shouldUseLocalhost ? envBaseURL : PRODUCTION_AI_URL;
  
  // Log configuration for debugging
  console.log("[AI Config] Resolved configuration:", {
    baseURL,
    hasApiKey: !!apiKey,
    isDevelopment,
    isProduction: !isDevelopment,
    signals: {
      REPLIT_DEV_DOMAIN: hasDevDomain,
      NODE_ENV: process.env.NODE_ENV,
      hasLocalhostURL,
    }
  });
  
  // Warn if something seems wrong
  if (!isDevelopment && hasLocalhostURL) {
    console.warn("[AI Config] WARNING: Localhost URL detected but NOT in development mode. Using production URL instead.");
  }
  
  if (!apiKey) {
    console.error("[AI Config] ERROR: No AI_INTEGRATIONS_OPENAI_API_KEY found!");
  }
  
  return {
    baseURL,
    apiKey,
    isProduction: !isDevelopment,
    isDevelopment,
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
