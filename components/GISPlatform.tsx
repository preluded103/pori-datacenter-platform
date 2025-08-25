/**
 * Modular GIS Platform for Datacenter Site Analysis
 * Standards-compliant mapping interface with dynamic layer management
 */

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { 
  Layers, 
  MapPin, 
  Settings, 
  Download, 
  ZoomIn, 
  ZoomOut,
  Maximize2,
  Navigation,
  Eye,
  EyeOff,
  Sliders,
  Filter,
  RotateCcw
} from 'lucide-react';

// Environment variables
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || 'pk.eyJ1IjoicHJlbHVkZWQiLCJhIjoiY2treXZsYmZhMDdsajJ2dWkwdjZib21hNyJ9.iYbWJ_lSePJw8c9AXaPL8A';

interface LayerConfig {
  id: string;
  name: string;
  type: 'raster' | 'vector' | 'geojson' | 'wms';
  category: 'base' | 'infrastructure' | 'environmental' | 'regulatory' | 'analysis';
  source: {
    type: string;
    url?: string;
    data?: any;
    tiles?: string[];
    layers?: string;
  };
  style?: {
    opacity?: number;
    color?: string;
    fillColor?: string;
    strokeColor?: string;
    strokeWidth?: number;
  };
  visible: boolean;
  interactive: boolean;
  minzoom?: number;
  maxzoom?: number;
  metadata?: {
    description: string;
    source: string;
    updated: string;
    crs: string;
    accuracy: string;
  };
}

interface Site {
  id: string;
  name: string;
  coordinates: [number, number];
  properties: {
    powerRequirement?: number;
    area?: number;
    status?: string;
    score?: number;
    country?: string;
    region?: string;
  };
}

interface GISPlatformProps {
  initialCenter?: [number, number];
  initialZoom?: number;
  sites?: Site[];
  onSiteSelect?: (site: Site) => void;
  className?: string;
}

