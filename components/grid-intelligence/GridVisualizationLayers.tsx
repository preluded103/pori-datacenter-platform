/**
 * Grid Visualization Layers Component
 * Renders grid infrastructure data layers on Mapbox GL JS map
 */

'use client';

import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { GridAnalysisResult, GridVisualizationLayer } from '@/lib/types/grid-types';

interface GridVisualizationLayersProps {
  map: mapboxgl.Map | null;
  analysisResult?: GridAnalysisResult;
  layers: GridVisualizationLayer[];
  onLayerClick?: (layerId: string, feature: any) => void;
}

interface LayerRenderer {
  render(map: mapboxgl.Map, data: any, layer: GridVisualizationLayer): void;
  remove(map: mapboxgl.Map, layer: GridVisualizationLayer): void;
}

export default function GridVisualizationLayers({
  map,
  analysisResult,
  layers,
  onLayerClick
}: GridVisualizationLayersProps) {
  
  const layerRenderersRef = useRef<Map<string, LayerRenderer>>(new Map());

  // Initialize layer renderers
  useEffect(() => {
    const renderers = new Map<string, LayerRenderer>();
    
    renderers.set('capacity', new GridCapacityRenderer());
    renderers.set('transmission', new TransmissionLinesRenderer());
    renderers.set('substations', new SubstationsRenderer());
    renderers.set('opportunities', new ConnectionOpportunitiesRenderer());
    renderers.set('constraints', new GridConstraintsRenderer());

    layerRenderersRef.current = renderers;
  }, []);

  // Update layers when map, data, or layer visibility changes
  useEffect(() => {
    if (!map || !analysisResult) return;

    layers.forEach(layer => {
      const renderer = layerRenderersRef.current.get(layer.type);
      if (!renderer) return;

      if (layer.visible) {
        // Get data for this layer type
        const layerData = getLayerData(analysisResult, layer.type);
        if (layerData) {
          renderer.render(map, layerData, layer);
          setupLayerInteractions(map, layer, onLayerClick);
        }
      } else {
        renderer.remove(map, layer);
      }
    });

    // Cleanup function
    return () => {
      layers.forEach(layer => {
        const renderer = layerRenderersRef.current.get(layer.type);
        if (renderer && map) {
          renderer.remove(map, layer);
        }
      });
    };
  }, [map, analysisResult, layers, onLayerClick]);

  return null; // This component only manages map layers
}

/**
 * Extract data for specific layer type from analysis result
 */
function getLayerData(analysisResult: GridAnalysisResult, layerType: string): any {
  switch (layerType) {
    case 'capacity':
      return analysisResult.capacityAnalysis;
    case 'transmission':
      return analysisResult.transmissionLines;
    case 'substations':
      return analysisResult.substations;
    case 'opportunities':
      return analysisResult.connectionOpportunities;
    case 'constraints':
      return analysisResult.constraints;
    default:
      return null;
  }
}

/**
 * Setup click interactions for layer
 */
function setupLayerInteractions(
  map: mapboxgl.Map, 
  layer: GridVisualizationLayer, 
  onLayerClick?: (layerId: string, feature: any) => void
) {
  if (!onLayerClick) return;

  const layerId = `${layer.id}-layer`;
  
  map.on('click', layerId, (e) => {
    if (e.features && e.features.length > 0) {
      onLayerClick(layer.id, e.features[0]);
    }
  });

  // Change cursor on hover
  map.on('mouseenter', layerId, () => {
    map.getCanvas().style.cursor = 'pointer';
  });

  map.on('mouseleave', layerId, () => {
    map.getCanvas().style.cursor = '';
  });
}

/**
 * Grid Capacity Heat Map Renderer
 */
class GridCapacityRenderer implements LayerRenderer {
  render(map: mapboxgl.Map, data: any, layer: GridVisualizationLayer): void {
    const sourceId = `${layer.id}-source`;
    const layerId = `${layer.id}-layer`;

    // Remove existing layer/source if it exists
    this.remove(map, layer);

    // Create heatmap data from capacity analysis
    const features = this.createHeatmapFeatures(data);

    map.addSource(sourceId, {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features
      }
    });

