/**
 * Grid Intelligence Integration Component
 * Main integration component that connects grid intelligence to existing feasibility dashboard
 */

'use client';

import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import mapboxgl from 'mapbox-gl';
import { PolygonGridAnalysisTrigger } from '@/lib/grid-intelligence/polygon-grid-trigger';
import { GridLayerManager } from '@/lib/grid-intelligence/grid-layer-manager';
import GridVisualizationLayers from './GridVisualizationLayers';
import GridInfrastructureLayerSelector from './GridInfrastructureLayerSelector';
import GridAnalysisProgressIndicator, { GridAnalysisProgressCompact } from './GridAnalysisProgressIndicator';
import GridIntelligenceErrorBoundary from './GridIntelligenceErrorBoundary';
import { 
  PolygonFeature, 
  GridAnalysisResult, 
  AnalysisProgress, 
  GridVisualizationLayer,
  GridInfrastructureLayerConfig 
} from '@/lib/types/grid-types';

interface GridIntelligenceIntegrationProps {
  map: mapboxgl.Map | null;
  isEnabled?: boolean;
  onAnalysisComplete?: (result: GridAnalysisResult) => void;
  onAnalysisError?: (error: Error) => void;
  className?: string;
}

function GridIntelligenceIntegration({
  map,
  isEnabled = true,
  onAnalysisComplete,
  onAnalysisError,
  className = ''
}: GridIntelligenceIntegrationProps) {
  
  // State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState<AnalysisProgress | undefined>();
  const [analysisResult, setAnalysisResult] = useState<GridAnalysisResult | undefined>();
  const [layers, setLayers] = useState<GridVisualizationLayer[]>([]);
  const [layerConfig, setLayerConfig] = useState<GridInfrastructureLayerConfig>({});
  
  // Memoized trigger configuration
  const triggerConfig = useMemo(() => ({
    autoTriggerEnabled: true,
    minPolygonArea: 10000, // 1 hectare minimum
    analysisTimeout: 300000, // 5 minutes
    retryAttempts: 3
  }), []);

  // Memoized callbacks to prevent unnecessary re-renders
  const triggerCallbacks = useMemo(() => ({
    onAnalysisStart: (polygon: PolygonFeature) => {
      console.log('🔍 Grid analysis started for polygon:', polygon.id);
      setIsAnalyzing(true);
      setAnalysisProgress({
        analysisId: `analysis-${Date.now()}`,
        percentage: 0,
        timestamp: new Date().toISOString(),
        stage: 'Validating location...'
      });
    },
    
    onProgress: (progress: AnalysisProgress) => {
      setAnalysisProgress(progress);
    },
    
    onComplete: (result: GridAnalysisResult) => {
      console.log('✅ Grid analysis completed:', result.analysisId);
      setAnalysisResult(result);
      setIsAnalyzing(false);
      setAnalysisProgress(undefined);
      onAnalysisComplete?.(result);
    },
    
    onError: (error: Error, polygon: PolygonFeature) => {
      console.error('❌ Grid analysis failed:', error);
      setIsAnalyzing(false);
      setAnalysisProgress(undefined);
      onAnalysisError?.(error);
    }
  }), [onAnalysisComplete, onAnalysisError]);

  // Managers with memoization
  const [polygonTrigger] = useState(() => new PolygonGridAnalysisTrigger(triggerConfig, triggerCallbacks));
  const [layerManager] = useState(() => new GridLayerManager());

  // Initialize layers with memoization
  const initialLayers = useMemo(() => {
    return layerManager.initializeDefaultLayers();
  }, [layerManager]);

  useEffect(() => {
    setLayers(initialLayers);
  }, [initialLayers]);

  // Update layer manager when analysis result changes
  useEffect(() => {
    if (analysisResult) {
      layerManager.updateAnalysisResult(analysisResult);
      
      // Auto-configure recommended layers
      layerManager.autoConfigureLayers();
      setLayers([...layerManager.getAllLayers()]);
      
      // Notify parent component
      onAnalysisComplete?.(analysisResult);
    }
  }, [analysisResult, layerManager, onAnalysisComplete]);

  // Setup polygon trigger when map is available
  useEffect(() => {
    if (!map || !isEnabled) return;

    // Initialize trigger with map
    polygonTrigger.initialize(map);

    // Cleanup
    return () => {
      polygonTrigger.cleanup();
      layerManager.cleanupMapResources(map);
    };
  }, [map, isEnabled, polygonTrigger, layerManager]);

  // Handle layer visibility toggle
  const handleLayerToggle = useCallback((layerId: string, visible: boolean) => {
    const updatedLayer = layerManager.toggleLayerVisibility(layerId, visible);
    if (updatedLayer) {
      setLayers([...layerManager.getAllLayers()]);
      
      // Optimize performance if many layers are visible
      layerManager.optimizeLayerRendering();
      
      // Check memory pressure
      const memoryStats = layerManager.checkMemoryUsage();
      if (memoryStats.memoryPressure === 'high') {
        console.warn('⚠️ High memory pressure detected - consider reducing visible layers');
      }
    }
  }, [layerManager]);

  // Handle layer opacity change
  const handleOpacityChange = useCallback((layerId: string, opacity: number) => {
    const updatedLayer = layerManager.updateLayerOpacity(layerId, opacity);
    if (updatedLayer) {
      setLayers([...layerManager.getAllLayers()]);
    }
  }, [layerManager]);

  // Handle layer configuration change
  const handleConfigChange = useCallback((config: Partial<GridInfrastructureLayerConfig>) => {
    const newConfig = { ...layerConfig, ...config };
    setLayerConfig(newConfig);
    layerManager.updateConfig(newConfig);
    setLayers([...layerManager.getAllLayers()]);
  }, [layerConfig, layerManager]);

  // Handle layer click for popups/info
  const handleLayerClick = useCallback((layerId: string, feature: any) => {
    console.log('Layer clicked:', layerId, feature);
    // Could show popup with feature details
  }, []);

  // Manual trigger for testing/demo with memoization
  const triggerAnalysisForBounds = useCallback(async (bounds: mapboxgl.LngLatBounds) => {
    if (!map) return;

    // Create a polygon feature from bounds
    const polygon: PolygonFeature = {
      id: `demo-polygon-${Date.now()}`,
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [bounds.getWest(), bounds.getNorth()],
          [bounds.getEast(), bounds.getNorth()],
          [bounds.getEast(), bounds.getSouth()],
          [bounds.getWest(), bounds.getSouth()],
          [bounds.getWest(), bounds.getNorth()]
        ]]
      },
      properties: {
        name: 'Demo Analysis Area',
        description: 'Manual trigger for grid analysis'
      }
    };

    await polygonTrigger.onPolygonCompleted(polygon);
  }, [map, polygonTrigger]);

  // Memoized debug panel data
  const debugData = useMemo(() => ({
    status: isAnalyzing ? 'Analyzing' : 'Idle',
    visibleLayerCount: layers.filter(l => l.visible).length,
    totalLayerCount: layers.length,
    hasAnalysisResult: !!analysisResult,
    progressPercentage: analysisProgress?.percentage || 0
  }), [isAnalyzing, layers, analysisResult, analysisProgress]);

  if (!isEnabled) {
    return null;
  }

  return (
    <GridIntelligenceErrorBoundary>
      <div className={`grid-intelligence-integration ${className}`}>
        {/* Map Visualization Layers */}
        <GridIntelligenceErrorBoundary>
          <GridVisualizationLayers
            map={map}
            analysisResult={analysisResult}
            layers={layers}
            onLayerClick={handleLayerClick}
          />
        </GridIntelligenceErrorBoundary>

        {/* Layer Selector Component */}
        <GridIntelligenceErrorBoundary>
          <GridInfrastructureLayerSelector
            layers={layers}
            onLayerToggle={handleLayerToggle}
            onOpacityChange={handleOpacityChange}
            config={layerConfig}
            onConfigChange={handleConfigChange}
            isAnalyzing={isAnalyzing}
            analysisProgress={analysisProgress?.percentage || 0}
          />
        </GridIntelligenceErrorBoundary>

        {/* Progress Indicator (Full Screen) */}
        {isAnalyzing && analysisProgress && (
          <GridIntelligenceErrorBoundary>
            <GridAnalysisProgressIndicator
              progress={analysisProgress}
              onCancel={() => {
                // Could implement cancellation logic
                console.log('Analysis cancellation requested');
              }}
            />
          </GridIntelligenceErrorBoundary>
        )}

      {/* Compact Progress Indicator (if preferred) */}
      {/* Uncomment for inline progress display instead of modal
      {isAnalyzing && analysisProgress && (
        <div className="fixed top-4 right-4 z-40">
          <GridAnalysisProgressCompact
            progress={analysisProgress}
            onCancel={() => {
              console.log('Analysis cancellation requested');
            }}
          />
        </div>
      )}
      */}

      {/* Debug Panel (Development Only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 bg-[#131316] border border-[#27272a] rounded-lg p-4 text-xs text-[#a1a1aa] max-w-sm">
          <h4 className="font-medium text-[#fafafa] mb-2">Grid Intelligence Debug</h4>
          <div className="space-y-1">
            <div>Status: {debugData.status}</div>
            <div>Visible Layers: {debugData.visibleLayerCount}/{debugData.totalLayerCount}</div>
            <div>Analysis Result: {debugData.hasAnalysisResult ? 'Available' : 'None'}</div>
            <div>Progress: {debugData.progressPercentage}%</div>
            {map && (
              <button
                onClick={() => triggerAnalysisForBounds(map.getBounds())}
                className="mt-2 px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                disabled={isAnalyzing}
              >
                Test Analysis
              </button>
            )}
          </div>
        </div>
      )}
      </div>
    </GridIntelligenceErrorBoundary>
  );
}

// Export memoized component for performance
export default memo(GridIntelligenceIntegration);

/**
 * Hook for using grid intelligence in existing components
 */
export function useGridIntelligence(map: mapboxgl.Map | null) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<GridAnalysisResult | undefined>();
  const [layers, setLayers] = useState<GridVisualizationLayer[]>([]);
  
  const layerManager = React.useMemo(() => new GridLayerManager(), []);

  // Initialize layers
  useEffect(() => {
    const defaultLayers = layerManager.initializeDefaultLayers();
    setLayers(defaultLayers);
  }, [layerManager]);

  // Update layers when analysis result changes
  useEffect(() => {
    if (analysisResult) {
      layerManager.updateAnalysisResult(analysisResult);
      layerManager.autoConfigureLayers();
      setLayers([...layerManager.getAllLayers()]);
    }
  }, [analysisResult, layerManager]);

  const triggerAnalysis = useCallback(async (polygon: PolygonFeature) => {
    if (!map) return;

    setIsAnalyzing(true);
    
    try {
      const config = {
        autoTriggerEnabled: true,
        minPolygonArea: 10000,
        analysisTimeout: 300000,
        retryAttempts: 3
      };

      const callbacks = {
        onAnalysisStart: (polygon: PolygonFeature) => setIsAnalyzing(true),
        onProgress: (progress: AnalysisProgress) => console.log('Progress:', progress.percentage),
        onComplete: (result: GridAnalysisResult) => {
          setAnalysisResult(result);
          setIsAnalyzing(false);
        },
        onError: (error: Error) => {
          console.error('Analysis error:', error);
          setIsAnalyzing(false);
        }
      };

      const trigger = new PolygonGridAnalysisTrigger(config, callbacks);
      trigger.initialize(map);
      await trigger.onPolygonCompleted(polygon);
    } catch (error) {
      console.error('Grid analysis error:', error);
      throw error;
    } finally {
      setIsAnalyzing(false);
    }
  }, [map]);

  const toggleLayer = useCallback((layerId: string, visible: boolean) => {
    layerManager.toggleLayerVisibility(layerId, visible);
    setLayers([...layerManager.getAllLayers()]);
  }, [layerManager]);

  const updateLayerOpacity = useCallback((layerId: string, opacity: number) => {
    layerManager.updateLayerOpacity(layerId, opacity);
    setLayers([...layerManager.getAllLayers()]);
  }, [layerManager]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (layerManager && map) {
        layerManager.cleanupMapResources(map);
      }
      layerManager.dispose();
    };
  }, [layerManager, map]);

  return {
    isAnalyzing,
    analysisResult,
    layers,
    triggerAnalysis,
    toggleLayer,
    updateLayerOpacity,
    layerManager
  };
}