const GISPlatform: React.FC<GISPlatformProps> = ({
  initialCenter = [21.8110, 61.4957], // Pori, Finland
  initialZoom = 10,
  sites = [],
  onSiteSelect,
  className = "h-screen w-full"
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [layers, setLayers] = useState<LayerConfig[]>([]);
  const [selectedLayers, setSelectedLayers] = useState<string[]>([]);
  const [layerPanelOpen, setLayerPanelOpen] = useState(false);
  const [currentStyle, setCurrentStyle] = useState('mapbox://styles/mapbox/dark-v11');

  // Initialize base layers configuration
  const initializeBaseLayers = useCallback((): LayerConfig[] => {
    return [
      // Base Maps
      {
        id: 'satellite',
        name: 'Satellite Imagery',
        type: 'raster',
        category: 'base',
        source: {
          type: 'raster',
          url: 'mapbox://mapbox.satellite',
        },
        visible: false,
        interactive: false,
        metadata: {
          description: 'High-resolution satellite imagery',
          source: 'Mapbox',
          updated: '2024',
          crs: 'EPSG:3857',
          accuracy: '1m'
        }
      },
      
      // Infrastructure Layers
      {
        id: 'power-grid',
        name: 'Power Grid Infrastructure',
        type: 'vector',
        category: 'infrastructure',
        source: {
          type: 'vector',
          url: 'mapbox://preluded.finnish-power-grid'
        },
        style: {
          color: '#ef4444',
          strokeWidth: 2,
          opacity: 0.8
        },
        visible: true,
        interactive: true,
        minzoom: 8,
        metadata: {
          description: 'Transmission lines and substations',
          source: 'Fingrid Open Data',
          updated: '2024-01',
          crs: 'EPSG:3067',
          accuracy: '10m'
        }
      },
      
      {
        id: 'fiber-infrastructure',
        name: 'Fiber Optic Networks',
        type: 'vector',
        category: 'infrastructure',
        source: {
          type: 'vector',
          url: 'mapbox://preluded.nordic-fiber'
        },
        style: {
          color: '#8b5cf6',
          strokeWidth: 1,
          opacity: 0.6
        },
        visible: false,
        interactive: true,
        minzoom: 10,
        metadata: {
          description: 'Fiber optic backbone infrastructure',
          source: 'Multiple Telecom Operators',
          updated: '2024-01',
          crs: 'EPSG:3857',
          accuracy: '100m'
        }
      },
      
      {
        id: 'water-infrastructure',
        name: 'Water Systems',
        type: 'vector',
        category: 'infrastructure',
        source: {
          type: 'vector',
          url: 'mapbox://preluded.finnish-water-systems'
        },
        style: {
          color: '#06b6d4',
          fillColor: '#06b6d4',
          opacity: 0.7
        },
        visible: false,
        interactive: true,
        metadata: {
          description: 'Rivers, lakes, and water treatment facilities',
          source: 'SYKE',
          updated: '2023-12',
          crs: 'EPSG:3067',
          accuracy: '1m'
        }
      },
      
      // Environmental Layers
      {
        id: 'protected-areas',
        name: 'Protected Areas (Natura 2000)',
        type: 'vector',
        category: 'environmental',
        source: {
          type: 'vector',
          url: 'mapbox://preluded.natura2000-finland'
        },
        style: {
          fillColor: '#22c55e',
          opacity: 0.3,
          strokeColor: '#16a34a',
          strokeWidth: 1
        },
        visible: true,
        interactive: true,
        metadata: {
          description: 'EU Natura 2000 protected areas',
          source: 'SYKE',
          updated: '2024-01',
          crs: 'EPSG:3067',
          accuracy: '1m'
        }
      },
      
      {
        id: 'flood-zones',
        name: 'Flood Risk Zones',
        type: 'vector',
        category: 'environmental',
        source: {
          type: 'vector',
          url: 'mapbox://preluded.flood-zones-finland'
        },
        style: {
          fillColor: '#3b82f6',
          opacity: 0.4,
          strokeColor: '#1d4ed8',
          strokeWidth: 1
        },
        visible: false,
        interactive: true,
        metadata: {
          description: '100-year flood risk zones',
          source: 'SYKE',
          updated: '2023-11',
          crs: 'EPSG:3067',
          accuracy: '10m'
        }
      },
      
      // Regulatory Layers
      {
        id: 'zoning',
        name: 'Land Use Zoning',
        type: 'vector',
        category: 'regulatory',
        source: {
          type: 'vector',
          url: 'mapbox://preluded.finnish-zoning'
        },
        style: {
          fillColor: '#f59e0b',
          opacity: 0.5,
          strokeColor: '#d97706',
          strokeWidth: 1
        },
        visible: false,
        interactive: true,
        metadata: {
          description: 'Municipal zoning classifications',
          source: 'Municipal Planning Authorities',
          updated: '2024-01',
          crs: 'EPSG:3067',
          accuracy: '1m'
        }
      },
      
      // Analysis Layers
      {
        id: 'constraint-analysis',
        name: 'Constraint Analysis',
        type: 'geojson',
        category: 'analysis',
        source: {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: []
          }
        },
        style: {
          fillColor: '#ef4444',
          opacity: 0.6,
          strokeColor: '#dc2626',
          strokeWidth: 2
        },
        visible: false,
        interactive: true,
        metadata: {
          description: 'Generated constraint analysis results',
          source: 'Platform Analysis',
          updated: new Date().toISOString(),
          crs: 'EPSG:4326',
          accuracy: 'Variable'
        }
      }
    ];
  }, []);

  // Initialize Mapbox GL
  useEffect(() => {
    if (map.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current!,
      style: currentStyle,
      center: initialCenter,
      zoom: initialZoom,
      projection: 'mercator',
      antialias: true,
      attributionControl: false
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    
    // Add fullscreen control
    map.current.addControl(new mapboxgl.FullscreenControl(), 'top-right');
    
    // Add scale control
    map.current.addControl(new mapboxgl.ScaleControl({
      maxWidth: 100,
      unit: 'metric'
    }), 'bottom-left');

    // Custom attribution
    map.current.addControl(new mapboxgl.AttributionControl({
      customAttribution: 'Pre-DD Intelligence Platform'
    }), 'bottom-right');

    map.current.on('load', () => {
      setMapLoaded(true);
      const baseLayers = initializeBaseLayers();
      setLayers(baseLayers);
      setSelectedLayers(baseLayers.filter(l => l.visible).map(l => l.id));
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [initialCenter, initialZoom, currentStyle, initializeBaseLayers]);

  // Add/remove layers based on selection
  useEffect(() => {
    if (!mapLoaded || !map.current) return;

    layers.forEach(layerConfig => {
      const isSelected = selectedLayers.includes(layerConfig.id);
      const layerExists = map.current!.getLayer(layerConfig.id);

      if (isSelected && !layerExists) {
        // Add source if it doesn't exist
        if (!map.current!.getSource(layerConfig.id)) {
          map.current!.addSource(layerConfig.id, layerConfig.source as any);
        }

        // Add layer based on type
        switch (layerConfig.type) {
          case 'vector':
            map.current!.addLayer({
              id: layerConfig.id,
              source: layerConfig.id,
              'source-layer': layerConfig.source.layers || layerConfig.id,
              type: 'line',
              paint: {
                'line-color': layerConfig.style?.strokeColor || layerConfig.style?.color || '#ffffff',
                'line-width': layerConfig.style?.strokeWidth || 1,
                'line-opacity': layerConfig.style?.opacity || 1
              }
            });
            break;
            
          case 'geojson':
            map.current!.addLayer({
              id: layerConfig.id,
              source: layerConfig.id,
              type: 'fill',
              paint: {
                'fill-color': layerConfig.style?.fillColor || '#ffffff',
                'fill-opacity': layerConfig.style?.opacity || 0.5,
                'fill-outline-color': layerConfig.style?.strokeColor || '#000000'
              }
            });
            break;
            
          case 'raster':
            map.current!.addLayer({
              id: layerConfig.id,
              source: layerConfig.id,
              type: 'raster',
              paint: {
                'raster-opacity': layerConfig.style?.opacity || 1
              }
            });
            break;
        }

        // Set zoom constraints if specified
        if (layerConfig.minzoom || layerConfig.maxzoom) {
          map.current!.setLayerZoomRange(
            layerConfig.id,
            layerConfig.minzoom || 0,
            layerConfig.maxzoom || 24
          );
        }

      } else if (!isSelected && layerExists) {
        // Remove layer
        map.current!.removeLayer(layerConfig.id);
        // Note: We keep the source for potential re-adding
      }
    });
  }, [selectedLayers, layers, mapLoaded]);

  // Add site markers
  useEffect(() => {
    if (!mapLoaded || !map.current || sites.length === 0) return;

    // Add sites source and layer
    const sitesGeoJSON = {
      type: 'FeatureCollection' as const,
      features: sites.map(site => ({
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: site.coordinates
        },
        properties: {
          ...site.properties,
          id: site.id,
          name: site.name
        }
      }))
    };

    if (map.current.getSource('sites')) {
      (map.current.getSource('sites') as mapboxgl.GeoJSONSource).setData(sitesGeoJSON);
    } else {
      map.current.addSource('sites', {
        type: 'geojson',
        data: sitesGeoJSON
      });

      // Add site markers
      map.current.addLayer({
        id: 'site-markers',
        source: 'sites',
        type: 'circle',
        paint: {
          'circle-radius': [
            'case',
            ['==', ['get', 'status'], 'completed'], 8,
            ['==', ['get', 'status'], 'analyzing'], 6,
            4
          ],
          'circle-color': [
            'case',
            ['==', ['get', 'status'], 'completed'], '#22c55e',
            ['==', ['get', 'status'], 'analyzing'], '#3b82f6',
            '#71717a'
          ],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff'
        }
      });

      // Add site labels
      map.current.addLayer({
        id: 'site-labels',
        source: 'sites',
        type: 'symbol',
        layout: {
          'text-field': ['get', 'name'],
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
          'text-size': 12,
          'text-offset': [0, 2],
          'text-anchor': 'top'
        },
        paint: {
          'text-color': '#ffffff',
          'text-halo-color': '#000000',
          'text-halo-width': 1
        }
      });

      // Add click handlers
      map.current.on('click', 'site-markers', (e) => {
        if (e.features && e.features[0] && onSiteSelect) {
          const feature = e.features[0];
          const site: Site = {
            id: feature.properties!.id,
            name: feature.properties!.name,
            coordinates: (feature.geometry as any).coordinates,
            properties: feature.properties!
          };
          onSiteSelect(site);
        }
      });

      // Change cursor on hover
      map.current.on('mouseenter', 'site-markers', () => {
        map.current!.getCanvas().style.cursor = 'pointer';
      });

      map.current.on('mouseleave', 'site-markers', () => {
        map.current!.getCanvas().style.cursor = '';
      });
    }
  }, [sites, mapLoaded, onSiteSelect]);

  const toggleLayer = (layerId: string) => {
    setSelectedLayers(prev => 
      prev.includes(layerId)
        ? prev.filter(id => id !== layerId)
        : [...prev, layerId]
    );
  };

  const changeBaseStyle = (styleUrl: string) => {
    if (map.current) {
      setCurrentStyle(styleUrl);
      map.current.setStyle(styleUrl);
      // Re-add layers after style change
      map.current.once('styledata', () => {
        setMapLoaded(true);
      });
    }
  };

  const resetView = () => {
    if (map.current) {
      map.current.flyTo({
        center: initialCenter,
        zoom: initialZoom,
        bearing: 0,
        pitch: 0
      });
    }
  };

  const LayerPanel = () => (
    <div className="absolute top-4 left-4 bg-[#131316] border border-[#27272a] rounded-lg shadow-xl w-80 max-h-[calc(100vh-2rem)] overflow-hidden z-10">
      <div className="border-b border-[#27272a] p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-[#fafafa] flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Map Layers
          </h3>
          <button
            onClick={() => setLayerPanelOpen(false)}
            className="text-[#71717a] hover:text-[#fafafa]"
          >
            ✕
          </button>
        </div>
      </div>
      
      <div className="overflow-y-auto max-h-96">
        {/* Base Maps */}
        <div className="p-4 border-b border-[#27272a]">
          <h4 className="text-sm font-medium text-[#a1a1aa] mb-2">Base Maps</h4>
          <div className="space-y-2">
            <button
              onClick={() => changeBaseStyle('mapbox://styles/mapbox/dark-v11')}
              className={`w-full text-left px-3 py-2 rounded text-sm ${
                currentStyle === 'mapbox://styles/mapbox/dark-v11'
                  ? 'bg-blue-600 text-white'
                  : 'text-[#fafafa] hover:bg-[#1a1a1f]'
              }`}
            >
              Dark
            </button>
            <button
              onClick={() => changeBaseStyle('mapbox://styles/mapbox/satellite-v9')}
              className={`w-full text-left px-3 py-2 rounded text-sm ${
                currentStyle === 'mapbox://styles/mapbox/satellite-v9'
                  ? 'bg-blue-600 text-white'
                  : 'text-[#fafafa] hover:bg-[#1a1a1f]'
              }`}
            >
              Satellite
            </button>
            <button
              onClick={() => changeBaseStyle('mapbox://styles/mapbox/outdoors-v12')}
              className={`w-full text-left px-3 py-2 rounded text-sm ${
                currentStyle === 'mapbox://styles/mapbox/outdoors-v12'
                  ? 'bg-blue-600 text-white'
                  : 'text-[#fafafa] hover:bg-[#1a1a1f]'
              }`}
            >
              Terrain
            </button>
          </div>
        </div>

        {/* Data Layers by Category */}
        {['infrastructure', 'environmental', 'regulatory', 'analysis'].map(category => {
          const categoryLayers = layers.filter(l => l.category === category);
          if (categoryLayers.length === 0) return null;

          return (
            <div key={category} className="p-4 border-b border-[#27272a]">
              <h4 className="text-sm font-medium text-[#a1a1aa] mb-2 capitalize">
                {category}
              </h4>
              <div className="space-y-2">
                {categoryLayers.map(layer => (
                  <div key={layer.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleLayer(layer.id)}
                        className="text-[#71717a] hover:text-[#fafafa]"
                      >
                        {selectedLayers.includes(layer.id) ? (
                          <Eye className="h-4 w-4" />
                        ) : (
                          <EyeOff className="h-4 w-4" />
                        )}
                      </button>
                      <span className="text-sm text-[#fafafa]">{layer.name}</span>
                    </div>
                    {layer.metadata && (
                      <div className="text-xs text-[#71717a]">
                        {layer.metadata.accuracy}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className={`relative ${className}`}>
      <div ref={mapContainer} className="absolute inset-0" />
      
      {/* Loading indicator */}
      {!mapLoaded && (
        <div className="absolute inset-0 bg-[#0a0a0b] flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-2 border-[#27272a] border-t-blue-600 rounded-full"></div>
        </div>
      )}

      {/* Layer panel */}
      {layerPanelOpen && <LayerPanel />}

      {/* Map controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
        <button
          onClick={() => setLayerPanelOpen(!layerPanelOpen)}
          className="p-2 bg-[#131316] border border-[#27272a] rounded text-[#fafafa] hover:bg-[#1a1a1f] transition-colors"
          title="Toggle Layers"
        >
          <Layers className="h-4 w-4" />
        </button>
        
        <button
          onClick={resetView}
          className="p-2 bg-[#131316] border border-[#27272a] rounded text-[#fafafa] hover:bg-[#1a1a1f] transition-colors"
          title="Reset View"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-[#131316]/90 border border-[#27272a] rounded p-3 text-xs text-[#a1a1aa] backdrop-blur z-10">
        <div className="font-medium text-[#fafafa] mb-2">Legend</div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Completed Analysis</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span>In Progress</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
            <span>Pending</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GISPlatform;