    map.addLayer({
      id: layerId,
      type: 'heatmap',
      source: sourceId,
      paint: {
        'heatmap-weight': [
          'interpolate',
          ['linear'],
          ['get', 'capacity'],
          0, 0,
          100, 1
        ],
        'heatmap-intensity': layer.opacity || 0.8,
        'heatmap-color': [
          'interpolate',
          ['linear'],
          ['heatmap-density'],
          0, 'rgba(255,0,0,0)',
          0.2, 'rgb(255,165,0)',
          0.4, 'rgb(255,255,0)',
          0.6, 'rgb(173,255,47)',
          0.8, 'rgb(0,255,0)',
          1, 'rgb(0,128,0)'
        ],
        'heatmap-radius': 30,
        'heatmap-opacity': layer.opacity || 0.8
      }
    });
  }

  remove(map: mapboxgl.Map, layer: GridVisualizationLayer): void {
    const sourceId = `${layer.id}-source`;
    const layerId = `${layer.id}-layer`;

    if (map.getLayer(layerId)) {
      map.removeLayer(layerId);
    }
    if (map.getSource(sourceId)) {
      map.removeSource(sourceId);
    }
  }

  private createHeatmapFeatures(capacityData: any): any[] {
    if (!capacityData?.gridPoints) return [];

    return capacityData.gridPoints.map((point: any) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [point.longitude, point.latitude]
      },
      properties: {
        capacity: point.availableCapacity || 0,
        voltage: point.voltage || 'Unknown',
        distance: point.distanceKm || 0
      }
    }));
  }
}

/**
 * Transmission Lines Renderer
 */
class TransmissionLinesRenderer implements LayerRenderer {
  render(map: mapboxgl.Map, data: any, layer: GridVisualizationLayer): void {
    const sourceId = `${layer.id}-source`;
    const layerId = `${layer.id}-layer`;

    this.remove(map, layer);

    const features = this.createLineFeatures(data);

    map.addSource(sourceId, {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features
      }
    });

    map.addLayer({
      id: layerId,
      type: 'line',
      source: sourceId,
      paint: {
        'line-color': [
          'match',
          ['get', 'voltage'],
          '400kV', '#ff0000',
          '220kV', '#ff8800',
          '132kV', '#0088ff',
          '110kV', '#00ff00',
          '#888888'
        ],
        'line-width': [
          'interpolate',
          ['linear'],
          ['zoom'],
          8, [
            'match',
            ['get', 'voltage'],
            '400kV', 3,
            '220kV', 2.5,
            '132kV', 2,
            '110kV', 1.5,
            1
          ],
          12, [
            'match',
            ['get', 'voltage'],
            '400kV', 6,
            '220kV', 5,
            '132kV', 4,
            '110kV', 3,
            2
          ]
        ],
        'line-opacity': layer.opacity || 0.8
      }
    });
  }

  remove(map: mapboxgl.Map, layer: GridVisualizationLayer): void {
    const sourceId = `${layer.id}-source`;
    const layerId = `${layer.id}-layer`;

    if (map.getLayer(layerId)) {
      map.removeLayer(layerId);
    }
    if (map.getSource(sourceId)) {
      map.removeSource(sourceId);
    }
  }

  private createLineFeatures(transmissionData: any): any[] {
    if (!transmissionData?.lines) return [];

    return transmissionData.lines.map((line: any) => ({
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: line.coordinates || []
      },
      properties: {
        voltage: line.voltage || 'Unknown',
        name: line.name || 'Unnamed',
        operator: line.operator || 'Unknown',
        capacity: line.capacity || 0,
        length: line.length || 0
      }
    }));
  }
}

/**
 * Substations Renderer
 */
class SubstationsRenderer implements LayerRenderer {
  render(map: mapboxgl.Map, data: any, layer: GridVisualizationLayer): void {
    const sourceId = `${layer.id}-source`;
    const layerId = `${layer.id}-layer`;
    const labelsLayerId = `${layer.id}-labels`;

    this.remove(map, layer);

    const features = this.createSubstationFeatures(data);

    map.addSource(sourceId, {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features
      }
    });

    // Substation icons
    map.addLayer({
      id: layerId,
      type: 'circle',
      source: sourceId,
      paint: {
        'circle-radius': [
          'interpolate',
          ['linear'],
          ['get', 'voltage'],
          110, 4,
          132, 5,
          220, 7,
          400, 10
        ],
        'circle-color': [
          'match',
          ['get', 'voltage'],
          400, '#ff0000',
          220, '#ff8800',
          132, '#0088ff',
          110, '#00ff00',
          '#888888'
        ],
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ffffff',
        'circle-opacity': layer.opacity || 0.9
      }
    });

    // Substation labels
    map.addLayer({
      id: labelsLayerId,
      type: 'symbol',
      source: sourceId,
      layout: {
        'text-field': ['get', 'name'],
        'text-font': ['Open Sans Regular'],
        'text-size': 12,
        'text-offset': [0, -2],
        'text-anchor': 'top'
      },
      paint: {
        'text-color': '#ffffff',
        'text-halo-color': '#000000',
        'text-halo-width': 1,
        'text-opacity': layer.opacity || 0.9
      },
      minzoom: 10
    });
  }

  remove(map: mapboxgl.Map, layer: GridVisualizationLayer): void {
    const sourceId = `${layer.id}-source`;
    const layerId = `${layer.id}-layer`;
    const labelsLayerId = `${layer.id}-labels`;

    [layerId, labelsLayerId].forEach(id => {
      if (map.getLayer(id)) {
        map.removeLayer(id);
      }
    });

    if (map.getSource(sourceId)) {
      map.removeSource(sourceId);
    }
  }

  private createSubstationFeatures(substationData: any): any[] {
    if (!substationData?.substations) return [];

    return substationData.substations.map((substation: any) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [substation.longitude, substation.latitude]
      },
      properties: {
        name: substation.name || 'Unknown',
        voltage: substation.maxVoltage || 110,
        operator: substation.operator || 'Unknown',
        capacity: substation.capacity || 0,
        connectionStatus: substation.connectionStatus || 'unknown',
        distance: substation.distanceKm || 0
      }
    }));
  }
}

