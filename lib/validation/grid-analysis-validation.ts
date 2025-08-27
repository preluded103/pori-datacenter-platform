/**
 * Comprehensive Input Validation for Grid Analysis APIs
 * Validates all inputs to prevent malformed data and security issues
 */

import { z } from 'zod';

// Coordinate validation
export const CoordinateSchema = z.tuple([
  z.number().min(-180).max(180), // longitude
  z.number().min(-90).max(90)     // latitude
]);

// Polygon geometry validation
export const PolygonGeometrySchema = z.object({
  type: z.literal('Polygon'),
  coordinates: z.array(
    z.array(CoordinateSchema).min(4) // Minimum 4 points for closed polygon
  ).min(1) // At least one ring
});

// Polygon feature validation
export const PolygonFeatureSchema = z.object({
  id: z.string().min(1).max(100),
  type: z.literal('Feature'),
  geometry: PolygonGeometrySchema,
  properties: z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    area: z.number().positive().optional()
  }).optional()
});

// Location validation request
export const LocationValidationRequestSchema = z.object({
  coordinates: CoordinateSchema,
  polygon: PolygonGeometrySchema.optional(),
  country: z.string().length(2).optional() // ISO country code
});

// TSO identification request
export const TSOIdentificationRequestSchema = z.object({
  location: z.object({
    country: z.string().min(2).max(50),
    coordinates: CoordinateSchema,
    region: z.string().optional()
  }),
  requirements: z.object({
    powerMW: z.number().positive().max(1000), // Reasonable datacenter limit
    voltageLevel: z.string().regex(/^\d+kV$/), // e.g., "110kV"
    timeline: z.string().max(50)
  }).optional()
});

// Grid data collection request
export const GridDataCollectionRequestSchema = z.object({
  tsos: z.array(z.object({
    name: z.string().min(1).max(100),
    country: z.string().length(2),
    jurisdiction: z.string().max(100)
  })).min(1).max(10),
  polygon: PolygonGeometrySchema,
  analysisId: z.string().uuid().optional(),
  filters: z.object({
    voltageLevel: z.array(z.number().positive()).optional(),
    maxDistanceKm: z.number().positive().max(50).optional(),
    minCapacityMW: z.number().positive().optional()
  }).optional()
});

// Analysis processing request
export const AnalysisProcessingRequestSchema = z.object({
  gridData: z.object({
    substations: z.array(z.unknown()),
    transmissionLines: z.array(z.unknown()),
    transformers: z.array(z.unknown()),
    loadCenters: z.array(z.unknown())
  }),
  polygon: PolygonGeometrySchema,
  analysisId: z.string().uuid().optional(),
  requirements: z.object({
    powerMW: z.number().positive().max(1000),
    redundancyRequired: z.boolean().optional(),
    preferredTimeline: z.number().positive().max(60).optional() // months
  }).optional()
});

// Analysis progress update
export const AnalysisProgressSchema = z.object({
  analysisId: z.string().min(1).max(100),
  stage: z.string().min(1).max(100),
  percentage: z.number().min(0).max(100),
  timestamp: z.string().datetime(),
  details: z.string().max(500).optional(),
  errors: z.array(z.string()).optional()
});

// Configuration schemas
export const GridAnalysisTriggerConfigSchema = z.object({
  autoTriggerEnabled: z.boolean(),
  minPolygonArea: z.number().positive().max(1000000000), // 1M hectares max
  analysisTimeout: z.number().positive().max(3600000), // 1 hour max
  retryAttempts: z.number().min(0).max(10)
});

export const RecommendationConfigSchema = z.object({
  weights: z.object({
    distance: z.number().min(0).max(1),
    capacity: z.number().min(0).max(1),
    timeline: z.number().min(0).max(1),
    cost: z.number().min(0).max(1),
    reliability: z.number().min(0).max(1),
    tsoQuality: z.number().min(0).max(1),
    risk: z.number().min(0).max(1)
  }).refine(weights => {
    const sum = Object.values(weights).reduce((a, b) => a + b, 0);
    return Math.abs(sum - 1.0) < 0.001; // Allow for floating point precision
  }, {
    message: "Weights must sum to 1.0"
  }),
  thresholds: z.object({
    minimumScore: z.number().min(0).max(100),
    minimumCapacityMW: z.number().positive(),
    maxDistanceKm: z.number().positive(),
    maxTimelineMonths: z.number().positive()
  }),
  regionalAdjustments: z.record(
    z.string(),
    z.object({
      multiplier: z.number().min(0.5).max(2.0),
      description: z.string().max(200)
    })
  ).optional()
});

