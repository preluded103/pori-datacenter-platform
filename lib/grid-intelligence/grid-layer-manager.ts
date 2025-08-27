/**
 * Grid Layer Manager
 * Manages grid intelligence visualization layers and their configurations
 */

import { GridAnalysisResult, GridVisualizationLayer, GridInfrastructureLayerConfig } from '@/lib/types/grid-types';

export class GridLayerManager {
  private layers: Map<string, GridVisualizationLayer> = new Map();
  private config: GridInfrastructureLayerConfig = {};
  private analysisResult: GridAnalysisResult | null = null;
  private mapSourceIds: Set<string> = new Set();
  private mapLayerIds: Set<string> = new Set();
  private cleanupCallbacks: (() => void)[] = [];

  /**
   * Initialize default grid layers
   */
  public initializeDefaultLayers(): GridVisualizationLayer[] {
    const defaultLayers: GridVisualizationLayer[] = [
      {
        id: 'grid-capacity-heatmap',
        name: 'Grid Capacity Heat Map',
        type: 'capacity',
        visible: false,
        opacity: 0.8,
        description: 'Available grid capacity visualization',
        dataSource: 'analysis'
      },
      {
        id: 'transmission-400kv',
        name: '400kV Transmission Lines',
        type: 'transmission',
        visible: false,
        opacity: 0.9,
        description: 'High voltage transmission infrastructure',
        dataSource: 'tso'
      },
      {
        id: 'transmission-220kv',
        name: '220kV Transmission Lines', 
        type: 'transmission',
        visible: false,
        opacity: 0.8,
        description: 'Medium voltage transmission lines',
        dataSource: 'tso'
      },
      {
        id: 'substations-primary',
        name: 'Primary Substations',
        type: 'substations',
        visible: false,
        opacity: 0.9,
        description: 'Major grid connection points',
        dataSource: 'tso'
      },
      {
        id: 'connection-opportunities',
        name: 'Connection Opportunities',
        type: 'opportunities',
        visible: false,
        opacity: 0.8,
        description: 'Viable connection points for datacenter',
        dataSource: 'analysis'
      },
      {
        id: 'grid-constraints',
        name: 'Grid Constraints',
        type: 'constraints',
        visible: false,
        opacity: 0.6,
        description: 'Grid limitations and restricted areas',
        dataSource: 'analysis'
      }
    ];

    // Store in internal map
    defaultLayers.forEach(layer => {
      this.layers.set(layer.id, layer);
    });

    return defaultLayers;
  }

  /**
   * Update analysis result and refresh affected layers
   */
  public updateAnalysisResult(result: GridAnalysisResult): void {
    this.analysisResult = result;
    
    // Enable analysis-based layers that have data
    this.layers.forEach(layer => {
      if (layer.dataSource === 'analysis') {
        layer.hasData = this.hasDataForLayer(layer.type);
      }
    });
  }

  /**
   * Toggle layer visibility
   */
  public toggleLayerVisibility(layerId: string, visible: boolean): GridVisualizationLayer | null {
    const layer = this.layers.get(layerId);
    if (!layer) return null;

    layer.visible = visible;
    this.layers.set(layerId, layer);
    
    return layer;
  }

  /**
   * Update layer opacity
   */
  public updateLayerOpacity(layerId: string, opacity: number): GridVisualizationLayer | null {
    const layer = this.layers.get(layerId);
    if (!layer) return null;

    layer.opacity = Math.max(0, Math.min(1, opacity));
    this.layers.set(layerId, layer);
    
    return layer;
  }

  /**
   * Get all layers
   */
  public getAllLayers(): GridVisualizationLayer[] {
    return Array.from(this.layers.values());
  }

  /**
   * Get layers by type
   */
  public getLayersByType(type: string): GridVisualizationLayer[] {
    return Array.from(this.layers.values()).filter(layer => layer.type === type);
  }

  /**
   * Get visible layers
   */
  public getVisibleLayers(): GridVisualizationLayer[] {
    return Array.from(this.layers.values()).filter(layer => layer.visible);
  }

  /**
   * Get layer by ID
   */
  public getLayerById(layerId: string): GridVisualizationLayer | undefined {
    return this.layers.get(layerId);
  }

  /**
   * Update layer configuration
   */
  public updateConfig(newConfig: Partial<GridInfrastructureLayerConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Apply configuration changes to relevant layers
    this.applyConfigToLayers();
  }

  /**
   * Get current configuration
   */
  public getConfig(): GridInfrastructureLayerConfig {
    return { ...this.config };
  }

  /**
   * Add custom layer
   */
  public addLayer(layer: GridVisualizationLayer): void {
    this.layers.set(layer.id, layer);
  }

