/**
 * Comprehensive Layer Definitions
 * All available European national mapping service layers
 */

import { TileLayerSource, LayerCategory, CountryLayerConfig } from './types';

// Finland - Maanmittauslaitos (National Land Survey) Layers
export const FINLAND_LAYERS: TileLayerSource[] = [
  {
    id: 'fi_topographic',
    name: 'Topographic Map',
    country: 'FI',
    provider: 'Maanmittauslaitos',
    type: 'wmts',
    url_template: 'https://avoin-karttakuva.maanmittauslaitos.fi/avoin/wmts/1.0.0/maastokartta/default/WGS84_Pseudo-Mercator/{z}/{y}/{x}.png',
    attribution: '© Maanmittauslaitos',
    max_zoom: 18,
    min_zoom: 0,
    coordinate_system: 'EPSG:3857',
    data_categories: ['topography', 'roads', 'buildings', 'elevation', 'base'],
    update_frequency: 'monthly',
    access_restrictions: 'public',
    default_visible: true,
    opacity: 1.0
  },
  {
    id: 'fi_orthophoto',
    name: 'Aerial Photography',
    country: 'FI', 
    provider: 'Maanmittauslaitos',
    type: 'wmts',
    url_template: 'https://avoin-karttakuva.maanmittauslaitos.fi/avoin/wmts/1.0.0/ortokuva/default/WGS84_Pseudo-Mercator/{z}/{y}/{x}.jpg',
    attribution: '© Maanmittauslaitos',
    max_zoom: 19,
    min_zoom: 0,
    coordinate_system: 'EPSG:3857',
    data_categories: ['aerial', 'current', 'base'],
    update_frequency: 'annual',
    access_restrictions: 'public',
    default_visible: false,
    opacity: 1.0
  },
  {
    id: 'fi_background',
    name: 'Background Map',
    country: 'FI',
    provider: 'Maanmittauslaitos',
    type: 'wmts', 
    url_template: 'https://avoin-karttakuva.maanmittauslaitos.fi/avoin/wmts/1.0.0/taustakartta/default/WGS84_Pseudo-Mercator/{z}/{y}/{x}.png',
    attribution: '© Maanmittauslaitos',
    max_zoom: 18,
    min_zoom: 0,
    coordinate_system: 'EPSG:3857',
    data_categories: ['simplified', 'roads', 'water', 'base'],
    update_frequency: 'monthly',
    access_restrictions: 'public',
    default_visible: false,
    opacity: 1.0
  },
  {
    id: 'fi_property_boundaries',
    name: 'Property Boundaries',
    country: 'FI',
    provider: 'Maanmittauslaitos',
    type: 'wmts',
    url_template: 'https://avoin-karttakuva.maanmittauslaitos.fi/avoin/wmts/1.0.0/kiinteistojaotus/default/WGS84_Pseudo-Mercator/{z}/{y}/{x}.png',
    attribution: '© Maanmittauslaitos',
    max_zoom: 18,
    min_zoom: 10,
    coordinate_system: 'EPSG:3857',
    data_categories: ['property', 'boundaries', 'legal', 'administrative'],
    update_frequency: 'weekly',
    access_restrictions: 'public',
    default_visible: false,
    opacity: 0.7
  },
  {
    id: 'fi_property_identifiers',
    name: 'Property Identifiers',
    country: 'FI',
    provider: 'Maanmittauslaitos', 
    type: 'wmts',
    url_template: 'https://avoin-karttakuva.maanmittauslaitos.fi/avoin/wmts/1.0.0/kiinteistotunnukset/default/WGS84_Pseudo-Mercator/{z}/{y}/{x}.png',
    attribution: '© Maanmittauslaitos',
    max_zoom: 18,
    min_zoom: 12,
    coordinate_system: 'EPSG:3857',
    data_categories: ['property', 'identifiers', 'legal', 'administrative'],
    update_frequency: 'weekly',
    access_restrictions: 'public',
    default_visible: false,
    opacity: 0.8
  }
];

