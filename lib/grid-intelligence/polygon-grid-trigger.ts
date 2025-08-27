/**
 * Polygon-to-Grid Analysis Trigger System
 * Integrates with existing polygon drawing to automatically trigger grid intelligence analysis
 */

import mapboxgl from 'mapbox-gl';
import { PolygonFeature, GridAnalysisResult, AnalysisProgress } from '../types/grid-types';
import { createApiErrorHandler, withTimeout } from '../utils/retry-logic';

export interface GridAnalysisTriggerConfig {
  autoTriggerEnabled: boolean;
  minPolygonArea: number; // Minimum area in square meters to trigger analysis
  analysisTimeout: number; // Timeout in milliseconds
  retryAttempts: number;
}

export interface GridAnalysisCallbacks {
  onAnalysisStart: (polygon: PolygonFeature) => void;
  onProgress: (progress: AnalysisProgress) => void;
  onComplete: (result: GridAnalysisResult) => void;
  onError: (error: Error, polygon: PolygonFeature) => void;
}

export class PolygonGridAnalysisTrigger {
  private config: GridAnalysisTriggerConfig;
  private callbacks: Partial<GridAnalysisCallbacks> = {};
  private analysisInProgress: boolean = false;
  private currentAnalysisId: string | null = null;
  private map: mapboxgl.Map | null = null;
  private errorHandler = createApiErrorHandler('GridAnalysisTrigger');

  constructor(config?: Partial<GridAnalysisTriggerConfig>, callbacks?: Partial<GridAnalysisCallbacks>) {
    // Provide default configuration
    this.config = {
      autoTriggerEnabled: true,
      minPolygonArea: 10000, // 1 hectare minimum
      analysisTimeout: 300000, // 5 minutes
      retryAttempts: 3,
      ...config
    };
    
    this.callbacks = callbacks || {};
  }

