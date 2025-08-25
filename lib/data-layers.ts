/**
 * Data Layer Management System
 * Handles dynamic loading, caching, and management of GIS data layers
 */

export interface LayerSource {
  id: string;
  name: string;
  type: 'wfs' | 'wms' | 'geojson' | 'vector-tiles' | 'rest-api' | 'csv';
  endpoint: string;
  authRequired?: boolean;
  headers?: Record<string, string>;
  params?: Record<string, any>;
  cacheDuration?: number; // minutes
  crs?: string;
  bounds?: [number, number, number, number]; // [minLng, minLat, maxLng, maxLat]
}

export interface DataLayerConfig {
  id: string;
  name: string;
  description: string;
  category: 'infrastructure' | 'environmental' | 'regulatory' | 'demographic' | 'analysis';
  country: string;
  region?: string;
  source: LayerSource;
  styling: {
    type: 'fill' | 'line' | 'circle' | 'symbol' | 'raster';
    paint: Record<string, any>;
    layout?: Record<string, any>;
  };
  metadata: {
    provider: string;
    updated: string;
    accuracy: string;
    license: string;
    contact?: string;
  };
  filters?: {
    property: string;
    operator: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'in' | 'contains';
    value: any;
  }[];
  minZoom?: number;
  maxZoom?: number;
  interactive?: boolean;
  popup?: {
    template: string;
    fields: string[];
  };
}

export class DataLayerManager {
  private layers: Map<string, DataLayerConfig> = new Map();
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private loadingStates: Map<string, boolean> = new Map();

  constructor() {
    this.initializeStandardLayers();
  }