// Sweden - Lantmäteriet Layers
export const SWEDEN_LAYERS: TileLayerSource[] = [
  {
    id: 'se_topoweb',
    name: 'Topographic Web Map',
    country: 'SE',
    provider: 'Lantmäteriet',
    type: 'wmts',
    url_template: 'https://api.lantmateriet.se/open/topowebb-ccby/v1/wmts/1.0.0/topowebb/default/3857/{z}/{y}/{x}.png',
    attribution: '© Lantmäteriet',
    max_zoom: 15,
    min_zoom: 0,
    coordinate_system: 'EPSG:3857',
    data_categories: ['topography', 'comprehensive', 'base'],
    update_frequency: 'monthly',
    access_restrictions: 'public',
    default_visible: true,
    opacity: 1.0
  },
  {
    id: 'se_ortofoto',
    name: 'Orthophoto',
    country: 'SE',
    provider: 'Lantmäteriet',
    type: 'wmts',
    url_template: 'https://api.lantmateriet.se/open/ortofoto-ccby/v1/wmts/1.0.0/ortofoto/default/3857/{z}/{y}/{x}.jpeg',
    attribution: '© Lantmäteriet',
    max_zoom: 18,
    min_zoom: 0,
    coordinate_system: 'EPSG:3857',
    data_categories: ['aerial', 'high_resolution', 'base'],
    update_frequency: 'annual',
    access_restrictions: 'public',
    default_visible: false,
    opacity: 1.0
  }
];

// Norway - Kartverket Layers
export const NORWAY_LAYERS: TileLayerSource[] = [
  {
    id: 'no_topo',
    name: 'Topographic Map',
    country: 'NO',
    provider: 'Kartverket',
    type: 'xyz',
    url_template: 'https://opencache.statkart.no/gatekeeper/gk/gk.open_gmaps?layers=topo4&zoom={z}&x={x}&y={y}',
    attribution: '© Kartverket',
    max_zoom: 18,
    min_zoom: 0,
    coordinate_system: 'EPSG:3857',
    data_categories: ['topography', 'terrain', 'base'],
    update_frequency: 'monthly',
    access_restrictions: 'public',
    default_visible: true,
    opacity: 1.0
  },
  {
    id: 'no_aerial',
    name: 'Aerial Photography',
    country: 'NO',
    provider: 'Kartverket',
    type: 'xyz',
    url_template: 'https://opencache.statkart.no/gatekeeper/gk/gk.open_gmaps?layers=norges_grunnkart&zoom={z}&x={x}&y={y}',
    attribution: '© Kartverket',
    max_zoom: 20,
    min_zoom: 0,
    coordinate_system: 'EPSG:3857',
    data_categories: ['aerial', 'current', 'base'],
    update_frequency: 'annual',
    access_restrictions: 'public',
    default_visible: false,
    opacity: 1.0
  },
  {
    id: 'no_sea_chart',
    name: 'Sea Chart',
    country: 'NO',
    provider: 'Kartverket',
    type: 'xyz',
    url_template: 'https://opencache.statkart.no/gatekeeper/gk/gk.open_gmaps?layers=sjokartraster&zoom={z}&x={x}&y={y}',
    attribution: '© Kartverket',
    max_zoom: 16,
    min_zoom: 0,
    coordinate_system: 'EPSG:3857',
    data_categories: ['marine', 'bathymetry', 'coastal', 'infrastructure'],
    update_frequency: 'monthly',
    access_restrictions: 'public',
    default_visible: false,
    opacity: 0.8
  }
];