  /**
   * Update callbacks after construction (for React component integration)
   */
  public updateCallbacks(callbacks: Partial<GridAnalysisCallbacks>): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  /**
   * Update configuration after construction
   */
  public updateConfig(config: Partial<GridAnalysisTriggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Initialize with map instance
   */
  public initialize(map: mapboxgl.Map): void {
    this.map = map;
    console.log('🗺️ PolygonGridAnalysisTrigger initialized with map');
  }

  /**
   * Cleanup resources
   */
  public cleanup(): void {
    this.map = null;
    this.currentAnalysisId = null;
    this.analysisInProgress = false;
    console.log('🧹 PolygonGridAnalysisTrigger cleaned up');
  }

  /**
   * Validate that the trigger is properly configured
   */
  private validateSetup(): boolean {
    const requiredCallbacks: (keyof GridAnalysisCallbacks)[] = ['onAnalysisStart', 'onProgress', 'onComplete', 'onError'];
    const missingCallbacks = requiredCallbacks.filter(cb => !this.callbacks[cb]);
    
    if (missingCallbacks.length > 0) {
      console.error('PolygonGridAnalysisTrigger: Missing required callbacks:', missingCallbacks);
      return false;
    }
    
    if (!this.map) {
      console.error('PolygonGridAnalysisTrigger: Map not initialized. Call initialize(map) first.');
      return false;
    }
    
    return true;
  }

  /**
   * Get current configuration
   */
  public getConfig(): GridAnalysisTriggerConfig {
    return { ...this.config };
  }

  /**
   * Main method to be called when polygon drawing is completed
   * Integrates with existing polygon completion events
   */
  public async onPolygonCompleted(polygon: PolygonFeature): Promise<void> {
    console.log('🎯 Polygon completed, evaluating grid analysis trigger...', {
      area: this.calculatePolygonArea(polygon),
      autoTrigger: this.config.autoTriggerEnabled
    });

    // Validate setup before proceeding
    if (!this.validateSetup()) {
      const error = new Error('PolygonGridAnalysisTrigger not properly configured. Call initialize() and updateCallbacks() first.');
      console.error('❌ Setup validation failed:', error.message);
      this.callbacks.onError?.(error, polygon);
      return;
    }

    // Validate polygon for analysis
    if (!this.shouldTriggerAnalysis(polygon)) {
      console.log('⏭️ Polygon does not meet criteria for grid analysis');
      return;
    }

    // Check if analysis already in progress
    if (this.analysisInProgress) {
      console.log('⏳ Grid analysis already in progress, skipping trigger');
      return;
    }

    try {
      await this.triggerGridAnalysis(polygon);
    } catch (error) {
      console.error('❌ Error triggering grid analysis:', error);
      this.callbacks.onError?.(error as Error, polygon);
    }
  }

  /**
   * Determine if polygon meets criteria for grid analysis
   */
  private shouldTriggerAnalysis(polygon: PolygonFeature): boolean {
    // Check if auto-trigger is enabled
    if (!this.config.autoTriggerEnabled) {
      return false;
    }

    // Check minimum area requirement
    const area = this.calculatePolygonArea(polygon);
    if (area < this.config.minPolygonArea) {
      console.log(`⚠️ Polygon area (${area}m²) below minimum (${this.config.minPolygonArea}m²)`);
      return false;
    }

    // Check if polygon has valid coordinates
    if (!polygon.geometry || !polygon.geometry.coordinates || polygon.geometry.coordinates.length === 0) {
      console.log('⚠️ Invalid polygon geometry');
      return false;
    }

    return true;
  }

  /**
   * Calculate polygon area in square meters
   */
  private calculatePolygonArea(polygon: PolygonFeature): number {
    if (!polygon.geometry?.coordinates?.[0]) return 0;

    const coordinates = polygon.geometry.coordinates[0];
    let area = 0;

    // Shoelace formula for polygon area (approximate for small areas)
    for (let i = 0; i < coordinates.length - 1; i++) {
      const [x1, y1] = coordinates[i];
      const [x2, y2] = coordinates[i + 1];
      area += (x1 * y2 - x2 * y1);
    }

    area = Math.abs(area) / 2;
    
    // Convert from degrees to approximate square meters (rough conversion)
    // More precise conversion would use proper geodesic calculations
    const metersPerDegree = 111320; // Approximate meters per degree at equator
    return area * metersPerDegree * metersPerDegree;
  }

  /**
   * Trigger grid intelligence analysis for the polygon
   */
  private async triggerGridAnalysis(polygon: PolygonFeature): Promise<void> {
    this.analysisInProgress = true;
    this.currentAnalysisId = this.generateAnalysisId();

    console.log('🚀 Starting grid intelligence analysis...', {
      analysisId: this.currentAnalysisId,
      polygon: polygon.geometry
    });

    // Notify analysis start
    this.callbacks.onAnalysisStart?.(polygon);

    try {
      // Step 1: Location Validation
      await this.updateProgress('Validating location...', 10);
      const locationInfo = await this.validateLocation(polygon);

      // Step 2: TSO Identification  
      await this.updateProgress('Identifying relevant TSOs...', 25);
      const tsoInfo = await this.identifyTSOs(locationInfo);

      // Step 3: Grid Data Collection
      await this.updateProgress('Collecting grid infrastructure data...', 50);
      const gridData = await this.collectGridData(tsoInfo, polygon);

      // Step 4: Analysis Processing
      await this.updateProgress('Processing grid intelligence...', 75);
      const analysisResult = await this.processGridAnalysis(gridData, polygon);

      // Step 5: Completion
      await this.updateProgress('Analysis complete!', 100);
      
      console.log('✅ Grid analysis completed successfully', {
        analysisId: this.currentAnalysisId,
        result: analysisResult
      });

      this.callbacks.onComplete?.(analysisResult);

    } catch (error) {
      console.error('❌ Grid analysis failed:', error);
      throw error;
    } finally {
      this.analysisInProgress = false;
      this.currentAnalysisId = null;
    }
  }

  /**
   * Update analysis progress
   */
  private async updateProgress(message: string, percentage: number): Promise<void> {
    const progress: AnalysisProgress = {
      analysisId: this.currentAnalysisId!,
      stage: message,
      percentage,
      timestamp: new Date().toISOString()
    };

    console.log(`📊 Progress: ${percentage}% - ${message}`);
    this.callbacks.onProgress?.(progress);

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  /**
   * Validate polygon location and extract geographic information with retry logic
   */
  private async validateLocation(polygon: PolygonFeature): Promise<any> {
    // Extract centroid of polygon
    const centroid = this.calculateCentroid(polygon);
    
    // Call location validation service with retry and timeout
    return this.errorHandler.withTimeoutAndRetry(async () => {
      const response = await fetch('/api/grid-intelligence/validate-location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coordinates: centroid,
          polygon: polygon.geometry
        })
      });

      if (!response.ok) {
        const error = new Error(`Location validation failed: ${response.statusText}`);
        (error as any).status = response.status;
        throw error;
      }

      return await response.json();
    }, 15000); // 15 second timeout
  }

  /**
   * Identify relevant TSOs based on location with retry logic
   */
  private async identifyTSOs(locationInfo: any): Promise<any> {
    return this.errorHandler.withTimeoutAndRetry(async () => {
      const response = await fetch('/api/grid-intelligence/identify-tsos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(locationInfo)
      });

      if (!response.ok) {
        const error = new Error(`TSO identification failed: ${response.statusText}`);
        (error as any).status = response.status;
        throw error;
      }

      return await response.json();
    }, 20000); // 20 second timeout for TSO data
  }

  /**
   * Collect grid data from relevant sources with retry logic
   */
  private async collectGridData(tsoInfo: any, polygon: PolygonFeature): Promise<any> {
    return this.errorHandler.withTimeoutAndRetry(async () => {
      const response = await fetch('/api/grid-intelligence/collect-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tsos: tsoInfo,
          polygon: polygon.geometry,
          analysisId: this.currentAnalysisId
        })
      });

      if (!response.ok) {
        const error = new Error(`Grid data collection failed: ${response.statusText}`);
        (error as any).status = response.status;
        throw error;
      }

      return await response.json();
    }, 45000); // 45 second timeout for data collection
  }

  /**
   * Process grid analysis and generate results with retry logic
   */
  private async processGridAnalysis(gridData: any, polygon: PolygonFeature): Promise<GridAnalysisResult> {
    return this.errorHandler.withTimeoutAndRetry(async () => {
      const response = await fetch('/api/grid-intelligence/process-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gridData,
          polygon: polygon.geometry,
          analysisId: this.currentAnalysisId
        })
      });

      if (!response.ok) {
        const error = new Error(`Grid analysis processing failed: ${response.statusText}`);
        (error as any).status = response.status;
        throw error;
      }

      return await response.json();
    }, 60000); // 60 second timeout for analysis processing
  }

  /**
   * Calculate centroid of polygon
   */
  private calculateCentroid(polygon: PolygonFeature): [number, number] {
    if (!polygon.geometry?.coordinates?.[0]) {
      throw new Error('Invalid polygon geometry for centroid calculation');
    }

    const coordinates = polygon.geometry.coordinates[0];
    let x = 0, y = 0;

    for (const [lng, lat] of coordinates) {
      x += lng;
      y += lat;
    }

    return [x / coordinates.length, y / coordinates.length];
  }

  /**
   * Generate unique analysis ID
   */
  private generateAnalysisId(): string {
    return `grid-analysis-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  }

  /**
   * Enable/disable auto-trigger functionality
   */
  public setAutoTrigger(enabled: boolean): void {
    this.config.autoTriggerEnabled = enabled;
    console.log(`🔄 Auto-trigger ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Check if analysis is currently in progress
   */
  public isAnalysisInProgress(): boolean {
    return this.analysisInProgress;
  }

  /**
   * Cancel ongoing analysis
   */
  public cancelAnalysis(): void {
    if (this.analysisInProgress && this.currentAnalysisId) {
      console.log('🛑 Cancelling grid analysis:', this.currentAnalysisId);
      this.analysisInProgress = false;
      this.currentAnalysisId = null;
      
      // Call cancel API if needed
      fetch(`/api/grid-intelligence/cancel/${this.currentAnalysisId}`, {
        method: 'POST'
      }).catch(error => {
        console.warn('Failed to cancel analysis on server:', error);
      });
    }
  }
}

