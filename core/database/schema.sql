-- Datacenter Pre-DD Platform Schema
-- Phase 0 Site Screening Database

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================
-- CORE TABLES
-- ============================================

-- Organizations (Clients)
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    subscription_tier TEXT CHECK (subscription_tier IN ('trial', 'professional', 'enterprise')) DEFAULT 'trial',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    organization_id UUID REFERENCES organizations(id),
    role TEXT CHECK (role IN ('viewer', 'analyst', 'admin')) DEFAULT 'viewer',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_login TIMESTAMPTZ
);

-- Projects (Screening Studies)
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    country_code TEXT NOT NULL, -- ISO 3166-1 alpha-2
    status TEXT CHECK (status IN ('draft', 'active', 'completed', 'archived')) DEFAULT 'draft',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sites (Individual Locations)
CREATE TABLE sites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    reference_code TEXT, -- Client's internal reference
    
    -- Location
    location GEOMETRY(Point, 4326) NOT NULL,
    boundary GEOMETRY(Polygon, 4326),
    address TEXT,
    municipality TEXT,
    region TEXT,
    country_code TEXT NOT NULL,
    
    -- Basic Requirements
    area_hectares DECIMAL,
    power_requirement_mw DECIMAL,
    
    -- Assessment Status
    assessment_status TEXT CHECK (assessment_status IN ('pending', 'analyzing', 'completed', 'error')) DEFAULT 'pending',
    assessment_date TIMESTAMPTZ,
    
    -- Scoring
    overall_score DECIMAL CHECK (overall_score >= 0 AND overall_score <= 10),
    recommendation TEXT CHECK (recommendation IN ('proceed', 'caution', 'avoid')),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create spatial index
CREATE INDEX idx_sites_location ON sites USING GIST(location);
CREATE INDEX idx_sites_boundary ON sites USING GIST(boundary);

-- ============================================
-- RISK ASSESSMENT TABLES
-- ============================================

-- Risk Categories
CREATE TABLE risk_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
    
    -- Infrastructure Proximity (distances in meters)
    power_substation_distance INTEGER,
    power_substation_name TEXT,
    power_voltage_kv INTEGER,
    
    fiber_backbone_distance INTEGER,
    fiber_provider TEXT,
    
    water_source_distance INTEGER,
    water_source_type TEXT,
    
    transport_highway_distance INTEGER,
    transport_rail_distance INTEGER,
    transport_port_distance INTEGER,
    transport_airport_distance INTEGER,
    
    -- Risk Flags (LOW, MEDIUM, HIGH)
    seismic_risk TEXT CHECK (seismic_risk IN ('LOW', 'MEDIUM', 'HIGH')),
    seismic_zone TEXT,
    seismic_pga DECIMAL,
    
    flood_risk TEXT CHECK (flood_risk IN ('LOW', 'MEDIUM', 'HIGH')),
    flood_zone TEXT,
    flood_return_period INTEGER,
    
    geotechnical_risk TEXT CHECK (geotechnical_risk IN ('LOW', 'MEDIUM', 'HIGH')),
    soil_type TEXT,
    bedrock_depth DECIMAL,
    
    aviation_risk TEXT CHECK (aviation_risk IN ('LOW', 'MEDIUM', 'HIGH')),
    nearest_airport_distance INTEGER,
    height_restriction_m INTEGER,
    
    heritage_risk TEXT CHECK (heritage_risk IN ('LOW', 'MEDIUM', 'HIGH')),
    nearest_protected_site_distance INTEGER,
    heritage_site_name TEXT,
    
    emi_risk TEXT CHECK (emi_risk IN ('LOW', 'MEDIUM', 'HIGH')),
    transmitter_count_5km INTEGER,
    nearest_transmitter_distance INTEGER,
    
    -- Environmental
    protected_area_distance INTEGER,
    natura2000_distance INTEGER,
    wetland_distance INTEGER,
    
    -- Regulatory
    zoning_status TEXT,
    zoning_compatible BOOLEAN,
    environmental_permit_required BOOLEAN,
    water_permit_required BOOLEAN,
    
    -- Cost Indicators (EUR millions)
    infrastructure_cost_min DECIMAL,
    infrastructure_cost_max DECIMAL,
    timeline_months_min INTEGER,
    timeline_months_max INTEGER,
    
    assessed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- DATA SOURCE TRACKING
-- ============================================

