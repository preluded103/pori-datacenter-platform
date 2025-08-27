/**
 * Type definitions for Grid Intelligence System integration
 */

export interface PolygonFeature {
  id: string;
  type: 'Feature';
  geometry: {
    type: 'Polygon';
    coordinates: number[][][]; // [[[lng, lat], [lng, lat], ...]]
  };
  properties?: {
    name?: string;
    description?: string;
    [key: string]: any;
  };
}

export interface LocationInfo {
  centroid: [number, number]; // [longitude, latitude]
  country: string;
  countryCode: string;
  region?: string;
  administrativeArea?: string;
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
}

export interface TSO {
  name: string;
  country: string;
  countryCode: string;
  eicCode: string; // Energy Identification Code
  apiEndpoints?: {
    capacity?: string;
    generation?: string;
    transmission?: string;
    [key: string]: string | undefined;
  };
  contactInfo?: {
    website?: string;
    email?: string;
    phone?: string;
  };
  gridVoltageLevel?: string[]; // e.g., ['400kV', '132kV']
  relevanceScore?: number; // 0-100
}

export interface GridCapacityData {
  locationId: string;
  substationName?: string;
  coordinates: [number, number];
  capacityMW: number;
  availableCapacityMW?: number;
  voltageLevel: string;
  connectionType: 'transmission' | 'distribution';
  distanceFromSite: number; // meters
  connectionFeasibility: 'high' | 'medium' | 'low';
}

export interface GridConstraint {
  type: 'thermal' | 'voltage' | 'stability' | 'congestion';
  severity: 'high' | 'medium' | 'low';
  description: string;
  location?: [number, number];
  affectedArea?: PolygonFeature;
  mitigationOptions?: string[];
}

export interface ConnectionOpportunity {
  id: string;
  substationName: string;
  coordinates: [number, number];
  availableCapacityMW: number;
  voltageLevel: string;
  distanceFromSiteKm: number;
  estimatedConnectionCost?: number;
  timelineMonths?: number;
  requirements: string[];
  tsoContact: TSO;
  feasibilityScore: number; // 0-100
}

export interface GridAnalysisResult {
  analysisId: string;
  timestamp: string;
  location: LocationInfo;
  tsos: TSO[];
  
  // Grid Infrastructure Data
  capacityAnalysis?: {
    totalAvailableCapacity: number; // MW
    nearestConnectionPoint?: {
      name: string;
      distanceKm: number;
      availableCapacity: number;
      voltage: number;
    };
    gridPoints?: Array<{
      longitude: number;
      latitude: number;
      availableCapacity: number;
      voltage: string;
      distanceKm: number;
    }>;
    congestionAreas?: any[];
  };
  
  transmissionLines?: {
    lines: Array<{
      coordinates: [number, number][];
      voltage: string;
      name: string;
      operator: string;
      capacity: number;
      length: number;
    }>;
    analysisRadius: number;
  };
  
  substations?: {
    substations: Array<{
      longitude: number;
      latitude: number;
      name: string;
      maxVoltage: number;
      operator: string;
      capacity: number;
      connectionStatus: 'available' | 'limited' | 'unavailable';
      distanceKm: number;
    }>;
  };
  
  connectionOpportunities?: {
    opportunities: Array<{
      longitude: number;
      latitude: number;
      suitabilityScore: number;
      availableCapacity: number;
      connectionCostEstimate: number;
      timeToConnect: string;
      description: string;
    }>;
  };
  
  constraints?: {
    constraints: Array<{
      geometry: {
        type: string;
        coordinates: any;
      };
      type: string;
      severity: 'high' | 'medium' | 'low';
      description: string;
      affectedCapacity: number;
    }>;
  };
  
  // Summary
  summary?: {
    overallSuitabilityScore: number;
    primaryRecommendation: string;
    keyFindings: string[];
    nextSteps: string[];
  };
}

export interface AnalysisProgress {
  analysisId: string;
  stage: string;
  percentage: number;
  timestamp: string;
  details?: {
    currentTask?: string;
    completedTasks?: string[];
    errors?: string[];
  };
}

export interface GridVisualizationLayer {
  id: string;
  name: string;
  type: 'capacity' | 'transmission' | 'substations' | 'constraints' | 'opportunities';
  visible: boolean;
  opacity: number;
  description?: string;
  dataSource?: 'analysis' | 'tso' | 'osm';
  hasData?: boolean;
  showLabels?: boolean;
  style?: {
    color?: string;
    fillColor?: string;
    weight?: number;
    opacity?: number;
    fillOpacity?: number;
    heatmapIntensity?: number;
    iconSizeByCapacity?: boolean;
    colorByVoltage?: boolean;
    showCapacityLabels?: boolean;
    [key: string]: any;
  };
}