  private initializeStandardLayers() {
    // Finnish Infrastructure Layers
    this.registerLayer({
      id: 'finland-power-grid',
      name: 'Finnish Power Grid',
      description: 'Transmission lines and substations from Fingrid',
      category: 'infrastructure',
      country: 'FI',
      source: {
        id: 'fingrid-grid',
        name: 'Fingrid Open Data',
        type: 'geojson',
        endpoint: 'https://data.fingrid.fi/api/datasets/power-grid/geojson',
        cacheDuration: 1440, // 24 hours
        crs: 'EPSG:3067'
      },
      styling: {
        type: 'line',
        paint: {
          'line-color': [
            'case',
            ['==', ['get', 'voltage'], 400], '#ef4444',
            ['==', ['get', 'voltage'], 220], '#f97316',
            ['==', ['get', 'voltage'], 110], '#eab308',
            '#71717a'
          ],
          'line-width': [
            'case',
            ['==', ['get', 'voltage'], 400], 3,
            ['==', ['get', 'voltage'], 220], 2,
            1
          ],
          'line-opacity': 0.8
        }
      },
      metadata: {
        provider: 'Fingrid Oyj',
        updated: '2024-01-15',
        accuracy: '10m',
        license: 'Open Data',
        contact: 'opendata@fingrid.fi'
      },
      minZoom: 8,
      interactive: true,
      popup: {
        template: '<h3>{name}</h3><p>Voltage: {voltage} kV</p><p>Type: {type}</p>',
        fields: ['name', 'voltage', 'type', 'operator']
      }
    });

    this.registerLayer({
      id: 'finland-substations',
      name: 'Power Substations',
      description: 'Electrical substations and switching stations',
      category: 'infrastructure',
      country: 'FI',
      source: {
        id: 'fingrid-substations',
        name: 'Fingrid Substations',
        type: 'geojson',
        endpoint: 'https://data.fingrid.fi/api/datasets/substations/geojson',
        cacheDuration: 1440,
        crs: 'EPSG:3067'
      },
      styling: {
        type: 'circle',
        paint: {
          'circle-radius': [
            'case',
            ['>=', ['get', 'capacity_mva'], 100], 8,
            ['>=', ['get', 'capacity_mva'], 50], 6,
            4
          ],
          'circle-color': [
            'case',
            ['>=', ['get', 'capacity_mva'], 100], '#ef4444',
            ['>=', ['get', 'capacity_mva'], 50], '#f97316',
            '#eab308'
          ],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
          'circle-opacity': 0.8
        }
      },
      metadata: {
        provider: 'Fingrid Oyj',
        updated: '2024-01-15',
        accuracy: '1m',
        license: 'Open Data'
      },
      interactive: true,
      popup: {
        template: '<h3>{name}</h3><p>Capacity: {capacity_mva} MVA</p><p>Voltage: {voltage_levels}</p>',
        fields: ['name', 'capacity_mva', 'voltage_levels', 'type']
      }
    });

    // Environmental Layers
    this.registerLayer({
      id: 'finland-natura2000',
      name: 'Natura 2000 Areas',
      description: 'EU protected areas in Finland',
      category: 'environmental',
      country: 'FI',
      source: {
        id: 'syke-natura2000',
        name: 'SYKE Protected Areas',
        type: 'wfs',
        endpoint: 'https://paikkatieto.ymparisto.fi/arcgis/services/INSPIRE/SYKE_SuojellutAlueet/MapServer/WFSServer',
        params: {
          service: 'WFS',
          version: '2.0.0',
          request: 'GetFeature',
          typeName: 'SYKE_SuojellutAlueet:Natura2000_alueet',
          outputFormat: 'application/json'
        },
        cacheDuration: 10080, // 7 days
        crs: 'EPSG:3067'
      },
      styling: {
        type: 'fill',
        paint: {
          'fill-color': '#22c55e',
          'fill-opacity': 0.3,
          'fill-outline-color': '#16a34a'
        }
      },
      metadata: {
        provider: 'SYKE',
        updated: '2024-01-01',
        accuracy: '1m',
        license: 'CC BY 4.0'
      },
      interactive: true,
      popup: {
        template: '<h3>{name}</h3><p>Type: {type}</p><p>Area: {area_ha} ha</p>',
        fields: ['name', 'type', 'area_ha', 'designation']
      }
    });

    // Water Systems
    this.registerLayer({
      id: 'finland-water-bodies',
      name: 'Water Bodies',
      description: 'Rivers, lakes and coastal waters',
      category: 'environmental',
      country: 'FI',
      source: {
        id: 'mml-water',
        name: 'Maanmittauslaitos Water',
        type: 'wfs',
        endpoint: 'https://avoin-paikkatieto.maanmittauslaitos.fi/maastotiedot/wfs',
        params: {
          service: 'WFS',
          version: '2.0.0',
          request: 'GetFeature',
          typeName: 'ms:Vesialue',
          outputFormat: 'application/json'
        },
        authRequired: true,
        cacheDuration: 10080,
        crs: 'EPSG:3067'
      },
      styling: {
        type: 'fill',
        paint: {
          'fill-color': '#0ea5e9',
          'fill-opacity': 0.6,
          'fill-outline-color': '#0284c7'
        }
      },
      metadata: {
        provider: 'Maanmittauslaitos',
        updated: '2024-01-01',
        accuracy: '5m',
        license: 'CC BY 4.0'
      },
      interactive: true
    });

    // Regulatory/Zoning Layers
    this.registerLayer({
      id: 'finland-zoning',
      name: 'Land Use Zoning',
      description: 'Municipal zoning and land use plans',
      category: 'regulatory',
      country: 'FI',
      region: 'nationwide',
      source: {
        id: 'municipal-zoning',
        name: 'Municipal WFS Services',
        type: 'wfs',
        endpoint: 'https://kartta.pori.fi/TeklaOGCWeb/WFS.ashx',
        params: {
          service: 'WFS',
          version: '1.1.0',
          request: 'GetFeature',
          typeName: 'Asemakaava_polygon',
          outputFormat: 'application/json'
        },
        cacheDuration: 1440,
        crs: 'EPSG:3067'
      },
      styling: {
        type: 'fill',
        paint: {
          'fill-color': [
            'case',
            ['==', ['get', 'kaavamerkinta'], 'T'], '#8b5cf6', // Industrial
            ['==', ['get', 'kaavamerkinta'], 'A'], '#eab308', // Residential
            ['==', ['get', 'kaavamerkinta'], 'K'], '#06b6d4', // Commercial
            '#71717a'
          ],
          'fill-opacity': 0.5,
          'fill-outline-color': '#27272a'
        }
      },
      metadata: {
        provider: 'Municipal Authorities',
        updated: '2024-01-01',
        accuracy: '1m',
        license: 'Various'
      },
      interactive: true,
      popup: {
        template: '<h3>Zone: {kaavamerkinta}</h3><p>{selite}</p>',
        fields: ['kaavamerkinta', 'selite', 'pinta_ala']
      }
    });
  }

