# Datacenter Due Diligence Platform - Database Architecture Plan

## Executive Summary

This document outlines a comprehensive database architecture for transforming the current file-based Pori datacenter analysis into a professional multi-tenant SaaS platform for European datacenter due diligence. The architecture leverages Supabase with PostGIS for enterprise-grade geospatial data management, multi-tenant isolation, and compliance with professional standards (EN 50600, TIA-942-C, RICS).

## 1. Architecture Overview

### 1.1 Core Design Principles
- **Multi-Tenant Row-Level Security**: Client data isolation with shared constraint layers
- **PostGIS-First**: European coordinate systems and spatial analysis optimization
- **Professional Compliance**: GDPR, audit trails, data retention policies
- **Performance-Optimized**: European-scale datasets with real-time analysis capabilities
- **Integration-Ready**: External API management and data freshness tracking

### 1.2 Technology Stack
- **Database**: Supabase PostgreSQL 15+ with PostGIS 3.3+
- **Spatial Extensions**: PostGIS, pg_stat_statements, pg_cron
- **Security**: Row Level Security (RLS), JWT-based authentication
- **Monitoring**: pg_stat_statements, custom performance metrics
- **Backup**: Point-in-time recovery, cross-region replication

## 2. Multi-Tenant Schema Architecture

### 2.1 Tenant Isolation Strategy
**Hybrid Approach**: Row-level tenant isolation with shared reference data

```sql
-- Core tenant schema
CREATE SCHEMA tenant_core;
CREATE SCHEMA shared_reference;
CREATE SCHEMA system_admin;
```

### 2.2 Tenant Management Tables

```sql
-- Organizations (clients)
CREATE TABLE tenant_core.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(50) UNIQUE NOT NULL, -- e.g., 'client-abc'
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255),
    subscription_tier VARCHAR(50) NOT NULL DEFAULT 'professional',
    max_projects INTEGER DEFAULT 10,
    max_storage_gb INTEGER DEFAULT 100,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    
    -- GDPR compliance
    data_retention_years INTEGER DEFAULT 7,
    data_processing_agreement_signed BOOLEAN DEFAULT FALSE,
    
    -- Professional standards
    certification_level VARCHAR(50), -- 'rics', 'cibse', 'ieee'
    compliance_frameworks TEXT[] -- ['en_50600', 'tia_942c']
);

-- Users within organizations
CREATE TABLE tenant_core.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(50) REFERENCES tenant_core.organizations(tenant_id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'analyst', -- 'admin', 'senior_analyst', 'analyst', 'viewer'
    professional_credentials JSONB, -- RICS, CIBSE, IEEE memberships
    access_level VARCHAR(50) NOT NULL DEFAULT 'standard', -- 'full', 'standard', 'restricted'
    
    -- Audit trail
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_login TIMESTAMPTZ,
    created_by UUID,
    
    -- GDPR
    consent_given BOOLEAN DEFAULT FALSE,
    consent_date TIMESTAMPTZ
);
```

### 2.3 Project Management Schema

```sql
-- Projects are tenant-scoped
CREATE TABLE tenant_core.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    project_code VARCHAR(50) NOT NULL, -- Client's internal reference
    
    -- Geographic scope
    country_code CHAR(2) NOT NULL, -- ISO 3166-1
    region VARCHAR(100),
    
    -- Project metadata
    project_type VARCHAR(50) NOT NULL, -- 'hyperscale', 'colocation', 'edge'
    phase VARCHAR(50) NOT NULL DEFAULT 'feasibility', -- 'feasibility', 'due_diligence', 'detailed', 'completed'
    priority VARCHAR(20) DEFAULT 'medium',
    
    -- Professional standards
    compliance_framework VARCHAR(50), -- 'en_50600', 'tia_942c'
    required_tier VARCHAR(10), -- 'tier_i', 'tier_ii', 'tier_iii', 'tier_iv'
    
    -- Spatial bounds (project area of interest)
    study_area_geom GEOMETRY(POLYGON, 4326),
    primary_site_geom GEOMETRY(POLYGON, 4326),
    
    -- Timeline
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deadline TIMESTAMPTZ,
    
    -- Team assignments
    project_lead UUID REFERENCES tenant_core.users(id),
    team_members UUID[],
    
    -- Status tracking
    is_active BOOLEAN DEFAULT TRUE,
    completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
    
    -- Constraints
    UNIQUE(tenant_id, project_code)
);
```

