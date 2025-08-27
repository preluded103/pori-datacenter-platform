/**
 * API Security Middleware
 * Comprehensive security layer for API endpoints including rate limiting, 
 * authentication, CORS, and request validation
 */

import { NextRequest, NextResponse } from 'next/server';

// Types
interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  message: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

interface SecurityConfig {
  rateLimit?: RateLimitConfig;
  requireAuth?: boolean;
  allowedOrigins?: string[];
  maxRequestSize?: number;
  requireApiKey?: boolean;
  enableCSRF?: boolean;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory rate limiting store (use Redis in production)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Default security configuration
const DEFAULT_SECURITY_CONFIG: SecurityConfig = {
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    message: 'Too many requests from this IP, please try again later.',
    skipSuccessfulRequests: false,
    skipFailedRequests: false
  },
  requireAuth: false,
  allowedOrigins: ['http://localhost:3000', 'https://localhost:3000'],
  maxRequestSize: 10 * 1024 * 1024, // 10MB
  requireApiKey: false,
  enableCSRF: false
};

/**
 * Rate limiting middleware
 */
export async function rateLimit(
  request: NextRequest,
  config: RateLimitConfig
): Promise<{ blocked: boolean; remaining?: number; resetTime?: number }> {
  
  // Extract client identifier (IP address)
  const clientIP = getClientIP(request);
  const now = Date.now();
  
  // Clean up expired entries
  cleanupExpiredEntries(now);
  
  // Get or create rate limit entry
  const key = `rate_limit:${clientIP}`;
  let entry = rateLimitStore.get(key);
  
  if (!entry || now >= entry.resetTime) {
    // Create new window
    entry = {
      count: 1,
      resetTime: now + config.windowMs
    };
  } else {
    // Increment counter
    entry.count++;
  }
  
  rateLimitStore.set(key, entry);
  
  // Check if limit exceeded
  if (entry.count > config.maxRequests) {
    return {
      blocked: true,
      remaining: 0,
      resetTime: entry.resetTime
    };
  }
  
  return {
    blocked: false,
    remaining: config.maxRequests - entry.count,
    resetTime: entry.resetTime
  };
}

/**
 * CORS middleware
 */
export function applyCORS(
  request: NextRequest,
  response: NextResponse,
  allowedOrigins: string[]
): NextResponse {
  
  const origin = request.headers.get('origin');
  
  // Set CORS headers
  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
  } else if (allowedOrigins.includes('*')) {
    response.headers.set('Access-Control-Allow-Origin', '*');
  }
  
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');
  response.headers.set('Access-Control-Max-Age', '86400'); // 24 hours
  
  return response;
}

/**
 * Authentication middleware
 */
export async function authenticateRequest(
  request: NextRequest
): Promise<{ authenticated: boolean; user?: any; error?: string }> {
  
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader) {
    return {
      authenticated: false,
      error: 'Missing authorization header'
    };
  }
  
  // Handle Bearer token
  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    
    try {
      // Validate token (implement your JWT validation here)
      const user = await validateJWT(token);
      return {
        authenticated: true,
        user
      };
    } catch (error) {
      return {
        authenticated: false,
        error: 'Invalid token'
      };
    }
  }
  
  // Handle API Key
  if (authHeader.startsWith('ApiKey ')) {
    const apiKey = authHeader.substring(7);
    
    const valid = await validateApiKey(apiKey);
    if (valid) {
      return {
        authenticated: true,
        user: { apiKey, type: 'api_key' }
      };
    }
  }
  
  return {
    authenticated: false,
    error: 'Invalid authentication method'
  };
}

/**
 * API Key validation middleware
 */
export async function validateApiKeyHeader(
  request: NextRequest
): Promise<{ valid: boolean; error?: string }> {
  
  const apiKey = request.headers.get('x-api-key');
  
  if (!apiKey) {
    return {
      valid: false,
      error: 'Missing API key header'
    };
  }
  
  const valid = await validateApiKey(apiKey);
  if (!valid) {
    return {
      valid: false,
      error: 'Invalid API key'
    };
  }
  
  return { valid: true };
}

/**
 * Request size validation
 */
export function validateRequestSize(
  request: NextRequest,
  maxSize: number
): { valid: boolean; error?: string } {
  
  const contentLength = request.headers.get('content-length');
  
  if (contentLength) {
    const size = parseInt(contentLength, 10);
    if (size > maxSize) {
      return {
        valid: false,
        error: `Request too large. Maximum size: ${maxSize} bytes`
      };
    }
  }
  
  return { valid: true };
}

/**
 * CSRF protection middleware
 */
export function validateCSRF(
  request: NextRequest
): { valid: boolean; error?: string } {
  
  // Skip CSRF for GET, HEAD, OPTIONS
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
    return { valid: true };
  }
  
  const csrfToken = request.headers.get('x-csrf-token');
  const sessionToken = request.headers.get('x-session-token');
  
  if (!csrfToken || !sessionToken) {
    return {
      valid: false,
      error: 'Missing CSRF or session token'
    };
  }
  
  // Validate tokens match (implement your CSRF validation logic)
  const valid = validateCSRFTokens(csrfToken, sessionToken);
  
  if (!valid) {
    return {
      valid: false,
      error: 'Invalid CSRF token'
    };
  }
  
  return { valid: true };
}

/**
 * Main security middleware wrapper
 */