/**
 * Factory function to create and configure the trigger system
 */
export function createPolygonGridTrigger(
  callbacks: GridAnalysisCallbacks,
  config?: Partial<GridAnalysisTriggerConfig>
): PolygonGridAnalysisTrigger {
  
  const defaultConfig: GridAnalysisTriggerConfig = {
    autoTriggerEnabled: true,
    minPolygonArea: 10000, // 10,000 m² minimum (1 hectare)
    analysisTimeout: 120000, // 2 minutes
    retryAttempts: 3
  };

  const finalConfig = { ...defaultConfig, ...config };

  return new PolygonGridAnalysisTrigger(finalConfig, callbacks);
}

/**
 * Integration helper for existing polygon drawing systems
 */
export class ExistingPolygonIntegration {
  private trigger: PolygonGridAnalysisTrigger;

  constructor(trigger: PolygonGridAnalysisTrigger) {
    this.trigger = trigger;
  }

  /**
   * Integrate with Mapbox GL JS draw events
   */
  public integrateWithMapboxDraw(map: any, draw: any): void {
    map.on('draw.create', (e: any) => {
      const feature = e.features[0];
      if (feature.geometry.type === 'Polygon') {
        this.trigger.onPolygonCompleted(feature as PolygonFeature);
      }
    });

    map.on('draw.update', (e: any) => {
      const feature = e.features[0]; 
      if (feature.geometry.type === 'Polygon') {
        this.trigger.onPolygonCompleted(feature as PolygonFeature);
      }
    });
  }

  /**
   * Integrate with ArcGIS draw events
   */
  public integrateWithArcGISDraw(mapView: any): void {
    // ArcGIS integration would go here
    console.log('🗺️ ArcGIS integration ready for implementation');
  }

  /**
   * Integrate with custom polygon drawing systems
   */
  public integrateWithCustomDraw(
    onPolygonCreate: (callback: (polygon: PolygonFeature) => void) => void,
    onPolygonUpdate: (callback: (polygon: PolygonFeature) => void) => void
  ): void {
    onPolygonCreate((polygon: PolygonFeature) => {
      this.trigger.onPolygonCompleted(polygon);
    });

    onPolygonUpdate((polygon: PolygonFeature) => {
      this.trigger.onPolygonCompleted(polygon);
    });
  }
}