/**
 * Supabase Database Client Configuration
 * Centralized database operations with proper typing
 */

import { createClient } from '@supabase/supabase-js';
import { Project, Site, RiskAssessment, DataSource, ProjectReport } from '@/lib/types/project-types';

// Environment variables with validation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing required Supabase environment variables');
}

// Database schema interface for type safety
export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          subscription_tier: 'trial' | 'professional' | 'enterprise';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          name: string;
          slug: string;
          subscription_tier?: 'trial' | 'professional' | 'enterprise';
        };
        Update: {
          name?: string;
          slug?: string;
          subscription_tier?: 'trial' | 'professional' | 'enterprise';
        };
      };
      projects: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          description: string | null;
          country_code: string;
          status: 'draft' | 'active' | 'completed' | 'archived';
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          organization_id: string;
          name: string;
          description?: string | null;
          country_code: string;
          created_by: string;
          status?: 'draft' | 'active' | 'completed' | 'archived';
        };
        Update: {
          name?: string;
          description?: string | null;
          country_code?: string;
          status?: 'draft' | 'active' | 'completed' | 'archived';
        };
      };
      sites: {
        Row: {
          id: string;
          project_id: string;
          name: string;
          reference_code: string | null;
          location: any; // PostGIS Point
          boundary: any | null; // PostGIS Polygon
          address: string | null;
          municipality: string | null;
          region: string | null;
          country_code: string;
          area_hectares: number | null;
          power_requirement_mw: number | null;
          assessment_status: 'pending' | 'analyzing' | 'completed' | 'error';
          assessment_date: string | null;
          overall_score: number | null;
          recommendation: 'proceed' | 'caution' | 'avoid' | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          project_id: string;
          name: string;
          reference_code?: string | null;
          location: any; // PostGIS Point
          boundary?: any | null;
          address?: string | null;
          municipality?: string | null;
          region?: string | null;
          country_code: string;
          area_hectares?: number | null;
          power_requirement_mw?: number | null;
          assessment_status?: 'pending' | 'analyzing' | 'completed' | 'error';
        };
        Update: {
          name?: string;
          reference_code?: string | null;
          location?: any;
          boundary?: any | null;
          address?: string | null;
          municipality?: string | null;
          region?: string | null;
          area_hectares?: number | null;
          power_requirement_mw?: number | null;
          assessment_status?: 'pending' | 'analyzing' | 'completed' | 'error';
          assessment_date?: string | null;
          overall_score?: number | null;
          recommendation?: 'proceed' | 'caution' | 'avoid' | null;
        };
      };
      risk_assessments: {
        Row: {
          id: string;
          site_id: string;
          power_substation_distance: number | null;
          power_substation_name: string | null;
          power_voltage_kv: number | null;
          fiber_backbone_distance: number | null;
          seismic_risk: 'LOW' | 'MEDIUM' | 'HIGH' | null;
          flood_risk: 'LOW' | 'MEDIUM' | 'HIGH' | null;
          heritage_risk: 'LOW' | 'MEDIUM' | 'HIGH' | null;
          infrastructure_cost_min: number | null;
          infrastructure_cost_max: number | null;
          timeline_months_min: number | null;
          timeline_months_max: number | null;
          assessed_at: string;
        };
        Insert: {
          site_id: string;
          power_substation_distance?: number | null;
          power_substation_name?: string | null;
          power_voltage_kv?: number | null;
          fiber_backbone_distance?: number | null;
          seismic_risk?: 'LOW' | 'MEDIUM' | 'HIGH' | null;
          flood_risk?: 'LOW' | 'MEDIUM' | 'HIGH' | null;
          heritage_risk?: 'LOW' | 'MEDIUM' | 'HIGH' | null;
          infrastructure_cost_min?: number | null;
          infrastructure_cost_max?: number | null;
          timeline_months_min?: number | null;
          timeline_months_max?: number | null;
        };
        Update: {
          power_substation_distance?: number | null;
          power_substation_name?: string | null;
          power_voltage_kv?: number | null;
          fiber_backbone_distance?: number | null;
          seismic_risk?: 'LOW' | 'MEDIUM' | 'HIGH' | null;
          flood_risk?: 'LOW' | 'MEDIUM' | 'HIGH' | null;
          heritage_risk?: 'LOW' | 'MEDIUM' | 'HIGH' | null;
          infrastructure_cost_min?: number | null;
          infrastructure_cost_max?: number | null;
          timeline_months_min?: number | null;
          timeline_months_max?: number | null;
        };
      };
    };
  };
}

// Client instances
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Service role client for server-side operations
export const supabaseAdmin = supabaseServiceKey 
  ? createClient<Database>(supabaseUrl, supabaseServiceKey)
  : null;

// Utility functions
export class DatabaseError extends Error {
  constructor(message: string, public originalError?: any) {
    super(message);
    this.name = 'DatabaseError';
  }
}

/**
 * Convert PostGIS Point to coordinates array
 */
export function pointToCoordinates(point: any): [number, number] {
  if (!point || !point.coordinates) {
    throw new DatabaseError('Invalid PostGIS Point format');
  }
  return point.coordinates as [number, number];
}

/**
 * Convert coordinates to PostGIS Point
 */
export function coordinatesToPoint(coordinates: [number, number]): string {
  return `POINT(${coordinates[0]} ${coordinates[1]})`;
}

/**
 * Convert PostGIS Polygon to coordinates array
 */
export function polygonToCoordinates(polygon: any): number[][][] {
  if (!polygon || !polygon.coordinates) {
    throw new DatabaseError('Invalid PostGIS Polygon format');
  }
  return polygon.coordinates as number[][][];
}

/**
 * Convert coordinates to PostGIS Polygon
 */
export function coordinatesToPolygon(coordinates: number[][][]): string {
  const rings = coordinates.map(ring => 
    `(${ring.map(coord => `${coord[0]} ${coord[1]}`).join(',')})`
  ).join(',');
  return `POLYGON(${rings})`;
}

/**
 * Generic error handler for database operations
 */
export function handleDatabaseError(error: any, operation: string): never {
  console.error(`Database error in ${operation}:`, error);
  
  if (error?.code === 'PGRST301') {
    throw new DatabaseError('Resource not found');
  }
  
  if (error?.code === 'PGRST116') {
    throw new DatabaseError('Permission denied');
  }
  
  if (error?.message) {
    throw new DatabaseError(`Database operation failed: ${error.message}`, error);
  }
  
  throw new DatabaseError(`Unknown database error in ${operation}`, error);
}

/**
 * Validate UUID format
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Get current user's organization ID
 * Used for Row Level Security
 */
export async function getCurrentUserOrgId(): Promise<string> {
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    throw new DatabaseError('User not authenticated');
  }
  
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .single();
  
  if (userError || !userData) {
    throw new DatabaseError('User organization not found');
  }
  
  return userData.organization_id;
}

/**
 * Check if user has permission for organization
 */
export async function checkOrgPermission(orgId: string): Promise<boolean> {
  try {
    const currentOrgId = await getCurrentUserOrgId();
    return currentOrgId === orgId;
  } catch {
    return false;
  }
}

/**
 * Transaction wrapper for multiple operations
 */
export async function withTransaction<T>(
  operations: (client: typeof supabase) => Promise<T>
): Promise<T> {
  // Note: Supabase doesn't support explicit transactions yet
  // This is a placeholder for when they add support
  // For now, we'll use the regular client
  return operations(supabase);
}