  /**
   * Remove layer
   */
  public removeLayer(layerId: string): boolean {
    return this.layers.delete(layerId);
  }

  /**
   * Check if layer has data available
   */
  private hasDataForLayer(layerType: string): boolean {
    if (!this.analysisResult) return false;

    switch (layerType) {
      case 'capacity':
        return !!(this.analysisResult.capacityAnalysis?.gridPoints?.length);
      
      case 'transmission':
        return !!(this.analysisResult.transmissionLines?.lines?.length);
      
      case 'substations':
        return !!(this.analysisResult.substations?.substations?.length);
      
      case 'opportunities':
        return !!(this.analysisResult.connectionOpportunities?.opportunities?.length);
      
      case 'constraints':
        return !!(this.analysisResult.constraints?.constraints?.length);
      
      default:
        return false;
    }
  }

  /**
   * Apply configuration changes to layers
   */
  private applyConfigToLayers(): void {
    this.layers.forEach(layer => {
      // Apply capacity analysis config
      if (layer.type === 'capacity' && this.config.capacityAnalysis) {
        // Update heatmap intensity, color scheme, etc.
        layer.style = {
          ...layer.style,
          heatmapIntensity: this.config.capacityAnalysis.heatmapIntensity
        };
      }

      // Apply substations config
      if (layer.type === 'substations' && this.config.substations) {
        layer.showLabels = this.config.substations.showLabels;
        layer.style = {
          ...layer.style,
          iconSizeByCapacity: this.config.substations.iconSizeByCapacity
        };
      }

      // Apply transmission config
      if (layer.type === 'transmission' && this.config.transmissionLines) {
        layer.style = {
          ...layer.style,
          colorByVoltage: this.config.transmissionLines.colorByVoltage,
          showCapacityLabels: this.config.transmissionLines.showCapacityLabels
        };
      }
    });
  }

  /**
   * Generate layer presets for common scenarios
   */
  public generateLayerPresets(): Record<string, string[]> {
    return {
      'datacenter-overview': [
        'grid-capacity-heatmap',
        'transmission-400kv',
        'substations-primary',
        'connection-opportunities'
      ],
      'detailed-analysis': [
        'grid-capacity-heatmap',
        'transmission-400kv',
        'transmission-220kv',
        'substations-primary',
        'connection-opportunities',
        'grid-constraints'
      ],
      'connection-focus': [
        'substations-primary',
        'connection-opportunities',
        'transmission-400kv'
      ],
      'constraint-analysis': [
        'grid-constraints',
        'grid-capacity-heatmap',
        'transmission-400kv'
      ]
    };
  }

  /**
   * Apply layer preset
   */
  public applyLayerPreset(presetName: string): void {
    const presets = this.generateLayerPresets();
    const layerIds = presets[presetName];
    
    if (!layerIds) return;

    // Hide all layers first
    this.layers.forEach(layer => {
      layer.visible = false;
    });

    // Show preset layers
    layerIds.forEach(layerId => {
      const layer = this.layers.get(layerId);
      if (layer) {
        layer.visible = true;
      }
    });
  }

  /**
   * Get layer statistics
   */
  public getLayerStatistics(): {
    total: number;
    visible: number;
    withData: number;
    byType: Record<string, number>;
  } {
    const layers = this.getAllLayers();
    
    const stats = {
      total: layers.length,
      visible: layers.filter(l => l.visible).length,
      withData: layers.filter(l => l.hasData).length,
      byType: {} as Record<string, number>
    };

    layers.forEach(layer => {
      stats.byType[layer.type] = (stats.byType[layer.type] || 0) + 1;
    });

    return stats;
  }

  /**
   * Export layer configuration for saving/sharing
   */
  public exportConfiguration(): {
    layers: GridVisualizationLayer[];
    config: GridInfrastructureLayerConfig;
  } {
    return {
      layers: this.getAllLayers(),
      config: this.getConfig()
    };
  }

  /**
   * Import layer configuration
   */
  public importConfiguration(data: {
    layers: GridVisualizationLayer[];
    config: GridInfrastructureLayerConfig;
  }): void {
    // Clear existing layers
    this.layers.clear();

    // Import layers
    data.layers.forEach(layer => {
      this.layers.set(layer.id, layer);
    });

    // Import config
    this.config = data.config;
  }