// Power Infrastructure Layers
export const POWER_INFRASTRUCTURE_LAYERS: TileLayerSource[] = [
  {
    id: 'osm_power_lines',
    name: 'Power Transmission Lines',
    country: 'EU',
    provider: 'OpenStreetMap',
    type: 'vector',
    url_template: 'https://overpass-api.de/api/interpreter?data=[out:geojson][timeout:25];(way["power"="line"](bbox:{south},{west},{north},{east});way["power"="cable"](bbox:{south},{west},{north},{east}););out geom;',
    attribution: '© OpenStreetMap contributors',
    max_zoom: 18,
    min_zoom: 8,
    coordinate_system: 'EPSG:4326',
    data_categories: ['power', 'infrastructure', 'transmission'],
    update_frequency: 'daily',
    access_restrictions: 'public',
    default_visible: false,
    opacity: 0.8
  },
  {
    id: 'osm_power_substations',
    name: 'Electrical Substations',
    country: 'EU',
    provider: 'OpenStreetMap',
    type: 'vector',
    url_template: 'https://overpass-api.de/api/interpreter?data=[out:geojson][timeout:25];(node["power"="substation"](bbox:{south},{west},{north},{east});way["power"="substation"](bbox:{south},{west},{north},{east}););out geom;',
    attribution: '© OpenStreetMap contributors',
    max_zoom: 18,
    min_zoom: 6,
    coordinate_system: 'EPSG:4326',
    data_categories: ['power', 'infrastructure', 'substations'],
    update_frequency: 'daily',
    access_restrictions: 'public',
    default_visible: false,
    opacity: 1.0
  },
  {
    id: 'fingrid_grid',
    name: 'Finnish Grid Infrastructure',
    country: 'FI',
    provider: 'Fingrid',
    type: 'vector',
    url_template: 'https://data.fingrid.fi/api/grid/geojson?bbox={west},{south},{east},{north}',
    attribution: '© Fingrid Oyj',
    max_zoom: 16,
    min_zoom: 0,
    coordinate_system: 'EPSG:4326',
    data_categories: ['power', 'grid', 'finland', 'real_time'],
    update_frequency: 'real-time',
    access_restrictions: 'api_key',
    api_key_required: true,
    default_visible: false,
    opacity: 0.9
  }
];

// Environmental Data Layers
export const ENVIRONMENTAL_LAYERS: TileLayerSource[] = [
  {
    id: 'natura2000',
    name: 'Natura 2000 Protected Areas',
    country: 'EU',
    provider: 'European Environment Agency',
    type: 'xyz',
    url_template: 'https://bio.discomap.eea.europa.eu/arcgis/rest/services/ProtectedSites/Natura2000Sites_Dyna_WM/MapServer/tile/{z}/{y}/{x}',
    attribution: '© European Environment Agency',
    max_zoom: 16,
    min_zoom: 0,
    coordinate_system: 'EPSG:3857',
    data_categories: ['environmental', 'protected_areas', 'biodiversity'],
    update_frequency: 'annual',
    access_restrictions: 'public',
    default_visible: false,
    opacity: 0.6
  },
  {
    id: 'corine_land_cover',
    name: 'CORINE Land Cover',
    country: 'EU',
    provider: 'European Environment Agency',
    type: 'xyz',
    url_template: 'https://image.discomap.eea.europa.eu/arcgis/rest/services/Corine/CLC2018_WM/MapServer/tile/{z}/{y}/{x}',
    attribution: '© European Environment Agency',
    max_zoom: 14,
    min_zoom: 0,
    coordinate_system: 'EPSG:3857',
    data_categories: ['land_use', 'classification', 'european', 'environmental'],
    update_frequency: 'annual',
    access_restrictions: 'public',
    default_visible: false,
    opacity: 0.7
  },
  {
    id: 'osm_wetlands',
    name: 'Wetlands and Water Bodies',
    country: 'EU',
    provider: 'OpenStreetMap',
    type: 'vector',
    url_template: 'https://overpass-api.de/api/interpreter?data=[out:geojson][timeout:25];(way["natural"="wetland"](bbox:{south},{west},{north},{east});way["water"](bbox:{south},{west},{north},{east});way["waterway"](bbox:{south},{west},{north},{east}););out geom;',
    attribution: '© OpenStreetMap contributors',
    max_zoom: 18,
    min_zoom: 6,
    coordinate_system: 'EPSG:4326',
    data_categories: ['water', 'wetlands', 'environmental'],
    update_frequency: 'daily',
    access_restrictions: 'public',
    default_visible: false,
    opacity: 0.8
  }
];

