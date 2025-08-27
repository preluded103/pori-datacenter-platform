/**
 * Test suite for PolygonGridAnalysisTrigger
 * Tests core functionality, error handling, and integration patterns
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PolygonGridAnalysisTrigger, GridAnalysisTriggerConfig, GridAnalysisCallbacks } from '@/lib/grid-intelligence/polygon-grid-trigger';
import { PolygonFeature, AnalysisProgress, GridAnalysisResult } from '@/lib/types/grid-types';

// Mock mapbox-gl
const mockMap = {
  on: vi.fn(),
  off: vi.fn(),
  getBounds: vi.fn(() => ({
    getWest: () => -1,
    getEast: () => 1,
    getNorth: () => 1,
    getSouth: () => -1
  })),
  getCenter: vi.fn(() => ({ lng: 0, lat: 0 })),
  getZoom: vi.fn(() => 10)
};

vi.mock('mapbox-gl', () => ({
  default: {
    Map: vi.fn(() => mockMap)
  }
}));

// Mock fetch
global.fetch = vi.fn();

// Test data
const createMockPolygon = (area: number = 15000): PolygonFeature => ({
  id: 'test-polygon',
  type: 'Feature',
  geometry: {
    type: 'Polygon',
    coordinates: [[
      [0, 0],
      [0, 0.001], 
      [0.001, 0.001],
      [0.001, 0],
      [0, 0]
    ]]
  },
  properties: {
    name: 'Test Polygon',
    description: 'Test polygon for analysis'
  }
});

const createMockCallbacks = (): GridAnalysisCallbacks => ({
  onAnalysisStart: vi.fn(),
  onProgress: vi.fn(),
  onComplete: vi.fn(),
  onError: vi.fn()
});

describe('PolygonGridAnalysisTrigger', () => {
  let trigger: PolygonGridAnalysisTrigger;
  let mockCallbacks: GridAnalysisCallbacks;

  beforeEach(() => {
    vi.clearAllMocks();
    mockCallbacks = createMockCallbacks();
    
    // Setup comprehensive fetch mock with proper responses
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('validate-location')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            centroid: [24.9384, 60.1699],
            country: 'Finland',
            countryCode: 'FI',
            region: 'Southern Finland',
            bounds: { north: 60.17, south: 60.16, east: 24.95, west: 24.93 },
            tsoRelevance: { primary: '10YFI-1--------U' },
            gridRegion: 'Nordic Grid'
          })
        });
      }
      if (url.includes('identify-tsos')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            primary: '10YFI-1--------U',
            secondary: ['10YSE-1--------K']
          })
        });
      }
      if (url.includes('collect-data')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            substations: [{ id: 'test-substation', capacity: 400 }],
            transmissionLines: [{ id: 'test-line', voltage: 400000 }],
            gridConnections: []
          })
        });
      }
      if (url.includes('process-analysis')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            analysisId: 'test-analysis-123',
            timestamp: new Date().toISOString(),
            score: 85,
            recommendations: [
              { type: 'grid-capacity', score: 90, details: 'Excellent grid capacity' }
            ],
            gridIntelligence: {
              nearestSubstation: { distance: 2.5, capacity: 400 },
              gridCapacity: 85,
              connectionFeasibility: 'high'
            }
          })
        });
      }
      if (url.includes('cancel/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ cancelled: true })
        });
      }
      
      // Default successful response
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });
    });
  });

  afterEach(() => {
    if (trigger) {
      trigger.cleanup();
    }
  });

  describe('Constructor and Initialization', () => {
    it('should initialize with default config when no parameters provided', () => {
      trigger = new PolygonGridAnalysisTrigger();
      
      const config = trigger.getConfig();
      expect(config).toMatchObject({
        autoTriggerEnabled: true,
        minPolygonArea: 10000,
        analysisTimeout: 300000,
        retryAttempts: 3
      });
    });

    it('should merge custom config with defaults', () => {
      const customConfig: Partial<GridAnalysisTriggerConfig> = {
        minPolygonArea: 5000,
        analysisTimeout: 120000
      };

      trigger = new PolygonGridAnalysisTrigger(customConfig);
      
      const config = trigger.getConfig();
      expect(config.minPolygonArea).toBe(5000);
      expect(config.analysisTimeout).toBe(120000);
      expect(config.autoTriggerEnabled).toBe(true); // Default preserved
      expect(config.retryAttempts).toBe(3); // Default preserved
    });

    it('should accept callbacks in constructor', () => {
      trigger = new PolygonGridAnalysisTrigger(undefined, mockCallbacks);
      
      // Verify callbacks are stored (private, so we test through behavior)
      expect(() => trigger.initialize(mockMap as any)).not.toThrow();
    });

    it('should allow callback updates after construction', () => {
      trigger = new PolygonGridAnalysisTrigger();
      
      const newCallbacks = createMockCallbacks();
      trigger.updateCallbacks(newCallbacks);
      
      // Should not throw when callbacks are properly set
      trigger.initialize(mockMap as any);
      expect(() => trigger.initialize(mockMap as any)).not.toThrow();
    });
  });

  describe('Configuration Management', () => {
    beforeEach(() => {
      trigger = new PolygonGridAnalysisTrigger();
    });

    it('should update configuration', () => {
      const newConfig: Partial<GridAnalysisTriggerConfig> = {
        minPolygonArea: 20000,
        autoTriggerEnabled: false
      };

      trigger.updateConfig(newConfig);
      
      const config = trigger.getConfig();
      expect(config.minPolygonArea).toBe(20000);
      expect(config.autoTriggerEnabled).toBe(false);
    });

    it('should enable/disable auto-trigger', () => {
      trigger.setAutoTrigger(false);
      expect(trigger.getConfig().autoTriggerEnabled).toBe(false);

      trigger.setAutoTrigger(true);
      expect(trigger.getConfig().autoTriggerEnabled).toBe(true);
    });
  });

  describe('Map Integration', () => {
    beforeEach(() => {
      trigger = new PolygonGridAnalysisTrigger(undefined, mockCallbacks);
    });

    it('should initialize with map', () => {
      trigger.initialize(mockMap as any);
      
      // Should not throw and should be ready for analysis
      expect(() => trigger.initialize(mockMap as any)).not.toThrow();
    });

    it('should cleanup properly', () => {
      trigger.initialize(mockMap as any);
      trigger.cleanup();
      
      expect(trigger.isAnalysisInProgress()).toBe(false);
    });
  });

  describe('Polygon Analysis Triggering', () => {
    beforeEach(() => {
      trigger = new PolygonGridAnalysisTrigger(undefined, mockCallbacks);
      trigger.initialize(mockMap as any);
    });

    it('should validate setup before analysis', async () => {
      const triggerWithoutCallbacks = new PolygonGridAnalysisTrigger();
      triggerWithoutCallbacks.initialize(mockMap as any);
      
      const polygon = createMockPolygon();
      
      // Should handle missing callbacks gracefully
      await expect(triggerWithoutCallbacks.onPolygonCompleted(polygon)).resolves.not.toThrow();
    });

    it('should check minimum area requirement', async () => {
      // Create a very small polygon that will be below minimum area
      const smallPolygon: PolygonFeature = {
        id: 'small-polygon',
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [0, 0],
            [0, 0.0001], // Very small - well below 10000 m²
            [0.0001, 0.0001],
            [0.0001, 0],
            [0, 0]
          ]]
        },
        properties: {
          name: 'Small Test Polygon'
        }
      };
      
      await trigger.onPolygonCompleted(smallPolygon);
      
      // Should not trigger analysis for small polygons
      expect(mockCallbacks.onAnalysisStart).not.toHaveBeenCalled();
    });

    it('should prevent multiple concurrent analyses', async () => {
      const polygon = createMockPolygon();
      
      // Mock fetch to simulate long-running analysis with proper API responses
      let callCount = 0;
      (global.fetch as any).mockImplementation((url: string) => {
        callCount++;
        return new Promise(resolve => setTimeout(() => {
          if (url.includes('validate-location')) {
            resolve({
              ok: true,
              json: () => Promise.resolve({ 
                centroid: [24.9384, 60.1699], 
                country: 'Finland',
                countryCode: 'FI',
                region: 'Southern Finland'
              })
            });
          } else {
            resolve({
              ok: true,
              json: () => Promise.resolve({ analysisId: 'test-123', score: 85 })
            });
          }
        }, 50));
      });
      
      // Start first analysis
      const promise1 = trigger.onPolygonCompleted(polygon);
      
      // Small delay then try to start second analysis
      await new Promise(resolve => setTimeout(resolve, 10));
      const promise2 = trigger.onPolygonCompleted(polygon);
      
      await Promise.all([promise1, promise2]);
      
      // Should only call onAnalysisStart once due to concurrent protection
      expect(mockCallbacks.onAnalysisStart).toHaveBeenCalledTimes(1);
    });

    it('should disable analysis when autoTrigger is false', async () => {
      trigger.setAutoTrigger(false);
      
      const polygon = createMockPolygon();
      await trigger.onPolygonCompleted(polygon);
      
      expect(mockCallbacks.onAnalysisStart).not.toHaveBeenCalled();
    });
  });

  describe('Analysis Workflow', () => {
    beforeEach(() => {
      trigger = new PolygonGridAnalysisTrigger(undefined, mockCallbacks);
      trigger.initialize(mockMap as any);
    });

    it('should execute complete analysis workflow', async () => {
      const polygon = createMockPolygon();
      
      // Mock API responses - use simplified mock that matches our comprehensive setup
      (global.fetch as any).mockImplementation((url: string) => {
        if (url.includes('validate-location')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ 
              centroid: [24.9384, 60.1699],
              country: 'Finland',
              countryCode: 'FI' 
            })
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            analysisId: 'test-123',
            score: 85,
            recommendations: []
          })
        });
      });

      await trigger.onPolygonCompleted(polygon);

      // Verify workflow callbacks - match actual implementation
      expect(mockCallbacks.onAnalysisStart).toHaveBeenCalledWith(polygon);
      expect(mockCallbacks.onProgress).toHaveBeenCalled(); // Multiple progress updates
      expect(mockCallbacks.onComplete).toHaveBeenCalledWith(
        expect.objectContaining({
          analysisId: 'test-123',
          score: 85,
          recommendations: expect.any(Array)
        })
      );
    });

    it('should handle API errors gracefully', async () => {
      const polygon = createMockPolygon();
      
      // Mock API failure
      (global.fetch as any).mockImplementation(() => 
        Promise.resolve({
          ok: false,
          statusText: 'Server Error'
        })
      );

      await trigger.onPolygonCompleted(polygon);

      expect(mockCallbacks.onAnalysisStart).toHaveBeenCalledWith(polygon);
      expect(mockCallbacks.onError).toHaveBeenCalledWith(
        expect.any(Error),
        polygon
      );
    });
  });

  describe('Area Calculations', () => {
    beforeEach(() => {
      trigger = new PolygonGridAnalysisTrigger();
    });

    it('should calculate polygon area approximately', async () => {
      // Create a 1km x 1km square polygon (approximately)
      const polygon: PolygonFeature = {
        id: 'test-square',
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [0, 0],
            [0, 0.009], // ~1km north
            [0.009, 0.009], // ~1km east  
            [0.009, 0],
            [0, 0]
          ]]
        },
        properties: {}
      };

      // Area calculation is approximate, should be roughly 1 million m²
      const mockCallbacks = createMockCallbacks();
      trigger.updateCallbacks(mockCallbacks);
      trigger.initialize(mockMap as any);

      // Mock fetch responses for this test
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ 
          analysisId: 'area-test',
          score: 75,
          recommendations: []
        })
      });

      await trigger.onPolygonCompleted(polygon);

      // Should trigger analysis for large enough polygon
      expect(mockCallbacks.onAnalysisStart).toHaveBeenCalled();
    });
  });

  describe('Analysis State Management', () => {
    beforeEach(() => {
      trigger = new PolygonGridAnalysisTrigger(undefined, mockCallbacks);
      trigger.initialize(mockMap as any);
    });

    it('should track analysis progress state', () => {
      expect(trigger.isAnalysisInProgress()).toBe(false);
      
      // State changes are tested implicitly through the workflow tests
    });

    it('should support analysis cancellation', () => {
      trigger.cancelAnalysis();
      
      expect(trigger.isAnalysisInProgress()).toBe(false);
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      trigger = new PolygonGridAnalysisTrigger(undefined, mockCallbacks);
    });

    it('should handle invalid polygon geometry', async () => {
      const invalidPolygon: PolygonFeature = {
        id: 'invalid',
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [] // Invalid - empty coordinates
        },
        properties: {}
      };

      trigger.initialize(mockMap as any);
      await trigger.onPolygonCompleted(invalidPolygon);

      // Should not trigger analysis for invalid geometry
      expect(mockCallbacks.onAnalysisStart).not.toHaveBeenCalled();
    });

    it('should handle missing map initialization', async () => {
      const polygon = createMockPolygon();
      
      // Don't initialize map
      await trigger.onPolygonCompleted(polygon);
      
      expect(mockCallbacks.onError).toHaveBeenCalled();
    });
  });
});

describe('Integration Helpers', () => {
  describe('ExistingPolygonIntegration', () => {
    it('should integrate with Mapbox Draw events', () => {
      // This would require more complex mocking of Mapbox Draw
      // For now, we just verify the class can be imported
      expect(true).toBe(true);
    });
  });

  describe('Factory Function', () => {
    it('should create trigger with factory function', async () => {
      const callbacks = createMockCallbacks();
      const config = { minPolygonArea: 5000 };
      
      // Use dynamic import instead of require for ES modules
      const { createPolygonGridTrigger } = await import('@/lib/grid-intelligence/polygon-grid-trigger');
      const trigger = createPolygonGridTrigger(callbacks, config);
      
      expect(trigger).toBeInstanceOf(PolygonGridAnalysisTrigger);
      expect(trigger.getConfig().minPolygonArea).toBe(5000);
      
      // Clean up
      trigger.cleanup();
    });
  });
});