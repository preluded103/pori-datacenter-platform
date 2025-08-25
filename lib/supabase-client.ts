/**
 * Supabase Client Configuration
 * Database connection and API client for the datacenter platform
 */

import { createClient } from '@supabase/supabase-js';
import { ConstraintAnalysis } from '../components/ConstraintVisualization';
import { generatePoriConstraintAnalysis } from './pori-demo-data';

// Environment configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bnvtiwglkfjdqocrrsob.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJudnRpd2dsa2ZqZHFvY3Jyc29iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2MDQ0NDEsImV4cCI6MjA3MTE4MDQ0MX0.M2acwdkRG6EYSd2EG3cEn8_3Yg0-WLF-6AIgQS1UjUQ';

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types (matching our schema)
export interface Organization {
  id: string;
  name: string;
  slug: string;
  subscription_tier: 'trial' | 'professional' | 'enterprise';
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  country_code: string;
  status: 'draft' | 'active' | 'completed' | 'archived';
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Site {
  id: string;
  project_id: string;
  name: string;
  reference_code?: string;
  location: any; // PostGIS Point
  boundary?: any; // PostGIS Polygon
  address?: string;
  municipality?: string;
  region?: string;
  country_code: string;
  area_hectares?: number;
  power_requirement_mw?: number;
  assessment_status: 'pending' | 'analyzing' | 'completed' | 'error';
  assessment_date?: string;
  overall_score?: number;
  recommendation?: 'proceed' | 'caution' | 'avoid';
  created_at: string;
  updated_at: string;
}

export interface RiskAssessment {
  id: string;
  site_id: string;
  power_substation_distance?: number;
  power_substation_name?: string;
  power_voltage_kv?: number;
  fiber_backbone_distance?: number;
  fiber_provider?: string;
  water_source_distance?: number;
  water_source_type?: string;
  seismic_risk?: 'LOW' | 'MEDIUM' | 'HIGH';
  flood_risk?: 'LOW' | 'MEDIUM' | 'HIGH';
  geotechnical_risk?: 'LOW' | 'MEDIUM' | 'HIGH';
  aviation_risk?: 'LOW' | 'MEDIUM' | 'HIGH';
  heritage_risk?: 'LOW' | 'MEDIUM' | 'HIGH';
  emi_risk?: 'LOW' | 'MEDIUM' | 'HIGH';
  protected_area_distance?: number;
  natura2000_distance?: number;
  wetland_distance?: number;
  zoning_status?: string;
  zoning_compatible?: boolean;
  environmental_permit_required?: boolean;
  water_permit_required?: boolean;
  infrastructure_cost_min?: number;
  infrastructure_cost_max?: number;
  timeline_months_min?: number;
  timeline_months_max?: number;
  assessed_at: string;
}

// API Functions
export class SupabaseAPI {
  
  // Initialize demo data
  static async initializeDemoData(): Promise<void> {
    try {
      // Check if demo organization exists
      const { data: existingOrg } = await supabase
        .from('organizations')
        .select('*')
        .eq('slug', 'demo-organization')
        .single();

      let orgId = existingOrg?.id;

      if (!existingOrg) {
        // Create demo organization
        const { data: newOrg, error: orgError } = await supabase
          .from('organizations')
          .insert({
            name: 'Demo Organization',
            slug: 'demo-organization',
            subscription_tier: 'professional'
          })
          .select()
          .single();

        if (orgError) throw orgError;
        orgId = newOrg.id;
      }

      // Check if demo project exists
      const { data: existingProject } = await supabase
        .from('projects')
        .select('*')
        .eq('name', 'Nordic Datacenter Expansion')
        .single();

      let projectId = existingProject?.id;

      if (!existingProject) {
        // Create demo project
        const { data: newProject, error: projectError } = await supabase
          .from('projects')
          .insert({
            organization_id: orgId,
            name: 'Nordic Datacenter Expansion',
            description: 'Multi-site screening across Finland, Norway, and Sweden',
            country_code: 'FI',
            status: 'active'
          })
          .select()
          .single();

        if (projectError) throw projectError;
        projectId = newProject.id;
      }

      // Create demo sites
      await this.createDemoSites(projectId);

    } catch (error) {
      console.error('Error initializing demo data:', error);
      throw error;
    }
  }