## 3. PostGIS Spatial Schema

### 3.1 Coordinate Reference Systems
**Primary CRS Strategy**: Support major European CRS with automatic transformation

```sql
-- Insert European CRS definitions
INSERT INTO spatial_ref_sys (srid, auth_name, auth_srid, proj4text, srtext) VALUES 
(3067, 'EPSG', 3067, '+proj=utm +zone=35 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs', 'PROJCS["ETRS89 / UTM zone 35N (Finland)"]'),
(25832, 'EPSG', 25832, '+proj=utm +zone=32 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs', 'PROJCS["ETRS89 / UTM zone 32N (Germany)"]');

-- Function for automatic CRS detection
CREATE OR REPLACE FUNCTION shared_reference.get_optimal_crs(geom GEOMETRY)
RETURNS INTEGER AS $$
BEGIN
    -- Logic to determine best local CRS based on centroid
    -- Returns appropriate EPSG code for the region
END;
$$ LANGUAGE plpgsql;
```

### 3.2 Spatial Constraint Layers (Shared Reference Data)

```sql
-- Shared constraint layers across all tenants
CREATE TABLE shared_reference.constraint_layers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    layer_name VARCHAR(100) NOT NULL,
    layer_type VARCHAR(50) NOT NULL, -- 'exclusion', 'limitation', 'preference'
    country_code CHAR(2) NOT NULL,
    
    -- Data source tracking
    source_authority VARCHAR(100), -- 'fingrid', 'elia', 'rte'
    source_dataset VARCHAR(100),
    data_vintage DATE,
    update_frequency VARCHAR(50), -- 'daily', 'weekly', 'monthly', 'annual'
    last_updated TIMESTAMPTZ,
    
    -- Professional standards compliance
    meets_en_50600 BOOLEAN DEFAULT FALSE,
    meets_tia_942c BOOLEAN DEFAULT FALSE,
    
    -- Spatial index
    geom GEOMETRY(MULTIPOLYGON, 4326),
    
    -- Metadata
    description TEXT,
    impact_severity VARCHAR(20), -- 'critical', 'high', 'medium', 'low'
    buffer_distance_m INTEGER DEFAULT 0
);

-- Spatial index on constraint geometries
CREATE INDEX idx_constraint_layers_geom ON shared_reference.constraint_layers USING GIST (geom);
CREATE INDEX idx_constraint_layers_country ON shared_reference.constraint_layers (country_code);
CREATE INDEX idx_constraint_layers_type ON shared_reference.constraint_layers (layer_type);
```

### 3.3 Infrastructure Layers

```sql
-- Power infrastructure (shared reference)
CREATE TABLE shared_reference.power_infrastructure (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    infrastructure_type VARCHAR(50) NOT NULL, -- 'substation', 'transmission_line', 'generation'
    voltage_kv INTEGER,
    capacity_mva DECIMAL(10,2),
    operator VARCHAR(100),
    country_code CHAR(2) NOT NULL,
    
    -- Spatial data
    geom GEOMETRY(POINT, 4326), -- For substations/generation
    line_geom GEOMETRY(LINESTRING, 4326), -- For transmission lines
    
    -- Technical specifications
    technical_specs JSONB,
    availability_status VARCHAR(20) DEFAULT 'operational',
    
    -- Data provenance
    source_authority VARCHAR(100),
    last_verified TIMESTAMPTZ,
    confidence_level VARCHAR(20) -- 'high', 'medium', 'low'
);

-- Water infrastructure
CREATE TABLE shared_reference.water_infrastructure (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    infrastructure_type VARCHAR(50) NOT NULL, -- 'treatment_plant', 'distribution', 'source'
    capacity_m3_per_day DECIMAL(12,2),
    water_quality_grade VARCHAR(20),
    operator VARCHAR(100),
    
    geom GEOMETRY(POINT, 4326),
    service_area GEOMETRY(POLYGON, 4326),
    
    -- Technical specs
    treatment_capabilities TEXT[],
    peak_capacity_m3_per_day DECIMAL(12,2),
    reliability_score DECIMAL(3,2) -- 0.00-1.00
);
```

## 4. Project-Specific Analysis Tables

### 4.1 Site Analysis Results

