-- ============================================
-- Spatial Analysis Functions for PostGIS
-- Advanced geospatial operations for datacenter site screening
-- ============================================

-- Enable PostGIS extensions if not already enabled
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;

-- ============================================
-- SPATIAL ANALYSIS RESULTS TRACKING
-- ============================================

-- Table to store spatial analysis requests and results
CREATE TABLE IF NOT EXISTS spatial_analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operation_type TEXT NOT NULL,
    parameters JSONB,
    input_layers JSONB,
    result JSONB,
    status TEXT CHECK (status IN ('pending', 'processing', 'completed', 'error')) DEFAULT 'pending',
    error TEXT,
    execution_time INTEGER, -- milliseconds
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    user_id UUID REFERENCES auth.users(id)
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_spatial_analyses_status ON spatial_analyses(status);
CREATE INDEX IF NOT EXISTS idx_spatial_analyses_type ON spatial_analyses(operation_type);
CREATE INDEX IF NOT EXISTS idx_spatial_analyses_user ON spatial_analyses(user_id);

-- ============================================
-- BUFFER ANALYSIS
-- ============================================

-- Create buffer around geometry with multiple distance support
CREATE OR REPLACE FUNCTION spatial_buffer(
    input_geojson JSONB,
    buffer_distance NUMERIC,
    buffer_units TEXT DEFAULT 'meters',
    output_format TEXT DEFAULT 'geojson'
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    input_geom GEOMETRY;
    buffered_geom GEOMETRY;
    result JSONB;
BEGIN
    -- Convert GeoJSON to PostGIS geometry
    input_geom := ST_GeomFromGeoJSON(input_geojson::TEXT);
    
    -- Transform to appropriate projected CRS for accurate buffer
    -- Use Web Mercator for global compatibility, or local UTM for precision
    IF ST_SRID(input_geom) = 4326 THEN
        input_geom := ST_Transform(input_geom, 3857); -- Web Mercator
    END IF;
    
    -- Convert distance to meters if needed
    CASE buffer_units
        WHEN 'kilometers' THEN buffer_distance := buffer_distance * 1000;
        WHEN 'miles' THEN buffer_distance := buffer_distance * 1609.34;
        WHEN 'feet' THEN buffer_distance := buffer_distance * 0.3048;
        ELSE -- meters is default
    END CASE;
    
    -- Create buffer
    buffered_geom := ST_Buffer(input_geom, buffer_distance);
    
    -- Transform back to WGS84
    buffered_geom := ST_Transform(buffered_geom, 4326);
    
    -- Return as GeoJSON
    result := ST_AsGeoJSON(buffered_geom)::JSONB;
    
    RETURN result;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Buffer analysis failed: %', SQLERRM;
END;
$$;

-- Multi-ring buffer analysis
CREATE OR REPLACE FUNCTION spatial_multi_buffer(
    input_geojson JSONB,
    buffer_distances NUMERIC[],
    buffer_units TEXT DEFAULT 'meters'
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    input_geom GEOMETRY;
    buffer_geom GEOMETRY;
    result_features JSONB := '[]'::JSONB;
    distance NUMERIC;
    i INTEGER;
BEGIN
    -- Convert input to geometry
    input_geom := ST_GeomFromGeoJSON(input_geojson::TEXT);
    
    -- Transform to projected CRS
    IF ST_SRID(input_geom) = 4326 THEN
        input_geom := ST_Transform(input_geom, 3857);
    END IF;
    
    -- Create buffer for each distance
    FOR i IN 1..array_length(buffer_distances, 1) LOOP
        distance := buffer_distances[i];
        
        -- Convert units
        CASE buffer_units
            WHEN 'kilometers' THEN distance := distance * 1000;
            WHEN 'miles' THEN distance := distance * 1609.34;
            WHEN 'feet' THEN distance := distance * 0.3048;
        END CASE;
        
        buffer_geom := ST_Buffer(input_geom, distance);
        buffer_geom := ST_Transform(buffer_geom, 4326);
        
        -- Add to result features
        result_features := result_features || jsonb_build_object(
            'type', 'Feature',
            'geometry', ST_AsGeoJSON(buffer_geom)::JSONB,
            'properties', jsonb_build_object(
                'buffer_distance', buffer_distances[i],
                'buffer_units', buffer_units,
                'ring_index', i
            )
        );
    END LOOP;
    
    RETURN jsonb_build_object(
        'type', 'FeatureCollection',
        'features', result_features
    );
END;
$$;

-- ============================================
-- INTERSECTION ANALYSIS
-- ============================================

-- Spatial intersection between two geometries
CREATE OR REPLACE FUNCTION spatial_intersection(
    geom1 JSONB,
    geom2 JSONB,
    output_format TEXT DEFAULT 'geojson'
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    geometry1 GEOMETRY;
    geometry2 GEOMETRY;
    intersection_geom GEOMETRY;
    result JSONB;
BEGIN
    -- Convert GeoJSON to geometries
    geometry1 := ST_GeomFromGeoJSON(geom1::TEXT);
    geometry2 := ST_GeomFromGeoJSON(geom2::TEXT);
    
    -- Ensure same CRS
    IF ST_SRID(geometry1) != ST_SRID(geometry2) THEN
        geometry2 := ST_Transform(geometry2, ST_SRID(geometry1));
    END IF;
    
    -- Calculate intersection
    intersection_geom := ST_Intersection(geometry1, geometry2);
    
    -- Check if intersection exists
    IF ST_IsEmpty(intersection_geom) THEN
        RETURN jsonb_build_object(
            'type', 'FeatureCollection',
            'features', '[]'::JSONB
        );
    END IF;
    
    -- Return as GeoJSON Feature
    result := jsonb_build_object(
        'type', 'Feature',
        'geometry', ST_AsGeoJSON(intersection_geom)::JSONB,
        'properties', jsonb_build_object(
            'intersection_area', ST_Area(ST_Transform(intersection_geom, 3857)),
            'intersection_type', ST_GeometryType(intersection_geom)
        )
    );
    
    RETURN result;
END;
$$;

-- ============================================
-- PROXIMITY ANALYSIS
-- ============================================

-- Find nearest infrastructure to each site
CREATE OR REPLACE FUNCTION spatial_proximity_analysis(
    sites JSONB,
    infrastructure JSONB,
    max_distance NUMERIC DEFAULT 10000, -- meters
    infrastructure_types TEXT[] DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    site_feature JSONB;
    infra_feature JSONB;
    site_geom GEOMETRY;
    infra_geom GEOMETRY;
    distance NUMERIC;
    closest_distance NUMERIC;
    closest_feature JSONB;
    result_features JSONB := '[]'::JSONB;
    site_props JSONB;
BEGIN
    -- Process each site
    FOR site_feature IN SELECT jsonb_array_elements(sites->'features')
    LOOP
        site_geom := ST_GeomFromGeoJSON((site_feature->'geometry')::TEXT);
        site_props := site_feature->'properties';
        closest_distance := max_distance + 1; -- Initialize with value larger than max
        closest_feature := NULL;
        
        -- Check each infrastructure element
        FOR infra_feature IN SELECT jsonb_array_elements(infrastructure->'features')
        LOOP
            -- Filter by infrastructure type if specified
            IF infrastructure_types IS NOT NULL THEN
                IF NOT (infra_feature->'properties'->>'type' = ANY(infrastructure_types)) THEN
                    CONTINUE;
                END IF;
            END IF;
            
            infra_geom := ST_GeomFromGeoJSON((infra_feature->'geometry')::TEXT);
            
            -- Calculate distance in meters
            distance := ST_Distance(
                ST_Transform(site_geom, 3857),
                ST_Transform(infra_geom, 3857)
            );
            
            -- Check if this is the closest and within max distance
            IF distance <= max_distance AND distance < closest_distance THEN
                closest_distance := distance;
                closest_feature := infra_feature;
            END IF;
        END LOOP;
        
        -- Add result feature with proximity information
        result_features := result_features || jsonb_build_object(
            'type', 'Feature',
            'geometry', site_feature->'geometry',
            'properties', site_props || jsonb_build_object(
                'nearest_infrastructure_distance', closest_distance,
                'nearest_infrastructure_type', 
                    CASE WHEN closest_feature IS NOT NULL 
                         THEN closest_feature->'properties'->>'type'
                         ELSE NULL END,
                'nearest_infrastructure_name',
                    CASE WHEN closest_feature IS NOT NULL 
                         THEN closest_feature->'properties'->>'name'
                         ELSE NULL END,
                'within_max_distance', closest_distance <= max_distance
            )
        );
    END LOOP;
    
    RETURN jsonb_build_object(
        'type', 'FeatureCollection',
        'features', result_features
    );
END;
$$;

-- ============================================
-- CONSTRAINT ANALYSIS
-- ============================================

-- Comprehensive constraint analysis for datacenter sites
CREATE OR REPLACE FUNCTION spatial_constraint_analysis(
    site_coordinates NUMERIC[2], -- [longitude, latitude]
    analysis_radius NUMERIC DEFAULT 5000, -- meters
    constraint_layers TEXT[] DEFAULT ARRAY['protected_areas', 'flood_zones', 'power_lines']
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    site_point GEOMETRY;
    analysis_buffer GEOMETRY;
    constraint_layer TEXT;
    constraints JSONB := '[]'::JSONB;
    layer_constraints JSONB;
BEGIN
    -- Create site point and analysis buffer
    site_point := ST_SetSRID(ST_MakePoint(site_coordinates[1], site_coordinates[2]), 4326);
    analysis_buffer := ST_Buffer(ST_Transform(site_point, 3857), analysis_radius);
    analysis_buffer := ST_Transform(analysis_buffer, 4326);
    
    -- Analyze each constraint layer
    FOREACH constraint_layer IN ARRAY constraint_layers
    LOOP
        CASE constraint_layer
            WHEN 'protected_areas' THEN
                layer_constraints := analyze_protected_areas(analysis_buffer);
            WHEN 'flood_zones' THEN
                layer_constraints := analyze_flood_zones(analysis_buffer);
            WHEN 'power_lines' THEN
                layer_constraints := analyze_power_infrastructure(analysis_buffer, site_point);
            ELSE
                CONTINUE; -- Skip unknown layers
        END CASE;
        
        -- Merge constraints
        constraints := constraints || layer_constraints;
    END LOOP;
    
    RETURN jsonb_build_object(
        'site_coordinates', site_coordinates,
        'analysis_radius', analysis_radius,
        'constraints', constraints,
        'analyzed_at', to_char(NOW(), 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
    );
END;
$$;

-- Helper function: Analyze protected areas
CREATE OR REPLACE FUNCTION analyze_protected_areas(analysis_area GEOMETRY)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    protected_area RECORD;
    constraints JSONB := '[]'::JSONB;
    distance NUMERIC;
BEGIN
    -- This would query actual protected areas data
    -- For now, we'll return a sample structure
    FOR protected_area IN 
        SELECT name, type, ST_Distance(ST_Transform(geom, 3857), ST_Transform(analysis_area, 3857)) as dist
        FROM protected_areas 
        WHERE ST_DWithin(geom, analysis_area, 0.1) -- Rough spatial filter
    LOOP
        distance := protected_area.dist;
        
        constraints := constraints || jsonb_build_object(
            'id', 'protected_' || protected_area.name,
            'name', protected_area.name,
            'category', 'environmental',
            'severity', CASE 
                WHEN distance < 500 THEN 'critical'
                WHEN distance < 1000 THEN 'high'
                WHEN distance < 2000 THEN 'medium'
                ELSE 'low'
            END,
            'distance', distance,
            'impact', CASE 
                WHEN distance < 500 THEN 'blocking'
                WHEN distance < 1000 THEN 'major'
                WHEN distance < 2000 THEN 'moderate'
                ELSE 'minor'
            END,
            'description', 'Proximity to ' || protected_area.type || ' protected area',
            'type', protected_area.type
        );
    END LOOP;
    
    RETURN constraints;
END;
$$;

-- Helper function: Analyze power infrastructure
CREATE OR REPLACE FUNCTION analyze_power_infrastructure(analysis_area GEOMETRY, site_point GEOMETRY)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    power_feature RECORD;
    constraints JSONB := '[]'::JSONB;
    distance NUMERIC;
BEGIN
    -- Analyze substations
    FOR power_feature IN 
        SELECT name, voltage, capacity_mva, 
               ST_Distance(ST_Transform(location, 3857), ST_Transform(site_point, 3857)) as dist
        FROM power_substations 
        WHERE ST_DWithin(location, analysis_area, 0.1)
    LOOP
        distance := power_feature.dist;
        
        constraints := constraints || jsonb_build_object(
            'id', 'substation_' || power_feature.name,
            'name', 'Substation: ' || power_feature.name,
            'category', 'power',
            'severity', CASE 
                WHEN distance > 5000 THEN 'critical'
                WHEN distance > 2000 THEN 'high'
                WHEN distance > 1000 THEN 'medium'
                ELSE 'low'
            END,
            'distance', distance,
            'impact', CASE 
                WHEN distance > 5000 THEN 'blocking'
                WHEN distance > 2000 THEN 'major'
                ELSE 'minor'
            END,
            'description', format('Power substation (%s kV, %s MVA) at %sm distance', 
                                power_feature.voltage, power_feature.capacity_mva, round(distance)),
            'voltage', power_feature.voltage,
            'capacity_mva', power_feature.capacity_mva
        );
    END LOOP;
    
    RETURN constraints;
END;
$$;

-- ============================================
-- SUITABILITY SCORING
-- ============================================

-- Calculate overall site suitability score based on constraints
CREATE OR REPLACE FUNCTION calculate_suitability_score(
    site_constraints JSONB,
    scoring_weights JSONB DEFAULT '{"critical": -5, "high": -3, "medium": -1, "low": 0}'::JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    constraint_item JSONB;
    severity TEXT;
    score NUMERIC := 10; -- Start with perfect score
    constraint_count INTEGER := 0;
    severity_counts JSONB := '{"critical": 0, "high": 0, "medium": 0, "low": 0}'::JSONB;
    weight NUMERIC;
BEGIN
    -- Process each constraint
    FOR constraint_item IN SELECT jsonb_array_elements(site_constraints)
    LOOP
        severity := constraint_item->>'severity';
        constraint_count := constraint_count + 1;
        
        -- Update severity count
        severity_counts := jsonb_set(
            severity_counts, 
            ARRAY[severity], 
            to_jsonb((severity_counts->>severity)::INTEGER + 1)
        );
        
        -- Apply scoring weight
        weight := (scoring_weights->>severity)::NUMERIC;
        score := score + weight;
    END LOOP;
    
    -- Ensure score stays within 0-10 range
    score := GREATEST(0, LEAST(10, score));
    
    -- Determine recommendation
    RETURN jsonb_build_object(
        'overall_score', round(score, 1),
        'recommendation', CASE 
            WHEN score >= 7 THEN 'proceed'
            WHEN score >= 4 THEN 'caution'
            ELSE 'avoid'
        END,
        'constraint_count', constraint_count,
        'severity_breakdown', severity_counts,
        'scoring_methodology', scoring_weights
    );
END;
$$;

-- ============================================
-- BATCH ANALYSIS FUNCTIONS
-- ============================================

-- Analyze multiple sites in batch
CREATE OR REPLACE FUNCTION batch_site_analysis(
    sites JSONB, -- GeoJSON FeatureCollection
    analysis_radius NUMERIC DEFAULT 5000
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    site_feature JSONB;
    site_coords NUMERIC[2];
    site_analysis JSONB;
    results JSONB := '[]'::JSONB;
BEGIN
    -- Process each site
    FOR site_feature IN SELECT jsonb_array_elements(sites->'features')
    LOOP
        -- Extract coordinates
        site_coords := ARRAY[
            (site_feature->'geometry'->'coordinates'->0)::NUMERIC,
            (site_feature->'geometry'->'coordinates'->1)::NUMERIC
        ];
        
        -- Run constraint analysis
        site_analysis := spatial_constraint_analysis(site_coords, analysis_radius);
        
        -- Add site properties and ID
        site_analysis := site_analysis || jsonb_build_object(
            'site_id', site_feature->'properties'->>'id',
            'site_name', site_feature->'properties'->>'name',
            'site_properties', site_feature->'properties'
        );
        
        -- Calculate suitability score
        site_analysis := site_analysis || calculate_suitability_score(site_analysis->'constraints');
        
        results := results || site_analysis;
    END LOOP;
    
    RETURN jsonb_build_object(
        'type', 'BatchAnalysisResult',
        'analyzed_sites', jsonb_array_length(sites->'features'),
        'analysis_radius', analysis_radius,
        'results', results,
        'analyzed_at', to_char(NOW(), 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
    );
END;
$$;

-- ============================================
-- RLS POLICIES
-- ============================================

-- Enable RLS on spatial_analyses table
ALTER TABLE spatial_analyses ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own analyses
CREATE POLICY "Users can access own spatial analyses" ON spatial_analyses
    FOR ALL USING (auth.uid() = user_id);

-- Grant usage on functions to authenticated users
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;