  registerLayer(config: DataLayerConfig): void {
    this.layers.set(config.id, config);
  }

  getLayer(id: string): DataLayerConfig | undefined {
    return this.layers.get(id);
  }

  getLayers(filters?: {
    category?: string;
    country?: string;
    region?: string;
  }): DataLayerConfig[] {
    const allLayers = Array.from(this.layers.values());
    
    if (!filters) return allLayers;

    return allLayers.filter(layer => {
      if (filters.category && layer.category !== filters.category) return false;
      if (filters.country && layer.country !== filters.country) return false;
      if (filters.region && layer.region !== filters.region) return false;
      return true;
    });
  }

  async loadLayerData(layerId: string, bounds?: [number, number, number, number]): Promise<any> {
    const layer = this.layers.get(layerId);
    if (!layer) {
      throw new Error(`Layer ${layerId} not found`);
    }

    // Check cache
    const cacheKey = bounds ? `${layerId}_${bounds.join('_')}` : layerId;
    const cached = this.cache.get(cacheKey);
    const now = Date.now();
    
    if (cached && layer.source.cacheDuration) {
      const cacheAge = (now - cached.timestamp) / (1000 * 60); // minutes
      if (cacheAge < layer.source.cacheDuration) {
        return cached.data;
      }
    }

    // Check if already loading
    if (this.loadingStates.get(layerId)) {
      // Return promise that resolves when loading is complete
      return new Promise((resolve) => {
        const checkLoading = () => {
          if (!this.loadingStates.get(layerId)) {
            const cachedData = this.cache.get(cacheKey);
            resolve(cachedData?.data);
          } else {
            setTimeout(checkLoading, 100);
          }
        };
        checkLoading();
      });
    }

    this.loadingStates.set(layerId, true);

    try {
      const data = await this.fetchLayerData(layer, bounds);
      
      // Cache the data
      this.cache.set(cacheKey, {
        data,
        timestamp: now
      });

      return data;
    } finally {
      this.loadingStates.set(layerId, false);
    }
  }

  private async fetchLayerData(layer: DataLayerConfig, bounds?: [number, number, number, number]): Promise<any> {
    const { source } = layer;
    
    switch (source.type) {
      case 'geojson':
        return this.fetchGeoJSON(source, bounds);
      
      case 'wfs':
        return this.fetchWFS(source, bounds);
      
      case 'rest-api':
        return this.fetchRestAPI(source, bounds);
      
      case 'csv':
        return this.fetchCSV(source, bounds);
      
      default:
        throw new Error(`Unsupported source type: ${source.type}`);
    }
  }