```sql
-- Tenant-scoped site analysis results
CREATE TABLE tenant_core.site_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(50) NOT NULL,
    project_id UUID REFERENCES tenant_core.projects(id) ON DELETE CASCADE,
    
    -- Site definition
    site_name VARCHAR(255) NOT NULL,
    site_boundary GEOMETRY(POLYGON, 4326) NOT NULL,
    site_centroid GEOMETRY(POINT, 4326) NOT NULL,
    local_crs INTEGER, -- Optimal CRS for detailed analysis
    
    -- Analysis parameters
    analysis_type VARCHAR(50) NOT NULL, -- 'preliminary', 'detailed', 'final'
    analysis_date TIMESTAMPTZ DEFAULT NOW(),
    analyst_id UUID REFERENCES tenant_core.users(id),
    
    -- Results summary
    overall_feasibility_score DECIMAL(3,2), -- 0.00-1.00
    risk_level VARCHAR(20), -- 'low', 'medium', 'high', 'critical'
    
    -- Compliance assessment
    en_50600_compliance JSONB, -- Detailed compliance breakdown
    tia_942c_compliance JSONB,
    
    -- Constraint analysis results
    exclusion_constraints INTEGER DEFAULT 0,
    limitation_constraints INTEGER DEFAULT 0,
    total_buildable_area_m2 DECIMAL(12,2),
    
    -- Infrastructure access scores
    power_access_score DECIMAL(3,2),
    water_access_score DECIMAL(3,2),
    telecom_access_score DECIMAL(3,2),
    transport_access_score DECIMAL(3,2),
    
    -- Version control
    version INTEGER DEFAULT 1,
    is_current_version BOOLEAN DEFAULT TRUE,
    superseded_by UUID REFERENCES tenant_core.site_analyses(id),
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.2 Constraint Impact Analysis

```sql
-- Detailed constraint impacts per site
CREATE TABLE tenant_core.constraint_impacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(50) NOT NULL,
    site_analysis_id UUID REFERENCES tenant_core.site_analyses(id) ON DELETE CASCADE,
    constraint_layer_id UUID REFERENCES shared_reference.constraint_layers(id),
    
    -- Spatial relationship
    intersection_geom GEOMETRY(MULTIPOLYGON, 4326),
    intersection_area_m2 DECIMAL(12,2),
    affected_percentage DECIMAL(5,2), -- Percentage of site affected
    
    -- Impact assessment
    impact_severity VARCHAR(20), -- 'exclusion', 'major', 'moderate', 'minor'
    mitigation_possible BOOLEAN DEFAULT FALSE,
    mitigation_cost_eur DECIMAL(12,2),
    mitigation_notes TEXT,
    
    -- Professional assessment
    requires_specialist_review BOOLEAN DEFAULT FALSE,
    specialist_comments TEXT,
    approved_by UUID REFERENCES tenant_core.users(id),
    approval_date TIMESTAMPTZ
);
```

## 5. Row Level Security (RLS) Implementation

### 5.1 Tenant Isolation Policies

```sql
-- Enable RLS on all tenant tables
ALTER TABLE tenant_core.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_core.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_core.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_core.site_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_core.constraint_impacts ENABLE ROW LEVEL SECURITY;

-- Base tenant isolation policy
CREATE POLICY tenant_isolation_organizations ON tenant_core.organizations
    FOR ALL 
    TO authenticated
    USING (
        tenant_id = COALESCE(
            current_setting('app.current_tenant', true),
            (auth.jwt() ->> 'tenant_id')
        )
    );

-- User access policy with role-based permissions
CREATE POLICY user_tenant_access ON tenant_core.users
    FOR ALL
    TO authenticated
    USING (
        tenant_id = COALESCE(
            current_setting('app.current_tenant', true),
            (auth.jwt() ->> 'tenant_id')
        )
        AND 
        CASE 
            WHEN (auth.jwt() ->> 'role') = 'admin' THEN true
            WHEN (auth.jwt() ->> 'role') = 'senior_analyst' THEN true
            WHEN (auth.jwt() ->> 'role') = 'analyst' THEN 
                id = (auth.jwt() ->> 'user_id')::uuid OR 
                access_level IN ('standard', 'restricted')
            ELSE id = (auth.jwt() ->> 'user_id')::uuid
        END
    );