-- Track data sources used for each assessment
CREATE TABLE data_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
    category TEXT NOT NULL, -- 'power', 'environmental', 'regulatory', etc.
    source_name TEXT NOT NULL,
    source_url TEXT,
    data_date DATE,
    confidence_level TEXT CHECK (confidence_level IN ('HIGH', 'MEDIUM', 'LOW')),
    validation_status TEXT CHECK (validation_status IN ('verified', 'unverified', 'failed')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- COUNTRY CONFIGURATION
-- ============================================

-- Country-specific data sources and rules
CREATE TABLE country_configs (
    country_code TEXT PRIMARY KEY, -- ISO 3166-1 alpha-2
    name TEXT NOT NULL,
    
    -- Coordinate Systems
    primary_crs_epsg INTEGER, -- Primary CRS for this country
    
    -- Data Sources (JSONB for flexibility)
    data_sources JSONB, -- {property: {api: url, type: 'wfs'}, environmental: {...}}
    
    -- Regulatory Framework
    regulatory_matrix JSONB, -- {datacenter_permit: true, eia_threshold_mw: 50, ...}
    
    -- Risk Thresholds
    risk_thresholds JSONB, -- {seismic_high: 0.2, flood_zone: '100yr', ...}
    
    -- Availability
    data_availability TEXT CHECK (data_availability IN ('excellent', 'good', 'limited')),
    
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- RESOURCE LISTS (Learned Data Sources)
-- ============================================

-- Store successful data source configurations
CREATE TABLE resource_lists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    country_code TEXT NOT NULL,
    region TEXT,
    resource_type TEXT NOT NULL, -- 'power', 'environmental', 'zoning', etc.
    
    -- Configuration
    source_name TEXT NOT NULL,
    access_method TEXT, -- 'api', 'wfs', 'download', 'manual'
    endpoint_url TEXT,
    authentication JSONB, -- Encrypted credentials if needed
    
    -- Quality Metrics
    success_rate DECIMAL,
    last_successful_access TIMESTAMPTZ,
    average_response_time_ms INTEGER,
    
    -- Validation
    test_query TEXT,
    expected_fields JSONB,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- AUDIT & COMPLIANCE
-- ============================================

-- Audit trail for compliance
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id UUID,
    changes JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- REPORTS & OUTPUTS
-- ============================================

-- Generated reports
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id),
    report_type TEXT CHECK (report_type IN ('scorecard', 'comparison', 'detailed')),
    format TEXT CHECK (format IN ('pdf', 'excel', 'geojson', 'kmz')),
    file_url TEXT,
    metadata JSONB,
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    generated_by UUID REFERENCES users(id)
);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies (simplified for Phase 0)
CREATE POLICY "Users can view their organization's data" ON projects
    FOR ALL USING (organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
    ));

CREATE POLICY "Users can view their organization's sites" ON sites
    FOR ALL USING (project_id IN (
        SELECT id FROM projects WHERE organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    ));

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX idx_projects_org ON projects(organization_id);
CREATE INDEX idx_sites_project ON sites(project_id);
CREATE INDEX idx_sites_country ON sites(country_code);
CREATE INDEX idx_risk_site ON risk_assessments(site_id);
CREATE INDEX idx_sources_site ON data_sources(site_id);
CREATE INDEX idx_audit_user ON audit_log(user_id);
CREATE INDEX idx_reports_project ON reports(project_id);

-- ============================================
-- INITIAL DATA
-- ============================================

-- Insert Finland configuration as reference
INSERT INTO country_configs (country_code, name, primary_crs_epsg, data_sources, regulatory_matrix, risk_thresholds, data_availability)
VALUES (
    'FI',
    'Finland',
    3067, -- ETRS89 / TM35FIN
    '{
        "property": {
            "name": "Maanmittauslaitos",
            "type": "api",
            "url": "https://avoin-paikkatieto.maanmittauslaitos.fi/",
            "requires_key": true
        },
        "environmental": {
            "name": "SYKE",
            "type": "download",
            "url": "https://www.syke.fi/en-US/Open_information",
            "requires_key": false
        },
        "zoning": {
            "name": "Municipal WFS",
            "type": "wfs",
            "example": "https://kartta.pori.fi/TeklaOGCWeb/WFS.ashx",
            "requires_key": false
        }
    }'::jsonb,
    '{
        "datacenter_permit": true,
        "eia_threshold_mw": 50,
        "water_permit_required": true,
        "grid_connection_process": "Fingrid application required"
    }'::jsonb,
    '{
        "seismic_high_pga": 0.05,
        "flood_high_zone": "100yr",
        "emi_high_transmitters": 5
    }'::jsonb,
    'good'
);