  private async fetchGeoJSON(source: LayerSource, bounds?: [number, number, number, number]): Promise<any> {
    let url = source.endpoint;
    
    // Add bounding box parameter if provided
    if (bounds && source.params) {
      const params = new URLSearchParams(source.params);
      params.set('bbox', bounds.join(','));
      url += '?' + params.toString();
    }

    const headers = {
      'Accept': 'application/json',
      ...source.headers
    };

    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  private async fetchWFS(source: LayerSource, bounds?: [number, number, number, number]): Promise<any> {
    const params = new URLSearchParams({
      service: 'WFS',
      version: '2.0.0',
      request: 'GetFeature',
      outputFormat: 'application/json',
      ...source.params
    });

    // Add spatial filter if bounds provided
    if (bounds) {
      const [minLng, minLat, maxLng, maxLat] = bounds;
      const bbox = `${minLng},${minLat},${maxLng},${maxLat},EPSG:4326`;
      params.set('bbox', bbox);
    }

    const url = `${source.endpoint}?${params.toString()}`;
    
    const headers = {
      'Accept': 'application/json',
      ...source.headers
    };

    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      throw new Error(`WFS Error ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  private async fetchRestAPI(source: LayerSource, bounds?: [number, number, number, number]): Promise<any> {
    const url = new URL(source.endpoint);
    
    // Add parameters
    if (source.params) {
      Object.entries(source.params).forEach(([key, value]) => {
        url.searchParams.set(key, value.toString());
      });
    }

    // Add spatial filter
    if (bounds) {
      url.searchParams.set('bbox', bounds.join(','));
    }

    const headers = {
      'Accept': 'application/json',
      ...source.headers
    };

    const response = await fetch(url.toString(), { headers });
    
    if (!response.ok) {
      throw new Error(`API Error ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  private async fetchCSV(source: LayerSource, bounds?: [number, number, number, number]): Promise<any> {
    const response = await fetch(source.endpoint, {
      headers: source.headers
    });
    
    if (!response.ok) {
      throw new Error(`CSV Error ${response.status}: ${response.statusText}`);
    }

    const csvText = await response.text();
    return this.parseCSVToGeoJSON(csvText);
  }

  private parseCSVToGeoJSON(csvText: string): any {
    const lines = csvText.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    const features = lines.slice(1)
      .filter(line => line.trim())
      .map(line => {
        const values = line.split(',');
        const properties: Record<string, any> = {};
        
        headers.forEach((header, index) => {
          properties[header] = values[index]?.trim();
        });

        // Try to find coordinate columns
        const lng = parseFloat(properties.longitude || properties.lng || properties.x);
        const lat = parseFloat(properties.latitude || properties.lat || properties.y);

        return {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [lng, lat]
          },
          properties
        };
      })
      .filter(feature => 
        !isNaN(feature.geometry.coordinates[0]) && 
        !isNaN(feature.geometry.coordinates[1])
      );

    return {
      type: 'FeatureCollection',
      features
    };
  }

  clearCache(layerId?: string): void {
    if (layerId) {
      // Clear specific layer cache
      const keysToDelete = Array.from(this.cache.keys())
        .filter(key => key.startsWith(layerId));
      keysToDelete.forEach(key => this.cache.delete(key));
    } else {
      // Clear all cache
      this.cache.clear();
    }
  }

  isLoading(layerId: string): boolean {
    return this.loadingStates.get(layerId) || false;
  }

  getLoadingStates(): Record<string, boolean> {
    return Object.fromEntries(this.loadingStates.entries());
  }
}

// Singleton instance
export const dataLayerManager = new DataLayerManager();

// Type guards and utilities
export function isValidGeoJSON(data: any): boolean {
  return (
    data &&
    typeof data === 'object' &&
    data.type &&
    (data.type === 'FeatureCollection' || data.type === 'Feature')
  );
}

export function transformToWebMercator(coordinates: [number, number]): [number, number] {
  const [lng, lat] = coordinates;
  const x = (lng * 20037508.34) / 180;
  const y = Math.log(Math.tan(((90 + lat) * Math.PI) / 360)) / (Math.PI / 180);
  const mercY = (y * 20037508.34) / 180;
  return [x, mercY];
}

export function transformFromWebMercator(coordinates: [number, number]): [number, number] {
  const [x, y] = coordinates;
  const lng = (x / 20037508.34) * 180;
  const lat = (Math.atan(Math.exp((y / 20037508.34) * 180 * (Math.PI / 180))) * 360) / Math.PI - 90;
  return [lng, lat];
}