-- Project access with team membership
CREATE POLICY project_team_access ON tenant_core.projects
    FOR ALL
    TO authenticated
    USING (
        tenant_id = COALESCE(
            current_setting('app.current_tenant', true),
            (auth.jwt() ->> 'tenant_id')
        )
        AND (
            project_lead = (auth.jwt() ->> 'user_id')::uuid OR
            (auth.jwt() ->> 'user_id')::uuid = ANY(team_members) OR
            (auth.jwt() ->> 'role') IN ('admin', 'senior_analyst')
        )
    );
```

### 5.2 Professional Access Control

```sql
-- Function to check professional credentials
CREATE OR REPLACE FUNCTION tenant_core.has_required_credentials(
    required_creds TEXT[],
    user_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    user_creds JSONB;
    cred TEXT;
BEGIN
    SELECT professional_credentials INTO user_creds
    FROM tenant_core.users WHERE id = user_id;
    
    FOREACH cred IN ARRAY required_creds LOOP
        IF NOT (user_creds ? cred) THEN
            RETURN FALSE;
        END IF;
    END LOOP;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policy for high-stakes analysis requiring professional credentials
CREATE POLICY professional_analysis_access ON tenant_core.site_analyses
    FOR UPDATE
    TO authenticated
    USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')
        AND (
            (auth.jwt() ->> 'role') = 'admin' OR
            tenant_core.has_required_credentials(
                ARRAY['rics', 'cibse'],
                (auth.jwt() ->> 'user_id')::uuid
            )
        )
    );
```

## 6. Performance Optimization Strategy

### 6.1 Spatial Indexing Strategy

```sql
-- Multi-level spatial indexing for European scale
CREATE INDEX CONCURRENTLY idx_site_analyses_geom_gist 
    ON tenant_core.site_analyses USING GIST (site_boundary);
    
CREATE INDEX CONCURRENTLY idx_site_analyses_centroid 
    ON tenant_core.site_analyses USING GIST (site_centroid);

-- Composite indexes for common queries
CREATE INDEX CONCURRENTLY idx_projects_tenant_active 
    ON tenant_core.projects (tenant_id, is_active) 
    WHERE is_active = TRUE;
    
CREATE INDEX CONCURRENTLY idx_site_analyses_project_current 
    ON tenant_core.site_analyses (project_id, is_current_version, analysis_type)
    WHERE is_current_version = TRUE;

-- Constraint layer optimization
CREATE INDEX CONCURRENTLY idx_constraint_layers_country_type_geom 
    ON shared_reference.constraint_layers (country_code, layer_type) 
    INCLUDE (geom);
