/**
 * Spatial Analysis Framework
 * Extensible architecture for client-side and server-side geospatial analysis
 * Supports integration with PostGIS, GeoServer, ArcGIS Server, QGIS Server
 */

export interface SpatialAnalysisProvider {
  name: string;
  type: 'client' | 'server';
  capabilities: SpatialCapability[];
  endpoint?: string;
  authenticate?: () => Promise<void>;
}

export type SpatialCapability = 
  | 'buffer'
  | 'intersection'
  | 'union' 
  | 'difference'
  | 'distance'
  | 'area'
  | 'centroid'
  | 'convex_hull'
  | 'voronoi'
  | 'raster_analysis'
  | 'network_analysis'
  | 'topology_validation'
  | 'coordinate_transformation'
  | 'spatial_statistics';

export interface SpatialAnalysisRequest {
  id: string;
  operation: SpatialOperation;
  parameters: Record<string, any>;
  input_layers: SpatialLayer[];
  output_format: 'geojson' | 'wkt' | 'geopackage' | 'shapefile';
  crs?: string; // Target coordinate reference system
  priority?: 'low' | 'normal' | 'high';
  callback_url?: string; // For async operations
}

export interface SpatialOperation {
  type: SpatialCapability;
  description: string;
  parameters_schema: Record<string, any>; // JSON Schema for validation
}

export interface SpatialLayer {
  id: string;
  name: string;
  type: 'vector' | 'raster';
  geometry_type?: 'Point' | 'LineString' | 'Polygon' | 'MultiPoint' | 'MultiLineString' | 'MultiPolygon';
  data: any; // GeoJSON, WKT, or reference to server-side layer
  crs: string;
  attributes?: Record<string, any>[];
}

export interface SpatialAnalysisResult {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  result?: any;
  error?: string;
  execution_time?: number;
  metadata?: {
    provider: string;
    operation: string;
    input_count: number;
    output_size: number;
    warnings?: string[];
  };
  created_at: string;
  completed_at?: string;
}

// Client-side analysis using Turf.js (limited operations)
class ClientSpatialProvider implements SpatialAnalysisProvider {
  name = 'turf-client';
  type = 'client' as const;
  capabilities: SpatialCapability[] = [
    'buffer',
    'intersection',
    'union',
    'difference',
    'distance',
    'area',
    'centroid',
    'convex_hull'
  ];

  async executeAnalysis(request: SpatialAnalysisRequest): Promise<SpatialAnalysisResult> {
    const startTime = Date.now();
    
    try {
      const turf = await import('@turf/turf');
      let result: any;

      switch (request.operation.type) {
        case 'buffer':
          result = this.bufferAnalysis(turf, request);
          break;
        case 'intersection':
          result = this.intersectionAnalysis(turf, request);
          break;
        case 'distance':
          result = this.distanceAnalysis(turf, request);
          break;
        case 'area':
          result = this.areaAnalysis(turf, request);
          break;
        default:
          throw new Error(`Operation ${request.operation.type} not supported by client provider`);
      }

      return {
        id: request.id,
        status: 'completed',
        result,
        execution_time: Date.now() - startTime,
        metadata: {
          provider: this.name,
          operation: request.operation.type,
          input_count: request.input_layers.length,
          output_size: JSON.stringify(result).length
        },
        created_at: new Date().toISOString(),
        completed_at: new Date().toISOString()
      };

    } catch (error) {
      return {
        id: request.id,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        execution_time: Date.now() - startTime,
        created_at: new Date().toISOString(),
        completed_at: new Date().toISOString()
      };
    }
  }

  private bufferAnalysis(turf: any, request: SpatialAnalysisRequest): any {
    const { distance, units = 'meters' } = request.parameters;
    const layer = request.input_layers[0];
    
    if (layer.data.type === 'FeatureCollection') {
      return {
        type: 'FeatureCollection',
        features: layer.data.features.map((feature: any) => 
          turf.buffer(feature, distance, { units })
        )
      };
    } else {
      return turf.buffer(layer.data, distance, { units });
    }
  }

