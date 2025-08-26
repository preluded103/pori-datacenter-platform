/**
 * Complete Project Lifecycle Data Model
 * End-to-end datacenter development project management
 */

export interface Organization {
  id: string;
  name: string;
  slug: string;
  subscription_tier: 'trial' | 'professional' | 'enterprise';
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  organization_id: string;
  role: 'viewer' | 'analyst' | 'admin';
  created_at: string;
  last_login: string | null;
}

// Main Project Interface
export interface Project {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  country_code: string;
  status: 'draft' | 'active' | 'completed' | 'archived';
  created_by: string;
  created_at: string;
  updated_at: string;
  
  // Computed fields
  sites_count: number;
  sites_assessed: number;
  sites_recommended: number;
  total_capacity_mw: number;
  total_investment_eur: number;
  
  // Related data
  sites?: Site[];
  organization?: Organization;
  creator?: User;
}

// Site within Project
export interface Site {
  id: string;
  project_id: string;
  name: string;
  reference_code: string | null;
  
  // Location (PostGIS Point)
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  boundary?: {
    type: 'Polygon';
    coordinates: number[][][];
  };
  address: string | null;
  municipality: string | null;
  region: string | null;
  country_code: string;
  
  // Requirements
  area_hectares: number | null;
  power_requirement_mw: number | null;
  
  // Assessment
  assessment_status: 'pending' | 'analyzing' | 'completed' | 'error';
  assessment_date: string | null;
  overall_score: number | null;
  recommendation: 'proceed' | 'caution' | 'avoid' | null;
  
  created_at: string;
  updated_at: string;
  
  // Related data
  risk_assessment?: RiskAssessment;
  data_sources?: DataSource[];
}

// Risk Assessment Results
export interface RiskAssessment {
  id: string;
  site_id: string;
  
  // Infrastructure Proximity
  power_substation_distance: number | null;
  power_substation_name: string | null;
  power_voltage_kv: number | null;
  fiber_backbone_distance: number | null;
  fiber_provider: string | null;
  water_source_distance: number | null;
  water_source_type: string | null;
  
  // Transport
  transport_highway_distance: number | null;
  transport_rail_distance: number | null;
  transport_port_distance: number | null;
  transport_airport_distance: number | null;
  
  // Risk Levels
  seismic_risk: 'LOW' | 'MEDIUM' | 'HIGH' | null;
  seismic_zone: string | null;
  seismic_pga: number | null;
  flood_risk: 'LOW' | 'MEDIUM' | 'HIGH' | null;
  flood_zone: string | null;
  flood_return_period: number | null;
  geotechnical_risk: 'LOW' | 'MEDIUM' | 'HIGH' | null;
  soil_type: string | null;
  bedrock_depth: number | null;
  aviation_risk: 'LOW' | 'MEDIUM' | 'HIGH' | null;
  nearest_airport_distance: number | null;
  height_restriction_m: number | null;
  heritage_risk: 'LOW' | 'MEDIUM' | 'HIGH' | null;
  nearest_protected_site_distance: number | null;
  heritage_site_name: string | null;
  emi_risk: 'LOW' | 'MEDIUM' | 'HIGH' | null;
  transmitter_count_5km: number | null;
  nearest_transmitter_distance: number | null;
  
  // Environmental
  protected_area_distance: number | null;
  natura2000_distance: number | null;
  wetland_distance: number | null;
  
  // Regulatory
  zoning_status: string | null;
  zoning_compatible: boolean | null;
  environmental_permit_required: boolean | null;
  water_permit_required: boolean | null;
  
  // Cost Analysis
  infrastructure_cost_min: number | null;
  infrastructure_cost_max: number | null;
  timeline_months_min: number | null;
  timeline_months_max: number | null;
  
  assessed_at: string;
}

// Data Source Tracking
export interface DataSource {
  id: string;
  site_id: string;
  category: string;
  source_name: string;
  source_url: string | null;
  data_date: string | null;
  confidence_level: 'HIGH' | 'MEDIUM' | 'LOW' | null;
  validation_status: 'verified' | 'unverified' | 'failed' | null;
  notes: string | null;
  created_at: string;
}

// Project Reports
export interface ProjectReport {
  id: string;
  project_id: string;
  report_type: 'scorecard' | 'comparison' | 'detailed';
  format: 'pdf' | 'excel' | 'geojson' | 'kmz';
  file_url: string | null;
  metadata: Record<string, any> | null;
  generated_at: string;
  generated_by: string;
}

// Project Creation/Update Forms
export interface CreateProjectRequest {
  name: string;
  description?: string;
  country_code: string;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  status?: Project['status'];
}

export interface CreateSiteRequest {
  name: string;
  reference_code?: string;
  coordinates: [number, number];
  address?: string;
  municipality?: string;
  area_hectares?: number;
  power_requirement_mw?: number;
}

export interface UpdateSiteRequest {
  name?: string;
  reference_code?: string;
  coordinates?: [number, number];
  address?: string;
  municipality?: string;
  area_hectares?: number;
  power_requirement_mw?: number;
}

// UI State Types
export interface ProjectListView {
  projects: Project[];
  loading: boolean;
  error: string | null;
  filters: {
    status?: Project['status'];
    country_code?: string;
    search?: string;
  };
  sorting: {
    field: keyof Project;
    direction: 'asc' | 'desc';
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

export interface ProjectDetailView {
  project: Project | null;
  sites: Site[];
  loading: boolean;
  error: string | null;
  activeTab: 'overview' | 'sites' | 'reports' | 'settings';
}

export interface SiteDetailView {
  site: Site | null;
  risk_assessment: RiskAssessment | null;
  data_sources: DataSource[];
  loading: boolean;
  error: string | null;
  activeView: 'overview' | 'assessment' | 'map' | 'reports';
}

// Assessment Status Types
export interface AssessmentProgress {
  site_id: string;
  status: 'pending' | 'analyzing' | 'completed' | 'error';
  progress_percentage: number;
  current_step: string;
  steps_completed: string[];
  steps_remaining: string[];
  estimated_completion: string | null;
  error_message: string | null;
}

// Workflow States
export type ProjectWorkflowState = 
  | 'setup'      // Initial project creation
  | 'sites'      // Adding/managing sites
  | 'assessment' // Running assessments
  | 'analysis'   // Reviewing results
  | 'reporting'  // Generating reports
  | 'completed'; // Project finished

export type SiteWorkflowState = 
  | 'draft'      // Site created but not assessed
  | 'ready'      // Ready for assessment
  | 'assessing'  // Assessment in progress
  | 'reviewed'   // Assessment complete, under review
  | 'approved'   // Site approved for development
  | 'rejected';  // Site rejected

// API Response Types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  error?: string;
}

export interface ApiListResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
  success: boolean;
  error?: string;
}

// Constraint Analysis (for compatibility with existing demo)
export interface Constraint {
  id: string;
  name: string;
  category: 'power' | 'environmental' | 'regulatory' | 'connectivity';
  severity: 'critical' | 'high' | 'medium' | 'low';
  distance?: number;
  impact: 'blocking' | 'major' | 'moderate' | 'minor';
  description: string;
  mitigation?: string;
  cost_impact?: {
    min: number;
    max: number;
    currency: string;
  };
  timeline_impact?: {
    delay_months: number;
    description: string;
  };
  coordinates?: [number, number];
  metadata?: Record<string, any>;
}

export interface ConstraintAnalysis {
  site_id: string;
  site_name: string;
  coordinates: [number, number];
  constraints: Constraint[];
  overall_score: number;
  recommendation: 'proceed' | 'caution' | 'avoid';
  critical_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
  analyzed_at: string;
}