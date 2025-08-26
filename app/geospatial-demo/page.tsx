'use client';

import React, { useState } from 'react';
import ComprehensiveMap from '@/components/geospatial/ComprehensiveMap';
import { MapPin, Layers, Info, Settings } from 'lucide-react';

export default function GeospatialDemoPage() {
  const [selectedLocation, setSelectedLocation] = useState<[number, number]>([21.7972, 61.4851]); // Pori, Finland
  const [activeCountry, setActiveCountry] = useState('FI');
  const [mapZoom, setMapZoom] = useState(12);

  const predefinedLocations = [
    { name: 'Pori, Finland', coordinates: [21.7972, 61.4851] as [number, number], country: 'FI' },
    { name: 'Stockholm, Sweden', coordinates: [18.0686, 59.3293] as [number, number], country: 'SE' },
    { name: 'Oslo, Norway', coordinates: [10.7522, 59.9139] as [number, number], country: 'NO' },
    { name: 'Copenhagen, Denmark', coordinates: [12.5683, 55.6761] as [number, number], country: 'DK' }
  ];

  const handleLocationChange = (coordinates: [number, number], zoom: number) => {
    setSelectedLocation(coordinates);
    setMapZoom(zoom);
  };

  const handleLocationSelect = (location: typeof predefinedLocations[0]) => {
    setSelectedLocation(location.coordinates);
    setActiveCountry(location.country);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-[#fafafa]">
      {/* Header */}
      <header className="border-b border-[#27272a] bg-[#131316]/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[#fafafa] flex items-center gap-3">
                <Layers className="h-8 w-8 text-blue-400" />
                Comprehensive Geospatial Platform
              </h1>
              <p className="text-[#a1a1aa] mt-1">
                Maximum data density mapping with European national services integration
              </p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={activeCountry}
                onChange={(e) => setActiveCountry(e.target.value)}
                className="px-4 py-2 bg-[#1a1a1f] border border-[#27272a] rounded-md text-[#fafafa] focus:border-blue-600 focus:outline-none"
              >
                <option value="FI">Finland</option>
                <option value="SE">Sweden</option>
                <option value="NO">Norway</option>
                <option value="EU">All European</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-5rem)]">
        {/* Sidebar */}
        <div className="w-80 border-r border-[#27272a] bg-[#131316] overflow-y-auto">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-[#fafafa] mb-4 flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Quick Locations
            </h3>
            
            <div className="space-y-2 mb-6">
              {predefinedLocations.map((location) => (
                <button
                  key={location.name}
                  onClick={() => handleLocationSelect(location)}
                  className={`w-full text-left p-3 rounded-md transition-all ${
                    JSON.stringify(selectedLocation) === JSON.stringify(location.coordinates)
                      ? 'bg-blue-600 text-white'
                      : 'bg-[#1a1a1f] hover:bg-[#27272a] text-[#fafafa]'
                  }`}
                >
                  <div className="font-medium">{location.name}</div>
                  <div className="text-sm text-[#a1a1aa]">
                    {location.coordinates[1].toFixed(4)}, {location.coordinates[0].toFixed(4)}
                  </div>
                </button>
              ))}
            </div>

            <div className="border-t border-[#27272a] pt-6">
              <h4 className="text-md font-medium text-[#fafafa] mb-3 flex items-center gap-2">
                <Info className="h-4 w-4" />
                Available Data Sources
              </h4>
              
              <div className="space-y-4 text-sm">
                <div>
                  <h5 className="font-medium text-[#fafafa] mb-2">🇫🇮 Finland - Maanmittauslaitos</h5>
                  <ul className="text-[#a1a1aa] space-y-1 ml-4">
                    <li>• Topographic maps (1:50k scale)</li>
                    <li>• Aerial photography (0.5m resolution)</li>
                    <li>• Property boundaries</li>
                    <li>• Building footprints</li>
                    <li>• Elevation models (2m grid)</li>
                  </ul>
                </div>

                <div>
                  <h5 className="font-medium text-[#fafafa] mb-2">🇸🇪 Sweden - Lantmäteriet</h5>
                  <ul className="text-[#a1a1aa] space-y-1 ml-4">
                    <li>• Topographic web maps</li>
                    <li>• High-resolution orthophotos</li>
                    <li>• Terrain models</li>
                  </ul>
                </div>

                <div>
                  <h5 className="font-medium text-[#fafafa] mb-2">🇳🇴 Norway - Kartverket</h5>
                  <ul className="text-[#a1a1aa] space-y-1 ml-4">
                    <li>• Topographic maps</li>
                    <li>• Aerial imagery</li>
                    <li>• Marine charts</li>
                    <li>• Bathymetry data</li>
                  </ul>
                </div>

                <div>
                  <h5 className="font-medium text-[#fafafa] mb-2">⚡ Infrastructure Data</h5>
                  <ul className="text-[#a1a1aa] space-y-1 ml-4">
                    <li>• Power transmission lines</li>
                    <li>• Electrical substations</li>
                    <li>• Fiber optic cables</li>
                    <li>• Railway networks</li>
                    <li>• Highway systems</li>
                  </ul>
                </div>

                <div>
                  <h5 className="font-medium text-[#fafafa] mb-2">🌿 Environmental Layers</h5>
                  <ul className="text-[#a1a1aa] space-y-1 ml-4">
                    <li>• Natura 2000 protected areas</li>
                    <li>• CORINE land cover</li>
                    <li>• Wetlands and water bodies</li>
                    <li>• Biodiversity zones</li>
                  </ul>
                </div>

                <div>
                  <h5 className="font-medium text-[#fafafa] mb-2">📡 Real-time Data</h5>
                  <ul className="text-[#a1a1aa] space-y-1 ml-4">
                    <li>• Weather radar</li>
                    <li>• Temperature maps</li>
                    <li>• Power grid status (Finland)</li>
                    <li>• Traffic flow</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="border-t border-[#27272a] pt-6 mt-6">
              <h4 className="text-md font-medium text-[#fafafa] mb-3 flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Current Location
              </h4>
              <div className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-[#a1a1aa]">Latitude:</span>
                  <span className="text-[#fafafa] font-mono">{selectedLocation[1].toFixed(6)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#a1a1aa]">Longitude:</span>
                  <span className="text-[#fafafa] font-mono">{selectedLocation[0].toFixed(6)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#a1a1aa]">Zoom Level:</span>
                  <span className="text-[#fafafa] font-mono">{mapZoom.toFixed(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#a1a1aa]">Country:</span>
                  <span className="text-[#fafafa]">{activeCountry}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Map */}
        <div className="flex-1 relative">
          <ComprehensiveMap
            center={selectedLocation}
            zoom={mapZoom}
            countryCode={activeCountry}
            onLocationChange={handleLocationChange}
            className="w-full h-full"
          />
          
          {/* Instructions Overlay */}
          <div className="absolute top-4 right-4 bg-[#131316]/90 backdrop-blur border border-[#27272a] rounded-lg p-4 max-w-sm">
            <h4 className="font-medium text-[#fafafa] mb-2">How to Use</h4>
            <ul className="text-sm text-[#a1a1aa] space-y-1">
              <li>• Click the layers button (📊) to toggle data overlays</li>
              <li>• Select different countries to see their national map services</li>
              <li>• Zoom in to see more detailed infrastructure data</li>
              <li>• Click on the map to see coordinates</li>
              <li>• Use quick locations in the sidebar</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}