export function withSecurity(
  config: Partial<SecurityConfig> = {},
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  
  const finalConfig = { ...DEFAULT_SECURITY_CONFIG, ...config };
  
  return async (request: NextRequest): Promise<NextResponse> => {
    
    try {
      // Handle preflight requests
      if (request.method === 'OPTIONS') {
        const response = new NextResponse(null, { status: 200 });
        return applyCORS(request, response, finalConfig.allowedOrigins || []);
      }
      
      // 1. Rate limiting
      if (finalConfig.rateLimit) {
        const rateLimitResult = await rateLimit(request, finalConfig.rateLimit);
        
        if (rateLimitResult.blocked) {
          const response = NextResponse.json(
            {
              error: finalConfig.rateLimit.message,
              retryAfter: Math.ceil((rateLimitResult.resetTime! - Date.now()) / 1000)
            },
            { status: 429 }
          );
          
          response.headers.set('X-RateLimit-Limit', finalConfig.rateLimit.maxRequests.toString());
          response.headers.set('X-RateLimit-Remaining', '0');
          response.headers.set('X-RateLimit-Reset', rateLimitResult.resetTime!.toString());
          
          return applyCORS(request, response, finalConfig.allowedOrigins || []);
        }
        
        // Add rate limit headers to successful responses
        if (rateLimitResult.remaining !== undefined) {
          request.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
          request.headers.set('X-RateLimit-Reset', rateLimitResult.resetTime!.toString());
        }
      }
      
      // 2. Request size validation
      if (finalConfig.maxRequestSize) {
        const sizeValidation = validateRequestSize(request, finalConfig.maxRequestSize);
        if (!sizeValidation.valid) {
          const response = NextResponse.json(
            { error: sizeValidation.error },
            { status: 413 }
          );
          return applyCORS(request, response, finalConfig.allowedOrigins || []);
        }
      }
      
      // 3. API Key validation
      if (finalConfig.requireApiKey) {
        const apiKeyValidation = await validateApiKeyHeader(request);
        if (!apiKeyValidation.valid) {
          const response = NextResponse.json(
            { error: apiKeyValidation.error },
            { status: 401 }
          );
          return applyCORS(request, response, finalConfig.allowedOrigins || []);
        }
      }
      
      // 4. Authentication
      if (finalConfig.requireAuth) {
        const authResult = await authenticateRequest(request);
        if (!authResult.authenticated) {
          const response = NextResponse.json(
            { error: authResult.error || 'Authentication required' },
            { status: 401 }
          );
          return applyCORS(request, response, finalConfig.allowedOrigins || []);
        }
        
        // Add user info to request context (if needed)
        request.headers.set('X-User-Context', JSON.stringify(authResult.user));
      }
      
      // 5. CSRF protection
      if (finalConfig.enableCSRF) {
        const csrfValidation = validateCSRF(request);
        if (!csrfValidation.valid) {
          const response = NextResponse.json(
            { error: csrfValidation.error },
            { status: 403 }
          );
          return applyCORS(request, response, finalConfig.allowedOrigins || []);
        }
      }
      
      // Call the original handler
      const response = await handler(request);
      
      // Apply CORS to successful responses
      return applyCORS(request, response, finalConfig.allowedOrigins || []);
      
    } catch (error) {
      console.error('Security middleware error:', error);
      
      const errorResponse = NextResponse.json(
        {
          error: 'Internal security error',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
      
      return applyCORS(request, errorResponse, finalConfig.allowedOrigins || []);
    }
  };
}

/**
 * Utility functions
 */
function getClientIP(request: NextRequest): string {
  // Check various headers for real IP
  const xForwardedFor = request.headers.get('x-forwarded-for');
  const xRealIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0].trim();
  }
  
  if (xRealIP) {
    return xRealIP;
  }
  
  if (cfConnectingIP) {
    return cfConnectingIP;
  }
  
  // Fallback to a default identifier
  return request.ip || 'unknown';
}

function cleanupExpiredEntries(now: number): void {
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now >= entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

async function validateJWT(token: string): Promise<any> {
  // Implement your JWT validation logic here
  // This is a placeholder - integrate with your auth provider
  
  if (token === 'valid-test-token') {
    return { id: 'test-user', role: 'admin' };
  }
  
  throw new Error('Invalid JWT token');
}

async function validateApiKey(apiKey: string): Promise<boolean> {
  // Implement your API key validation logic here
  // This is a placeholder - check against your API key store
  
  const validApiKeys = [
    'grid-intelligence-api-key-123',
    'datacenter-analysis-key-456'
  ];
  
  return validApiKeys.includes(apiKey);
}

function validateCSRFTokens(csrfToken: string, sessionToken: string): boolean {
  // Implement your CSRF validation logic here
  // This is a placeholder - implement proper CSRF protection
  
  return csrfToken.length > 0 && sessionToken.length > 0;
}

// Export configured middleware for common use cases
export const gridIntelligenceApiSecurity = withSecurity({
  rateLimit: {
    windowMs: 10 * 60 * 1000, // 10 minutes
    maxRequests: 50, // Conservative for analysis APIs
    message: 'Too many grid analysis requests. Please try again later.'
  },
  maxRequestSize: 5 * 1024 * 1024, // 5MB for polygon data
  allowedOrigins: [
    'http://localhost:3000',
    'https://localhost:3000',
    'https://your-domain.com'
  ]
});

export const publicApiSecurity = withSecurity({
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 200,
    message: 'Rate limit exceeded. Please try again later.'
  },
  allowedOrigins: ['*'], // More permissive for public APIs
  maxRequestSize: 1 * 1024 * 1024 // 1MB for public endpoints
});

export const authenticatedApiSecurity = withSecurity({
  requireAuth: true,
  rateLimit: {
    windowMs: 5 * 60 * 1000, // 5 minutes  
    maxRequests: 100,
    message: 'Rate limit exceeded for authenticated requests.'
  },
  enableCSRF: true,
  maxRequestSize: 20 * 1024 * 1024 // 20MB for authenticated users
});