  private intersectionAnalysis(turf: any, request: SpatialAnalysisRequest): any {
    const [layer1, layer2] = request.input_layers;
    return turf.intersect(layer1.data, layer2.data);
  }

  private distanceAnalysis(turf: any, request: SpatialAnalysisRequest): any {
    const [layer1, layer2] = request.input_layers;
    const { units = 'meters' } = request.parameters;
    
    if (layer1.data.type === 'Feature' && layer2.data.type === 'Feature') {
      return turf.distance(layer1.data, layer2.data, { units });
    }
    
    throw new Error('Distance analysis requires two point features');
  }

  private areaAnalysis(turf: any, request: SpatialAnalysisRequest): any {
    const layer = request.input_layers[0];
    const { units = 'meters' } = request.parameters;
    
    if (layer.data.type === 'FeatureCollection') {
      return layer.data.features.map((feature: any) => ({
        ...feature,
        properties: {
          ...feature.properties,
          area: turf.area(feature, { units })
        }
      }));
    } else {
      return turf.area(layer.data, { units });
    }
  }
}

// PostGIS/Supabase server provider
class PostGISSpatialProvider implements SpatialAnalysisProvider {
  name = 'postgis-supabase';
  type = 'server' as const;
  capabilities: SpatialCapability[] = [
    'buffer',
    'intersection',
    'union',
    'difference',
    'distance',
    'area',
    'centroid',
    'convex_hull',
    'voronoi',
    'network_analysis',
    'topology_validation',
    'coordinate_transformation',
    'spatial_statistics'
  ];
  
  constructor(private supabaseClient: any) {}

  async executeAnalysis(request: SpatialAnalysisRequest): Promise<SpatialAnalysisResult> {
    const startTime = Date.now();
    
    try {
      // Store analysis request in database
      const { data: analysisRecord } = await this.supabaseClient
        .from('spatial_analyses')
        .insert({
          id: request.id,
          operation_type: request.operation.type,
          parameters: request.parameters,
          status: 'processing'
        })
        .select()
        .single();

      // Execute spatial analysis using PostGIS functions
      let result: any;
      
      switch (request.operation.type) {
        case 'buffer':
          result = await this.executePostGISBuffer(request);
          break;
        case 'intersection':
          result = await this.executePostGISIntersection(request);
          break;
        default:
          throw new Error(`Operation ${request.operation.type} not implemented`);
      }

      // Update analysis record
      await this.supabaseClient
        .from('spatial_analyses')
        .update({
          status: 'completed',
          result: result,
          execution_time: Date.now() - startTime,
          completed_at: new Date().toISOString()
        })
        .eq('id', request.id);

      return {
        id: request.id,
        status: 'completed',
        result,
        execution_time: Date.now() - startTime,
        metadata: {
          provider: this.name,
          operation: request.operation.type,
          input_count: request.input_layers.length,
          output_size: JSON.stringify(result).length
        },
        created_at: new Date().toISOString(),
        completed_at: new Date().toISOString()
      };

    } catch (error) {
      // Update analysis record with error
      await this.supabaseClient
        .from('spatial_analyses')
        .update({
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
          completed_at: new Date().toISOString()
        })
        .eq('id', request.id);

      return {
        id: request.id,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        execution_time: Date.now() - startTime,
        created_at: new Date().toISOString(),
        completed_at: new Date().toISOString()
      };
    }
  }

  private async executePostGISBuffer(request: SpatialAnalysisRequest): Promise<any> {
    const { distance } = request.parameters;
    const layer = request.input_layers[0];
    
    // Convert GeoJSON to PostGIS geometry and perform buffer
    const { data } = await this.supabaseClient.rpc('spatial_buffer', {
      input_geojson: layer.data,
      buffer_distance: distance,
      output_format: request.output_format
    });
    
    return data;
  }

