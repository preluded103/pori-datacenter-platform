'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, Layers, Search, Home, ChevronRight, ChevronLeft,
  Info, BarChart3, X, Menu, ZoomIn, ZoomOut, Maximize2,
  Navigation, Map as MapIcon
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface ProjectMapPageProps {
  params: { id: string };
}

interface LayerOption {
  id: string;
  name: string;
  category: string;
  enabled: boolean;
  color?: string;
  opacity?: number;
}

export default function ProjectMapPage({ params }: ProjectMapPageProps) {
  const router = useRouter();
  const mapRef = useRef<HTMLDivElement>(null);
  const [projectName, setProjectName] = useState('');
  const [loading, setLoading] = useState(true);
  const [layerPanelOpen, setLayerPanelOpen] = useState(true);
  const [dataPanelOpen, setDataPanelOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [mapStyle, setMapStyle] = useState('satellite'); // satellite, streets, terrain
  
  const [layers, setLayers] = useState<LayerOption[]>([
    // Base Layers - these are exclusive (only one can be active)
    { id: 'base_satellite', name: 'Satellite', category: 'Base', enabled: true, opacity: 1 },
    { id: 'base_streets', name: 'Streets', category: 'Base', enabled: false, opacity: 1 },
    { id: 'base_terrain', name: 'Terrain', category: 'Base', enabled: false, opacity: 1 },
    
    // Infrastructure Overlays
    { id: 'power_lines', name: 'Power Lines', category: 'Infrastructure', enabled: true, color: '#ff0000', opacity: 0.8 },
    { id: 'substations', name: 'Substations', category: 'Infrastructure', enabled: true, color: '#ff6600', opacity: 1 },
    { id: 'fiber_cables', name: 'Fiber Cables', category: 'Infrastructure', enabled: false, color: '#0099ff', opacity: 0.7 },
    { id: 'roads', name: 'Roads', category: 'Infrastructure', enabled: true, color: '#666666', opacity: 0.6 },
    { id: 'railways', name: 'Railways', category: 'Infrastructure', enabled: false, color: '#333333', opacity: 0.8 },
    
    // Environmental Overlays
    { id: 'protected_areas', name: 'Protected Areas', category: 'Environmental', enabled: true, color: '#00ff00', opacity: 0.4 },
    { id: 'water_bodies', name: 'Water Bodies', category: 'Environmental', enabled: true, color: '#0066ff', opacity: 0.5 },
    { id: 'flood_zones', name: 'Flood Zones', category: 'Environmental', enabled: false, color: '#ff0066', opacity: 0.3 },
    
    // Zoning Overlays
    { id: 'zoning', name: 'Zoning Districts', category: 'Zoning', enabled: false, color: '#ffff00', opacity: 0.3 },
    { id: 'parcels', name: 'Property Parcels', category: 'Zoning', enabled: false, color: '#ff00ff', opacity: 0.2 },
    
    // Site-specific
    { id: 'site_boundary', name: 'Site Boundary', category: 'Project', enabled: true, color: '#00ffff', opacity: 1 },
    { id: 'buffer_zones', name: 'Buffer Zones', category: 'Project', enabled: false, color: '#ffcc00', opacity: 0.3 }
  ]);

  // Mock project data
  useEffect(() => {
    const loadProject = async () => {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (params.id === '1') {
        setProjectName('Pori Finland DC');
      } else if (params.id === '2') {
        setProjectName('Stockholm Sweden DC');
      } else if (params.id === '3') {
        setProjectName('Oslo Norway DC');
      } else {
        setProjectName(`Project ${params.id}`);
      }
      
      setLoading(false);
    };
    
    loadProject();
  }, [params.id]);

  const toggleLayer = (layerId: string) => {
    setLayers(prev => {
      const layer = prev.find(l => l.id === layerId);
      
      // If it's a base layer, make it exclusive
      if (layer?.category === 'Base') {
        return prev.map(l => ({
          ...l,
          enabled: l.category === 'Base' ? l.id === layerId : l.enabled
        }));
      }
      
      // Otherwise just toggle the layer
      return prev.map(l => 
        l.id === layerId ? { ...l, enabled: !l.enabled } : l
      );
    });
  };

  const updateLayerOpacity = (layerId: string, opacity: number) => {
    setLayers(prev => prev.map(layer => 
      layer.id === layerId ? { ...layer, opacity } : layer
    ));
  };

  const groupedLayers = layers.reduce((groups, layer) => {
    if (!groups[layer.category]) {
      groups[layer.category] = [];
    }
    groups[layer.category].push(layer);
    return groups;
  }, {} as Record<string, LayerOption[]>);

  const activeLayersCount = layers.filter(l => l.enabled && l.category !== 'Base').length;

  if (loading) {
    return (
      <div className="h-screen bg-[#0a0a0b] text-[#fafafa] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-[#27272a] border-t-blue-600 rounded-full mx-auto mb-4"></div>
          <p className="text-[#a1a1aa]">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#0a0a0b] text-[#fafafa] relative overflow-hidden">
      
      {/* Full-screen Map Container */}
      <div ref={mapRef} className="absolute inset-0 bg-[#1a1a1f]">
        {/* This is where the actual map would render */}
        <div className="w-full h-full flex items-center justify-center relative">
          {/* Map placeholder visualization */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0b] via-[#131316] to-[#1a1a1f]">
            <MapIcon className="w-32 h-32 text-[#27272a] absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
          
          {/* Example overlay elements to show layer visualization */}
          {layers.filter(l => l.enabled).map((layer, idx) => (
            <div 
              key={layer.id}
              className="absolute text-xs text-[#71717a] opacity-50"
              style={{
                top: `${20 + idx * 30}px`,
                right: '50%',
                transform: 'translateX(50%)'
              }}
            >
              {layer.name} Layer Active
            </div>
          ))}
        </div>
      </div>

      {/* Top Navigation Bar */}
      <div className="absolute top-0 left-0 right-0 bg-[#0a0a0b]/90 backdrop-blur-md border-b border-[#27272a] z-20">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Link 
              href="/"
              className="p-2 hover:bg-[#27272a] rounded-md transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-lg font-bold">{projectName}</h1>
              <p className="text-xs text-[#a1a1aa]">Feasibility Analysis</p>
            </div>
          </div>
          
          {/* Search Bar */}
          <div className="flex-1 max-w-md mx-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#71717a]" />
              <input
                type="text"
                placeholder="Search location, address, coordinates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[#131316] border border-[#27272a] rounded-md text-sm text-[#fafafa] placeholder-[#71717a] focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600/20"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="p-2 hover:bg-[#27272a] text-[#a1a1aa] hover:text-[#fafafa] rounded-md transition-colors"
              title="Dashboard"
            >
              <Home className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Left Panel - Layers Control */}
      <div className={`absolute left-0 top-16 bottom-0 bg-[#0a0a0b]/95 backdrop-blur-md border-r border-[#27272a] transition-all duration-300 z-10 ${
        layerPanelOpen ? 'w-80' : 'w-0'
      }`}>
        {layerPanelOpen && (
          <div className="h-full flex flex-col">
            <div className="p-4 border-b border-[#27272a]">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Layers className="w-5 h-5 mr-2 text-blue-400" />
                  <h2 className="font-semibold">Data Layers</h2>
                </div>
                <button
                  onClick={() => setLayerPanelOpen(false)}
                  className="p-1 hover:bg-[#27272a] rounded transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-[#71717a] mt-1">{activeLayersCount} layers active</p>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              {Object.entries(groupedLayers).map(([category, categoryLayers]) => (
                <div key={category} className="mb-6">
                  <h3 className="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wider mb-3">
                    {category}
                  </h3>
                  <div className="space-y-2">
                    {categoryLayers.map((layer) => (
                      <div key={layer.id} className="group">
                        <div className="flex items-center justify-between p-2 hover:bg-[#131316] rounded-md transition-colors">
                          <label className="flex items-center flex-1 cursor-pointer">
                            <input
                              type={category === 'Base' ? 'radio' : 'checkbox'}
                              name={category === 'Base' ? 'base-layer' : undefined}
                              checked={layer.enabled}
                              onChange={() => toggleLayer(layer.id)}
                              className="w-4 h-4 rounded border border-[#27272a] bg-[#0a0a0b] checked:bg-blue-600 checked:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                            />
                            <span className="ml-3 text-sm text-[#fafafa] flex items-center gap-2">
                              {layer.name}
                              {layer.color && (
                                <span 
                                  className="w-3 h-3 rounded-full border border-[#27272a]"
                                  style={{ backgroundColor: layer.color }}
                                />
                              )}
                            </span>
                          </label>
                          {layer.enabled && layer.category !== 'Base' && (
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-[#71717a]">
                                {Math.round((layer.opacity || 1) * 100)}%
                              </span>
                            </div>
                          )}
                        </div>
                        {layer.enabled && layer.category !== 'Base' && (
                          <div className="px-2 pb-2">
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={(layer.opacity || 1) * 100}
                              onChange={(e) => updateLayerOpacity(layer.id, Number(e.target.value) / 100)}
                              className="w-full h-1 bg-[#27272a] rounded-lg appearance-none cursor-pointer"
                              style={{
                                background: `linear-gradient(to right, ${layer.color || '#3b82f6'} 0%, ${layer.color || '#3b82f6'} ${(layer.opacity || 1) * 100}%, #27272a ${(layer.opacity || 1) * 100}%, #27272a 100%)`
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
        )}
      </div>

      {/* Layer Panel Toggle (when closed) */}
      {!layerPanelOpen && (
        <button
          onClick={() => setLayerPanelOpen(true)}
          className="absolute left-4 top-20 bg-[#0a0a0b]/90 backdrop-blur-md border border-[#27272a] p-2 rounded-md hover:bg-[#131316] transition-colors z-10"
        >
          <Layers className="w-5 h-5" />
        </button>
      )}

      {/* Right Panel - Data Summary */}
      <div className={`absolute right-0 top-16 bottom-0 bg-[#0a0a0b]/95 backdrop-blur-md border-l border-[#27272a] transition-all duration-300 z-10 ${
        dataPanelOpen ? 'w-80' : 'w-0'
      }`}>
        {dataPanelOpen && (
          <div className="h-full flex flex-col">
            <div className="p-4 border-b border-[#27272a]">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2 text-green-400" />
                  <h2 className="font-semibold">Site Analysis</h2>
                </div>
                <button
                  onClick={() => setDataPanelOpen(false)}
                  className="p-1 hover:bg-[#27272a] rounded transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Site Score */}
              <div className="bg-[#131316] p-4 rounded-lg border border-[#27272a]">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="text-xs text-[#a1a1aa] uppercase tracking-wider">Overall Score</div>
                    <div className="text-3xl font-bold text-green-400">8.7/10</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-[#a1a1aa] uppercase tracking-wider">Risk Level</div>
                    <div className="text-lg font-semibold text-yellow-400">Medium</div>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-[#27272a]">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#71717a]">Recommendation:</span>
                    <span className="text-green-400 font-medium">Proceed</span>
                  </div>
                </div>
              </div>
              
              {/* Key Metrics */}
              <div className="bg-[#131316] p-4 rounded-lg border border-[#27272a]">
                <h3 className="text-sm font-semibold text-[#fafafa] mb-3">Infrastructure</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#a1a1aa]">Power Capacity:</span>
                    <span className="text-[#fafafa] font-medium">70 MW</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#a1a1aa]">Grid Distance:</span>
                    <span className="text-[#fafafa] font-medium">2.3 km</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#a1a1aa]">Fiber Access:</span>
                    <span className="text-green-400 font-medium">Available</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#a1a1aa]">Water Supply:</span>
                    <span className="text-yellow-400 font-medium">Limited</span>
                  </div>
                </div>
              </div>
              
              {/* Site Details */}
              <div className="bg-[#131316] p-4 rounded-lg border border-[#27272a]">
                <h3 className="text-sm font-semibold text-[#fafafa] mb-3">Site Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#a1a1aa]">Land Area:</span>
                    <span className="text-[#fafafa] font-medium">15 hectares</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#a1a1aa]">Zoning:</span>
                    <span className="text-[#fafafa] font-medium">Industrial</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#a1a1aa]">Elevation:</span>
                    <span className="text-[#fafafa] font-medium">45m ASL</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#a1a1aa]">Flood Risk:</span>
                    <span className="text-green-400 font-medium">Low</span>
                  </div>
                </div>
              </div>
              
              {/* Environmental */}
              <div className="bg-[#131316] p-4 rounded-lg border border-[#27272a]">
                <h3 className="text-sm font-semibold text-[#fafafa] mb-3">Environmental</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#a1a1aa]">Protected Areas:</span>
                    <span className="text-yellow-400 font-medium">1.2km away</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#a1a1aa]">Wetlands:</span>
                    <span className="text-green-400 font-medium">None</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#a1a1aa]">Heritage Sites:</span>
                    <span className="text-green-400 font-medium">None</span>
                  </div>
                </div>
              </div>
              
              {/* Status */}
              <div className="bg-[#131316] p-4 rounded-lg border border-[#27272a]">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-[#a1a1aa] uppercase tracking-wider">Analysis Status</div>
                    <div className="text-sm text-green-400 font-medium mt-1">✓ Complete</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-[#71717a]">Last updated</div>
                    <div className="text-xs text-[#a1a1aa]">2 hours ago</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Data Panel Toggle (when closed) */}
      {!dataPanelOpen && (
        <button
          onClick={() => setDataPanelOpen(true)}
          className="absolute right-4 top-20 bg-[#0a0a0b]/90 backdrop-blur-md border border-[#27272a] p-2 rounded-md hover:bg-[#131316] transition-colors z-10"
        >
          <Info className="w-5 h-5" />
        </button>
      )}

      {/* Map Controls (Bottom Right) */}
      <div className="absolute bottom-8 right-8 flex flex-col gap-2 z-10">
        <button className="bg-[#0a0a0b]/90 backdrop-blur-md border border-[#27272a] p-2 rounded-md hover:bg-[#131316] transition-colors">
          <ZoomIn className="w-5 h-5" />
        </button>
        <button className="bg-[#0a0a0b]/90 backdrop-blur-md border border-[#27272a] p-2 rounded-md hover:bg-[#131316] transition-colors">
          <ZoomOut className="w-5 h-5" />
        </button>
        <button className="bg-[#0a0a0b]/90 backdrop-blur-md border border-[#27272a] p-2 rounded-md hover:bg-[#131316] transition-colors">
          <Maximize2 className="w-5 h-5" />
        </button>
        <button className="bg-[#0a0a0b]/90 backdrop-blur-md border border-[#27272a] p-2 rounded-md hover:bg-[#131316] transition-colors">
          <Navigation className="w-5 h-5" />
        </button>
      </div>

      {/* Map Style Switcher (Bottom Left) */}
      <div className="absolute bottom-8 left-8 bg-[#0a0a0b]/90 backdrop-blur-md border border-[#27272a] rounded-md overflow-hidden z-10">
        <div className="flex">
          <button
            onClick={() => setMapStyle('satellite')}
            className={`px-3 py-2 text-xs font-medium transition-colors ${
              mapStyle === 'satellite' 
                ? 'bg-blue-600 text-white' 
                : 'text-[#a1a1aa] hover:text-[#fafafa] hover:bg-[#131316]'
            }`}
          >
            Satellite
          </button>
          <button
            onClick={() => setMapStyle('streets')}
            className={`px-3 py-2 text-xs font-medium transition-colors border-l border-r border-[#27272a] ${
              mapStyle === 'streets' 
                ? 'bg-blue-600 text-white' 
                : 'text-[#a1a1aa] hover:text-[#fafafa] hover:bg-[#131316]'
            }`}
          >
            Streets
          </button>
          <button
            onClick={() => setMapStyle('terrain')}
            className={`px-3 py-2 text-xs font-medium transition-colors ${
              mapStyle === 'terrain' 
                ? 'bg-blue-600 text-white' 
                : 'text-[#a1a1aa] hover:text-[#fafafa] hover:bg-[#131316]'
            }`}
          >
            Terrain
          </button>
        </div>
      </div>

      {/* Coordinates Display (Bottom Center) */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-[#0a0a0b]/90 backdrop-blur-md border border-[#27272a] px-3 py-1 rounded-md z-10">
        <div className="text-xs text-[#a1a1aa] font-mono">
          61.4851°N, 21.7972°E | Zoom: 12
        </div>
      </div>
    </div>
  );
}