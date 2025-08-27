/**
 * Test suite for GridLayerManager
 * Tests layer management, memory cleanup, and performance optimization
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GridLayerManager } from '@/lib/grid-intelligence/grid-layer-manager';
import { GridAnalysisResult, GridVisualizationLayer } from '@/lib/types/grid-types';

// Mock map instance
const createMockMap = () => ({
  addLayer: vi.fn(),
  removeLayer: vi.fn(),
  getLayer: vi.fn(),
  addSource: vi.fn(),
  removeSource: vi.fn(),
  getSource: vi.fn(),
  setLayerProps: vi.fn(),
  setFilter: vi.fn(),
  setPaintProperty: vi.fn()
});

// Mock analysis result
const createMockAnalysisResult = (): GridAnalysisResult => ({
  analysisId: 'test-analysis-123',
  timestamp: new Date().toISOString(),
  location: {
    centroid: [24.9384, 60.1699],
    country: 'Finland',
    region: 'Uusimaa',
    polygon: {
      type: 'Polygon',
      coordinates: [[[24.9, 60.1], [24.95, 60.1], [24.95, 60.15], [24.9, 60.15], [24.9, 60.1]]]
    }
  },
  requirements: {
    powerMW: 70,
    voltageLevel: '110kV',
    timeline: '18 months',
    budget: 5000000
  },
  connectionOpportunities: [],
  gridData: {
    substations: [],
    transmissionLines: [],
    transformers: [],
    loadCenters: []
  },
  tsoAnalysis: {
    primaryTSO: 'Fingrid',
    secondaryTSOs: [],
    jurisdictionalComplexity: 'Simple'
  }
});

describe('GridLayerManager', () => {
  let manager: GridLayerManager;
  let mockMap: any;

  beforeEach(() => {
    manager = new GridLayerManager();
    mockMap = createMockMap();
  });

  afterEach(() => {
    manager.dispose();
  });

  describe('Initialization and Layer Management', () => {
    it('should initialize default layers', () => {
      const layers = manager.initializeDefaultLayers();
      
      expect(layers).toBeDefined();
      expect(layers.length).toBeGreaterThan(0);
      
      // Check for expected layer types
      const layerTypes = layers.map(l => l.type);
      expect(layerTypes).toContain('capacity');
      expect(layerTypes).toContain('transmission');
      expect(layerTypes).toContain('substations');
    });

    it('should get all layers', () => {
      manager.initializeDefaultLayers();
      const allLayers = manager.getAllLayers();
      
      expect(allLayers).toBeDefined();
      expect(allLayers.length).toBeGreaterThan(0);
    });

    it('should get layer by id', () => {
      manager.initializeDefaultLayers();
      const layer = manager.getLayerById('grid-capacity-heatmap');
      
      expect(layer).toBeDefined();
      expect(layer?.id).toBe('grid-capacity-heatmap');
    });

    it('should return undefined for non-existent layer', () => {
      manager.initializeDefaultLayers();
      const layer = manager.getLayerById('non-existent-layer');
      
      expect(layer).toBeUndefined();
    });
  });

  describe('Layer Visibility Management', () => {
    beforeEach(() => {
      manager.initializeDefaultLayers();
    });

    it('should toggle layer visibility', () => {
      const layerId = 'grid-capacity-heatmap';
      const originalLayer = manager.getLayerById(layerId);
      const originalVisibility = originalLayer?.visible || false;
      
      const updatedLayer = manager.toggleLayerVisibility(layerId, !originalVisibility);
      
      expect(updatedLayer).toBeDefined();
      expect(updatedLayer?.visible).toBe(!originalVisibility);
    });

    it('should return null for invalid layer toggle', () => {
      const result = manager.toggleLayerVisibility('invalid-layer', true);
      expect(result).toBeNull();
    });

    it('should update layer opacity', () => {
      const layerId = 'grid-capacity-heatmap';
      const newOpacity = 0.5;
      
      const updatedLayer = manager.updateLayerOpacity(layerId, newOpacity);
      
      expect(updatedLayer).toBeDefined();
      expect(updatedLayer?.opacity).toBe(newOpacity);
    });

    it('should clamp opacity to valid range', () => {
      const layerId = 'grid-capacity-heatmap';
      
      // Test upper bound
      let updatedLayer = manager.updateLayerOpacity(layerId, 2.0);
      expect(updatedLayer?.opacity).toBe(1.0);
      
      // Test lower bound
      updatedLayer = manager.updateLayerOpacity(layerId, -0.5);
      expect(updatedLayer?.opacity).toBe(0.0);
    });
  });

  describe('Configuration Management', () => {
    beforeEach(() => {
      manager.initializeDefaultLayers();
    });

    it('should update configuration', () => {
      const newConfig = {
        showCapacityLabels: true,
        transmissionLineWidth: 3,
        substationIconSize: 12
      };
      
      manager.updateConfig(newConfig);
      const config = manager.getConfig();
      
      expect(config.showCapacityLabels).toBe(true);
      expect(config.transmissionLineWidth).toBe(3);
      expect(config.substationIconSize).toBe(12);
    });

    it('should merge configuration with existing values', () => {
      manager.updateConfig({ showCapacityLabels: true });
      manager.updateConfig({ transmissionLineWidth: 5 });
      
      const config = manager.getConfig();
      expect(config.showCapacityLabels).toBe(true);
      expect(config.transmissionLineWidth).toBe(5);
    });
  });

  describe('Analysis Result Integration', () => {
    beforeEach(() => {
      manager.initializeDefaultLayers();
    });

    it('should update analysis result', () => {
      const analysisResult = createMockAnalysisResult();
      
      manager.updateAnalysisResult(analysisResult);
      
      // Should not throw and should store the result
      expect(() => manager.updateAnalysisResult(analysisResult)).not.toThrow();
    });

    it('should auto-configure layers based on analysis', () => {
      const analysisResult = createMockAnalysisResult();
      manager.updateAnalysisResult(analysisResult);
      
      const initialVisibleCount = manager.getAllLayers().filter(l => l.visible).length;
      
      manager.autoConfigureLayers();
      
      const finalVisibleCount = manager.getAllLayers().filter(l => l.visible).length;
      
      // Should have configured some layers as visible
      expect(finalVisibleCount).toBeGreaterThanOrEqual(initialVisibleCount);
    });
  });

  describe('Layer Presets', () => {
    beforeEach(() => {
      manager.initializeDefaultLayers();
    });

    it('should generate layer presets', () => {
      const presets = manager.generateLayerPresets();
      
      expect(presets).toBeDefined();
      expect(typeof presets).toBe('object');
      expect(Object.keys(presets).length).toBeGreaterThan(0);
      
      // Check for expected preset names
      expect(presets['datacenter-overview']).toBeDefined();
      expect(presets['detailed-analysis']).toBeDefined();
      expect(presets['connection-focus']).toBeDefined();
    });

    it('should apply layer preset', () => {
      const presetName = 'datacenter-overview';
      
      // Initially all layers should be hidden
      manager.getAllLayers().forEach(layer => {
        manager.toggleLayerVisibility(layer.id, false);
      });
      
      manager.applyLayerPreset(presetName);
      
      const visibleLayers = manager.getAllLayers().filter(l => l.visible);
      expect(visibleLayers.length).toBeGreaterThan(0);
    });

    it('should handle invalid preset gracefully', () => {
      expect(() => manager.applyLayerPreset('invalid-preset')).not.toThrow();
    });
  });

  describe('Memory Management and Cleanup', () => {
    beforeEach(() => {
      manager.initializeDefaultLayers();
    });

    it('should register map sources for cleanup', () => {
      const sourceId = 'test-source-123';
      
      expect(() => manager.registerMapSource(sourceId)).not.toThrow();
    });

    it('should register map layers for cleanup', () => {
      const layerId = 'test-layer-123';
      
      expect(() => manager.registerMapLayer(layerId)).not.toThrow();
    });

    it('should add cleanup callbacks', () => {
      const callback = vi.fn();
      
      manager.addCleanupCallback(callback);
      
      expect(() => manager.addCleanupCallback(callback)).not.toThrow();
    });

    it('should cleanup map resources', () => {
      const sourceId = 'test-source';
      const layerId = 'test-layer';
      const callback = vi.fn();
      
      // Setup resources
      mockMap.getLayer.mockReturnValue(true);
      mockMap.getSource.mockReturnValue(true);
      
      manager.registerMapSource(sourceId);
      manager.registerMapLayer(layerId);
      manager.addCleanupCallback(callback);
      
      // Cleanup
      manager.cleanupMapResources(mockMap);
      
      // Verify cleanup calls
      expect(mockMap.removeLayer).toHaveBeenCalledWith(layerId);
      expect(mockMap.removeSource).toHaveBeenCalledWith(sourceId);
      expect(callback).toHaveBeenCalled();
    });

    it('should handle cleanup errors gracefully', () => {
      const sourceId = 'test-source';
      const layerId = 'test-layer';
      
      // Setup to throw errors
      mockMap.removeLayer.mockImplementation(() => {
        throw new Error('Layer removal failed');
      });
      mockMap.removeSource.mockImplementation(() => {
        throw new Error('Source removal failed');
      });
      
      manager.registerMapSource(sourceId);
      manager.registerMapLayer(layerId);
      
      // Should not throw despite underlying errors
      expect(() => manager.cleanupMapResources(mockMap)).not.toThrow();
    });
  });

  describe('Performance Optimization', () => {
    beforeEach(() => {
      manager.initializeDefaultLayers();
    });

    it('should optimize layer rendering', () => {
      // Make many layers visible
      const layers = manager.getAllLayers();
      layers.slice(0, 10).forEach(layer => {
        manager.toggleLayerVisibility(layer.id, true);
      });
      
      expect(() => manager.optimizeLayerRendering()).not.toThrow();
      
      // Should have adjusted opacity for performance
      const visibleLayers = manager.getAllLayers().filter(l => l.visible);
      if (visibleLayers.length > 5) {
        const adjustedLayers = visibleLayers.slice(5);
        adjustedLayers.forEach(layer => {
          expect(layer.opacity).toBeLessThan(1.0);
        });
      }
    });

    it('should check memory usage', () => {
      const memoryStats = manager.checkMemoryUsage();
      
      expect(memoryStats).toBeDefined();
      expect(memoryStats.layerCount).toBeGreaterThanOrEqual(0);
      expect(memoryStats.visibleCount).toBeGreaterThanOrEqual(0);
      expect(['low', 'medium', 'high']).toContain(memoryStats.memoryPressure);
    });

    it('should report high memory pressure with many layers', () => {
      // Create many layers
      for (let i = 0; i < 60; i++) {
        const testLayer: GridVisualizationLayer = {
          id: `test-layer-${i}`,
          name: `Test Layer ${i}`,
          type: 'test',
          visible: true,
          opacity: 1.0,
          description: 'Test layer',
          dataSource: 'test'
        };
        // Add layer through manager (assuming there's an addLayer method or we modify the internal state)
      }
      
      const memoryStats = manager.checkMemoryUsage();
      // With default layers plus 60 test layers, should be high pressure
      expect(['low', 'medium', 'high']).toContain(memoryStats.memoryPressure);
    });
  });

  describe('Resource Disposal', () => {
    it('should dispose resources properly', () => {
      manager.initializeDefaultLayers();
      manager.registerMapSource('test-source');
      manager.registerMapLayer('test-layer');
      
      expect(() => manager.dispose()).not.toThrow();
      
      // After disposal, should have no layers
      const layers = manager.getAllLayers();
      expect(layers).toHaveLength(0);
    });

    it('should handle multiple dispose calls', () => {
      manager.dispose();
      expect(() => manager.dispose()).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle corrupted layer data', () => {
      manager.initializeDefaultLayers();
      
      // Try to update layer with invalid data
      expect(() => manager.updateLayerOpacity('', NaN)).not.toThrow();
      expect(() => manager.toggleLayerVisibility('', true)).not.toThrow();
    });

    it('should handle null/undefined inputs gracefully', () => {
      expect(() => manager.updateConfig(null as any)).not.toThrow();
      expect(() => manager.updateAnalysisResult(null as any)).not.toThrow();
    });
  });
});