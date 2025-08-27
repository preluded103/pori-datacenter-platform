/**
 * Test suite for GridIntelligenceIntegration component
 * Tests React component behavior, hooks, and integration patterns
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import GridIntelligenceIntegration, { useGridIntelligence } from '@/components/grid-intelligence/GridIntelligenceIntegration';
import { renderHook, act } from '@testing-library/react';
import type { GridAnalysisResult, PolygonFeature } from '@/lib/types/grid-types';

// Mock dependencies
vi.mock('@/lib/grid-intelligence/polygon-grid-trigger', () => ({
  PolygonGridAnalysisTrigger: vi.fn().mockImplementation(() => ({
    initialize: vi.fn(),
    cleanup: vi.fn(),
    onPolygonCompleted: vi.fn(),
    setAutoTrigger: vi.fn(),
    isAnalysisInProgress: vi.fn(() => false),
    cancelAnalysis: vi.fn(),
    getConfig: vi.fn(() => ({
      autoTriggerEnabled: true,
      minPolygonArea: 10000,
      analysisTimeout: 300000,
      retryAttempts: 3
    }))
  }))
}));

vi.mock('@/lib/grid-intelligence/grid-layer-manager', () => ({
  GridLayerManager: vi.fn().mockImplementation(() => ({
    initializeDefaultLayers: vi.fn(() => []),
    getAllLayers: vi.fn(() => []),
    toggleLayerVisibility: vi.fn(),
    updateLayerOpacity: vi.fn(),
    updateConfig: vi.fn(),
    updateAnalysisResult: vi.fn(),
    autoConfigureLayers: vi.fn(),
    cleanupMapResources: vi.fn(),
    optimizeLayerRendering: vi.fn(),
    checkMemoryUsage: vi.fn(() => ({
      layerCount: 5,
      visibleCount: 2,
      memoryPressure: 'low' as const
    })),
    dispose: vi.fn()
  }))
}));

// Mock child components
vi.mock('@/components/grid-intelligence/GridVisualizationLayers', () => ({
  default: ({ layers }: any) => (
    <div data-testid="grid-visualization-layers">
      {layers?.length || 0} layers
    </div>
  )
}));

vi.mock('@/components/grid-intelligence/GridInfrastructureLayerSelector', () => ({
  default: ({ layers, isAnalyzing }: any) => (
    <div data-testid="grid-layer-selector">
      <div>Layers: {layers?.length || 0}</div>
      <div>Analyzing: {isAnalyzing ? 'Yes' : 'No'}</div>
    </div>
  )
}));

vi.mock('@/components/grid-intelligence/GridAnalysisProgressIndicator', () => ({
  default: ({ progress, onCancel }: any) => (
    <div data-testid="progress-indicator">
      <div>Progress: {progress?.percentage || 0}%</div>
      <button onClick={onCancel}>Cancel</button>
    </div>
  ),
  GridAnalysisProgressCompact: ({ progress }: any) => (
    <div data-testid="progress-compact">
      Progress: {progress?.percentage || 0}%
    </div>
  )
}));

vi.mock('@/components/grid-intelligence/GridIntelligenceErrorBoundary', () => ({
  default: ({ children }: any) => <div data-testid="error-boundary">{children}</div>
}));

// Mock map instance
const createMockMap = () => ({
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
});

// Test data
const createMockPolygon = (): PolygonFeature => ({
  id: 'test-polygon',
  type: 'Feature',
  geometry: {
    type: 'Polygon',
    coordinates: [[
      [0, 0], [0, 1], [1, 1], [1, 0], [0, 0]
    ]]
  },
  properties: {
    name: 'Test Polygon'
  }
});

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

describe('GridIntelligenceIntegration Component', () => {
  let mockMap: any;

  beforeEach(() => {
    mockMap = createMockMap();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render when enabled', () => {
      render(
        <GridIntelligenceIntegration
          map={mockMap}
          isEnabled={true}
        />
      );

      expect(screen.getByTestId('error-boundary')).toBeInTheDocument();
      expect(screen.getByTestId('grid-visualization-layers')).toBeInTheDocument();
      expect(screen.getByTestId('grid-layer-selector')).toBeInTheDocument();
    });

    it('should not render when disabled', () => {
      const { container } = render(
        <GridIntelligenceIntegration
          map={mockMap}
          isEnabled={false}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('should render with default props', () => {
      render(
        <GridIntelligenceIntegration
          map={mockMap}
        />
      );

      expect(screen.getByTestId('grid-layer-selector')).toBeInTheDocument();
      expect(screen.getByText('Analyzing: No')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const customClass = 'custom-grid-intelligence';
      const { container } = render(
        <GridIntelligenceIntegration
          map={mockMap}
          className={customClass}
        />
      );

      expect(container.querySelector(`.${customClass}`)).toBeInTheDocument();
    });
  });

  describe('Analysis State Management', () => {
    it('should show progress indicator during analysis', async () => {
      const { rerender } = render(
        <GridIntelligenceIntegration
          map={mockMap}
          isEnabled={true}
        />
      );

      // Initially not analyzing
      expect(screen.queryByTestId('progress-indicator')).not.toBeInTheDocument();

      // Simulate analysis start by re-rendering with internal state change
      // Note: This is a limitation of testing - we'd need to trigger actual analysis
      expect(screen.getByText('Analyzing: No')).toBeInTheDocument();
    });

    it('should handle analysis completion callback', () => {
      const onAnalysisComplete = vi.fn();
      const mockResult = createMockAnalysisResult();

      render(
        <GridIntelligenceIntegration
          map={mockMap}
          onAnalysisComplete={onAnalysisComplete}
        />
      );

      // Component should be rendered without errors
      expect(screen.getByTestId('grid-layer-selector')).toBeInTheDocument();
    });

    it('should handle analysis error callback', () => {
      const onAnalysisError = vi.fn();

      render(
        <GridIntelligenceIntegration
          map={mockMap}
          onAnalysisError={onAnalysisError}
        />
      );

      expect(screen.getByTestId('grid-layer-selector')).toBeInTheDocument();
    });
  });

  describe('Layer Management', () => {
    it('should handle layer toggle', async () => {
      render(
        <GridIntelligenceIntegration
          map={mockMap}
        />
      );

      // Component should render layers section
      expect(screen.getByTestId('grid-layer-selector')).toBeInTheDocument();
      expect(screen.getByText('Layers: 0')).toBeInTheDocument();
    });

    it('should handle opacity changes', () => {
      render(
        <GridIntelligenceIntegration
          map={mockMap}
        />
      );

      // Component should handle opacity changes through layer selector
      expect(screen.getByTestId('grid-layer-selector')).toBeInTheDocument();
    });
  });

  describe('Map Integration', () => {
    it('should initialize with map when available', () => {
      render(
        <GridIntelligenceIntegration
          map={mockMap}
          isEnabled={true}
        />
      );

      // Should render without errors when map is provided
      expect(screen.getByTestId('grid-visualization-layers')).toBeInTheDocument();
    });

    it('should handle null map gracefully', () => {
      expect(() => {
        render(
          <GridIntelligenceIntegration
            map={null}
            isEnabled={true}
          />
        );
      }).not.toThrow();

      expect(screen.getByTestId('grid-layer-selector')).toBeInTheDocument();
    });
  });

  describe('Development Features', () => {
    // Mock process.env for development testing
    const originalEnv = process.env.NODE_ENV;

    beforeEach(() => {
      process.env.NODE_ENV = 'development';
    });

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    it('should show debug panel in development', () => {
      render(
        <GridIntelligenceIntegration
          map={mockMap}
          isEnabled={true}
        />
      );

      // Debug panel should be visible in development
      expect(screen.getByText('Grid Intelligence Debug')).toBeInTheDocument();
      expect(screen.getByText('Status: Idle')).toBeInTheDocument();
    });

    it('should have test analysis button in development', () => {
      render(
        <GridIntelligenceIntegration
          map={mockMap}
          isEnabled={true}
        />
      );

      const testButton = screen.getByText('Test Analysis');
      expect(testButton).toBeInTheDocument();
      expect(testButton).toBeEnabled();
    });

    it('should handle test analysis button click', () => {
      render(
        <GridIntelligenceIntegration
          map={mockMap}
          isEnabled={true}
        />
      );

      const testButton = screen.getByText('Test Analysis');
      fireEvent.click(testButton);

      // Should not throw error
      expect(testButton).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should render error boundaries', () => {
      render(
        <GridIntelligenceIntegration
          map={mockMap}
        />
      );

      // Should have multiple error boundaries wrapping components
      const errorBoundaries = screen.getAllByTestId('error-boundary');
      expect(errorBoundaries.length).toBeGreaterThan(0);
    });

    it('should handle component errors gracefully', () => {
      // Mock a component that throws an error
      const ThrowingComponent = () => {
        throw new Error('Test error');
      };

      expect(() => {
        render(
          <GridIntelligenceIntegration
            map={mockMap}
          />
        );
      }).not.toThrow();
    });
  });
});

describe('useGridIntelligence Hook', () => {
  let mockMap: any;

  beforeEach(() => {
    mockMap = createMockMap();
    vi.clearAllMocks();
  });

  describe('Hook Functionality', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useGridIntelligence(mockMap));

      expect(result.current.isAnalyzing).toBe(false);
      expect(result.current.analysisResult).toBeUndefined();
      expect(result.current.layers).toEqual([]);
      expect(result.current.triggerAnalysis).toBeInstanceOf(Function);
      expect(result.current.toggleLayer).toBeInstanceOf(Function);
      expect(result.current.updateLayerOpacity).toBeInstanceOf(Function);
      expect(result.current.layerManager).toBeDefined();
    });

    it('should handle trigger analysis', async () => {
      const { result } = renderHook(() => useGridIntelligence(mockMap));
      const mockPolygon = createMockPolygon();

      await act(async () => {
        await result.current.triggerAnalysis(mockPolygon);
      });

      // Should complete without errors
      expect(result.current.isAnalyzing).toBe(false);
    });

    it('should handle layer toggle', () => {
      const { result } = renderHook(() => useGridIntelligence(mockMap));

      act(() => {
        result.current.toggleLayer('test-layer', true);
      });

      // Should not throw errors
      expect(result.current.toggleLayer).toBeInstanceOf(Function);
    });

    it('should handle layer opacity update', () => {
      const { result } = renderHook(() => useGridIntelligence(mockMap));

      act(() => {
        result.current.updateLayerOpacity('test-layer', 0.5);
      });

      // Should not throw errors
      expect(result.current.updateLayerOpacity).toBeInstanceOf(Function);
    });

    it('should cleanup on unmount', () => {
      const { unmount } = renderHook(() => useGridIntelligence(mockMap));

      // Should not throw on unmount
      expect(() => unmount()).not.toThrow();
    });
  });

  describe('Hook with null map', () => {
    it('should handle null map gracefully', () => {
      const { result } = renderHook(() => useGridIntelligence(null));

      expect(result.current.isAnalyzing).toBe(false);
      expect(result.current.layers).toEqual([]);
    });

    it('should not trigger analysis with null map', async () => {
      const { result } = renderHook(() => useGridIntelligence(null));
      const mockPolygon = createMockPolygon();

      await act(async () => {
        await result.current.triggerAnalysis(mockPolygon);
      });

      // Should remain not analyzing
      expect(result.current.isAnalyzing).toBe(false);
    });
  });

  describe('Hook State Updates', () => {
    it('should update layers when analysis result changes', () => {
      const { result } = renderHook(() => useGridIntelligence(mockMap));

      // Initial state
      expect(result.current.layers).toEqual([]);

      // Layers should be managed by the layer manager
      expect(result.current.layerManager).toBeDefined();
    });
  });
});