```

### 6.2 Query Optimization Functions

```sql
-- Optimized spatial intersection query
CREATE OR REPLACE FUNCTION tenant_core.get_site_constraints(
    site_geom GEOMETRY,
    p_tenant_id VARCHAR(50),
    p_country_code CHAR(2) DEFAULT NULL
) RETURNS TABLE (
    constraint_id UUID,
    layer_name VARCHAR(100),
    impact_severity VARCHAR(20),
    intersection_area DECIMAL(12,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cl.id,
        cl.layer_name,
        cl.impact_severity,
        ST_Area(ST_Intersection(cl.geom, site_geom))::DECIMAL(12,2)
    FROM shared_reference.constraint_layers cl
    WHERE 
        ST_Intersects(cl.geom, site_geom)
        AND (p_country_code IS NULL OR cl.country_code = p_country_code)
        AND ST_Area(ST_Intersection(cl.geom, site_geom)) > 100; -- Minimum 100 m²
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 6.3 Materialized Views for Performance

```sql
-- Pre-computed project statistics
CREATE MATERIALIZED VIEW tenant_core.mv_project_statistics AS
SELECT 
    p.tenant_id,
    p.id AS project_id,
    p.name AS project_name,
    COUNT(sa.id) AS total_sites_analyzed,
    AVG(sa.overall_feasibility_score) AS avg_feasibility_score,
    COUNT(CASE WHEN sa.risk_level = 'low' THEN 1 END) AS low_risk_sites,
    COUNT(CASE WHEN sa.risk_level = 'high' THEN 1 END) AS high_risk_sites,
    MAX(sa.updated_at) AS last_analysis_date
FROM tenant_core.projects p
LEFT JOIN tenant_core.site_analyses sa ON p.id = sa.project_id 
    AND sa.is_current_version = TRUE
WHERE p.is_active = TRUE
GROUP BY p.tenant_id, p.id, p.name;

-- Refresh policy
CREATE INDEX ON tenant_core.mv_project_statistics (tenant_id, project_id);
```

## 7. Data Integration & External Sources

### 7.1 External Data Source Management

```sql
-- Track external data sources and freshness
CREATE TABLE shared_reference.external_data_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_name VARCHAR(100) NOT NULL,
    source_type VARCHAR(50) NOT NULL, -- 'wfs', 'rest_api', 'file_download'
    country_code CHAR(2),
    authority VARCHAR(100),
    
    -- Connection details
    endpoint_url VARCHAR(500),
    api_key_required BOOLEAN DEFAULT FALSE,
    authentication_method VARCHAR(50), -- 'none', 'api_key', 'oauth2'
    
    -- Data freshness
    update_schedule CRON,
    last_successful_update TIMESTAMPTZ,
    next_scheduled_update TIMESTAMPTZ,
    
    -- Quality metrics
    reliability_score DECIMAL(3,2), -- 0.00-1.00
    average_response_time_ms INTEGER,
    last_error_message TEXT,
    consecutive_failures INTEGER DEFAULT 0,
    
    -- Metadata
    data_format VARCHAR(50), -- 'geojson', 'shapefile', 'gml'
    coordinate_system INTEGER, -- EPSG code
    feature_count_estimate INTEGER
);

-- Data ingestion log
CREATE TABLE shared_reference.data_ingestion_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID REFERENCES shared_reference.external_data_sources(id),
    ingestion_date TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ingestion metrics
    records_processed INTEGER,
    records_inserted INTEGER,
    records_updated INTEGER,
    records_failed INTEGER,
    
    -- Performance
    processing_time_seconds INTEGER,
    data_size_mb DECIMAL(10,2),
    
    -- Status
    status VARCHAR(20), -- 'success', 'partial', 'failed'
    error_details JSONB,
    
    -- Data quality checks
    geometry_validation_passed BOOLEAN,
    attribute_validation_passed BOOLEAN,
    completeness_score DECIMAL(3,2)
);
```

### 7.2 Automated Data Pipeline Functions

```sql
-- Function to refresh external constraint data
CREATE OR REPLACE FUNCTION shared_reference.refresh_constraint_layer(
    p_source_id UUID
) RETURNS JSONB AS $$
DECLARE
    source_config RECORD;
    ingestion_result JSONB;
    start_time TIMESTAMPTZ;
BEGIN
    start_time := NOW();
    
    -- Get source configuration
    SELECT * INTO source_config 
    FROM shared_reference.external_data_sources 
    WHERE id = p_source_id;
    
    -- Implementation would handle WFS/API calls
    -- This is a framework for the actual ingestion logic
    
    -- Log the ingestion attempt
    INSERT INTO shared_reference.data_ingestion_log (
        source_id,
        processing_time_seconds,
        status
    ) VALUES (
        p_source_id,
        EXTRACT(EPOCH FROM (NOW() - start_time))::INTEGER,
        'success'
    );
    
    RETURN jsonb_build_object(
        'status', 'success',
        'processing_time', EXTRACT(EPOCH FROM (NOW() - start_time))
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## 8. Audit Trail & GDPR Compliance

### 8.1 Comprehensive Audit Logging

```sql
-- Audit trail for all data modifications
CREATE TABLE system_admin.audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(50),
    user_id UUID,
    table_name VARCHAR(100) NOT NULL,
    record_id UUID,
    action VARCHAR(20) NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
    
    -- Change tracking
    old_values JSONB,
    new_values JSONB,
    changed_fields TEXT[],
    
    -- Context
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(100),
    
    -- Professional requirements
    professional_review_required BOOLEAN DEFAULT FALSE,
    business_justification TEXT,
    
    -- GDPR compliance
    lawful_basis VARCHAR(50), -- 'legitimate_interest', 'contract', 'consent'
    data_subject_id UUID,
    retention_period_years INTEGER DEFAULT 7
);

-- Indexes for audit queries
CREATE INDEX idx_audit_log_tenant_table ON system_admin.audit_log (tenant_id, table_name);
CREATE INDEX idx_audit_log_user_timestamp ON system_admin.audit_log (user_id, timestamp);
CREATE INDEX idx_audit_log_record ON system_admin.audit_log (table_name, record_id);
```

### 8.2 Automated Audit Triggers

```sql
-- Generic audit trigger function
CREATE OR REPLACE FUNCTION system_admin.audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
    audit_row system_admin.audit_log%ROWTYPE;
    old_data JSONB;
    new_data JSONB;
    excluded_cols TEXT[] := ARRAY['updated_at', 'last_login'];
BEGIN
    -- Build audit record
    audit_row.table_name = TG_TABLE_NAME;
    audit_row.action = TG_OP;
    audit_row.tenant_id = COALESCE(
        current_setting('app.current_tenant', true),
        (auth.jwt() ->> 'tenant_id')
    );
    audit_row.user_id = (auth.jwt() ->> 'user_id')::UUID;
    audit_row.timestamp = NOW();
    
    -- Handle different operations
    IF TG_OP = 'DELETE' THEN
        audit_row.record_id = OLD.id;
        audit_row.old_values = to_jsonb(OLD.*);
        
    ELSIF TG_OP = 'INSERT' THEN
        audit_row.record_id = NEW.id;
        audit_row.new_values = to_jsonb(NEW.*);
        
    ELSIF TG_OP = 'UPDATE' THEN
        audit_row.record_id = NEW.id;
        audit_row.old_values = to_jsonb(OLD.*);
        audit_row.new_values = to_jsonb(NEW.*);
        
        -- Identify changed fields
        SELECT array_agg(key) INTO audit_row.changed_fields
        FROM jsonb_each(audit_row.old_values) old_val
        JOIN jsonb_each(audit_row.new_values) new_val ON old_val.key = new_val.key
        WHERE old_val.value != new_val.value
        AND old_val.key != ALL(excluded_cols);
    END IF;
    
    -- Insert audit record
    INSERT INTO system_admin.audit_log SELECT audit_row.*;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit triggers to sensitive tables
CREATE TRIGGER audit_organizations 
    AFTER INSERT OR UPDATE OR DELETE ON tenant_core.organizations
    FOR EACH ROW EXECUTE FUNCTION system_admin.audit_trigger_function();

CREATE TRIGGER audit_site_analyses 
    AFTER INSERT OR UPDATE OR DELETE ON tenant_core.site_analyses
    FOR EACH ROW EXECUTE FUNCTION system_admin.audit_trigger_function();
```

## 9. Migration Strategy

### 9.1 Migration from File-Based System

```sql
-- Migration tracking
CREATE TABLE system_admin.migration_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_name VARCHAR(100) NOT NULL,
    source_type VARCHAR(50) NOT NULL, -- 'pori_analysis', 'excel_data', 'geojson'
    tenant_id VARCHAR(50) NOT NULL,
    
    -- Migration metrics
    total_records INTEGER,
    processed_records INTEGER DEFAULT 0,
    successful_records INTEGER DEFAULT 0,
    failed_records INTEGER DEFAULT 0,
    
    -- Status tracking
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed'
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    error_summary TEXT,
    
    -- File references
    source_file_paths TEXT[],
    validation_report_path VARCHAR(500)
);

