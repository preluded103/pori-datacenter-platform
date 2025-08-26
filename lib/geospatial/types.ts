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

export interface RailwayData {
  id: string;
  railway_type: string;
  operator: string;
  gauge_mm: number;
  electrified: boolean;
  distance_m: number;
  geometry: GeoJSON.LineString;
}

export interface PortData {
  id: string;
  name: string;
  port_type: string;
  operator: string;
  capacity_tonnes: number;
  distance_m: number;
  geometry: GeoJSON.Point;
}

export interface AirportData {
  id: string;
  name: string;
  airport_type: string;
  iata_code?: string;
  icao_code?: string;
  runway_count: number;
  distance_m: number;
  geometry: GeoJSON.Point;
}

export interface WaterBodyData {
  id: string;
  name: string;
  water_type: string;
  area_m2: number;
  distance_m: number;
  geometry: GeoJSON.Polygon;
}

export interface WetlandData {
  id: string;
  name: string;
  wetland_type: string;
  conservation_status: string;
  area_m2: number;
  distance_m: number;
  geometry: GeoJSON.Polygon;
}

export interface BiodiversityZoneData {
  id: string;
  name: string;
  zone_type: string;
  protection_level: string;
  species_count: number;
  distance_m: number;
  geometry: GeoJSON.Polygon;
}

export interface AirQualityData {
  station_id: string;
  pm25: number;
  pm10: number;
  no2: number;
  so2: number;
  o3: number;
  measurement_date: string;
}

export interface NoiseLevelData {
  station_id: string;
  db_level: number;
  measurement_type: string;
  measurement_date: string;
}

export interface PropertyBoundaryData {
  id: string;
  property_id: string;
  owner: string;
  area_m2: number;
  land_use: string;
  geometry: GeoJSON.Polygon;
}

export interface BuildingPermitData {
  id: string;
  permit_type: string;
  status: string;
  application_date: string;
  approval_date?: string;
  building_area_m2: number;
  geometry: GeoJSON.Point;
}

export interface FloodRiskData {
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
  flood_zone: string;
  return_period_years: number;
  max_depth_m: number;
  last_flood_date?: string;
}

export interface TrafficData {
  congestion_level: 'LOW' | 'MEDIUM' | 'HIGH';
  average_speed_kmh: number;
  incident_count: number;
  last_updated: string;
}

export interface ConstructionActivityData {
  id: string;
  project_type: string;
  status: 'PLANNED' | 'ACTIVE' | 'COMPLETED';
  start_date: string;
  end_date?: string;
  impact_radius_m: number;
  geometry: GeoJSON.Point;
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