// Infrastructure and Transportation Layers
export const INFRASTRUCTURE_LAYERS: TileLayerSource[] = [
  {
    id: 'osm_fiber_cables',
    name: 'Fiber Optic Infrastructure',
    country: 'EU',
    provider: 'OpenStreetMap',
    type: 'vector',
    url_template: 'https://overpass-api.de/api/interpreter?data=[out:geojson][timeout:25];(way["communication"="fibre_optic"](bbox:{south},{west},{north},{east});way["man_made"="cable"]["cable"="fibre_optic"](bbox:{south},{west},{north},{east}););out geom;',
    attribution: '© OpenStreetMap contributors',
    max_zoom: 18,
    min_zoom: 8,
    coordinate_system: 'EPSG:4326',
    data_categories: ['telecommunications', 'fiber', 'connectivity', 'infrastructure'],
    update_frequency: 'daily',
    access_restrictions: 'public',
    default_visible: false,
    opacity: 0.9
  },
  {
    id: 'osm_railways',
    name: 'Railway Networks',
    country: 'EU',
    provider: 'OpenStreetMap',
    type: 'vector',
    url_template: 'https://overpass-api.de/api/interpreter?data=[out:geojson][timeout:25];(way["railway"](bbox:{south},{west},{north},{east}););out geom;',
    attribution: '© OpenStreetMap contributors',
    max_zoom: 18,
    min_zoom: 6,
    coordinate_system: 'EPSG:4326',
    data_categories: ['transport', 'rail', 'logistics', 'infrastructure'],
    update_frequency: 'daily',
    access_restrictions: 'public',
    default_visible: false,
    opacity: 0.8
  },
  {
    id: 'osm_highways',
    name: 'Major Highway Network',
    country: 'EU',
    provider: 'OpenStreetMap',
    type: 'vector',
    url_template: 'https://overpass-api.de/api/interpreter?data=[out:geojson][timeout:25];(way["highway"~"^(motorway|trunk|primary)$"](bbox:{south},{west},{north},{east}););out geom;',
    attribution: '© OpenStreetMap contributors',
    max_zoom: 18,
    min_zoom: 4,
    coordinate_system: 'EPSG:4326',
    data_categories: ['transport', 'roads', 'logistics', 'infrastructure'],
    update_frequency: 'daily',
    access_restrictions: 'public',
    default_visible: false,
    opacity: 0.8
  }
];

// Real-time Data Layers
export const REALTIME_LAYERS: TileLayerSource[] = [
  {
    id: 'openweather_precipitation',
    name: 'Weather Radar - Precipitation',
    country: 'Global',
    provider: 'OpenWeatherMap',
    type: 'xyz',
    url_template: 'https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid={api_key}',
    attribution: '© OpenWeatherMap',
    max_zoom: 10,
    min_zoom: 0,
    coordinate_system: 'EPSG:3857',
    data_categories: ['weather', 'real_time', 'precipitation'],
    update_frequency: 'real-time',
    access_restrictions: 'api_key',
    api_key_required: true,
    default_visible: false,
    opacity: 0.6
  },
  {
    id: 'openweather_temperature',
    name: 'Temperature Map',
    country: 'Global',
    provider: 'OpenWeatherMap',
    type: 'xyz',
    url_template: 'https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid={api_key}',
    attribution: '© OpenWeatherMap',
    max_zoom: 10,
    min_zoom: 0,
    coordinate_system: 'EPSG:3857',
    data_categories: ['weather', 'real_time', 'temperature'],
    update_frequency: 'real-time',
    access_restrictions: 'api_key',
    api_key_required: true,
    default_visible: false,
    opacity: 0.5
  }
];