-- Migration validation function
CREATE OR REPLACE FUNCTION system_admin.validate_migration_data(
    p_batch_id UUID
) RETURNS JSONB AS $$
DECLARE
    validation_results JSONB := jsonb_build_object();
    batch_info RECORD;
BEGIN
    SELECT * INTO batch_info FROM system_admin.migration_batches WHERE id = p_batch_id;
    
    -- Validation logic would include:
    -- - Geometry validation
    -- - Coordinate system verification
    -- - Required field presence
    -- - Data type consistency
    -- - Business rule validation
    
    RETURN validation_results;
END;
$$ LANGUAGE plpgsql;
```

### 9.2 Phased Migration Approach

**Phase 1: Core Structure**
1. Create tenant and user accounts
2. Migrate basic project metadata
3. Establish spatial reference framework

**Phase 2: Spatial Data Migration**
1. Import existing site boundaries
2. Validate and transform coordinate systems
3. Create baseline constraint layer references

**Phase 3: Analysis Results Migration**
1. Import existing feasibility assessments
2. Recreate analysis parameters and results
3. Establish audit trails for migrated data

**Phase 4: Integration Setup**
1. Configure external data source connections
2. Implement automated refresh schedules
3. Validate data quality and completeness

## 10. Backup & Disaster Recovery

### 10.1 Backup Strategy

```sql
-- Backup monitoring
CREATE TABLE system_admin.backup_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    backup_type VARCHAR(50) NOT NULL, -- 'full', 'incremental', 'spatial'
    backup_date TIMESTAMPTZ DEFAULT NOW(),
    
    -- Backup metrics
    database_size_gb DECIMAL(10,2),
    backup_size_gb DECIMAL(10,2),
    compression_ratio DECIMAL(4,3),
    backup_duration_minutes INTEGER,
    
    -- Status
    status VARCHAR(20), -- 'completed', 'failed', 'in_progress'
    backup_location VARCHAR(500),
    retention_until TIMESTAMPTZ,
    
    -- Verification
    verification_status VARCHAR(20), -- 'passed', 'failed', 'pending'
    recovery_tested BOOLEAN DEFAULT FALSE,
    
    -- Cross-region replication
    replicated_to_regions TEXT[],
    replication_lag_minutes INTEGER
);
```

### 10.2 Point-in-Time Recovery Configuration

```sql
-- Function to estimate recovery time for specific tenant
CREATE OR REPLACE FUNCTION system_admin.estimate_recovery_time(
    p_tenant_id VARCHAR(50),
    p_target_timestamp TIMESTAMPTZ
) RETURNS JSONB AS $$
DECLARE
    tenant_data_size DECIMAL(10,2);
    estimated_minutes INTEGER;
