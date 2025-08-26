'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, Layers, Search, MapPin, BarChart3, 
  FileText, Settings, Home, Sliders, Satellite, Map as MapIcon,
  ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCcw
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface ProjectDetailPageProps {
  params: { id: string };
}

interface LayerOption {
  id: string;
  name: string;
  category: string;
  enabled: boolean;
  color: string;
  opacity: number;
}

export default function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const router = useRouter();
  const [projectName, setProjectName] = useState('');
  const [loading, setLoading] = useState(true);
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [mapStyle, setMapStyle] = useState('mapbox://styles/mapbox/streets-v12');
  const [coordinates, setCoordinates] = useState({ lat: 0, lng: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  
  const [layers, setLayers] = useState<LayerOption[]>([
    // Base Layers
    { id: 'base_terrain', name: 'Terrain', category: 'Base Layer', enabled: false, color: '#8B4513', opacity: 1 },
    { id: 'base_satellite', name: 'Satellite', category: 'Base Layer', enabled: false, color: '#00FF00', opacity: 1 },
    
    // Infrastructure
    { id: 'power_lines', name: 'Power Lines', category: 'Infrastructure', enabled: true, color: '#ff0000', opacity: 0.8 },
    { id: 'substations', name: 'Substations', category: 'Infrastructure', enabled: true, color: '#ff6600', opacity: 1 },
    { id: 'fiber_cables', name: 'Fiber Cables', category: 'Infrastructure', enabled: false, color: '#0066ff', opacity: 0.7 },
    { id: 'roads', name: 'Roads', category: 'Infrastructure', enabled: true, color: '#666666', opacity: 0.6 },
    { id: 'railways', name: 'Railways', category: 'Infrastructure', enabled: false, color: '#333333', opacity: 0.8 },
    
    // Environmental
    { id: 'protected_areas', name: 'Protected Areas', category: 'Environmental', enabled: true, color: '#00cc00', opacity: 0.5 },
    { id: 'water_bodies', name: 'Water Bodies', category: 'Environmental', enabled: true, color: '#0099ff', opacity: 0.6 },
    { id: 'flood_zones', name: 'Flood Zones', category: 'Environmental', enabled: false, color: '#6699ff', opacity: 0.4 },
    
    // Zoning & Planning
    { id: 'zoning', name: 'Zoning', category: 'Zoning & Planning', enabled: false, color: '#ff9900', opacity: 0.3 },
    { id: 'building_permits', name: 'Building Permits', category: 'Zoning & Planning', enabled: false, color: '#cc6600', opacity: 0.5 },
    
    // Real-time
    { id: 'weather', name: 'Weather', category: 'Real-time', enabled: false, color: '#66ccff', opacity: 0.7 },
    { id: 'traffic', name: 'Traffic', category: 'Real-time', enabled: false, color: '#ff3333', opacity: 0.8 }
  ]);

  // Initialize Mapbox
  useEffect(() => {
    if (!mapContainer.current || map.current) return;
    
    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || 'pk.eyJ1IjoicHJlbHVkZWQiLCJhIjoiY2treXZsYmZhMDdsajJ2dWkwdjZib21hNyJ9.iYbWJ_lSePJw8c9AXaPL8A';
    
    if (!mapboxToken) {
      console.error('Mapbox token not found');
      setMapError('Mapbox token not found. Please check configuration.');
      setLoading(false);
      return;
    }
    
    mapboxgl.accessToken = mapboxToken;
    
    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: mapStyle,
        center: [21.7975, 61.4847], // Default to Pori, Finland
        zoom: 12
      });
      
      map.current.on('mousemove', (e) => {
        setCoordinates({
          lat: parseFloat(e.lngLat.lat.toFixed(6)),
          lng: parseFloat(e.lngLat.lng.toFixed(6))
        });
      });
      
      map.current.on('load', () => {
        console.log('Map loaded successfully');
        // Add some sample data layers
        addPowerInfrastructureLayer();
        setLoading(false);
      });
      
      map.current.on('error', (e) => {
        console.error('Map error:', e);
        setMapError(`Map error: ${e.error?.message || 'Unknown error'}`);
        setLoading(false);
      });
      
    } catch (error) {
      console.error('Failed to initialize map:', error);
      setMapError(`Failed to initialize map: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setLoading(false);
    }
    
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);
  
  // Update map style when changed
  useEffect(() => {
    if (map.current) {
      map.current.setStyle(mapStyle);
    }
  }, [mapStyle]);
  
  // Mock project data - replace with actual API call
  useEffect(() => {
    const loadProject = async () => {
      // Set project name based on ID or fetch from API
      if (params.id === '1') {
        setProjectName('Pori Finland DC');
      } else if (params.id === '2') {
        setProjectName('Stockholm Sweden DC');
      } else if (params.id === '3') {
        setProjectName('Oslo Norway DC');
      } else {
        setProjectName(`Project ${params.id}`);
      }
    };
    
    loadProject();
  }, [params.id]);

  const toggleLayer = (layerId: string) => {
    setLayers(prev => {
      const layer = prev.find(l => l.id === layerId);
      if (!layer) return prev;
      
      // Handle base layer exclusivity
      if (layer.category === 'Base Layer' && !layer.enabled) {
        return prev.map(l => 
          l.category === 'Base Layer' ? { ...l, enabled: l.id === layerId } : l
        );
      }
      
      const updatedLayers = prev.map(l => 
        l.id === layerId ? { ...l, enabled: !l.enabled } : l
      );
      
      // Update map layer visibility
      if (map.current) {
        const newState = !layer.enabled;
        if (layerId === 'power_lines' && map.current.getLayer('power-lines-layer')) {
          map.current.setLayoutProperty('power-lines-layer', 'visibility', newState ? 'visible' : 'none');
        }
        if (layerId === 'substations' && map.current.getLayer('substations-layer')) {
          map.current.setLayoutProperty('substations-layer', 'visibility', newState ? 'visible' : 'none');
        }
      }
      
      return updatedLayers;
    });
  };
  
  const updateLayerOpacity = (layerId: string, opacity: number) => {
    setLayers(prev => prev.map(layer => 
      layer.id === layerId ? { ...layer, opacity } : layer
    ));
    
    // Update map layer opacity
    if (map.current) {
      if (layerId === 'power_lines' && map.current.getLayer('power-lines-layer')) {
        map.current.setPaintProperty('power-lines-layer', 'line-opacity', opacity);
      }
      if (layerId === 'substations' && map.current.getLayer('substations-layer')) {
        map.current.setPaintProperty('substations-layer', 'circle-opacity', opacity);
      }
    }
  };
  
  const handleMapStyleChange = (style: string) => {
    setMapStyle(style);
  };
  
  const handleZoomIn = () => {
    if (map.current) {
      map.current.zoomIn();
    }
  };
  
  const handleZoomOut = () => {
    if (map.current) {
      map.current.zoomOut();
    }
  };
  
  const handleResetView = () => {
    if (map.current) {
      map.current.flyTo({
        center: [21.7975, 61.4847],
        zoom: 12,
        essential: true
      });
    }
  };
  
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?access_token=${mapboxgl.accessToken}&country=fi&types=place,postcode,district,address&limit=5`
      );
      const data = await response.json();
      setSearchResults(data.features || []);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };
  
  const handleSearchSelect = (result: any) => {
    if (map.current && result.geometry) {
      map.current.flyTo({
        center: result.geometry.coordinates,
        zoom: 14,
        essential: true
      });
      
      // Add marker for selected location
      new mapboxgl.Marker({ color: '#3b82f6' })
        .setLngLat(result.geometry.coordinates)
        .setPopup(
          new mapboxgl.Popup({ offset: 25 })
            .setHTML(`<div class="text-white"><h3>${result.text}</h3><p>${result.place_name}</p></div>`)
        )
        .addTo(map.current);
    }
    setSearchResults([]);
    setSearchQuery('');
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };
  
  const addPowerInfrastructureLayer = () => {
    if (!map.current) return;
    
    // Add sample power line data around Pori, Finland
    const samplePowerLines = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: { voltage: 110, name: 'Pori-Rauma 110kV' },
          geometry: {
            type: 'LineString',
            coordinates: [[21.7975, 61.4847], [21.5118, 61.1300]]
          }
        },
        {
          type: 'Feature',
          properties: { voltage: 400, name: 'Pori-Tampere 400kV' },
          geometry: {
            type: 'LineString',
            coordinates: [[21.7975, 61.4847], [23.7610, 61.4978]]
          }
        }
      ]
    };
    
    const sampleSubstations = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: { name: 'Pori Main Substation', voltage: 400, capacity: 300 },
          geometry: {
            type: 'Point',
            coordinates: [21.7975, 61.4847]
          }
        },
        {
          type: 'Feature',
          properties: { name: 'Harjavalta Substation', voltage: 110, capacity: 150 },
          geometry: {
            type: 'Point',
            coordinates: [22.1380, 61.3107]
          }
        }
      ]
    };
    
    // Add power lines layer
    map.current.addSource('power-lines', {
      type: 'geojson',
      data: samplePowerLines as any
    });
    
    map.current.addLayer({
      id: 'power-lines-layer',
      type: 'line',
      source: 'power-lines',
      paint: {
        'line-color': ['case', ['==', ['get', 'voltage'], 400], '#ff0000', '#ff6600'],
        'line-width': ['case', ['==', ['get', 'voltage'], 400], 4, 2],
        'line-opacity': 0.8
      }
    });
    
    // Add substations layer
    map.current.addSource('substations', {
      type: 'geojson',
      data: sampleSubstations as any
    });
    
    map.current.addLayer({
      id: 'substations-layer',
      type: 'circle',
      source: 'substations',
      paint: {
        'circle-color': ['case', ['==', ['get', 'voltage'], 400], '#ff0000', '#ff6600'],
        'circle-radius': ['case', ['==', ['get', 'voltage'], 400], 8, 6],
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 2,
        'circle-opacity': 1
      }
    });
    
    // Add popups on click
    map.current.on('click', 'substations-layer', (e) => {
      const coordinates = (e.features![0].geometry as any).coordinates.slice();
      const properties = e.features![0].properties;
      
      new mapboxgl.Popup()
        .setLngLat(coordinates)
        .setHTML(`
          <div class="text-white p-2">
            <h3 class="font-semibold">${properties!.name}</h3>
            <p class="text-sm">Voltage: ${properties!.voltage}kV</p>
            <p class="text-sm">Capacity: ${properties!.capacity}MW</p>
          </div>
        `)
        .addTo(map.current!);
    });
    
    // Change cursor on hover
    map.current.on('mouseenter', 'substations-layer', () => {
      if (map.current) map.current.getCanvas().style.cursor = 'pointer';
    });
    
    map.current.on('mouseleave', 'substations-layer', () => {
      if (map.current) map.current.getCanvas().style.cursor = '';
    });
  };

  const groupedLayers = layers.reduce((groups, layer) => {
    if (!groups[layer.category]) {
      groups[layer.category] = [];
    }
    groups[layer.category].push(layer);
    return groups;
  }, {} as Record<string, LayerOption[]>);
  
  const mapStyles = [
    { id: 'mapbox://styles/mapbox/streets-v12', name: 'Streets', icon: MapIcon },
    { id: 'mapbox://styles/mapbox/satellite-streets-v12', name: 'Satellite', icon: Satellite },
    { id: 'mapbox://styles/mapbox/outdoors-v12', name: 'Terrain', icon: MapIcon }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0b] text-[#fafafa] flex items-center justify-center">
        <div className="text-center">
          {mapError ? (
            <>
              <div className="w-16 h-16 bg-red-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-red-400 text-2xl">⚠</span>
              </div>
              <p className="text-red-400 mb-2">Map Loading Failed</p>
              <p className="text-[#71717a] text-sm max-w-md">{mapError}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
              >
                Retry
              </button>
            </>
          ) : (
            <>
              <div className="animate-spin h-8 w-8 border-2 border-[#27272a] border-t-blue-600 rounded-full mx-auto mb-4"></div>
              <p className="text-[#a1a1aa]">Loading map...</p>
              <p className="text-[#71717a] text-sm mt-2">Initializing Mapbox GL JS</p>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#0a0a0b] text-[#fafafa] flex flex-col overflow-hidden">
      {/* Top Navigation Bar */}
      <header className="h-14 border-b border-[#27272a] bg-[#131316]/90 backdrop-blur-md flex items-center justify-between px-4 relative z-50">
        <div className="flex items-center gap-4">
          <Link 
            href="/"
            className="p-2 hover:bg-[#27272a] rounded-md transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-lg font-semibold">{projectName}</h1>
            <p className="text-xs text-[#a1a1aa]">Feasibility Analysis</p>
          </div>
        </div>
        
        {/* Search Bar */}
        <div className="flex-1 max-w-md mx-6 relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#71717a]" />
            <input
              type="text"
              placeholder="Search location in Finland..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full pl-10 pr-12 py-2 bg-[#0a0a0b] border border-[#27272a] rounded-md text-[#fafafa] placeholder-[#71717a] focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 text-sm"
            />
            {searchQuery && (
              <button
                onClick={handleSearch}
                disabled={isSearching}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-[#71717a] hover:text-blue-400 transition-colors"
              >
                {isSearching ? (
                  <div className="animate-spin h-3 w-3 border border-[#71717a] border-t-blue-400 rounded-full" />
                ) : (
                  <Search className="w-3 h-3" />
                )}
              </button>
            )}
          </div>
          
          {/* Search Results Dropdown */}
          {searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-[#131316] border border-[#27272a] rounded-md shadow-xl z-50">
              {searchResults.map((result, index) => (
                <button
                  key={index}
                  onClick={() => handleSearchSelect(result)}
                  className="w-full text-left p-3 hover:bg-[#1a1a1f] transition-colors border-b border-[#27272a] last:border-b-0"
                >
                  <div className="font-medium text-[#fafafa] text-sm">{result.text}</div>
                  <div className="text-xs text-[#71717a] mt-1">{result.place_name}</div>
                </button>
              ))}
            </div>
          )}
        </div>
        
        {/* Map Style Switcher */}
        <div className="flex items-center gap-2">
          {mapStyles.map((style) => {
            const IconComponent = style.icon;
            return (
              <button
                key={style.id}
                onClick={() => handleMapStyleChange(style.id)}
                className={`p-2 rounded-md transition-colors text-sm ${
                  mapStyle === style.id 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-[#1a1a1f] text-[#a1a1aa] hover:bg-[#27272a] hover:text-[#fafafa]'
                }`}
                title={style.name}
              >
                <IconComponent className="w-4 h-4" />
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Map Area with Panels */}
      <div className="flex-1 relative">
        {/* Map Container */}
        <div ref={mapContainer} className="absolute inset-0" />
        
        {/* Left Panel - Layers */}
        <div className={`absolute left-4 top-4 bottom-4 w-80 bg-[#131316]/95 backdrop-blur-md border border-[#27272a] rounded-lg shadow-2xl transition-transform duration-300 z-40 ${
          leftPanelOpen ? 'translate-x-0' : '-translate-x-72'
        }`}>
          <div className="flex items-center justify-between p-4 border-b border-[#27272a]">
            <div className="flex items-center">
              <Layers className="w-5 h-5 mr-2 text-blue-400" />
              <h2 className="font-semibold">Data Layers</h2>
            </div>
            <button
              onClick={() => setLeftPanelOpen(!leftPanelOpen)}
              className="p-1 hover:bg-[#27272a] rounded transition-colors"
            >
              {leftPanelOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
          
          <div className="p-4 h-full overflow-y-auto">
            {Object.entries(groupedLayers).map(([category, categoryLayers]) => (
              <div key={category} className="mb-6">
                <h3 className="text-sm font-medium text-[#a1a1aa] mb-3 uppercase tracking-wider">{category}</h3>
                <div className="space-y-3">
                  {categoryLayers.map((layer) => (
                    <div key={layer.id} className="space-y-2">
                      <label className="flex items-center space-x-3 cursor-pointer group">
                        <input
                          type={layer.category === 'Base Layer' ? 'radio' : 'checkbox'}
                          name={layer.category === 'Base Layer' ? 'baseLayer' : undefined}
                          checked={layer.enabled}
                          onChange={() => toggleLayer(layer.id)}
                          className="w-4 h-4 rounded border border-[#27272a] bg-[#0a0a0b] checked:bg-blue-600 checked:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                        />
                        <div 
                          className="w-4 h-4 rounded border border-[#27272a]"
                          style={{ backgroundColor: layer.enabled ? layer.color : 'transparent' }}
                        />
                        <span className="text-sm text-[#fafafa] group-hover:text-blue-400 transition-colors">{layer.name}</span>
                      </label>
                      
                      {layer.enabled && layer.category !== 'Base Layer' && (
                        <div className="ml-7 space-y-1">
                          <div className="flex items-center space-x-2">
                            <Sliders className="w-3 h-3 text-[#71717a]" />
                            <span className="text-xs text-[#71717a]">Opacity</span>
                            <span className="text-xs text-[#a1a1aa]">{Math.round(layer.opacity * 100)}%</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={layer.opacity}
                            onChange={(e) => updateLayerOpacity(layer.id, parseFloat(e.target.value))}
                            className="w-full h-1 bg-[#27272a] rounded-lg appearance-none cursor-pointer opacity-slider"
                            style={{
                              background: `linear-gradient(to right, ${layer.color} 0%, ${layer.color} ${layer.opacity * 100}%, #27272a ${layer.opacity * 100}%, #27272a 100%)`
                            }}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Right Panel - Data Summary */}
        <div className={`absolute right-4 top-4 bottom-4 w-80 bg-[#131316]/95 backdrop-blur-md border border-[#27272a] rounded-lg shadow-2xl transition-transform duration-300 z-40 ${
          rightPanelOpen ? 'translate-x-0' : 'translate-x-72'
        }`}>
          <div className="flex items-center justify-between p-4 border-b border-[#27272a]">
            <div className="flex items-center">
              <BarChart3 className="w-5 h-5 mr-2 text-green-400" />
              <h2 className="font-semibold">Site Analysis</h2>
            </div>
            <button
              onClick={() => setRightPanelOpen(!rightPanelOpen)}
              className="p-1 hover:bg-[#27272a] rounded transition-colors"
            >
              {rightPanelOpen ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>
          
          <div className="p-4 h-full overflow-y-auto space-y-4">
            {/* Site Score Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#1a1a1f]/80 p-3 rounded-lg backdrop-blur-sm">
                <div className="text-xs text-[#a1a1aa] mb-1">Site Score</div>
                <div className="text-lg font-bold text-green-400">8.7/10</div>
              </div>
              <div className="bg-[#1a1a1f]/80 p-3 rounded-lg backdrop-blur-sm">
                <div className="text-xs text-[#a1a1aa] mb-1">Risk Level</div>
                <div className="text-lg font-bold text-yellow-400">Medium</div>
              </div>
            </div>
            
            {/* Key Metrics */}
            <div className="bg-[#1a1a1f]/80 p-4 rounded-lg backdrop-blur-sm">
              <div className="text-sm font-medium text-[#a1a1aa] mb-3">Infrastructure Metrics</div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-[#fafafa]">Power Capacity</span>
                  <span className="text-[#a1a1aa] font-mono">70 MW</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#fafafa]">Grid Distance</span>
                  <span className="text-[#a1a1aa] font-mono">2.3 km</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#fafafa]">Fiber Distance</span>
                  <span className="text-[#a1a1aa] font-mono">0.8 km</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#fafafa]">Land Area</span>
                  <span className="text-[#a1a1aa] font-mono">15 ha</span>
                </div>
              </div>
            </div>
            
            {/* Environmental Factors */}
            <div className="bg-[#1a1a1f]/80 p-4 rounded-lg backdrop-blur-sm">
              <div className="text-sm font-medium text-[#a1a1aa] mb-3">Environmental Assessment</div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[#fafafa]">Flood Risk</span>
                  <span className="px-2 py-1 bg-green-600/20 text-green-400 rounded text-xs">LOW</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#fafafa]">Seismic Risk</span>
                  <span className="px-2 py-1 bg-green-600/20 text-green-400 rounded text-xs">LOW</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#fafafa]">Heritage Risk</span>
                  <span className="px-2 py-1 bg-yellow-600/20 text-yellow-400 rounded text-xs">MEDIUM</span>
                </div>
              </div>
            </div>
            
            {/* Analysis Status */}
            <div className="bg-[#1a1a1f]/80 p-4 rounded-lg backdrop-blur-sm">
              <div className="text-sm font-medium text-[#a1a1aa] mb-2">Analysis Status</div>
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-[#fafafa]">Data Loading</span>
              </div>
              <div className="text-xs text-[#71717a]">
                Last updated: {new Date().toLocaleString()}
              </div>
              <div className="text-xs text-[#71717a]">
                {layers.filter(l => l.enabled).length} active layers
              </div>
              <div className="text-xs text-[#71717a]">
                Map center: {coordinates.lat.toFixed(4)}, {coordinates.lng.toFixed(4)}
              </div>
            </div>
          </div>
        </div>
        
        {/* Map Controls */}
        <div className="absolute bottom-4 right-4 flex flex-col space-y-2 z-30">
          <button
            onClick={handleZoomIn}
            className="p-2 bg-[#131316]/90 hover:bg-[#27272a]/90 border border-[#27272a] rounded-md transition-colors backdrop-blur-sm"
            title="Zoom In"
          >
            <ZoomIn className="w-5 h-5" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-2 bg-[#131316]/90 hover:bg-[#27272a]/90 border border-[#27272a] rounded-md transition-colors backdrop-blur-sm"
            title="Zoom Out"
          >
            <ZoomOut className="w-5 h-5" />
          </button>
          <button
            onClick={handleResetView}
            className="p-2 bg-[#131316]/90 hover:bg-[#27272a]/90 border border-[#27272a] rounded-md transition-colors backdrop-blur-sm"
            title="Reset View"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>
        
        {/* Coordinates Display */}
        <div className="absolute bottom-4 left-4 px-3 py-2 bg-[#131316]/90 border border-[#27272a] rounded-md text-xs text-[#a1a1aa] font-mono backdrop-blur-sm z-30">
          {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
        </div>
        
        {/* Panel Toggle Buttons (when panels are closed) */}
        {!leftPanelOpen && (
          <button
            onClick={() => setLeftPanelOpen(true)}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 p-2 bg-[#131316]/90 hover:bg-[#27272a]/90 border border-[#27272a] rounded-r-md transition-colors backdrop-blur-sm z-30"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
        
        {!rightPanelOpen && (
          <button
            onClick={() => setRightPanelOpen(true)}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 bg-[#131316]/90 hover:bg-[#27272a]/90 border border-[#27272a] rounded-l-md transition-colors backdrop-blur-sm z-30"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}