  private async executePostGISIntersection(request: SpatialAnalysisRequest): Promise<any> {
    const [layer1, layer2] = request.input_layers;
    
    const { data } = await this.supabaseClient.rpc('spatial_intersection', {
      geom1: layer1.data,
      geom2: layer2.data,
      output_format: request.output_format
    });
    
    return data;
  }
}

// GeoServer WPS provider (for complex raster analysis)
class GeoServerWPSProvider implements SpatialAnalysisProvider {
  name = 'geoserver-wps';
  type = 'server' as const;
  endpoint: string;
  capabilities: SpatialCapability[] = [
    'buffer',
    'intersection',
    'union',
    'difference',
    'raster_analysis',
    'network_analysis',
    'spatial_statistics'
  ];

  constructor(endpoint: string, private credentials?: { username: string; password: string }) {
    this.endpoint = endpoint;
  }

  async executeAnalysis(request: SpatialAnalysisRequest): Promise<SpatialAnalysisResult> {
    const startTime = Date.now();
    
    try {
      // Build WPS request XML
      const wpsRequest = this.buildWPSRequest(request);
      
      const response = await fetch(`${this.endpoint}/wps`, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml',
          ...this.getAuthHeaders()
        },
        body: wpsRequest
      });

      if (!response.ok) {
        throw new Error(`GeoServer WPS error: ${response.statusText}`);
      }

      const result = await response.text();
      // Parse WPS response (implementation depends on specific process)
      
      return {
        id: request.id,
        status: 'completed',
        result: result,
        execution_time: Date.now() - startTime,
        metadata: {
          provider: this.name,
          operation: request.operation.type,
          input_count: request.input_layers.length,
          output_size: result.length
        },
        created_at: new Date().toISOString(),
        completed_at: new Date().toISOString()
      };

    } catch (error) {
      return {
        id: request.id,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        execution_time: Date.now() - startTime,
        created_at: new Date().toISOString(),
        completed_at: new Date().toISOString()
      };
    }
  }

  private buildWPSRequest(request: SpatialAnalysisRequest): string {
    // Build WPS XML request based on operation type
    // This is a simplified example - real implementation would be more complex
    return `
      <wps:Execute version="1.0.0" service="WPS"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xmlns="http://www.opengis.net/wps/1.0.0"
        xmlns:wps="http://www.opengis.net/wps/1.0.0"
        xmlns:ows="http://www.opengis.net/ows/1.1">
        <ows:Identifier>gs:${request.operation.type}</ows:Identifier>
        <wps:DataInputs>
          <!-- Parameters would be added here -->
        </wps:DataInputs>
        <wps:ResponseForm>
          <wps:RawDataOutput mimeType="application/json">
            <ows:Identifier>result</ows:Identifier>
          </wps:RawDataOutput>
        </wps:ResponseForm>
      </wps:Execute>
    `;
  }

  private getAuthHeaders(): Record<string, string> {
    if (this.credentials) {
      const auth = btoa(`${this.credentials.username}:${this.credentials.password}`);
      return { 'Authorization': `Basic ${auth}` };
    }
    return {};
  }
}

// Main spatial analysis manager
export class SpatialAnalysisManager {
  private providers: Map<string, SpatialAnalysisProvider> = new Map();
  private analysisHistory: Map<string, SpatialAnalysisResult> = new Map();

  constructor() {
    // Register default client-side provider
    this.registerProvider(new ClientSpatialProvider());
  }

  registerProvider(provider: SpatialAnalysisProvider): void {
    this.providers.set(provider.name, provider);
  }

  getProviders(): SpatialAnalysisProvider[] {
    return Array.from(this.providers.values());
  }

  getCapableProviders(capability: SpatialCapability): SpatialAnalysisProvider[] {
    return Array.from(this.providers.values())
      .filter(provider => provider.capabilities.includes(capability));
  }