BEGIN
    -- Calculate tenant data size
    SELECT 
        SUM(pg_total_relation_size(schemaname||'.'||tablename)) / (1024^3)::DECIMAL(10,2)
    INTO tenant_data_size
    FROM pg_tables 
    WHERE schemaname = 'tenant_core';
    
    -- Estimate recovery time (rough calculation)
    estimated_minutes := (tenant_data_size * 2)::INTEGER; -- 2 minutes per GB estimate
    
    RETURN jsonb_build_object(
        'tenant_id', p_tenant_id,
        'data_size_gb', tenant_data_size,
        'estimated_recovery_minutes', estimated_minutes,
        'target_timestamp', p_target_timestamp
    );
END;
$$ LANGUAGE plpgsql;
```

## 11. Performance Monitoring & Optimization

### 11.1 Custom Performance Metrics

```sql
-- Query performance tracking
CREATE TABLE system_admin.query_performance_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(50),
    query_type VARCHAR(100), -- 'site_analysis', 'constraint_check', 'project_summary'
    
    -- Performance metrics
    execution_time_ms INTEGER,
    rows_examined INTEGER,
    rows_returned INTEGER,
    memory_usage_mb DECIMAL(10,2),
    
    -- Query details
    query_hash VARCHAR(64), -- MD5 hash of normalized query
    query_plan_hash VARCHAR(64),
    index_usage JSONB, -- Which indexes were used
    
    -- Context
    executed_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID,
    
    -- Geospatial specifics
    spatial_operation VARCHAR(50), -- 'intersection', 'buffer', 'within'
    geometry_complexity_score INTEGER, -- Number of vertices
    coordinate_system INTEGER
);

