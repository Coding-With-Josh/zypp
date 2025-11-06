import { logger } from "./logger";

export interface RetryConfig {
  maxAttempts: number;
  delay: number;
  backoff?: number;
  shouldRetry?: (error: any) => boolean;
}

const defaultConfig: RetryConfig = {
  maxAttempts: 3,
  delay: 1000,
  backoff: 2,
  shouldRetry: () => true,
};

export async function retry<T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const finalConfig = { ...defaultConfig, ...config };
  let lastError: Error | undefined;
  let currentDelay = finalConfig.delay;

  for (let attempt = 1; attempt <= finalConfig.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;

      const shouldRetry = finalConfig.shouldRetry?.(error) ?? true;
      if (!shouldRetry || attempt === finalConfig.maxAttempts) {
        throw error;
      }

      logger.warn(`Operation failed, retrying in ${currentDelay}ms`, {
        attempt,
        error: error.message,
        nextDelay: currentDelay,
      });

      await new Promise((resolve) => setTimeout(resolve, currentDelay));
      currentDelay *= finalConfig.backoff!;
    }
  }

  throw lastError;
}

export function withRetry<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  config: Partial<RetryConfig> = {}
): T {
  return (async (...args: Parameters<T>) => {
    return retry(() => fn(...args), config);
  }) as T;
}
