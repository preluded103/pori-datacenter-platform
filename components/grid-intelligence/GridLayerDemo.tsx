/**
 * Grid Layer Demo Component
 * Demonstrates grid intelligence visualization layers with sample data
 */

'use client';

import React, { useState, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import { GridLayerManager } from '@/lib/grid-intelligence/grid-layer-manager';
import GridVisualizationLayers from './GridVisualizationLayers';
import GridInfrastructureLayerSelector from './GridInfrastructureLayerSelector';
import { GridAnalysisResult, GridVisualizationLayer, GridInfrastructureLayerConfig } from '@/lib/types/grid-types';

interface GridLayerDemoProps {
  map: mapboxgl.Map | null;
  className?: string;
}

export default function GridLayerDemo({ map, className = '' }: GridLayerDemoProps) {
  const [layers, setLayers] = useState<GridVisualizationLayer[]>([]);
  const [layerConfig, setLayerConfig] = useState<GridInfrastructureLayerConfig>({});
  const [demoResult, setDemoResult] = useState<GridAnalysisResult | undefined>();
  const [layerManager] = useState(() => new GridLayerManager());

  // Initialize demo data and layers
  useEffect(() => {
    const defaultLayers = layerManager.initializeDefaultLayers();
    setLayers(defaultLayers);

    // Generate demo analysis result
    const demoAnalysisResult = generateDemoAnalysisResult();
    setDemoResult(demoAnalysisResult);
    
    layerManager.updateAnalysisResult(demoAnalysisResult);
    
    // Show some layers by default for demo
    layerManager.toggleLayerVisibility('grid-capacity-heatmap', true);
    layerManager.toggleLayerVisibility('substations-primary', true);
    layerManager.toggleLayerVisibility('transmission-400kv', true);
    
    setLayers([...layerManager.getAllLayers()]);
  }, [layerManager]);

  // Handle layer visibility toggle
  const handleLayerToggle = (layerId: string, visible: boolean) => {
    layerManager.toggleLayerVisibility(layerId, visible);
    setLayers([...layerManager.getAllLayers()]);
  };

  // Handle layer opacity change
  const handleOpacityChange = (layerId: string, opacity: number) => {
    layerManager.updateLayerOpacity(layerId, opacity);
    setLayers([...layerManager.getAllLayers()]);
  };

  // Handle configuration changes
  const handleConfigChange = (config: Partial<GridInfrastructureLayerConfig>) => {
    const newConfig = { ...layerConfig, ...config };
    setLayerConfig(newConfig);
    layerManager.updateConfig(newConfig);
    setLayers([...layerManager.getAllLayers()]);
  };

  // Apply layer presets
  const applyPreset = (presetName: string) => {
    layerManager.applyLayerPreset(presetName);
    setLayers([...layerManager.getAllLayers()]);
  };

  return (
    <div className={`grid-layer-demo ${className}`}>
      {/* Map Visualization Layers */}
      <GridVisualizationLayers
        map={map}
        analysisResult={demoResult}
        layers={layers}
        onLayerClick={(layerId, feature) => {
          console.log('Demo layer clicked:', layerId, feature);
        }}
      />

      {/* Layer Selector */}
      <GridInfrastructureLayerSelector
        layers={layers}
        onLayerToggle={handleLayerToggle}
        onOpacityChange={handleOpacityChange}
        config={layerConfig}
        onConfigChange={handleConfigChange}
        isAnalyzing={false}
        analysisProgress={100}
      />

      {/* Demo Controls */}
      <div className="fixed top-4 right-4 bg-[#131316] border border-[#27272a] rounded-lg p-4 text-sm max-w-xs">
        <h3 className="font-semibold text-[#fafafa] mb-3">Layer Presets</h3>
        <div className="space-y-2">
          <button
            onClick={() => applyPreset('datacenter-overview')}
            className="w-full px-3 py-1 bg-blue-600/20 text-blue-400 rounded hover:bg-blue-600/30 transition-colors"
          >
            Datacenter Overview
          </button>
          <button
            onClick={() => applyPreset('detailed-analysis')}
            className="w-full px-3 py-1 bg-green-600/20 text-green-400 rounded hover:bg-green-600/30 transition-colors"
          >
            Detailed Analysis
          </button>
          <button
            onClick={() => applyPreset('connection-focus')}
            className="w-full px-3 py-1 bg-purple-600/20 text-purple-400 rounded hover:bg-purple-600/30 transition-colors"
          >
            Connection Focus
          </button>
          <button
            onClick={() => applyPreset('constraint-analysis')}
            className="w-full px-3 py-1 bg-red-600/20 text-red-400 rounded hover:bg-red-600/30 transition-colors"
          >
            Constraint Analysis
          </button>
        </div>

        <div className="mt-4 pt-3 border-t border-[#27272a]">
          <div className="text-xs text-[#71717a]">
            Stats: {layers.filter(l => l.visible).length}/{layers.length} layers visible
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Generate demo analysis result with sample data
 */
function generateDemoAnalysisResult(): GridAnalysisResult {
  // Sample coordinates around Pori, Finland area
  const centerLng = 21.7972;
  const centerLat = 61.4851;

  return {
    analysisId: 'demo-analysis-' + Date.now(),
    timestamp: new Date().toISOString(),
    location: {
      centroid: [centerLng, centerLat],
      country: 'Finland',
      countryCode: 'FI',
      region: 'Southern Finland',
      bounds: {
        north: centerLat + 0.1,
        south: centerLat - 0.1,
        east: centerLng + 0.2,
        west: centerLng - 0.2
      }
    },
    tsos: [{
      eicCode: '10YFI-1--------U',
      name: 'Fingrid Oyj',
      country: 'Finland',
      countryCode: 'FI',
      contactInfo: {
        website: 'https://www.fingrid.fi',
        email: 'info@fingrid.fi'
      },
      apiEndpoints: {
        capacity: 'https://api.fingrid.fi/v1/variable/188/events/json',
        generation: 'https://api.fingrid.fi/v1/variable/74/events/json'
      },
      relevanceScore: 100
    }],
    capacityAnalysis: {
      totalAvailableCapacity: 250, // MW
      nearestConnectionPoint: {
        name: 'Pori Substation',
        distanceKm: 2.5,
        availableCapacity: 150,
        voltage: 110
      },
      gridPoints: [
        {
          longitude: centerLng - 0.05,
          latitude: centerLat + 0.03,
          availableCapacity: 50,
          voltage: '110kV',
          distanceKm: 1.2
        },
        {
          longitude: centerLng + 0.02,
          latitude: centerLat - 0.02,
          availableCapacity: 120,
          voltage: '400kV',
          distanceKm: 3.1
        },
        {
          longitude: centerLng + 0.08,
          latitude: centerLat + 0.05,
          availableCapacity: 80,
          voltage: '220kV',
          distanceKm: 5.7
        }
      ],
      congestionAreas: []
    },
    transmissionLines: {
      lines: [
        {
          coordinates: [
            [centerLng - 0.1, centerLat - 0.05],
            [centerLng + 0.1, centerLat + 0.05]
          ],
          voltage: '400kV',
          name: 'Pori-Harjavalta',
          operator: 'Fingrid Oyj',
          capacity: 800,
          length: 15.2
        },
        {
          coordinates: [
            [centerLng - 0.05, centerLat + 0.08],
            [centerLng + 0.05, centerLat - 0.08]
          ],
          voltage: '220kV',
          name: 'Pori-Rauma',
          operator: 'Fingrid Oyj',
          capacity: 400,
          length: 22.1
        }
      ],
      analysisRadius: 50
    },
    substations: {
      substations: [
        {
          longitude: centerLng - 0.02,
          latitude: centerLat + 0.01,
          name: 'Pori Main',
          maxVoltage: 400,
          operator: 'Fingrid Oyj',
          capacity: 500,
          connectionStatus: 'available',
          distanceKm: 2.1
        },
        {
          longitude: centerLng + 0.05,
          latitude: centerLat - 0.03,
          name: 'Harjavalta',
          maxVoltage: 220,
          operator: 'Fingrid Oyj',
          capacity: 200,
          connectionStatus: 'limited',
          distanceKm: 6.8
        },
        {
          longitude: centerLng - 0.08,
          latitude: centerLat - 0.02,
          name: 'Pori Industrial',
          maxVoltage: 110,
          operator: 'Fingrid Oyj',
          capacity: 150,
          connectionStatus: 'available',
          distanceKm: 4.2
        }
      ]
    },
    connectionOpportunities: {
      opportunities: [
        {
          longitude: centerLng + 0.01,
          latitude: centerLat + 0.02,
          suitabilityScore: 95,
          availableCapacity: 200,
          connectionCostEstimate: 2500000,
          timeToConnect: '12-18 months',
          description: 'High-capacity connection via new 110kV line to Pori Main substation'
        },
        {
          longitude: centerLng - 0.03,
          latitude: centerLat - 0.01,
          suitabilityScore: 78,
          availableCapacity: 100,
          connectionCostEstimate: 1800000,
          timeToConnect: '8-12 months',
          description: 'Medium-capacity connection via existing 22kV infrastructure upgrade'
        }
      ]
    },
    constraints: {
      constraints: [
        {
          geometry: {
            type: 'Polygon',
            coordinates: [[
              [centerLng - 0.15, centerLat + 0.08],
              [centerLng - 0.10, centerLat + 0.08],
              [centerLng - 0.10, centerLat + 0.12],
              [centerLng - 0.15, centerLat + 0.12],
              [centerLng - 0.15, centerLat + 0.08]
            ]]
          },
          type: 'protected_area',
          severity: 'high',
          description: 'National park - construction prohibited',
          affectedCapacity: 0
        },
        {
          geometry: {
            type: 'Polygon',
            coordinates: [[
              [centerLng + 0.06, centerLat - 0.08],
              [centerLng + 0.12, centerLat - 0.08],
              [centerLng + 0.12, centerLat - 0.04],
              [centerLng + 0.06, centerLat - 0.04],
              [centerLng + 0.06, centerLat - 0.08]
            ]]
          },
          type: 'grid_congestion',
          severity: 'medium',
          description: 'High grid utilization area - capacity limitations',
          affectedCapacity: 50
        }
      ]
    },
    summary: {
      overallSuitabilityScore: 82,
      primaryRecommendation: 'Site shows high potential for datacenter development with good grid connectivity',
      keyFindings: [
        'Multiple high-voltage connection points within 5km',
        'Fingrid infrastructure provides reliable grid access',
        'Some capacity constraints in eastern areas',
        'Protected areas limit expansion options to the north'
      ],
      nextSteps: [
        'Contact Fingrid for detailed capacity assessment',
        'Conduct site-specific grid impact study',
        'Evaluate connection cost estimates',
        'Review environmental constraints in detail'
      ]
    }
  };
}