-- Performance monitoring function
CREATE OR REPLACE FUNCTION system_admin.log_query_performance(
    p_tenant_id VARCHAR(50),
    p_query_type VARCHAR(100),
    p_execution_time_ms INTEGER,
    p_additional_metrics JSONB DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
    INSERT INTO system_admin.query_performance_log (
        tenant_id,
        query_type,
        execution_time_ms,
        rows_examined,
        rows_returned
    ) VALUES (
        p_tenant_id,
        p_query_type,
        p_execution_time_ms,
        (p_additional_metrics->>'rows_examined')::INTEGER,
        (p_additional_metrics->>'rows_returned')::INTEGER
    );
    
    -- Alert if performance degradation detected
    IF p_execution_time_ms > 5000 THEN -- 5 second threshold
        -- Insert into alerts table or trigger notification
        PERFORM system_admin.create_performance_alert(
            p_tenant_id, 
            'slow_query', 
            format('Query type %s took %s ms', p_query_type, p_execution_time_ms)
        );
    END IF;
END;
$$ LANGUAGE plpgsql;
```

### 11.2 Automated Optimization

```sql
-- Index usage analysis
CREATE OR REPLACE FUNCTION system_admin.analyze_index_usage()
RETURNS TABLE (
    schemaname VARCHAR,
    tablename VARCHAR,
    indexname VARCHAR,
    index_scans BIGINT,
    table_scans BIGINT,
    usage_ratio DECIMAL(5,4),
    recommendation TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.schemaname::VARCHAR,
        s.relname::VARCHAR,
        s.indexrelname::VARCHAR,
        s.idx_scan,
        t.seq_scan,
        CASE 
            WHEN t.seq_scan + s.idx_scan > 0 
            THEN s.idx_scan::DECIMAL / (t.seq_scan + s.idx_scan)
            ELSE 0 
        END,
        CASE 
            WHEN s.idx_scan = 0 AND t.seq_scan > 1000 THEN 'Consider dropping unused index'
            WHEN s.idx_scan::DECIMAL / NULLIF(t.seq_scan + s.idx_scan, 0) < 0.1 THEN 'Low usage - review necessity'
            ELSE 'Index performing well'
        END::TEXT
    FROM pg_stat_user_indexes s
    JOIN pg_stat_user_tables t ON s.relid = t.relid
    WHERE s.schemaname IN ('tenant_core', 'shared_reference')
    ORDER BY s.idx_scan DESC;
END;
$$ LANGUAGE plpgsql;
```

## 12. Implementation Roadmap

### Phase 1: Foundation (Weeks 1-2)
1. **Database Setup**
   - Supabase project creation with PostGIS extension
   - Basic schema creation (tenant_core, shared_reference, system_admin)
   - Initial RLS policies implementation

2. **Core Tables**
   - Organizations and users tables
   - Basic project management structure
   - Audit logging framework

### Phase 2: Spatial Foundation (Weeks 3-4)
1. **PostGIS Configuration**
   - European coordinate system setup
   - Spatial indexing strategy implementation
   - Basic constraint layer structure

2. **Performance Optimization**
   - Initial index creation
   - Query optimization functions
   - Performance monitoring setup

### Phase 3: Advanced Features (Weeks 5-6)
1. **Analysis Engine**
   - Site analysis tables and functions
   - Constraint impact calculation
   - Professional compliance tracking

2. **External Integration**
   - Data source management system
   - Automated refresh mechanisms
   - Data quality monitoring

### Phase 4: Migration & Production (Weeks 7-8)
1. **Data Migration**
   - Migration framework implementation
   - Pori project data import
   - Validation and quality assurance

2. **Production Readiness**
   - Backup and recovery testing
   - Performance optimization
   - Security audit and compliance verification

## 13. Success Metrics & Monitoring

### 13.1 Key Performance Indicators

**Technical Metrics:**
- Query response time < 2 seconds for standard analyses
- Spatial intersection calculations < 5 seconds for complex geometries
- Database uptime > 99.9%
- Cross-region replication lag < 5 minutes

**Business Metrics:**
- Multi-tenant data isolation 100% effective
- GDPR compliance audit score > 95%
- Professional standard compliance tracking accuracy
- User satisfaction with query performance

### 13.2 Automated Health Checks

```sql
-- Database health monitoring
CREATE OR REPLACE FUNCTION system_admin.database_health_check()
RETURNS JSONB AS $$
DECLARE
    health_report JSONB := jsonb_build_object();
    connection_count INTEGER;
    slow_query_count INTEGER;
    replication_lag INTEGER;
BEGIN
    -- Connection monitoring
    SELECT count(*) INTO connection_count FROM pg_stat_activity;
    
    -- Slow query detection
    SELECT count(*) INTO slow_query_count 
    FROM system_admin.query_performance_log 
    WHERE execution_time_ms > 5000 AND executed_at > NOW() - INTERVAL '1 hour';
    
    -- Build health report
    health_report := jsonb_build_object(
        'timestamp', NOW(),
        'database_connections', connection_count,
        'slow_queries_last_hour', slow_query_count,
        'overall_status', CASE 
            WHEN connection_count < 80 AND slow_query_count < 10 THEN 'healthy'
            WHEN connection_count < 90 AND slow_query_count < 20 THEN 'warning'
            ELSE 'critical'
        END
    );
    
    RETURN health_report;
END;
$$ LANGUAGE plpgsql;
```

This comprehensive database architecture provides a solid foundation for scaling from the current Pori analysis to a professional multi-tenant European datacenter due diligence platform. The design prioritizes data integrity, performance, compliance, and professional standards while maintaining the flexibility to adapt to evolving business requirements.

The architecture supports the transition from file-based analysis to a robust database-driven system that can handle multiple clients, complex spatial analyses, and professional-grade reporting requirements across the European market.