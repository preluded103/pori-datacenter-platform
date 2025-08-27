/**
 * Retry Logic and Error Recovery Utilities
 * Provides robust retry mechanisms for API calls and asynchronous operations
 */

// Types
export interface RetryConfig {
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  jitterEnabled: boolean;
  retryableErrors?: (error: any) => boolean;
  onRetry?: (attempt: number, error: any) => void;
  onMaxAttemptsReached?: (error: any) => void;
}

export interface RetryResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
  attempts: number;
  totalTime: number;
}

export interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeoutMs: number;
  monitoringWindowMs: number;
}

export enum CircuitState {
  CLOSED = 'closed',
  OPEN = 'open', 
  HALF_OPEN = 'half_open'
}

// Default configurations
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
  jitterEnabled: true,
  retryableErrors: (error: any) => {
    // Default retryable conditions
    if (error.code === 'NETWORK_ERROR') return true;
    if (error.code === 'TIMEOUT') return true;
    if (error.status >= 500 && error.status < 600) return true; // Server errors
    if (error.status === 429) return true; // Rate limit
    if (error.status === 408) return true; // Request timeout
    return false;
  }
};

const DEFAULT_CIRCUIT_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5,
  resetTimeoutMs: 60000, // 1 minute
  monitoringWindowMs: 300000 // 5 minutes
};

/**
 * Exponential backoff with jitter
 */
export function calculateDelay(
  attempt: number,
  config: RetryConfig
): number {
  const exponentialDelay = config.initialDelayMs * Math.pow(config.backoffMultiplier, attempt - 1);
  const delayWithCap = Math.min(exponentialDelay, config.maxDelayMs);
  
  if (config.jitterEnabled) {
    // Add random jitter (0-25% of delay)
    const jitter = delayWithCap * 0.25 * Math.random();
    return Math.floor(delayWithCap + jitter);
  }
  
  return delayWithCap;
}

/**
 * Sleep utility
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry wrapper for any async function
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<RetryResult<T>> {
  
  const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  const startTime = Date.now();
  let lastError: Error;
  
  for (let attempt = 1; attempt <= finalConfig.maxAttempts; attempt++) {
    try {
      const result = await operation();
      
      return {
        success: true,
        data: result,
        attempts: attempt,
        totalTime: Date.now() - startTime
      };
      
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Check if error is retryable
      if (!finalConfig.retryableErrors!(error)) {
        return {
          success: false,
          error: lastError,
          attempts: attempt,
          totalTime: Date.now() - startTime
        };
      }
      
      // If this was the last attempt, don't retry
      if (attempt >= finalConfig.maxAttempts) {
        break;
      }
      
      // Calculate delay and wait
      const delay = calculateDelay(attempt, finalConfig);
      
      // Call retry callback
      finalConfig.onRetry?.(attempt, error);
      
      console.log(`Retry attempt ${attempt}/${finalConfig.maxAttempts} after ${delay}ms delay. Error:`, error);
      
      await sleep(delay);
    }
  }
  
  // Max attempts reached
  finalConfig.onMaxAttemptsReached?.(lastError!);
  
  return {
    success: false,
    error: lastError!,
    attempts: finalConfig.maxAttempts,
    totalTime: Date.now() - startTime
  };
}

/**
 * Retry wrapper specifically for fetch operations
 */
export async function retryFetch(
  url: string,
  options: RequestInit = {},
  config: Partial<RetryConfig> = {}
): Promise<RetryResult<Response>> {
  
  return withRetry(async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      // Check for HTTP error status
      if (!response.ok) {
        const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
        (error as any).status = response.status;
        (error as any).response = response;
        throw error;
      }
      
      return response;
      
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        const timeoutError = new Error('Request timeout');
        (timeoutError as any).code = 'TIMEOUT';
        throw timeoutError;
      }
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        const networkError = new Error('Network error');
        (networkError as any).code = 'NETWORK_ERROR';
        throw networkError;
      }
      
      throw error;
    }
  }, config);
}

/**
 * Circuit Breaker implementation
 */
export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failures: number = 0;
  private lastFailureTime: number = 0;
  private successes: number = 0;
  private config: CircuitBreakerConfig;
  
  constructor(config: Partial<CircuitBreakerConfig> = {}) {
    this.config = { ...DEFAULT_CIRCUIT_CONFIG, ...config };
  }
  
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() - this.lastFailureTime < this.config.resetTimeoutMs) {
        throw new Error('Circuit breaker is OPEN');
      } else {
        this.state = CircuitState.HALF_OPEN;
        console.log('Circuit breaker moving to HALF_OPEN state');
      }
    }
    
    try {
      const result = await operation();
      
      // Success
      if (this.state === CircuitState.HALF_OPEN) {
        this.successes++;
        if (this.successes >= 2) { // Require 2 successes to close
          this.reset();
          console.log('Circuit breaker moving to CLOSED state');
        }
      }
      
      return result;
      
    } catch (error) {
      this.recordFailure();
      
      if (this.state === CircuitState.HALF_OPEN) {
        this.state = CircuitState.OPEN;
        this.lastFailureTime = Date.now();
        console.log('Circuit breaker moving back to OPEN state');
      }
      
      throw error;
    }
  }
  
  private recordFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.failures >= this.config.failureThreshold && this.state === CircuitState.CLOSED) {
      this.state = CircuitState.OPEN;
      console.log('Circuit breaker moving to OPEN state after', this.failures, 'failures');
    }
  }
  
  private reset(): void {
    this.state = CircuitState.CLOSED;
    this.failures = 0;
    this.successes = 0;
    this.lastFailureTime = 0;
  }
  
  getState(): CircuitState {
    return this.state;
  }
  
  getStats(): { state: CircuitState; failures: number; successes: number } {
    return {
      state: this.state,
      failures: this.failures,
      successes: this.successes
    };
  }
}