  static async createDemoSites(projectId: string): Promise<void> {
    const demoSites = [
      {
        name: 'Pori Konepajanranta',
        reference_code: 'PORI-001',
        coordinates: [21.7972, 61.4851],
        address: 'Konepajanranta, Pori, Finland',
        municipality: 'Pori',
        region: 'Satakunta',
        country_code: 'FI',
        area_hectares: 15,
        power_requirement_mw: 70,
        assessment_status: 'completed' as const,
        overall_score: 4.2,
        recommendation: 'caution' as const
      },
      {
        name: 'Tampere Industrial',
        reference_code: 'TAMP-001',
        coordinates: [23.7871, 61.4991],
        address: 'Industrial District, Tampere, Finland',
        municipality: 'Tampere',
        region: 'Pirkanmaa',
        country_code: 'FI',
        area_hectares: 12,
        power_requirement_mw: 50,
        assessment_status: 'analyzing' as const
      },
      {
        name: 'Turku Harbor District',
        reference_code: 'TURK-001',
        coordinates: [22.2666, 60.4518],
        address: 'Harbor District, Turku, Finland',
        municipality: 'Turku',
        region: 'Southwest Finland',
        country_code: 'FI',
        area_hectares: 20,
        power_requirement_mw: 100,
        assessment_status: 'pending' as const
      }
    ];

    for (const siteData of demoSites) {
      // Check if site exists
      const { data: existing } = await supabase
        .from('sites')
        .select('*')
        .eq('reference_code', siteData.reference_code)
        .single();

      if (!existing) {
        // Create PostGIS point
        const location = `POINT(${siteData.coordinates[0]} ${siteData.coordinates[1]})`;
        
        const { error } = await supabase
          .from('sites')
          .insert({
            project_id: projectId,
            name: siteData.name,
            reference_code: siteData.reference_code,
            location,
            address: siteData.address,
            municipality: siteData.municipality,
            region: siteData.region,
            country_code: siteData.country_code,
            area_hectares: siteData.area_hectares,
            power_requirement_mw: siteData.power_requirement_mw,
            assessment_status: siteData.assessment_status,
            overall_score: siteData.overall_score,
            recommendation: siteData.recommendation,
            assessment_date: new Date().toISOString()
          });

        if (error) {
          console.error(`Error creating site ${siteData.name}:`, error);
        }
      }
    }
  }

  // Get all sites for a project
  static async getSites(projectId?: string): Promise<Site[]> {
    try {
      let query = supabase
        .from('sites')
        .select(`
          *,
          risk_assessments(*)
        `);

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching sites:', error);
      return [];
    }
  }

  // Get site with constraints
  static async getSiteWithConstraints(siteId: string): Promise<ConstraintAnalysis | null> {
    try {
      const { data: site, error: siteError } = await supabase
        .from('sites')
        .select(`
          *,
          risk_assessments(*)
        `)
        .eq('id', siteId)
        .single();

      if (siteError) throw siteError;

      // For demo purposes, return Pori analysis for Pori site
      if (site.reference_code === 'PORI-001') {
        return generatePoriConstraintAnalysis();
      }

      // For other sites, return basic constraint analysis
      return {
        site_id: site.id,
        site_name: site.name,
        coordinates: this.parsePostGISPoint(site.location),
        constraints: [],
        overall_score: site.overall_score || 5.0,
        recommendation: site.recommendation || 'caution',
        critical_count: 0,
        high_count: 0,
        medium_count: 0,
        low_count: 0,
        analyzed_at: site.assessment_date || site.created_at
      };

    } catch (error) {
      console.error('Error fetching site constraints:', error);
      return null;
    }
  }

  // Create or update site
  static async upsertSite(siteData: Partial<Site>): Promise<Site | null> {
    try {
      const { data, error } = await supabase
        .from('sites')
        .upsert(siteData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error upserting site:', error);
      return null;
    }
  }

  // Create risk assessment
  static async createRiskAssessment(assessment: Partial<RiskAssessment>): Promise<RiskAssessment | null> {
    try {
      const { data, error } = await supabase
        .from('risk_assessments')
        .insert(assessment)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating risk assessment:', error);
      return null;
    }
  }

  // Get projects
  static async getProjects(): Promise<Project[]> {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          sites(count)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching projects:', error);
      return [];
    }
  }

  // Utility: Parse PostGIS point to coordinates
  static parsePostGISPoint(location: any): [number, number] {
    if (typeof location === 'string') {
      // Handle WKT format: "POINT(lng lat)"
      const matches = location.match(/POINT\(([^)]+)\)/);
      if (matches) {
        const [lng, lat] = matches[1].split(' ').map(Number);
        return [lng, lat];
      }
    }
    
    if (location && typeof location === 'object') {
      // Handle GeoJSON format
      if (location.coordinates) {
        return location.coordinates as [number, number];
      }
    }
    
    // Fallback to Pori coordinates
    return [21.7972, 61.4851];
  }

  // Utility: Convert coordinates to PostGIS point
  static coordinatesToPostGIS(coordinates: [number, number]): string {
    return `POINT(${coordinates[0]} ${coordinates[1]})`;
  }

  // Real-time subscriptions
  static subscribeToSites(projectId: string, callback: (sites: Site[]) => void) {
    return supabase
      .channel(`sites_${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sites',
          filter: `project_id=eq.${projectId}`
        },
        () => {
          // Refresh sites when changes occur
          this.getSites(projectId).then(callback);
        }
      )
      .subscribe();
  }

  // Test connection
  static async testConnection(): Promise<boolean> {
    try {
      const { data, error } = await supabase.from('organizations').select('count').limit(1);
      return !error;
    } catch (error) {
      console.error('Supabase connection test failed:', error);
      return false;
    }
  }
}

// Initialize spatial analysis providers with Supabase
export async function initializeSpatialProviders() {
  const { spatialAnalysisManager } = await import('./spatial-analysis');
  const { initializeSpatialProviders } = await import('./spatial-analysis');
  
  initializeSpatialProviders(supabase);
}

// Auto-initialize demo data in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  SupabaseAPI.testConnection().then(connected => {
    if (connected) {
      console.log('✅ Supabase connected successfully');
      // SupabaseAPI.initializeDemoData().catch(console.error);
    } else {
      console.warn('⚠️ Supabase connection failed');
    }
  });
}