/**
 * Grid Intelligence Demo Page
 * Comprehensive demonstration of grid intelligence features
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Zap, Play, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

import GridIntelligenceIntegration from '@/components/grid-intelligence/GridIntelligenceIntegration';
import EnhancedProjectSummary from '@/components/grid-intelligence/EnhancedProjectSummary';
import { useProjectGridIntegration } from '@/lib/grid-intelligence/use-project-grid-integration';
import { PolygonFeature } from '@/lib/types/grid-types';

export default function GridIntelligenceDemoPage() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [mapError, setMapError] = useState<string | null>(null);
  const [demoStep, setDemoStep] = useState<'idle' | 'drawing' | 'analyzing' | 'complete'>('idle');
  
  const projectId = 'demo-grid-intelligence';
  const { 
    analysisResult, 
    isAnalyzing, 
    triggerGridAnalysis,
    getAnalysisSummary 
  } = useProjectGridIntegration(projectId);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;
    
    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || 'pk.eyJ1IjoicHJlbHVkZWQiLCJhIjoiY2treXZsYmZhMDdsajJ2dWkwdjZib21hNyJ9.iYbWJ_lSePJw8c9AXaPL8A';
    
    if (!mapboxToken) {
      setMapError('Mapbox token not found');
      setLoading(false);
      return;
    }
    
    mapboxgl.accessToken = mapboxToken;
    
    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/dark-v11',
        center: [21.7975, 61.4847], // Pori, Finland
        zoom: 11
      });
      
      map.current.on('load', () => {
        setLoading(false);
        console.log('Demo map loaded');
      });
      
      map.current.on('error', (e) => {
        console.error('Demo map error:', e);
        setMapError(`Map error: ${e.error?.message || 'Unknown error'}`);
        setLoading(false);
      });
      
    } catch (error) {
      console.error('Failed to initialize demo map:', error);
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

  // Demo polygon for Pori area
  const createDemoPolygon = (): PolygonFeature => {
    const centerLng = 21.7975;
    const centerLat = 61.4847;
    const size = 0.02; // Approximate size in degrees

    return {
      id: 'demo-polygon-pori',
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [centerLng - size, centerLat + size],
          [centerLng + size, centerLat + size], 
          [centerLng + size, centerLat - size],
          [centerLng - size, centerLat - size],
          [centerLng - size, centerLat + size]
        ]]
      },
      properties: {
        name: 'Pori Demo Site',
        description: 'Demonstration site for grid intelligence analysis'
      }
    };
  };

  // Start demo analysis
  const startDemo = async () => {
    if (!map.current) return;
    
    setDemoStep('drawing');
    
    const demoPolygon = createDemoPolygon();
    
    // Add demo polygon to map
    if (map.current.getSource('demo-polygon')) {
      map.current.removeLayer('demo-polygon-layer');
      map.current.removeLayer('demo-polygon-outline');
      map.current.removeSource('demo-polygon');
    }
    
    map.current.addSource('demo-polygon', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: [demoPolygon]
      }
    });
    
    map.current.addLayer({
      id: 'demo-polygon-layer',
      type: 'fill',
      source: 'demo-polygon',
      paint: {
        'fill-color': '#3b82f6',
        'fill-opacity': 0.3
      }
    });
    
    map.current.addLayer({
      id: 'demo-polygon-outline',
      type: 'line',
      source: 'demo-polygon',
      paint: {
        'line-color': '#3b82f6',
        'line-width': 2
      }
    });
    
    // Fit map to polygon
    const coordinates = demoPolygon.geometry.coordinates[0];
    const bounds = coordinates.reduce((bounds, coord) => {
      return bounds.extend(coord as [number, number]);
    }, new mapboxgl.LngLatBounds(coordinates[0] as [number, number], coordinates[0] as [number, number]));
    
    map.current.fitBounds(bounds, {
      padding: 50,
      duration: 1000
    });
    
    // Wait for animation, then trigger analysis
    setTimeout(async () => {
      setDemoStep('analyzing');
      await triggerGridAnalysis(demoPolygon);
      setDemoStep('complete');
    }, 2000);
  };

  const resetDemo = () => {
    setDemoStep('idle');
    
    if (map.current) {
      // Remove demo polygon
      if (map.current.getLayer('demo-polygon-layer')) {
        map.current.removeLayer('demo-polygon-layer');
      }
      if (map.current.getLayer('demo-polygon-outline')) {
        map.current.removeLayer('demo-polygon-outline');
      }
      if (map.current.getSource('demo-polygon')) {
        map.current.removeSource('demo-polygon');
      }
      
      // Reset map view
      map.current.flyTo({
        center: [21.7975, 61.4847],
        zoom: 11,
        duration: 1000
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0b] text-[#fafafa] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-[#27272a] border-t-blue-600 rounded-full mx-auto mb-4"></div>
          <p className="text-[#a1a1aa]">Loading Grid Intelligence Demo...</p>
        </div>
      </div>
    );
  }

  if (mapError) {
    return (
      <div className="min-h-screen bg-[#0a0a0b] text-[#fafafa] flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-400 text-2xl">⚠</span>
          </div>
          <p className="text-red-400 mb-2">Demo Loading Failed</p>
          <p className="text-[#71717a] text-sm">{mapError}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
          >
            Retry Demo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#0a0a0b] text-[#fafafa] flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-14 border-b border-[#27272a] bg-[#131316]/90 backdrop-blur-md flex items-center justify-between px-4 relative z-50">
        <div className="flex items-center gap-4">
          <Link 
            href="/"
            className="p-2 hover:bg-[#27272a] rounded-md transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-lg font-semibold flex items-center space-x-2">
              <Zap className="w-5 h-5 text-blue-400" />
              <span>Grid Intelligence Demo</span>
            </h1>
            <p className="text-xs text-[#a1a1aa]">
              {demoStep === 'idle' && 'Click "Start Demo" to begin analysis'}
              {demoStep === 'drawing' && 'Drawing analysis polygon...'}
              {demoStep === 'analyzing' && 'Analyzing grid infrastructure...'}
              {demoStep === 'complete' && 'Analysis complete - explore results'}
            </p>
          </div>
        </div>
        
        {/* Demo Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={startDemo}
            disabled={demoStep !== 'idle' || isAnalyzing}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-[#27272a] disabled:text-[#71717a] text-white rounded-md transition-colors"
          >
            <Play className="w-4 h-4" />
            <span>{isAnalyzing ? 'Analyzing...' : 'Start Demo'}</span>
          </button>
          
          {demoStep !== 'idle' && (
            <button
              onClick={resetDemo}
              className="flex items-center space-x-2 px-3 py-2 bg-[#1a1a1f] hover:bg-[#27272a] text-[#a1a1aa] rounded-md transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 relative flex">
        {/* Map Container */}
        <div className="flex-1 relative">
          <div ref={mapContainer} className="absolute inset-0" />
          
          {/* Grid Intelligence Integration */}
          <GridIntelligenceIntegration
            map={map.current}
            isEnabled={demoStep === 'analyzing' || demoStep === 'complete'}
          />
          
          {/* Demo Status Overlay */}
          <div className="absolute top-4 left-4 bg-[#131316]/95 backdrop-blur-md border border-[#27272a] rounded-lg p-4 max-w-sm">
            <div className="flex items-center space-x-2 mb-2">
              <div className={`w-3 h-3 rounded-full ${
                demoStep === 'idle' ? 'bg-[#71717a]' :
                demoStep === 'drawing' ? 'bg-yellow-400 animate-pulse' :
                demoStep === 'analyzing' ? 'bg-blue-400 animate-pulse' :
                'bg-green-400'
              }`}></div>
              <span className="text-sm font-medium">Demo Status</span>
            </div>
            
            <div className="space-y-1 text-xs">
              <div className={`flex justify-between ${demoStep === 'drawing' ? 'text-[#fafafa]' : 'text-[#71717a]'}`}>
                <span>1. Draw Polygon</span>
                <span>{demoStep === 'drawing' ? '⏳' : demoStep === 'idle' ? '⏸' : '✅'}</span>
              </div>
              <div className={`flex justify-between ${demoStep === 'analyzing' ? 'text-[#fafafa]' : 'text-[#71717a]'}`}>
                <span>2. Analyze Grid</span>
                <span>{demoStep === 'analyzing' ? '⏳' : demoStep === 'complete' ? '✅' : '⏸'}</span>
              </div>
              <div className={`flex justify-between ${demoStep === 'complete' ? 'text-[#fafafa]' : 'text-[#71717a]'}`}>
                <span>3. View Results</span>
                <span>{demoStep === 'complete' ? '✅' : '⏸'}</span>
              </div>
            </div>
            
            {analysisResult && (
              <div className="mt-3 pt-3 border-t border-[#27272a]">
                <div className="text-xs text-[#a1a1aa] mb-1">Quick Results:</div>
                <div className="text-xs space-y-1">
                  <div>Score: {analysisResult.summary?.overallSuitabilityScore || 0}/100</div>
                  <div>Connection: {analysisResult.capacityAnalysis?.nearestConnectionPoint?.distanceKm?.toFixed(1) || 'N/A'} km</div>
                  <div>Capacity: {analysisResult.capacityAnalysis?.totalAvailableCapacity || 0} MW</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Enhanced Summary */}
        <div className="w-96 bg-[#131316]/95 backdrop-blur-md border-l border-[#27272a] shadow-2xl overflow-hidden">
          <EnhancedProjectSummary
            projectId={projectId}
            projectName="Pori Demo Site"
            coordinates={{ lat: 61.4847, lng: 21.7975 }}
            layers={[]} // Empty for demo
            analysisResult={analysisResult}
          />
        </div>
      </div>

      {/* Demo Instructions */}
      {demoStep === 'idle' && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-40">
          <div className="bg-[#131316] border border-[#27272a] rounded-xl shadow-2xl p-8 max-w-lg mx-4">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-blue-400" />
              </div>
              <h2 className="text-xl font-semibold text-[#fafafa] mb-2">Grid Intelligence Demo</h2>
              <p className="text-[#a1a1aa] text-sm">
                Experience how our grid intelligence system analyzes European transmission infrastructure for datacenter site selection.
              </p>
            </div>
            
            <div className="space-y-4 mb-6">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-600/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs text-blue-400">1</span>
                </div>
                <div>
                  <h3 className="font-medium text-[#fafafa] text-sm">Site Selection</h3>
                  <p className="text-xs text-[#71717a]">We'll draw a polygon around a potential datacenter site in Pori, Finland</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-600/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs text-blue-400">2</span>
                </div>
                <div>
                  <h3 className="font-medium text-[#fafafa] text-sm">Grid Analysis</h3>
                  <p className="text-xs text-[#71717a]">Our system will analyze Fingrid data, identify connection points, and assess capacity</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-600/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs text-blue-400">3</span>
                </div>
                <div>
                  <h3 className="font-medium text-[#fafafa] text-sm">Results & Visualization</h3>
                  <p className="text-xs text-[#71717a]">View comprehensive analysis with maps, recommendations, and TSO contacts</p>
                </div>
              </div>
            </div>
            
            <button
              onClick={startDemo}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
            >
              <Play className="w-4 h-4" />
              <span>Start Demo Analysis</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}