/**
 * Timeout wrapper with retry
 */
export async function withTimeout<T>(
  operation: () => Promise<T>,
  timeoutMs: number,
  retryConfig?: Partial<RetryConfig>
): Promise<T> {
  
  const timeoutOperation = async (): Promise<T> => {
    return Promise.race([
      operation(),
      new Promise<never>((_, reject) => {
        setTimeout(() => {
          const error = new Error(`Operation timed out after ${timeoutMs}ms`);
          (error as any).code = 'TIMEOUT';
          reject(error);
        }, timeoutMs);
      })
    ]);
  };
  
  if (retryConfig) {
    const result = await withRetry(timeoutOperation, retryConfig);
    if (!result.success) {
      throw result.error;
    }
    return result.data!;
  }
  
  return timeoutOperation();
}

/**
 * Bulk retry operations with error recovery
 */
export async function retryBatch<T, R>(
  items: T[],
  operation: (item: T) => Promise<R>,
  config: Partial<RetryConfig> = {}
): Promise<Array<{ item: T; result?: R; error?: Error; attempts: number }>> {
  
  const results = await Promise.allSettled(
    items.map(async (item) => {
      const retryResult = await withRetry(() => operation(item), config);
      return {
        item,
        result: retryResult.data,
        error: retryResult.error,
        attempts: retryResult.attempts
      };
    })
  );
  
  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      return {
        item: items[index],
        error: result.reason,
        attempts: 1
      };
    }
  });
}

/**
 * Pre-configured retry instances for common use cases
 */

// Grid analysis API calls
export const gridAnalysisRetry = (operation: () => Promise<any>) => 
  withRetry(operation, {
    maxAttempts: 3,
    initialDelayMs: 2000,
    maxDelayMs: 10000,
    backoffMultiplier: 2,
    jitterEnabled: true,
    retryableErrors: (error) => {
      return error.status >= 500 || error.code === 'TIMEOUT' || error.code === 'NETWORK_ERROR';
    },
    onRetry: (attempt, error) => {
      console.log(`🔄 Grid analysis retry ${attempt}: ${error.message}`);
    },
    onMaxAttemptsReached: (error) => {
      console.error('❌ Grid analysis failed after all retries:', error.message);
    }
  });

// Location validation with conservative retry
export const locationValidationRetry = (operation: () => Promise<any>) =>
  withRetry(operation, {
    maxAttempts: 2,
    initialDelayMs: 1000,
    maxDelayMs: 5000,
    backoffMultiplier: 2,
    jitterEnabled: false,
    retryableErrors: (error) => {
      return error.status === 503 || error.status === 502 || error.code === 'TIMEOUT';
    }
  });

// TSO data fetching with aggressive retry
export const tsoDataRetry = (operation: () => Promise<any>) =>
  withRetry(operation, {
    maxAttempts: 5,
    initialDelayMs: 5000,
    maxDelayMs: 30000,
    backoffMultiplier: 1.5,
    jitterEnabled: true,
    retryableErrors: (error) => {
      // TSO APIs can be flaky, retry more aggressively
      return error.status >= 500 || error.status === 429 || error.code === 'TIMEOUT' || error.code === 'NETWORK_ERROR';
    },
    onRetry: (attempt, error) => {
      console.log(`🔄 TSO data retry ${attempt}: ${error.message}`);
    }
  });

// Circuit breaker for external API calls
export const externalApiCircuitBreaker = new CircuitBreaker({
  failureThreshold: 3,
  resetTimeoutMs: 30000, // 30 seconds
  monitoringWindowMs: 120000 // 2 minutes
});

// Export utility for API route error recovery
export function createApiErrorHandler(operationName: string) {
  return {
    async withRetry<T>(operation: () => Promise<T>): Promise<T> {
      const result = await withRetry(operation, {
        maxAttempts: 3,
        initialDelayMs: 1000,
        maxDelayMs: 8000,
        onRetry: (attempt, error) => {
          console.log(`🔄 ${operationName} retry ${attempt}:`, error.message);
        },
        onMaxAttemptsReached: (error) => {
          console.error(`❌ ${operationName} failed after all retries:`, error.message);
        }
      });
      
      if (!result.success) {
        throw result.error;
      }
      
      return result.data!;
    },
    
    async withCircuitBreaker<T>(operation: () => Promise<T>): Promise<T> {
      return externalApiCircuitBreaker.execute(operation);
    },
    
    async withTimeoutAndRetry<T>(
      operation: () => Promise<T>, 
      timeoutMs: number = 30000
    ): Promise<T> {
      return withTimeout(operation, timeoutMs, {
        maxAttempts: 2,
        initialDelayMs: 2000
      });
    }
  };
}