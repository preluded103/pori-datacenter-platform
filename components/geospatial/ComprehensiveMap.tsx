'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { 
  Layers, Eye, EyeOff, Settings, Info, ZoomIn, ZoomOut, 
  Navigation, MapPin, Satellite, Map as MapIcon, Activity 
} from 'lucide-react';
import { 
  TileLayerSource, 
  LayerCategory, 
  LayerVisibilityState,
  GeospatialBounds 
} from '@/lib/geospatial/types';
import { 
  LAYER_CATEGORIES, 
  getLayersByCountry,
  getAllLayers
} from '@/lib/geospatial/layer-definitions';

interface ComprehensiveMapProps {
  center: [number, number];
  zoom?: number;
  onLocationChange?: (coordinates: [number, number], zoom: number) => void;
  onLayerToggle?: (layerId: string, visible: boolean) => void;
  countryCode?: string;
  className?: string;
}

export default function ComprehensiveMap({
  center,
  zoom = 12,
  onLocationChange,
  onLayerToggle,
  countryCode = 'FI',
  className = 'w-full h-full'
}: ComprehensiveMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showLayerPanel, setShowLayerPanel] = useState(false);
  const [layerVisibility, setLayerVisibility] = useState<LayerVisibilityState>({});
  const [currentZoom, setCurrentZoom] = useState(zoom);
  const [currentCenter, setCurrentCenter] = useState<[number, number]>(center);
  const [activeLayers, setActiveLayers] = useState<Set<string>>(new Set());

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Set Mapbox access token
    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11', // Base style
      center: center,
      zoom: zoom,
      preserveDrawingBuffer: true
    });

    map.current.on('load', () => {
      setIsLoaded(true);
      initializeDefaultLayers();
    });

    map.current.on('move', () => {
      if (map.current) {
        const newCenter = map.current.getCenter();
        const newZoom = map.current.getZoom();
        setCurrentCenter([newCenter.lng, newCenter.lat]);
        setCurrentZoom(newZoom);
        onLocationChange?.([newCenter.lng, newCenter.lat], newZoom);
      }
    });

    map.current.on('click', (e) => {
      const coordinates: [number, number] = [e.lngLat.lng, e.lngLat.lat];
      // Map click coordinates available here for future data queries
      // Could trigger data queries here
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Initialize default layers based on country
  const initializeDefaultLayers = useCallback(() => {
    if (!map.current || !isLoaded) return;

    const countryLayers = getLayersByCountry(countryCode);
    const defaultLayer = countryLayers.find(layer => layer.default_visible);
    
    if (defaultLayer) {
      addLayer(defaultLayer);
      setActiveLayers(prev => new Set([...prev, defaultLayer.id]));
    }
  }, [isLoaded, countryCode]);

  // Add layer to map
  const addLayer = useCallback((layer: TileLayerSource) => {
    if (!map.current || !isLoaded) return;

    try {
      // Remove existing layer if it exists
      if (map.current.getLayer(layer.id)) {
        map.current.removeLayer(layer.id);
      }
      if (map.current.getSource(layer.id)) {
        map.current.removeSource(layer.id);
      }

      // Add source based on layer type
      if (layer.type === 'xyz' || layer.type === 'wmts') {
        map.current.addSource(layer.id, {
          type: 'raster',
          tiles: [layer.url_template],
          tileSize: 256,
          attribution: layer.attribution,
          maxzoom: layer.max_zoom,
          minzoom: layer.min_zoom
        });

        map.current.addLayer({
          id: layer.id,
          type: 'raster',
          source: layer.id,
          paint: {
            'raster-opacity': layer.opacity || 1.0
          }
        });
      } else if (layer.type === 'vector') {
        // For vector layers (like OSM Overpass API)
        if (layer.url_template.includes('overpass-api')) {
          loadOverpassData(layer);
        }
      }

      setLayerVisibility(prev => ({
        ...prev,
        [layer.id]: {
          visible: true,
          opacity: layer.opacity || 1.0,
          z_index: 0
        }
      }));
    } catch (error) {
      console.error(`Error adding layer ${layer.id}:`, error);
    }
  }, [isLoaded]);

  // Load data from Overpass API
  const loadOverpassData = useCallback(async (layer: TileLayerSource) => {
    if (!map.current) return;

    try {
      const bounds = map.current.getBounds();
      const bbox = `${bounds.getSouth()},${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()}`;
      const query = layer.url_template.replace('{south},{west},{north},{east}', bbox);

      const response = await fetch(query);
      const geojson = await response.json();

      // Add source and layer for vector data
      if (map.current.getSource(layer.id)) {
        (map.current.getSource(layer.id) as mapboxgl.GeoJSONSource).setData(geojson);
      } else {
        map.current.addSource(layer.id, {
          type: 'geojson',
          data: geojson
        });

        // Style based on data category
        if (layer.data_categories.includes('power')) {
          map.current.addLayer({
            id: layer.id,
            type: 'line',
            source: layer.id,
            paint: {
              'line-color': '#ff6b35',
              'line-width': 2,
              'line-opacity': 0.8
            }
          });
        } else if (layer.data_categories.includes('transport')) {
          map.current.addLayer({
            id: layer.id,
            type: 'line',
            source: layer.id,
            paint: {
              'line-color': '#4a90e2',
              'line-width': 1.5,
              'line-opacity': 0.7
            }
          });
        } else if (layer.data_categories.includes('water')) {
          map.current.addLayer({
            id: layer.id,
            type: 'fill',
            source: layer.id,
            paint: {
              'fill-color': '#0ea5e9',
              'fill-opacity': 0.3
            }
          });
        }
      }
    } catch (error) {
      console.error(`Error loading Overpass data for ${layer.id}:`, error);
    }
  }, []);

  // Toggle layer visibility
  const toggleLayer = useCallback((layerId: string) => {
    if (!map.current) return;

    const layer = getAllLayers().find(l => l.id === layerId);
    if (!layer) return;

    if (activeLayers.has(layerId)) {
      // Remove layer
      if (map.current.getLayer(layerId)) {
        map.current.removeLayer(layerId);
      }
      if (map.current.getSource(layerId)) {
        map.current.removeSource(layerId);
      }
      setActiveLayers(prev => {
        const newSet = new Set(prev);
        newSet.delete(layerId);
        return newSet;
      });
      onLayerToggle?.(layerId, false);
    } else {
      // Add layer
      addLayer(layer);
      setActiveLayers(prev => new Set([...prev, layerId]));
      onLayerToggle?.(layerId, true);
    }
  }, [activeLayers, addLayer, onLayerToggle]);

  // Layer category component
  const LayerCategoryComponent = ({ category }: { category: LayerCategory }) => (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{category.icon}</span>
        <h4 className="font-medium text-[#fafafa]">{category.name}</h4>
      </div>
      <p className="text-xs text-[#71717a] mb-3">{category.description}</p>
      <div className="space-y-2">
        {category.layers.filter(layer => 
          countryCode === 'EU' || layer.country === countryCode || layer.country === 'EU' || layer.country === 'Global'
        ).map(layer => (
          <div key={layer.id} className="flex items-center justify-between p-2 bg-[#1a1a1f] rounded-md">
            <div className="flex-1">
              <div className="text-sm font-medium text-[#fafafa]">{layer.name}</div>
              <div className="text-xs text-[#71717a]">{layer.provider}</div>
              {layer.api_key_required && (
                <div className="text-xs text-yellow-400 mt-1">API Key Required</div>
              )}
            </div>
            <button
              onClick={() => toggleLayer(layer.id)}
              className={`p-1 rounded transition-colors ${
                activeLayers.has(layer.id)
                  ? 'text-blue-400 hover:text-blue-300'
                  : 'text-[#71717a] hover:text-[#a1a1aa]'
              }`}
            >
              {activeLayers.has(layer.id) ? (
                <Eye className="h-4 w-4" />
              ) : (
                <EyeOff className="h-4 w-4" />
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className={`relative ${className}`}>
      {/* Map Container */}
      <div ref={mapContainer} className="w-full h-full" />

      {/* Map Controls */}
      <div className="absolute top-4 left-4 flex flex-col gap-2">
        <button
          onClick={() => setShowLayerPanel(!showLayerPanel)}
          className={`p-3 bg-[#131316] border border-[#27272a] rounded-lg shadow-lg transition-all ${
            showLayerPanel ? 'bg-blue-600 text-white' : 'text-[#fafafa] hover:bg-[#1a1a1f]'
          }`}
          title="Toggle Layer Panel"
        >
          <Layers className="h-5 w-5" />
        </button>

        <button
          onClick={() => map.current?.zoomIn()}
          className="p-3 bg-[#131316] border border-[#27272a] rounded-lg shadow-lg text-[#fafafa] hover:bg-[#1a1a1f] transition-all"
          title="Zoom In"
        >
          <ZoomIn className="h-5 w-5" />
        </button>

        <button
          onClick={() => map.current?.zoomOut()}
          className="p-3 bg-[#131316] border border-[#27272a] rounded-lg shadow-lg text-[#fafafa] hover:bg-[#1a1a1f] transition-all"
          title="Zoom Out"
        >
          <ZoomOut className="h-5 w-5" />
        </button>
      </div>

      {/* Layer Control Panel */}
      {showLayerPanel && (
        <div className="absolute top-4 left-20 w-80 max-h-[80vh] bg-[#131316] border border-[#27272a] rounded-lg shadow-xl overflow-y-auto">
          <div className="p-4 border-b border-[#27272a]">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[#fafafa]">Data Layers</h3>
              <button
                onClick={() => setShowLayerPanel(false)}
                className="text-[#71717a] hover:text-[#fafafa]"
              >
                ✕
              </button>
            </div>
            <p className="text-sm text-[#a1a1aa] mt-1">
              Toggle geospatial data layers from European national mapping services
            </p>
          </div>
          
          <div className="p-4">
            {LAYER_CATEGORIES.map(category => (
              <LayerCategoryComponent key={category.id} category={category} />
            ))}
          </div>
        </div>
      )}

      {/* Map Info Display */}
      <div className="absolute bottom-4 left-4 bg-[#131316] border border-[#27272a] rounded-lg p-3 text-sm">
        <div className="text-[#71717a]">
          <div>Zoom: {currentZoom.toFixed(1)}</div>
          <div>Lat: {currentCenter[1].toFixed(4)}</div>
          <div>Lng: {currentCenter[0].toFixed(4)}</div>
          <div>Active Layers: {activeLayers.size}</div>
        </div>
      </div>

      {/* Attribution */}
      <div className="absolute bottom-4 right-4 bg-[#131316] border border-[#27272a] rounded-lg p-2 text-xs text-[#71717a] max-w-md">
        <div>© Mapbox</div>
        {Array.from(activeLayers).map(layerId => {
          const layer = getAllLayers().find(l => l.id === layerId);
          return layer ? (
            <div key={layerId}>{layer.attribution}</div>
          ) : null;
        })}
      </div>

      {/* Loading Indicator */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-[#0a0a0b]/80 flex items-center justify-center">
          <div className="text-center text-[#fafafa]">
            <div className="animate-spin h-8 w-8 border-2 border-[#27272a] border-t-blue-600 rounded-full mx-auto mb-4"></div>
            <p>Loading comprehensive map data...</p>
          </div>
        </div>
      )}
    </div>
  );
}