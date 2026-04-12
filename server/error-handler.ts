/**
 * Standardized error handling for the app
 * All errors should be one of these types for consistent client-side handling
 */

export const ERROR_CODES = {
  // Validation errors
  VALIDATION_FAILED: "VALIDATION_FAILED",
  INVALID_TOPIC: "INVALID_TOPIC",
  INVALID_PARAMETERS: "INVALID_PARAMETERS",
  
  // API/AI errors
  AI_RATE_LIMITED: "AI_RATE_LIMITED",
  AI_FAILED: "AI_FAILED",
  AI_TOKEN_LIMIT: "AI_TOKEN_LIMIT",
  
  // User/Auth errors
  NOT_AUTHENTICATED: "NOT_AUTHENTICATED",
  INSUFFICIENT_CREDITS: "INSUFFICIENT_CREDITS",
  QUOTA_EXCEEDED: "QUOTA_EXCEEDED",
  
  // System errors
  DATABASE_ERROR: "DATABASE_ERROR",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  TIMEOUT: "TIMEOUT",
  
  // Generation specific
  GENERATION_FAILED: "GENERATION_FAILED",
  GENERATION_CANCELLED: "GENERATION_CANCELLED",
  GENERATION_TIMEOUT: "GENERATION_TIMEOUT",
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public statusCode: number = 400,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "AppError";
  }

  toJSON() {
    return {
      error: {
        code: this.code,
        message: this.message,
        details: this.details,
      },
    };
  }
}

// Common error responses
export const ERROR_RESPONSES = {
  INVALID_TOPIC: new AppError(
    ERROR_CODES.INVALID_TOPIC,
    "Topic is required and must be at least 5 characters",
    400
  ),
  
  AI_RATE_LIMITED: new AppError(
    ERROR_CODES.AI_RATE_LIMITED,
    "AI service is overwhelmed. Please try again in a few seconds.",
    429
  ),
  
  AI_FAILED: new AppError(
    ERROR_CODES.AI_FAILED,
    "AI generation failed. This is usually temporary. Try again or use a shorter script.",
    500
  ),
  
  QUOTA_EXCEEDED: new AppError(
    ERROR_CODES.QUOTA_EXCEEDED,
    "You've exceeded your monthly script generation limit. Upgrade to Pro for more.",
    403
  ),
  
  GENERATION_TIMEOUT: new AppError(
    ERROR_CODES.GENERATION_TIMEOUT,
    "Script generation took too long. Try with a shorter duration or simpler topic.",
    408
  ),
  
  DATABASE_ERROR: new AppError(
    ERROR_CODES.DATABASE_ERROR,
    "Database connection failed. Please try again.",
    500
  ),
};

// Helper to extract meaningful error messages from OpenAI API errors
export function parseOpenAIError(error: any): { code: ErrorCode; message: string; statusCode: number } {
  const originalError = error?.response?.data || error;
  
  if (error?.status === 429 || error?.code === "rate_limit_exceeded") {
    return {
      code: ERROR_CODES.AI_RATE_LIMITED,
      message: "OpenAI rate limit hit. Waiting 30 seconds before retry...",
      statusCode: 429,
    };
  }
  
  if (error?.status === 401 || error?.code === "invalid_api_key") {
    return {
      code: ERROR_CODES.AI_FAILED,
      message: "OpenAI API key issue. Contact support.",
      statusCode: 500,
    };
  }
  
  if (error?.code === "context_length_exceeded") {
    return {
      code: ERROR_CODES.AI_TOKEN_LIMIT,
      message: "Script generation exceeded token limits. Try a shorter or simpler topic.",
      statusCode: 400,
    };
  }
  
  if (error?.message?.includes("timeout") || error?.code === "ETIMEDOUT") {
    return {
      code: ERROR_CODES.GENERATION_TIMEOUT,
      message: "Generation took too long. Try again with a simpler script.",
      statusCode: 408,
    };
  }
  
  return {
    code: ERROR_CODES.AI_FAILED,
    message: "AI generation failed. Please try again.",
    statusCode: 500,
  };
}
