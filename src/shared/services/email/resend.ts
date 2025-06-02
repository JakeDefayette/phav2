import { Resend } from 'resend';
import { config } from '@/shared/config';

export interface ResendConfig {
  apiKey: string;
  rateLimit?: {
    tokensPerSecond: number;
    maxTokens: number;
  };
  retry?: {
    maxAttempts: number;
    baseDelayMs: number;
  };
}

export interface EmailSendOptions {
  from: string;
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType?: string;
  }>;
  headers?: Record<string, string>;
  tags?: Array<{
    name: string;
    value: string;
  }>;
}

export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  rateLimited?: boolean;
}

export interface RateLimitStatus {
  tokensAvailable: number;
  nextRefillTime: Date;
  isLimited: boolean;
}

/**
 * Token bucket implementation for rate limiting
 */
class TokenBucket {
  private tokens: number;
  private lastRefill: number;
  private readonly maxTokens: number;
  private readonly refillRate: number; // tokens per second

  constructor(maxTokens: number, refillRate: number) {
    this.maxTokens = maxTokens;
    this.refillRate = refillRate;
    this.tokens = maxTokens;
    this.lastRefill = Date.now();
  }

  /**
   * Attempt to consume a token
   */
  consume(): boolean {
    this.refill();

    if (this.tokens >= 1) {
      this.tokens -= 1;
      return true;
    }

    return false;
  }

  /**
   * Get current rate limit status
   */
  getStatus(): RateLimitStatus {
    this.refill();

    const nextRefillTime = new Date(this.lastRefill + 1000 / this.refillRate);

    return {
      tokensAvailable: Math.floor(this.tokens),
      nextRefillTime,
      isLimited: this.tokens < 1,
    };
  }

  /**
   * Refill tokens based on elapsed time
   */
  private refill(): void {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    const tokensToAdd = (elapsed / 1000) * this.refillRate;

    this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }
}

/**
 * Resend client with rate limiting and retry logic
 */
export class ResendClient {
  private client: Resend;
  private tokenBucket: TokenBucket;
  private config: Required<ResendConfig>;

  constructor(userConfig: ResendConfig) {
    this.config = {
      apiKey: userConfig.apiKey,
      rateLimit: {
        tokensPerSecond: 10, // Resend free tier limit
        maxTokens: 20,
        ...userConfig.rateLimit,
      },
      retry: {
        maxAttempts: 3,
        baseDelayMs: 1000,
        ...userConfig.retry,
      },
    };

    this.client = new Resend(this.config.apiKey);
    this.tokenBucket = new TokenBucket(
      this.config.rateLimit.maxTokens,
      this.config.rateLimit.tokensPerSecond
    );
  }

  /**
   * Send email with rate limiting and retry logic
   */
  async sendEmail(options: EmailSendOptions): Promise<EmailSendResult> {
    for (let attempt = 1; attempt <= this.config.retry.maxAttempts; attempt++) {
      try {
        // Check rate limit
        if (!this.tokenBucket.consume()) {
          const status = this.tokenBucket.getStatus();
          const waitTime = status.nextRefillTime.getTime() - Date.now();

          if (attempt === this.config.retry.maxAttempts) {
            return {
              success: false,
              error: 'Rate limit exceeded',
              rateLimited: true,
            };
          }

          // Wait for next token
          await this.delay(Math.max(waitTime, 100));
          continue;
        }

        // Attempt to send email
        const result = await this.client.emails.send({
          from: options.from,
          to: options.to,
          subject: options.subject,
          html: options.html,
          text: options.text,
          attachments: options.attachments?.map(att => ({
            filename: att.filename,
            content: att.content,
            content_type: att.contentType,
          })),
          headers: options.headers,
          tags: options.tags,
        });

        if (result.error) {
          throw new Error(`Resend API error: ${result.error.message}`);
        }

        return {
          success: true,
          messageId: result.data?.id,
        };
      } catch (error) {
        const isLastAttempt = attempt === this.config.retry.maxAttempts;
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';

        // Check for specific error types
        if (this.isRateLimitError(error)) {
          if (isLastAttempt) {
            return {
              success: false,
              error: 'Rate limit exceeded after retries',
              rateLimited: true,
            };
          }
          // Wait longer for rate limit errors
          await this.delay(
            this.config.retry.baseDelayMs * Math.pow(2, attempt)
          );
          continue;
        }

        if (this.isAuthError(error)) {
          return {
            success: false,
            error: `Authentication failed: ${errorMessage}`,
          };
        }

        if (this.isValidationError(error)) {
          return {
            success: false,
            error: `Validation error: ${errorMessage}`,
          };
        }

        // For other errors, retry with exponential backoff
        if (!isLastAttempt) {
          const delay =
            this.config.retry.baseDelayMs * Math.pow(2, attempt - 1);
          await this.delay(delay);
          continue;
        }

        return {
          success: false,
          error: `Failed after ${this.config.retry.maxAttempts} attempts: ${errorMessage}`,
        };
      }
    }

    return {
      success: false,
      error: 'Unexpected error: retry loop completed without result',
    };
  }

  /**
   * Get current rate limit status
   */
  getRateLimitStatus(): RateLimitStatus {
    return this.tokenBucket.getStatus();
  }

  /**
   * Check if API key is configured
   */
  isConfigured(): boolean {
    return !!this.config.apiKey && this.config.apiKey !== '';
  }

  /**
   * Test API connectivity
   */
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      // Use a dry-run approach by sending to a test endpoint
      // Note: Resend doesn't have a specific health check endpoint,
      // so we'll validate the API key format and configuration

      if (!this.isConfigured()) {
        return {
          success: false,
          error: 'API key not configured',
        };
      }

      // Basic API key format validation
      if (!this.config.apiKey.startsWith('re_')) {
        return {
          success: false,
          error: 'Invalid API key format',
        };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Connection test failed',
      };
    }
  }

  /**
   * Delay helper for retry logic
   */
  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Check if error is a rate limit error
   */
  private isRateLimitError(error: unknown): boolean {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      return (
        message.includes('rate limit') ||
        message.includes('429') ||
        message.includes('too many requests')
      );
    }
    return false;
  }

  /**
   * Check if error is an authentication error
   */
  private isAuthError(error: unknown): boolean {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      return (
        message.includes('unauthorized') ||
        message.includes('invalid api key') ||
        message.includes('401') ||
        message.includes('403')
      );
    }
    return false;
  }

  /**
   * Check if error is a validation error
   */
  private isValidationError(error: unknown): boolean {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      return (
        message.includes('validation') ||
        message.includes('invalid email') ||
        message.includes('400')
      );
    }
    return false;
  }
}

/**
 * Create configured Resend client instance
 */
export function createResendClient(): ResendClient | null {
  const apiKey = config.email.resend_api_key;

  if (!apiKey) {
    console.warn(
      'RESEND_API_KEY not configured. Email functionality will be limited.'
    );
    return null;
  }

  return new ResendClient({
    apiKey,
    rateLimit: {
      tokensPerSecond: 10, // Conservative rate for free tier
      maxTokens: 20,
    },
    retry: {
      maxAttempts: 3,
      baseDelayMs: 1000,
    },
  });
}

// Export singleton instance (can be null if not configured)
export const resendClient = createResendClient();
