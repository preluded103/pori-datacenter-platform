/**
 * Comprehensive Geospatial Data Types
 * Supporting maximum data density from European national mapping services
 */

export interface TileLayerSource {
  id: string;
  name: string;
  country: string;
  provider: string;
  type: 'raster' | 'vector' | 'wmts' | 'wms' | 'xyz';
  url_template: string;
  attribution: string;
  max_zoom: number;
  min_zoom: number;
  coordinate_system: string; // EPSG code
  data_categories: string[];
  update_frequency: 'real-time' | 'daily' | 'weekly' | 'monthly' | 'annual' | 'static';
  access_restrictions?: 'public' | 'api_key' | 'commercial' | 'registration';
  api_key_required?: boolean;
  default_visible?: boolean;
  opacity?: number;
  blend_mode?: 'normal' | 'multiply' | 'screen' | 'overlay';
}

export interface LayerCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  layers: TileLayerSource[];
  default_active: boolean;
  max_active_layers?: number;
}

export interface GeospatialBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface ComprehensiveGeospatialData {
  coordinates: [number, number];
  radius_km: number;
  timestamp: string;
  
  // Base geographic data
  topographic: {
    elevation_m: number;
    slope_percent: number;
    aspect_degrees: number;
    terrain_classification: string;
  };
  
  // Infrastructure data
  infrastructure: {
    power_lines: PowerLineData[];
    substations: SubstationData[];
    fiber_cables: FiberCableData[];
    roads: RoadData[];
    railways: RailwayData[];
    ports: PortData[];
    airports: AirportData[];
  };
  
  // Environmental data
  environmental: {
    protected_areas: ProtectedAreaData[];
    water_bodies: WaterBodyData[];
    wetlands: WetlandData[];
    biodiversity_zones: BiodiversityZoneData[];
    air_quality: AirQualityData;
    noise_levels: NoiseLevelData;
  };
  
  // Administrative data
  administrative: {
    municipality: string;
    county: string;
    zoning: ZoningData[];
    property_boundaries: PropertyBoundaryData[];
    building_permits: BuildingPermitData[];
  };
  
  // Geological data
  geological: {
    bedrock_type: string;
    soil_classification: string;
    seismic_zone: string;
    flood_risk: FloodRiskData;
    groundwater_depth_m: number;
  };
  
  // Real-time data
  realtime: {
    weather: WeatherData;
    traffic: TrafficData;
    power_grid_status: PowerGridData;
    construction_activity: ConstructionActivityData[];
  };
}

// Detailed data interfaces
export interface PowerLineData {
  id: string;
  voltage_kv: number;
  operator: string;
  distance_m: number;
  line_type: 'overhead' | 'underground' | 'submarine';
  geometry: GeoJSON.LineString;
}

export interface SubstationData {
  id: string;
  name: string;
  voltage_kv: number;
  capacity_mva: number;
  operator: string;
  distance_m: number;
  substation_type: string;
  coordinates: [number, number];
}

export interface FiberCableData {
  id: string;
  operator: string;
  cable_type: string;
  capacity: string;
  distance_m: number;
  geometry: GeoJSON.LineString;
}

export interface RoadData {
  id: string;
  highway_class: string;
  surface_type: string;
  width_m: number;
  speed_limit_kmh: number;
  distance_m: number;
  geometry: GeoJSON.LineString;
}

export interface ProtectedAreaData {
  id: string;
  name: string;
  designation: string;
  protection_level: string;
  area_hectares: number;
  distance_m: number;
  restrictions: string[];
  geometry: GeoJSON.Polygon;
}

export interface ZoningData {
  id: string;
  zone_type: string;
  permitted_uses: string[];
  restrictions: string[];
  max_building_height_m: number;
  max_floor_area_ratio: number;
  geometry: GeoJSON.Polygon;
}

export interface WeatherData {
  temperature_c: number;
  humidity_percent: number;
  wind_speed_ms: number;
  wind_direction_degrees: number;
  precipitation_mm: number;
  visibility_km: number;
  timestamp: string;
}

export interface PowerGridData {
  frequency_hz: number;
  voltage_stability: 'stable' | 'variable' | 'unstable';
  load_percentage: number;
  congestion_alerts: string[];
  maintenance_schedules: MaintenanceSchedule[];
  timestamp: string;
}

export interface MaintenanceSchedule {
  component: string;
  start_date: string;
  end_date: string;
  impact_level: 'low' | 'medium' | 'high';
  affected_area_km: number;
}

// Layer configuration presets
export interface CountryLayerConfig {
  country_code: string;
  country_name: string;
  primary_crs: string;
  available_layers: TileLayerSource[];
  default_layer_stack: string[];
  api_requirements: {
    [provider: string]: {
      api_key_required: boolean;
      registration_url?: string;
      rate_limits?: {
        requests_per_minute: number;
        requests_per_day: number;
      };
    };
  };
}

// Map interaction types
export interface MapInteractionEvent {
  type: 'click' | 'hover' | 'zoom' | 'pan';
  coordinates: [number, number];
  zoom_level: number;
  visible_layers: string[];
  timestamp: string;
}

export interface LayerVisibilityState {
  [layerId: string]: {
    visible: boolean;
    opacity: number;
    z_index: number;
  };
}

// Query and analysis types
export interface GeospatialQuery {
  coordinates: [number, number];
  radius_m: number;
  data_categories: string[];
  include_realtime: boolean;
  coordinate_system: string;
  detail_level: 'basic' | 'standard' | 'comprehensive';
}

export interface LayerDataRequest {
  layer_id: string;
  bounds: GeospatialBounds;
  zoom_level: number;
  additional_params?: Record<string, any>;
}

// API response types
export interface LayerTileResponse {
  tile_data: ArrayBuffer | string;
  content_type: string;
  cache_headers: Record<string, string>;
  attribution: string;
}

export interface GeospatialAnalysisResult {
  query: GeospatialQuery;
  data: ComprehensiveGeospatialData;
  analysis_duration_ms: number;
  data_sources_used: string[];
  confidence_scores: {
    [category: string]: number; // 0-1 confidence score
  };
  last_updated: string;
}