/**
 * Connection Opportunities Renderer
 */
class ConnectionOpportunitiesRenderer implements LayerRenderer {
  render(map: mapboxgl.Map, data: any, layer: GridVisualizationLayer): void {
    const sourceId = `${layer.id}-source`;
    const layerId = `${layer.id}-layer`;

    this.remove(map, layer);

    const features = this.createOpportunityFeatures(data);

    map.addSource(sourceId, {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features
      }
    });

    map.addLayer({
      id: layerId,
      type: 'circle',
      source: sourceId,
      paint: {
        'circle-radius': [
          'interpolate',
          ['linear'],
          ['get', 'score'],
          0, 3,
          100, 12
        ],
        'circle-color': [
          'interpolate',
          ['linear'],
          ['get', 'score'],
          0, '#ff0000',
          25, '#ff8800',
          50, '#ffff00',
          75, '#88ff00',
          100, '#00ff00'
        ],
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ffffff',
        'circle-opacity': layer.opacity || 0.8
      }
    });
  }

  remove(map: mapboxgl.Map, layer: GridVisualizationLayer): void {
    const sourceId = `${layer.id}-source`;
    const layerId = `${layer.id}-layer`;

    if (map.getLayer(layerId)) {
      map.removeLayer(layerId);
    }
    if (map.getSource(sourceId)) {
      map.removeSource(sourceId);
    }
  }

  private createOpportunityFeatures(opportunityData: any): any[] {
    if (!opportunityData?.opportunities) return [];

    return opportunityData.opportunities.map((opp: any) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [opp.longitude, opp.latitude]
      },
      properties: {
        score: opp.suitabilityScore || 0,
        capacity: opp.availableCapacity || 0,
        connectionCost: opp.connectionCostEstimate || 0,
        timeToConnect: opp.timeToConnect || 'Unknown',
        description: opp.description || 'Connection opportunity'
      }
    }));
  }
}

/**
 * Grid Constraints Renderer
 */
class GridConstraintsRenderer implements LayerRenderer {
  render(map: mapboxgl.Map, data: any, layer: GridVisualizationLayer): void {
    const sourceId = `${layer.id}-source`;
    const layerId = `${layer.id}-layer`;

    this.remove(map, layer);

    const features = this.createConstraintFeatures(data);

    map.addSource(sourceId, {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features
      }
    });

    map.addLayer({
      id: layerId,
      type: 'fill',
      source: sourceId,
      paint: {
        'fill-color': [
          'match',
          ['get', 'severity'],
          'high', '#ff0000',
          'medium', '#ff8800',
          'low', '#ffff00',
          '#888888'
        ],
        'fill-opacity': [
          'match',
          ['get', 'severity'],
          'high', 0.6,
          'medium', 0.4,
          'low', 0.2,
          0.3
        ]
      }
    });

    // Constraint boundaries
    map.addLayer({
      id: `${layerId}-outline`,
      type: 'line',
      source: sourceId,
      paint: {
        'line-color': '#ff0000',
        'line-width': 2,
        'line-dasharray': [2, 2],
        'line-opacity': layer.opacity || 0.8
      }
    });
  }

  remove(map: mapboxgl.Map, layer: GridVisualizationLayer): void {
    const sourceId = `${layer.id}-source`;
    const layerId = `${layer.id}-layer`;
    const outlineLayerId = `${layerId}-outline`;

    [layerId, outlineLayerId].forEach(id => {
      if (map.getLayer(id)) {
        map.removeLayer(id);
      }
    });

    if (map.getSource(sourceId)) {
      map.removeSource(sourceId);
    }
  }

  private createConstraintFeatures(constraintData: any): any[] {
    if (!constraintData?.constraints) return [];

    return constraintData.constraints.map((constraint: any) => ({
      type: 'Feature',
      geometry: constraint.geometry || {
        type: 'Polygon',
        coordinates: [[]]
      },
      properties: {
        type: constraint.type || 'unknown',
        severity: constraint.severity || 'medium',
        description: constraint.description || 'Grid constraint',
        affectedCapacity: constraint.affectedCapacity || 0
      }
    }));
  }
}