// Validation utility functions
export class GridAnalysisValidator {
  /**
   * Validate polygon feature with detailed error reporting
   */
  static validatePolygonFeature(data: unknown): { 
    valid: boolean; 
    data?: z.infer<typeof PolygonFeatureSchema>; 
    errors?: string[] 
  } {
    try {
      const validatedData = PolygonFeatureSchema.parse(data);
      
      // Additional business logic validation
      const errors: string[] = [];
      
      // Check polygon area (approximate)
      const area = this.calculateApproximateArea(validatedData.geometry);
      if (area < 100) { // Minimum 100 m²
        errors.push('Polygon area too small (minimum 100 m²)');
      }
      if (area > 1000000000) { // Maximum 1M hectares
        errors.push('Polygon area too large (maximum 1M hectares)');
      }
      
      // Check for self-intersecting polygons (basic check)
      if (this.hasSelfIntersection(validatedData.geometry)) {
        errors.push('Polygon must not self-intersect');
      }
      
      return {
        valid: errors.length === 0,
        data: validatedData,
        errors: errors.length > 0 ? errors : undefined
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          valid: false,
          errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        };
      }
      return {
        valid: false,
        errors: ['Unknown validation error']
      };
    }
  }

  /**
   * Validate analysis configuration
   */
  static validateTriggerConfig(data: unknown): {
    valid: boolean;
    data?: z.infer<typeof GridAnalysisTriggerConfigSchema>;
    errors?: string[]
  } {
    try {
      const validatedData = GridAnalysisTriggerConfigSchema.parse(data);
      
      // Business logic validation
      const errors: string[] = [];
      
      if (validatedData.analysisTimeout < 30000) { // Minimum 30 seconds
        errors.push('Analysis timeout too short (minimum 30 seconds)');
      }
      
      if (validatedData.minPolygonArea < 100) {
        errors.push('Minimum polygon area too small (minimum 100 m²)');
      }
      
      return {
        valid: errors.length === 0,
        data: validatedData,
        errors: errors.length > 0 ? errors : undefined
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          valid: false,
          errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        };
      }
      return {
        valid: false,
        errors: ['Unknown validation error']
      };
    }
  }

  /**
   * Validate recommendation configuration
   */
  static validateRecommendationConfig(data: unknown): {
    valid: boolean;
    data?: z.infer<typeof RecommendationConfigSchema>;
    errors?: string[]
  } {
    try {
      const validatedData = RecommendationConfigSchema.parse(data);
      return {
        valid: true,
        data: validatedData
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          valid: false,
          errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        };
      }
      return {
        valid: false,
        errors: ['Unknown validation error']
      };
    }
  }

  /**
   * Sanitize string inputs to prevent XSS and injection attacks
   */
  static sanitizeString(input: string): string {
    return input
      .replace(/[<>\"'&]/g, '') // Remove potential HTML/JS characters
      .slice(0, 1000) // Limit length
      .trim();
  }

  /**
   * Validate coordinates are within reasonable bounds
   */
  static validateCoordinate(coord: [number, number]): boolean {
    const [lng, lat] = coord;
    return lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90;
  }

  /**
   * Check if coordinates are within European bounds (rough check)
   */
  static isWithinEurope(coord: [number, number]): boolean {
    const [lng, lat] = coord;
    // Rough European bounds
    return lng >= -30 && lng <= 70 && lat >= 35 && lat <= 75;
  }

  /**
   * Calculate approximate polygon area in square meters
   */
  private static calculateApproximateArea(geometry: z.infer<typeof PolygonGeometrySchema>): number {
    if (!geometry.coordinates[0] || geometry.coordinates[0].length < 4) return 0;
    
    const coords = geometry.coordinates[0];
    let area = 0;
    
    // Shoelace formula
    for (let i = 0; i < coords.length - 1; i++) {
      const [x1, y1] = coords[i];
      const [x2, y2] = coords[i + 1];
      area += (x1 * y2 - x2 * y1);
    }
    
    area = Math.abs(area) / 2;
    
    // Convert degrees to approximate meters (very rough)
    const metersPerDegree = 111320;
    return area * metersPerDegree * metersPerDegree;
  }

  /**
   * Basic check for self-intersecting polygons
   */
  private static hasSelfIntersection(geometry: z.infer<typeof PolygonGeometrySchema>): boolean {
    // This is a simplified check - in production, use a proper geometric library
    const coords = geometry.coordinates[0];
    if (coords.length < 4) return false;
    
    // Check if first and last points are the same (closed polygon)
    const first = coords[0];
    const last = coords[coords.length - 1];
    const isClosed = first[0] === last[0] && first[1] === last[1];
    
    if (!isClosed) return true; // Polygon must be closed
    
    // Basic duplicate point check
    for (let i = 0; i < coords.length - 1; i++) {
      for (let j = i + 2; j < coords.length - 1; j++) {
        if (coords[i][0] === coords[j][0] && coords[i][1] === coords[j][1]) {
          return true; // Found duplicate points
        }
      }
    }
    
    return false;
  }
}

// Error response types
export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationResponse {
  valid: boolean;
  errors?: ValidationError[];
  warnings?: string[];
}

// Middleware helper for API routes
export function createValidationMiddleware<T>(schema: z.ZodSchema<T>) {
  return (data: unknown): { success: true; data: T } | { success: false; errors: ValidationError[] } => {
    try {
      const validatedData = schema.parse(data);
      return { success: true, data: validatedData };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: ValidationError[] = error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
          code: e.code
        }));
        return { success: false, errors };
      }
      return {
        success: false,
        errors: [{ field: 'unknown', message: 'Unknown validation error', code: 'unknown' }]
      };
    }
  };
}

// Schemas are exported above individually, no need for re-export