// Layer Categories for UI Organization
export const LAYER_CATEGORIES: LayerCategory[] = [
  {
    id: 'base_maps',
    name: 'Base Maps',
    description: 'Topographic and aerial base layers',
    icon: '🗺️',
    layers: [...FINLAND_LAYERS, ...SWEDEN_LAYERS, ...NORWAY_LAYERS],
    default_active: true,
    max_active_layers: 1
  },
  {
    id: 'power_infrastructure',
    name: 'Power Infrastructure',
    description: 'Electrical grid, substations, transmission lines',
    icon: '⚡',
    layers: POWER_INFRASTRUCTURE_LAYERS,
    default_active: false
  },
  {
    id: 'environmental',
    name: 'Environmental',
    description: 'Protected areas, wetlands, land cover',
    icon: '🌿',
    layers: ENVIRONMENTAL_LAYERS,
    default_active: false
  },
  {
    id: 'infrastructure',
    name: 'Infrastructure',
    description: 'Transportation, telecommunications, utilities',
    icon: '🏗️',
    layers: INFRASTRUCTURE_LAYERS,
    default_active: false
  },
  {
    id: 'realtime',
    name: 'Real-time Data',
    description: 'Weather, traffic, current conditions',
    icon: '📡',
    layers: REALTIME_LAYERS,
    default_active: false
  }
];

// Country Configurations
export const COUNTRY_CONFIGS: CountryLayerConfig[] = [
  {
    country_code: 'FI',
    country_name: 'Finland',
    primary_crs: 'EPSG:3067', // ETRS89 / TM35FIN
    available_layers: FINLAND_LAYERS,
    default_layer_stack: ['fi_topographic'],
    api_requirements: {
      'Maanmittauslaitos': {
        api_key_required: false,
        rate_limits: {
          requests_per_minute: 60,
          requests_per_day: 10000
        }
      }
    }
  },
  {
    country_code: 'SE',
    country_name: 'Sweden',
    primary_crs: 'EPSG:3006', // SWEREF99 TM
    available_layers: SWEDEN_LAYERS,
    default_layer_stack: ['se_topoweb'],
    api_requirements: {
      'Lantmäteriet': {
        api_key_required: false,
        rate_limits: {
          requests_per_minute: 30,
          requests_per_day: 5000
        }
      }
    }
  },
  {
    country_code: 'NO',
    country_name: 'Norway',
    primary_crs: 'EPSG:25833', // ETRS89 / UTM zone 33N
    available_layers: NORWAY_LAYERS,
    default_layer_stack: ['no_topo'],
    api_requirements: {
      'Kartverket': {
        api_key_required: false,
        rate_limits: {
          requests_per_minute: 120,
          requests_per_day: 20000
        }
      }
    }
  }
];

// Get layers by country
export function getLayersByCountry(countryCode: string): TileLayerSource[] {
  const config = COUNTRY_CONFIGS.find(c => c.country_code === countryCode);
  return config?.available_layers || [];
}

// Get layers by category
export function getLayersByCategory(categoryId: string): TileLayerSource[] {
  const category = LAYER_CATEGORIES.find(c => c.id === categoryId);
  return category?.layers || [];
}

// Get all available layers
export function getAllLayers(): TileLayerSource[] {
  return [
    ...FINLAND_LAYERS,
    ...SWEDEN_LAYERS,
    ...NORWAY_LAYERS,
    ...POWER_INFRASTRUCTURE_LAYERS,
    ...ENVIRONMENTAL_LAYERS,
    ...INFRASTRUCTURE_LAYERS,
    ...REALTIME_LAYERS
  ];
}