  async executeAnalysis(
    request: SpatialAnalysisRequest, 
    preferredProvider?: string
  ): Promise<SpatialAnalysisResult> {
    
    let provider: SpatialAnalysisProvider;

    if (preferredProvider && this.providers.has(preferredProvider)) {
      provider = this.providers.get(preferredProvider)!;
    } else {
      // Select best provider based on capability
      const capableProviders = this.getCapableProviders(request.operation.type);
      if (capableProviders.length === 0) {
        throw new Error(`No provider supports operation: ${request.operation.type}`);
      }
      
      // Prefer server providers for complex operations
      const serverProviders = capableProviders.filter(p => p.type === 'server');
      provider = serverProviders.length > 0 ? serverProviders[0] : capableProviders[0];
    }

    // Validate request parameters against operation schema
    this.validateRequest(request);

    // Execute analysis
    const result = await (provider as any).executeAnalysis(request);
    
    // Store in history
    this.analysisHistory.set(request.id, result);
    
    return result;
  }

  getAnalysisResult(id: string): SpatialAnalysisResult | undefined {
    return this.analysisHistory.get(id);
  }

  getAnalysisHistory(): SpatialAnalysisResult[] {
    return Array.from(this.analysisHistory.values())
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  private validateRequest(request: SpatialAnalysisRequest): void {
    // Add JSON schema validation here
    if (!request.id || !request.operation || !request.input_layers) {
      throw new Error('Invalid analysis request: missing required fields');
    }
    
    if (request.input_layers.length === 0) {
      throw new Error('Analysis request requires at least one input layer');
    }
  }

  // Helper methods for common analysis operations
  async bufferAnalysis(
    geometry: any, 
    distance: number, 
    units: string = 'meters',
    provider?: string
  ): Promise<any> {
    const request: SpatialAnalysisRequest = {
      id: `buffer_${Date.now()}`,
      operation: {
        type: 'buffer',
        description: 'Create buffer around geometry',
        parameters_schema: {
          distance: { type: 'number', required: true },
          units: { type: 'string', default: 'meters' }
        }
      },
      parameters: { distance, units },
      input_layers: [{
        id: 'input_geometry',
        name: 'Input Geometry',
        type: 'vector',
        data: geometry,
        crs: 'EPSG:4326'
      }],
      output_format: 'geojson'
    };

    const result = await this.executeAnalysis(request, provider);
    return result.result;
  }

  async proximityAnalysis(
    sites: any[], 
    infrastructure: any[], 
    maxDistance: number = 5000
  ): Promise<any> {
    const request: SpatialAnalysisRequest = {
      id: `proximity_${Date.now()}`,
      operation: {
        type: 'distance',
        description: 'Calculate proximity to infrastructure',
        parameters_schema: {
          maxDistance: { type: 'number', default: 5000 }
        }
      },
      parameters: { maxDistance },
      input_layers: [
        {
          id: 'sites',
          name: 'Potential Sites',
          type: 'vector',
          geometry_type: 'Point',
          data: { type: 'FeatureCollection', features: sites },
          crs: 'EPSG:4326'
        },
        {
          id: 'infrastructure',
          name: 'Infrastructure',
          type: 'vector',
          data: { type: 'FeatureCollection', features: infrastructure },
          crs: 'EPSG:4326'
        }
      ],
      output_format: 'geojson'
    };

    const result = await this.executeAnalysis(request);
    return result.result;
  }
}

// Singleton instance
export const spatialAnalysisManager = new SpatialAnalysisManager();

// Initialize with Supabase provider when available
export function initializeSpatialProviders(supabaseClient?: any, geoServerEndpoint?: string) {
  if (supabaseClient) {
    spatialAnalysisManager.registerProvider(new PostGISSpatialProvider(supabaseClient));
  }
  
  if (geoServerEndpoint) {
    spatialAnalysisManager.registerProvider(new GeoServerWPSProvider(geoServerEndpoint));
  }
}