export interface GridInfrastructureLayerConfig {
  capacityAnalysis?: {
    enabled?: boolean;
    heatmapIntensity?: number;
    colorScale?: string[];
  };
  transmissionLines?: {
    enabled?: boolean;
    voltageColorMapping?: Record<string, string>;
    lineWidthByVoltage?: Record<string, number>;
    colorByVoltage?: boolean;
    showCapacityLabels?: boolean;
  };
  substations?: {
    enabled?: boolean;
    iconSizeByCapacity?: boolean;
    showLabels?: boolean;
  };
  connectionOpportunities?: {
    enabled?: boolean;
    feasibilityColorMapping?: Record<string, string>;
  };
  constraints?: {
    enabled?: boolean;
    showSeverityLevels?: boolean;
    constraintTypeColors?: Record<string, string>;
  };
}

export interface ProjectGridSummary {
  projectId: string;
  gridAnalysisId?: string;
  lastAnalyzed?: string;
  
  // Quick Summary Stats
  suitabilityScore?: number;
  nearestConnectionKm?: number;
  availableCapacityMW?: number;
  estimatedTimelineMonths?: number;
  
  // Key Findings
  primaryTSO?: TSO;
  recommendedConnectionPoint?: string;
  majorConstraints?: string[];
  keyRequirements?: string[];
  
  // Status
  analysisStatus: 'pending' | 'in_progress' | 'completed' | 'error';
  needsRefresh: boolean;
}

export interface GridIntelligenceConfig {
  // Analysis Settings
  autoTriggerOnPolygon: boolean;
  minPolygonAreaM2: number;
  maxAnalysisRadiusKm: number;
  
  // Data Sources
  enabledTSOs: string[]; // TSO codes to include
  priorityDataSources: string[];
  cacheTimeoutMinutes: number;
  
  // Visualization
  defaultLayerVisibility: Record<string, boolean>;
  performanceMode: 'high_quality' | 'balanced' | 'fast';
  
  // Recommendations
  recommendationWeights: {
    distance: number;
    capacity: number;
    cost: number;
    timeline: number;
    reliability: number;
  };
}

export interface GridIntelligenceAPI {
  // Analysis endpoints
  validateLocation: (coordinates: [number, number], polygon?: PolygonFeature) => Promise<LocationInfo>;
  identifyTSOs: (locationInfo: LocationInfo) => Promise<TSO[]>;
  collectGridData: (tsos: TSO[], polygon: PolygonFeature, analysisId: string) => Promise<any>;
  processAnalysis: (gridData: any, polygon: PolygonFeature, analysisId: string) => Promise<GridAnalysisResult>;
  
  // Data endpoints  
  getCapacityData: (bounds: LocationInfo['bounds']) => Promise<GridCapacityData[]>;
  getTransmissionLines: (bounds: LocationInfo['bounds']) => Promise<any[]>;
  getSubstations: (bounds: LocationInfo['bounds']) => Promise<any[]>;
  
  // Project integration
  saveGridAnalysis: (projectId: string, analysis: GridAnalysisResult) => Promise<void>;
  getProjectGridSummary: (projectId: string) => Promise<ProjectGridSummary>;
  refreshGridAnalysis: (projectId: string, polygon: PolygonFeature) => Promise<GridAnalysisResult>;
}

// Event types for integration
export interface GridIntelligenceEvents {
  'analysis:start': { polygon: PolygonFeature; analysisId: string };
  'analysis:progress': { progress: AnalysisProgress };
  'analysis:complete': { result: GridAnalysisResult };
  'analysis:error': { error: Error; polygon: PolygonFeature };
  'layers:updated': { layers: GridVisualizationLayer[] };
  'recommendation:selected': { opportunity: ConnectionOpportunity };
}

// Component prop types
export interface GridIntelligenceComponentProps {
  projectId: string;
  polygon?: PolygonFeature;
  config?: Partial<GridIntelligenceConfig>;
  onAnalysisComplete?: (result: GridAnalysisResult) => void;
  onError?: (error: Error) => void;
}

export interface GridLayerSelectorProps {
  layers: GridVisualizationLayer[];
  onLayerToggle: (layerId: string, visible: boolean) => void;
  onOpacityChange: (layerId: string, opacity: number) => void;
  config: GridInfrastructureLayerConfig;
}

export interface GridProgressIndicatorProps {
  progress?: AnalysisProgress;
  onCancel?: () => void;
  showDetails?: boolean;
}

export interface GridRecommendationsProps {
  recommendations: GridAnalysisResult['recommendations'];
  onSelectOpportunity: (opportunity: ConnectionOpportunity) => void;
  showAlternatives?: boolean;
}