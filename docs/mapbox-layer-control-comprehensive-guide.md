# Mapbox GL JS Layer Control Capabilities & Advanced Features
## Comprehensive Guide for Datacenter Feasibility Platform

### Table of Contents
1. [Layer Management Fundamentals](#layer-management-fundamentals)
2. [Advanced Layer Types & Integration](#advanced-layer-types--integration)
3. [Custom Controls & UI Components](#custom-controls--ui-components)
4. [Data-Driven Styling & Filtering](#data-driven-styling--filtering)
5. [Performance Optimization](#performance-optimization)
6. [ArcGIS Service Integration](#arcgis-service-integration)
7. [Implementation Examples](#implementation-examples)
8. [Best Practices & Recommendations](#best-practices--recommendations)

---

## Layer Management Fundamentals

### Core Architecture
Mapbox GL JS follows a **source-layer** pattern where:
- **Sources** contain geographic data (defining feature shapes and locations)
- **Layers** define visual representation and styling
- **Controls** manage user interaction and layer visibility

### Basic Layer Operations

```typescript
// 1. Add Source First
map.addSource('power-lines-source', {
  type: 'vector',
  tiles: ['https://api.example.com/power/{z}/{x}/{y}.mvt'],
  minzoom: 6,
  maxzoom: 14
});

// 2. Add Layer with Visual Styling
map.addLayer({
  id: 'power-transmission-lines',
  type: 'line',
  source: 'power-lines-source',
  'source-layer': 'power_lines',
  paint: {
    'line-color': '#ff6b35',
    'line-width': ['interpolate', ['linear'], ['zoom'], 8, 1, 14, 4],
    'line-opacity': 0.8
  },
  filter: ['>=', ['get', 'voltage'], 110000] // Only high voltage lines
});

// 3. Runtime Layer Control
function toggleLayerVisibility(layerId: string, visible: boolean) {
  map.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none');
}

function updateLayerOpacity(layerId: string, opacity: number) {
  map.setPaintProperty(layerId, 'line-opacity', opacity);
}
```

### Layer Ordering for Mapbox Standard Style
```typescript
// Use slot property for proper layer ordering
map.addLayer({
  id: 'infrastructure-layer',
  type: 'fill',
  source: 'infrastructure-source',
  slot: 'bottom', // Options: 'bottom', 'middle', 'top'
  paint: { 'fill-opacity': 0.6 }
});
```

---

## Advanced Layer Types & Integration

### 1. Vector Tile Layers
**Best for:** Interactive infrastructure data, real-time updates, client-side styling

```typescript
// High-Performance Vector Tiles
const addVectorTileLayer = (map: mapboxgl.Map) => {
  map.addSource('infrastructure-vector', {
    type: 'vector',
    tiles: [
      'https://api.fingrid.fi/tiles/{z}/{x}/{y}.pbf',
      'https://overpass.kumi.systems/api/tiles/{z}/{x}/{y}.mvt'
    ],
    minzoom: 0,
    maxzoom: 18,
    attribution: '© Fingrid, OpenStreetMap'
  });

  // Multiple layers from same source
  map.addLayer({
    id: 'power-substations',
    type: 'circle',
    source: 'infrastructure-vector',
    'source-layer': 'substations',
    paint: {
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 8, 4, 16, 12],
      'circle-color': ['case',
        ['>=', ['get', 'voltage'], 400000], '#ff0000', // 400kV+ = red
        ['>=', ['get', 'voltage'], 132000], '#ff6b35', // 132-400kV = orange
        '#ffb000' // <132kV = yellow
      ],
      'circle-stroke-color': '#ffffff',
      'circle-stroke-width': 1
    }
  });

  map.addLayer({
    id: 'transmission-lines',
    type: 'line',
    source: 'infrastructure-vector',
    'source-layer': 'power_lines',
    paint: {
      'line-width': ['get', 'line_width'],
      'line-color': ['get', 'line_color']
    }
  });
};
```

### 2. WMS Layer Integration
**Best for:** Government data services, real-time imagery, standardized protocols

```typescript
// WMS Layer Implementation
const addWMSLayer = (map: mapboxgl.Map, layerConfig: {
  id: string;
  url: string;
  layers: string;
  format?: string;
  transparent?: boolean;
}) => {
  const wmsUrl = `${layerConfig.url}?service=WMS&version=1.3.0&request=GetMap` +
    `&layers=${layerConfig.layers}&format=${layerConfig.format || 'image/png'}` +
    `&transparent=${layerConfig.transparent || true}&crs=EPSG:3857` +
    `&width=256&height=256&bbox={bbox-epsg-3857}`;

  map.addSource(layerConfig.id, {
    type: 'raster',
    tiles: [wmsUrl],
    tileSize: 256,
    attribution: 'WMS Service'
  });

  map.addLayer({
    id: layerConfig.id,
    type: 'raster',
    source: layerConfig.id,
    paint: {
      'raster-opacity': 0.7
    }
  });
};

// Example: Finnish Environmental Data
addWMSLayer(map, {
  id: 'fi-flood-zones',
  url: 'https://kartta.syke.fi/geoserver/ows',
  layers: 'tulvariskialueet:tulvariskialueet_1_100',
  format: 'image/png',
  transparent: true
});
```

### 3. Custom GeoJSON Data Layers
**Best for:** Site-specific analysis, constraint visualization, dynamic data

```typescript
// Advanced GeoJSON Implementation
class ConstraintLayerManager {
  private map: mapboxgl.Map;
  private constraints: Map<string, any> = new Map();

  constructor(map: mapboxgl.Map) {
    this.map = map;
  }

  addConstraintLayer(constraintId: string, data: any, styling: any) {
    // Add source
    this.map.addSource(`constraint-${constraintId}`, {
      type: 'geojson',
      data: data,
      generateId: true // Enable feature-state
    });

    // Add visualization layer
    this.map.addLayer({
      id: `constraint-${constraintId}`,
      type: styling.type || 'fill',
      source: `constraint-${constraintId}`,
      paint: {
        ...styling.paint,
        [`${styling.type || 'fill'}-opacity`]: [
          'case',
          ['boolean', ['feature-state', 'hover'], false],
          0.8,
          0.6
        ]
      }
    });

    // Add interactivity
    this.addInteractivity(`constraint-${constraintId}`);
    this.constraints.set(constraintId, { data, styling });
  }

  private addInteractivity(layerId: string) {
    let hoveredFeatureId: string | number | undefined;

    this.map.on('mouseenter', layerId, (e) => {
      if (e.features && e.features.length > 0) {
        if (hoveredFeatureId !== undefined) {
          this.map.setFeatureState(
            { source: layerId, id: hoveredFeatureId },
            { hover: false }
          );
        }
        hoveredFeatureId = e.features[0].id;
        this.map.setFeatureState(
          { source: layerId, id: hoveredFeatureId },
          { hover: true }
        );
      }
      this.map.getCanvas().style.cursor = 'pointer';
    });

    this.map.on('mouseleave', layerId, () => {
      if (hoveredFeatureId !== undefined) {
        this.map.setFeatureState(
          { source: layerId, id: hoveredFeatureId },
          { hover: false }
        );
      }
      hoveredFeatureId = undefined;
      this.map.getCanvas().style.cursor = '';
    });
  }
}
```

---

## Custom Controls & UI Components

### 1. Advanced Layer Control Panel
```typescript
interface LayerControlOptions {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  collapsible?: boolean;
  categories?: LayerCategory[];
}

class AdvancedLayerControl implements mapboxgl.IControl {
  private map: mapboxgl.Map | undefined;
  private container: HTMLElement;
  private layerStates: Map<string, LayerState> = new Map();

  constructor(private options: LayerControlOptions) {
    this.container = this.createControlContainer();
  }

  onAdd(map: mapboxgl.Map): HTMLElement {
    this.map = map;
    this.initializeLayerStates();
    this.setupEventListeners();
    return this.container;
  }

  onRemove(): void {
    if (this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    this.map = undefined;
  }

  private createControlContainer(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'mapboxgl-ctrl mapboxgl-ctrl-group';
    container.innerHTML = `
      <div class="layer-control-panel">
        <div class="layer-control-header">
          <h3>Data Layers</h3>
          <button class="layer-control-toggle">⚙️</button>
        </div>
        <div class="layer-control-content">
          ${this.renderCategories()}
        </div>
      </div>
    `;
    return container;
  }

  private renderCategories(): string {
    return this.options.categories?.map(category => `
      <div class="layer-category" data-category="${category.id}">
        <div class="category-header">
          <span class="category-icon">${category.icon}</span>
          <span class="category-name">${category.name}</span>
          <span class="category-toggle">▼</span>
        </div>
        <div class="category-layers">
          ${category.layers.map(layer => this.renderLayerControl(layer)).join('')}
        </div>
      </div>
    `).join('') || '';
  }

  private renderLayerControl(layer: TileLayerSource): string {
    return `
      <div class="layer-item" data-layer="${layer.id}">
        <div class="layer-main">
          <label class="layer-checkbox">
            <input type="checkbox" ${layer.default_visible ? 'checked' : ''}>
            <span class="layer-name">${layer.name}</span>
          </label>
          <button class="layer-info">ℹ️</button>
        </div>
        <div class="layer-controls">
          <div class="opacity-control">
            <label>Opacity</label>
            <input type="range" min="0" max="100" value="${(layer.opacity || 1) * 100}" 
                   class="opacity-slider">
            <span class="opacity-value">${Math.round((layer.opacity || 1) * 100)}%</span>
          </div>
          <div class="layer-metadata">
            <small>Provider: ${layer.provider}</small>
            <small>Updated: ${layer.update_frequency}</small>
          </div>
        </div>
      </div>
    `;
  }
}

// Usage
const layerControl = new AdvancedLayerControl({
  position: 'top-left',
  collapsible: true,
  categories: LAYER_CATEGORIES
});
map.addControl(layerControl);
```

### 2. Opacity Control Implementation
```typescript
// Smooth opacity controls with debouncing
class OpacityController {
  private debounceTimeout: NodeJS.Timeout | null = null;

  updateOpacity(layerId: string, opacity: number, immediate = false) {
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }

    const updateFn = () => {
      if (this.map.getLayer(layerId)) {
        const layerType = this.map.getLayer(layerId)?.type;
        const opacityProperty = this.getOpacityProperty(layerType);
        this.map.setPaintProperty(layerId, opacityProperty, opacity);
      }
    };

    if (immediate) {
      updateFn();
    } else {
      this.debounceTimeout = setTimeout(updateFn, 150);
    }
  }

  private getOpacityProperty(layerType: string): string {
    const opacityMap: { [key: string]: string } = {
      'fill': 'fill-opacity',
      'line': 'line-opacity',
      'circle': 'circle-opacity',
      'symbol': 'text-opacity',
      'raster': 'raster-opacity',
      'fill-extrusion': 'fill-extrusion-opacity'
    };
    return opacityMap[layerType] || 'opacity';
  }
}
```

---

## Data-Driven Styling & Filtering

### 1. Dynamic Expression-Based Styling
```typescript
// Advanced data-driven styling for infrastructure analysis
const createInfrastructureLayer = (map: mapboxgl.Map) => {
  map.addLayer({
    id: 'power-capacity-analysis',
    type: 'circle',
    source: 'substations-source',
    paint: {
      // Size based on capacity
      'circle-radius': [
        'interpolate', ['exponential', 1.5], ['get', 'capacity_mva'],
        0, 4,
        100, 8,
        500, 16,
        2000, 32
      ],
      // Color based on utilization
      'circle-color': [
        'interpolate', ['linear'], ['/', ['get', 'current_load'], ['get', 'capacity_mva']],
        0, '#00ff00',      // Green: 0% utilization
        0.5, '#ffff00',    // Yellow: 50% utilization
        0.8, '#ff8000',    // Orange: 80% utilization
        1.0, '#ff0000'     // Red: 100% utilization
      ],
      // Stroke based on voltage level
      'circle-stroke-color': [
        'case',
        ['>=', ['get', 'voltage_kv'], 400], '#ff0000',
        ['>=', ['get', 'voltage_kv'], 220], '#ff6b35',
        ['>=', ['get', 'voltage_kv'], 132], '#ffb000',
        '#4a90e2'
      ],
      'circle-stroke-width': 2,
      // Opacity based on distance to site
      'circle-opacity': [
        'interpolate', ['exponential', 2], ['get', 'distance_to_site_km'],
        0, 1.0,
        10, 0.8,
        50, 0.4,
        100, 0.2
      ]
    }
  });
};
```

### 2. Advanced Filtering System
```typescript
class LayerFilterManager {
  private activeFilters: Map<string, any[]> = new Map();

  // Multi-criteria filtering
  applyConstraintFilters(layerId: string, criteria: {
    minDistance?: number;
    maxDistance?: number;
    minCapacity?: number;
    voltageLevel?: number[];
    availability?: 'high' | 'medium' | 'low';
    environmentalRisk?: 'low' | 'medium' | 'high';
  }) {
    const filters: any[] = ['all'];

    if (criteria.minDistance !== undefined) {
      filters.push(['>=', ['get', 'distance_km'], criteria.minDistance]);
    }
    
    if (criteria.maxDistance !== undefined) {
      filters.push(['<=', ['get', 'distance_km'], criteria.maxDistance]);
    }

    if (criteria.minCapacity !== undefined) {
      filters.push(['>=', ['get', 'capacity_mva'], criteria.minCapacity]);
    }

    if (criteria.voltageLevel?.length) {
      filters.push(['in', ['get', 'voltage_kv'], ['literal', criteria.voltageLevel]]);
    }

    if (criteria.availability) {
      const availabilityMap = { 'high': 80, 'medium': 50, 'low': 0 };
      filters.push(['>=', ['get', 'availability_percent'], availabilityMap[criteria.availability]]);
    }

    this.activeFilters.set(layerId, filters);
    this.map.setFilter(layerId, filters.length > 1 ? filters : null);
  }

  // Time-based filtering for historical data
  applyTemporalFilter(layerId: string, timeRange: { start: Date; end: Date }) {
    const filter = [
      'all',
      ['>=', ['get', 'timestamp'], timeRange.start.getTime()],
      ['<=', ['get', 'timestamp'], timeRange.end.getTime()]
    ];
    
    this.map.setFilter(layerId, filter);
  }

  clearFilters(layerId: string) {
    this.activeFilters.delete(layerId);
    this.map.setFilter(layerId, null);
  }
}
```

---

## Performance Optimization

### 1. Layer Optimization Strategies
```typescript
class PerformanceOptimizedLayerManager {
  private layerCache: Map<string, any> = new Map();
  private visibilityStates: Map<string, boolean> = new Map();

  // Combine similar layers for better performance
  combineLayerSources(layers: TileLayerSource[]): void {
    const sourceGroups = layers.reduce((groups, layer) => {
      const key = `${layer.provider}-${layer.type}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(layer);
      return groups;
    }, {} as { [key: string]: TileLayerSource[] });

    Object.entries(sourceGroups).forEach(([groupKey, groupLayers]) => {
      if (groupLayers.length > 1) {
        this.createCombinedSource(groupKey, groupLayers);
      }
    });
  }

  // Use feature-state for dynamic styling instead of re-parsing
  updateFeatureState(sourceId: string, featureId: string | number, state: any): void {
    this.map.setFeatureState({ source: sourceId, id: featureId }, state);
  }

  // Lazy loading with viewport-based triggering
  enableLazyLayerLoading(): void {
    this.map.on('moveend', () => {
      const bounds = this.map.getBounds();
      const zoom = this.map.getZoom();
      
      this.layerCache.forEach((layer, layerId) => {
        if (layer.min_zoom <= zoom && zoom <= layer.max_zoom) {
          if (!this.map.getLayer(layerId) && this.shouldLoadLayer(layer, bounds)) {
            this.loadLayer(layer);
          }
        } else if (this.map.getLayer(layerId)) {
          this.unloadLayer(layerId);
        }
      });
    });
  }

  // Optimize expressions for better performance
  createOptimizedExpression(property: string, stops: [number, any][]): any[] {
    // Use step expressions for discrete values
    if (stops.length <= 5) {
      return ['step', ['get', property], stops[0][1], ...stops.slice(1).flat()];
    }
    // Use interpolate for continuous values
    return ['interpolate', ['linear'], ['get', property], ...stops.flat()];
  }
}
```

### 2. Memory Management
```typescript
class LayerMemoryManager {
  private loadedLayers: Set<string> = new Set();
  private maxConcurrentLayers = 10;

  manageLayerMemory(): void {
    if (this.loadedLayers.size > this.maxConcurrentLayers) {
      // Remove least recently used layers
      const layersToRemove = Array.from(this.loadedLayers)
        .slice(0, this.loadedLayers.size - this.maxConcurrentLayers);
      
      layersToRemove.forEach(layerId => {
        this.unloadLayer(layerId);
      });
    }
  }

  unloadLayer(layerId: string): void {
    if (this.map.getLayer(layerId)) {
      this.map.removeLayer(layerId);
    }
    if (this.map.getSource(layerId)) {
      this.map.removeSource(layerId);
    }
    this.loadedLayers.delete(layerId);
  }
}
```

---

## ArcGIS Service Integration

### 1. ArcGIS REST Services
```typescript
// ArcGIS Feature Service Integration
class ArcGISServiceManager {
  private baseUrl: string;
  private token?: string;

  constructor(baseUrl: string, token?: string) {
    this.baseUrl = baseUrl;
    this.token = token;
  }

  async addFeatureService(serviceUrl: string, layerConfig: {
    id: string;
    name: string;
    styling: any;
  }): Promise<void> {
    try {
      // Query service metadata
      const metadataResponse = await fetch(
        `${serviceUrl}?f=json&token=${this.token || ''}`
      );
      const metadata = await metadataResponse.json();

      // Create vector tile URL if supported
      if (metadata.capabilities?.includes('TilesOnly')) {
        const vtUrl = `${serviceUrl}/VectorTileServer/tile/{z}/{y}/{x}.pbf`;
        
        this.map.addSource(layerConfig.id, {
          type: 'vector',
          tiles: [vtUrl],
          minzoom: metadata.minScale ? this.scaleToZoom(metadata.minScale) : 0,
          maxzoom: metadata.maxScale ? this.scaleToZoom(metadata.maxScale) : 18
        });
      } else {
        // Fallback to feature query
        await this.loadFeatureData(serviceUrl, layerConfig);
      }

    } catch (error) {
      console.error('Error loading ArcGIS service:', error);
    }
  }

  private async loadFeatureData(serviceUrl: string, layerConfig: any): Promise<void> {
    const bounds = this.map.getBounds();
    const geometry = this.boundsToEsriGeometry(bounds);
    
    const query = new URLSearchParams({
      where: '1=1',
      geometry: JSON.stringify(geometry),
      geometryType: 'esriGeometryEnvelope',
      spatialRel: 'esriSpatialRelIntersects',
      outFields: '*',
      returnGeometry: 'true',
      f: 'geojson',
      token: this.token || ''
    });

    const response = await fetch(`${serviceUrl}/query?${query}`);
    const geojson = await response.json();

    this.map.addSource(layerConfig.id, {
      type: 'geojson',
      data: geojson
    });

    this.map.addLayer({
      id: layerConfig.id,
      type: layerConfig.styling.type,
      source: layerConfig.id,
      paint: layerConfig.styling.paint
    });
  }

  private scaleToZoom(scale: number): number {
    return Math.round(Math.log2(591657527.591555 / scale));
  }

  private boundsToEsriGeometry(bounds: mapboxgl.LngLatBounds): any {
    return {
      xmin: bounds.getWest(),
      ymin: bounds.getSouth(),
      xmax: bounds.getEast(),
      ymax: bounds.getNorth(),
      spatialReference: { wkid: 4326 }
    };
  }
}
```

### 2. ArcGIS Online Integration
```typescript
// Integration with ArcGIS Online hosted services
class ArcGISOnlineManager extends ArcGISServiceManager {
  async addWebMap(webmapId: string): Promise<void> {
    const webmapUrl = `https://www.arcgis.com/sharing/rest/content/items/${webmapId}/data`;
    
    try {
      const response = await fetch(`${webmapUrl}?f=json&token=${this.token}`);
      const webmapData = await response.json();
      
      // Process operational layers
      for (const layer of webmapData.operationalLayers) {
        await this.processWebMapLayer(layer);
      }
      
      // Process basemap
      if (webmapData.baseMap) {
        await this.processBasemap(webmapData.baseMap);
      }
    } catch (error) {
      console.error('Error loading ArcGIS web map:', error);
    }
  }

  private async processWebMapLayer(layer: any): Promise<void> {
    if (layer.layerType === 'ArcGISFeatureLayer') {
      await this.addFeatureService(layer.url, {
        id: layer.id,
        name: layer.title,
        styling: this.convertEsriSymbology(layer.layerDefinition?.drawingInfo)
      });
    }
  }

  private convertEsriSymbology(drawingInfo: any): any {
    // Convert Esri symbology to Mapbox GL JS styling
    if (!drawingInfo) return { type: 'circle', paint: { 'circle-color': '#3388ff' } };
    
    const renderer = drawingInfo.renderer;
    
    switch (renderer.type) {
      case 'simple':
        return this.convertSimpleRenderer(renderer);
      case 'classBreaks':
        return this.convertClassBreaksRenderer(renderer);
      case 'uniqueValue':
        return this.convertUniqueValueRenderer(renderer);
      default:
        return { type: 'circle', paint: { 'circle-color': '#3388ff' } };
    }
  }
}
```

---

## Implementation Examples

### Complete Layer Management System
```typescript
// Complete implementation for datacenter feasibility platform
class DatacenterFeasibilityLayerManager {
  private map: mapboxgl.Map;
  private layerStates: Map<string, LayerState> = new Map();
  private constraintManager: ConstraintLayerManager;
  private performanceManager: PerformanceOptimizedLayerManager;

  constructor(map: mapboxgl.Map) {
    this.map = map;
    this.constraintManager = new ConstraintLayerManager(map);
    this.performanceManager = new PerformanceOptimizedLayerManager(map);
    this.initializeInfrastructureLayers();
  }

  private async initializeInfrastructureLayers(): Promise<void> {
    // Power infrastructure
    await this.addPowerInfrastructure();
    
    // Environmental constraints
    await this.addEnvironmentalLayers();
    
    // Planning and zoning
    await this.addPlanningLayers();
    
    // Transportation
    await this.addTransportationLayers();
  }

  private async addPowerInfrastructure(): Promise<void> {
    // Fingrid transmission network
    this.map.addSource('fingrid-network', {
      type: 'vector',
      tiles: ['https://data.fingrid.fi/tiles/{z}/{x}/{y}.mvt'],
      attribution: '© Fingrid Oyj'
    });

    // High voltage lines
    this.map.addLayer({
      id: 'transmission-lines-400kv',
      type: 'line',
      source: 'fingrid-network',
      'source-layer': 'transmission_lines',
      filter: ['>=', ['get', 'voltage_kv'], 400],
      paint: {
        'line-color': '#ff0000',
        'line-width': ['interpolate', ['linear'], ['zoom'], 8, 3, 16, 8],
        'line-opacity': 0.9
      }
    });

    // Substations with capacity analysis
    this.map.addLayer({
      id: 'substations-capacity',
      type: 'circle',
      source: 'fingrid-network',
      'source-layer': 'substations',
      paint: {
        'circle-radius': [
          'interpolate', ['exponential', 1.5], ['get', 'capacity_mva'],
          0, 6, 100, 10, 500, 20, 2000, 40
        ],
        'circle-color': [
          'interpolate', ['linear'], ['/', ['get', 'available_capacity'], ['get', 'total_capacity']],
          0, '#ff0000', 0.3, '#ff8000', 0.7, '#ffff00', 1.0, '#00ff00'
        ],
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 2
      }
    });
  }

  private async addEnvironmentalLayers(): Promise<void> {
    // Natura 2000 protected areas
    this.map.addSource('natura2000', {
      type: 'raster',
      tiles: ['https://bio.discomap.eea.europa.eu/arcgis/rest/services/ProtectedSites/Natura2000Sites_Dyna_WM/MapServer/tile/{z}/{y}/{x}'],
      attribution: '© European Environment Agency'
    });

    this.map.addLayer({
      id: 'protected-areas',
      type: 'raster',
      source: 'natura2000',
      paint: { 'raster-opacity': 0.6 }
    });

    // Flood risk areas (Finnish data)
    await this.loadFloodRiskData();
  }

  private async addPlanningLayers(): Promise<void> {
    // Zoning from local municipality
    const zoningData = await this.fetchMunicipalZoning();
    
    this.map.addSource('municipal-zoning', {
      type: 'geojson',
      data: zoningData
    });

    this.map.addLayer({
      id: 'zoning-industrial',
      type: 'fill',
      source: 'municipal-zoning',
      filter: ['in', ['get', 'zone_type'], ['literal', ['industrial', 'mixed_use', 'special']]],
      paint: {
        'fill-color': [
          'match', ['get', 'zone_type'],
          'industrial', '#8b5a2b',
          'mixed_use', '#d4a574',
          'special', '#a67c5a',
          '#cccccc'
        ],
        'fill-opacity': 0.4
      }
    });
  }

  // Advanced constraint analysis
  async analyzeDatacenterConstraints(siteLocation: [number, number], radius: number): Promise<ConstraintAnalysis> {
    const analysis: ConstraintAnalysis = {
      power: await this.analyzePowerAvailability(siteLocation, radius),
      environmental: await this.analyzeEnvironmentalConstraints(siteLocation, radius),
      planning: await this.analyzePlanningConstraints(siteLocation, radius),
      transportation: await this.analyzeTransportAccess(siteLocation, radius)
    };

    // Visualize constraints
    await this.visualizeConstraints(siteLocation, analysis);
    
    return analysis;
  }

  private async visualizeConstraints(location: [number, number], analysis: ConstraintAnalysis): Promise<void> {
    // Create constraint heatmap
    const constraintScores = this.generateConstraintHeatmap(location, analysis);
    
    this.map.addSource('constraint-heatmap', {
      type: 'geojson',
      data: constraintScores
    });

    this.map.addLayer({
      id: 'constraint-visualization',
      type: 'heatmap',
      source: 'constraint-heatmap',
      paint: {
        'heatmap-weight': ['get', 'constraint_score'],
        'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 1, 18, 3],
        'heatmap-color': [
          'interpolate', ['linear'], ['heatmap-density'],
          0, 'rgba(0,255,0,0)',
          0.2, 'rgba(255,255,0,0.5)',
          0.5, 'rgba(255,165,0,0.7)',
          1, 'rgba(255,0,0,0.9)'
        ],
        'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 20, 18, 50]
      }
    });
  }
}

// Usage
const layerManager = new DatacenterFeasibilityLayerManager(map);
const constraints = await layerManager.analyzeDatacenterConstraints([21.7975, 61.4851], 10000);
```

---

## Best Practices & Recommendations

### 1. Layer Organization Strategy
```typescript
const LAYER_ORGANIZATION_BEST_PRACTICES = {
  // Group layers by data source for better performance
  groupBySimilarity: true,
  
  // Use meaningful layer IDs
  namingConvention: 'category-provider-datatype-detail',
  // Example: 'power-fingrid-transmission-400kv'
  
  // Limit concurrent layers
  maxConcurrentLayers: 15,
  
  // Use appropriate zoom levels
  zoomOptimization: {
    overview: { min: 0, max: 8 },    // Regional data
    analysis: { min: 8, max: 14 },   // Detailed analysis
    site: { min: 14, max: 20 }       // Site-specific data
  }
};
```

### 2. Performance Guidelines
```typescript
const PERFORMANCE_GUIDELINES = {
  // Vector tiles over GeoJSON for large datasets
  preferVectorTiles: true,
  
  // Use feature-state for dynamic styling
  useFeatureState: true,
  
  // Combine sources where possible
  combineSimilarSources: true,
  
  // Implement lazy loading
  lazyLoadLayers: true,
  
  // Cache frequently used data
  implementCaching: true,
  
  // Monitor memory usage
  memoryManagement: {
    maxFeatures: 10000,
    cleanupInterval: 30000,
    unloadHiddenLayers: true
  }
};
```

### 3. User Experience Optimization
```typescript
const UX_OPTIMIZATION_PATTERNS = {
  // Progressive disclosure
  layerCategories: {
    essential: ['base_maps', 'power_infrastructure'],
    analysis: ['environmental', 'planning'],
    advanced: ['real_time', 'historical']
  },
  
  // Smart defaults
  intelligentDefaults: {
    showRelevantLayers: true,
    contextualVisibility: true,
    adaptiveOpacity: true
  },
  
  // Loading states
  loadingFeedback: {
    showProgress: true,
    gracefulDegradation: true,
    errorHandling: true
  }
};
```

### 4. Data Integration Recommendations

**For Infrastructure Analysis:**
- Use vector tiles for interactive power grid data
- Implement real-time updates for capacity information
- Create composite layers for multi-criteria analysis

**For Environmental Constraints:**
- Load protected area boundaries as vector data
- Use WMS for real-time environmental monitoring
- Implement temporal filtering for seasonal data

**For Planning & Zoning:**
- Integrate municipal WMS services
- Cache permit and approval data locally
- Provide detailed property boundary information

**For Performance at Scale:**
- Implement viewport-based data loading
- Use clustering for point data at low zoom levels
- Pre-process complex geometries for web display
- Monitor and optimize render performance continuously

This comprehensive guide provides the foundation for implementing sophisticated layer management in your datacenter feasibility platform, with specific attention to European data sources and infrastructure analysis requirements.