  /**
   * Get recommended layers based on analysis result
   */
  public getRecommendedLayers(): string[] {
    if (!this.analysisResult) {
      return ['grid-capacity-heatmap', 'substations-primary'];
    }

    const recommendations: string[] = [];

    // Always recommend capacity if available
    if (this.hasDataForLayer('capacity')) {
      recommendations.push('grid-capacity-heatmap');
    }

    // Recommend substations if available
    if (this.hasDataForLayer('substations')) {
      recommendations.push('substations-primary');
    }

    // Recommend transmission lines based on analysis scope
    if (this.hasDataForLayer('transmission')) {
      recommendations.push('transmission-400kv');
      
      // Add 220kV if we have detailed data
      if (this.analysisResult.transmissionLines?.lines?.length && 
          this.analysisResult.transmissionLines.lines.length > 5) {
        recommendations.push('transmission-220kv');
      }
    }

    // Recommend opportunities if analysis is complete
    if (this.hasDataForLayer('opportunities')) {
      recommendations.push('connection-opportunities');
    }

    // Recommend constraints if there are significant issues
    if (this.hasDataForLayer('constraints') && 
        this.analysisResult.constraints?.constraints?.length && 
        this.analysisResult.constraints.constraints.length > 0) {
      recommendations.push('grid-constraints');
    }

    return recommendations;
  }

  /**
   * Auto-configure layers based on analysis result
   */
  public autoConfigureLayers(): void {
    const recommended = this.getRecommendedLayers();
    
    // Hide all layers first
    this.layers.forEach(layer => {
      layer.visible = false;
    });

    // Show recommended layers
    recommended.forEach(layerId => {
      const layer = this.layers.get(layerId);
      if (layer) {
        layer.visible = true;
      }
    });
  }

  /**
   * Register map source for cleanup tracking
   */
  public registerMapSource(sourceId: string): void {
    this.mapSourceIds.add(sourceId);
  }

  /**
   * Register map layer for cleanup tracking  
   */
  public registerMapLayer(layerId: string): void {
    this.mapLayerIds.add(layerId);
  }

  /**
   * Add cleanup callback
   */
  public addCleanupCallback(callback: () => void): void {
    this.cleanupCallbacks.push(callback);
  }

  /**
   * Remove map sources and layers for memory management
   */
  public cleanupMapResources(map: any): void {
    // Remove map layers
    this.mapLayerIds.forEach(layerId => {
      try {
        if (map.getLayer(layerId)) {
          map.removeLayer(layerId);
        }
      } catch (error) {
        console.warn(`Failed to remove layer ${layerId}:`, error);
      }
    });

    // Remove map sources  
    this.mapSourceIds.forEach(sourceId => {
      try {
        if (map.getSource(sourceId)) {
          map.removeSource(sourceId);
        }
      } catch (error) {
        console.warn(`Failed to remove source ${sourceId}:`, error);
      }
    });

    // Execute cleanup callbacks
    this.cleanupCallbacks.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.warn('Cleanup callback failed:', error);
      }
    });

    // Clear tracking sets
    this.mapSourceIds.clear();
    this.mapLayerIds.clear();
    this.cleanupCallbacks = [];

    console.log('✅ Grid layer resources cleaned up');
  }

  /**
   * Optimize layer rendering for performance
   */
  public optimizeLayerRendering(): void {
    let visibleLayerCount = 0;
    
    this.layers.forEach(layer => {
      if (layer.visible) {
        visibleLayerCount++;
        
        // Reduce opacity for performance if too many layers visible
        if (visibleLayerCount > 5) {
          layer.opacity = Math.max(0.3, layer.opacity - 0.1);
        }
        
        // Disable expensive effects for performance
        if (visibleLayerCount > 8) {
          layer.style = { 
            ...layer.style, 
            blur: 0, 
            haloWidth: 0 
          };
        }
      }
    });

    if (visibleLayerCount > 10) {
      console.warn('⚠️ Too many layers visible - performance may be impacted');
    }
  }

  /**
   * Check memory usage and clean up if needed
   */
  public checkMemoryUsage(): { 
    layerCount: number; 
    visibleCount: number; 
    memoryPressure: 'low' | 'medium' | 'high' 
  } {
    const layerCount = this.layers.size;
    const visibleCount = Array.from(this.layers.values()).filter(l => l.visible).length;
    
    let memoryPressure: 'low' | 'medium' | 'high' = 'low';
    
    if (layerCount > 50) memoryPressure = 'high';
    else if (layerCount > 20) memoryPressure = 'medium';
    
    if (visibleCount > 10) memoryPressure = 'high';
    else if (visibleCount > 5) memoryPressure = 'medium';

    return { layerCount, visibleCount, memoryPressure };
  }

  /**
   * Dispose of all resources
   */
  public dispose(): void {
    this.layers.clear();
    this.config = {};
    this.analysisResult = null;
    this.mapSourceIds.clear();
    this.mapLayerIds.clear();
    this.cleanupCallbacks = [];
    
    console.log('🗑️ GridLayerManager disposed');
  }
}