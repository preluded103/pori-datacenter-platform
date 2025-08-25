/**
 * Infrastructure Proximity Analysis Module
 * Phase 0 Screening - Distance-based analysis only (no capacity calculations)
 */

import * as turf from '@turf/turf';
import { FeatureCollection, Point, Polygon } from 'geojson';

export interface InfrastructureProximityResult {
  power: {
    nearestSubstation: {
      distance: number; // meters
      name?: string;
      voltageKv?: number;
      confidence: 'HIGH' | 'MEDIUM' | 'LOW';
    };
    transmissionLineDistance?: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    flag?: string;
  };
  fiber: {
    backboneDistance: number;
    provider?: string;
    confidence: 'HIGH' | 'MEDIUM' | 'LOW';
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    flag?: string;
  };
  water: {
    sourceDistance: number;
    sourceType?: string; // 'river', 'lake', 'municipal', 'groundwater'
    confidence: 'HIGH' | 'MEDIUM' | 'LOW';
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    flag?: string;
  };
  transport: {
    highwayDistance: number;
    railDistance?: number;
    portDistance?: number;
    airportDistance: number;
    accessQuality: 'EXCELLENT' | 'GOOD' | 'POOR';
    flag?: string;
  };
}

export interface ProximityThresholds {
  power: {
    excellent: number; // < 5km
    acceptable: number; // < 15km
    problematic: number; // > 15km
  };
  fiber: {
    excellent: number; // < 2km
    acceptable: number; // < 10km
    problematic: number; // > 10km
  };
  water: {
    excellent: number; // < 5km
    acceptable: number; // < 10km
    problematic: number; // > 10km
  };
  transport: {
    highway: number; // < 5km for good access
    airport: number; // > 10km to avoid restrictions
  };
}

export class InfrastructureProximityAnalyzer {
  private thresholds: ProximityThresholds = {
    power: {
      excellent: 5000, // 5km
      acceptable: 15000, // 15km
      problematic: 15000
    },
    fiber: {
      excellent: 2000, // 2km
      acceptable: 10000, // 10km
      problematic: 10000
    },
    water: {
      excellent: 5000, // 5km
      acceptable: 10000, // 10km
      problematic: 10000
    },
    transport: {
      highway: 5000, // 5km
      airport: 10000 // 10km minimum distance
    }
  };

  /**
   * Analyze infrastructure proximity for a site
   * Phase 0: Distance only, no capacity or detailed analysis
   */
  async analyzeSite(
    siteLocation: Point,
    siteBoundary: Polygon,
    infrastructureData: {
      substations?: FeatureCollection;
      transmissionLines?: FeatureCollection;
      fiberRoutes?: FeatureCollection;
      waterBodies?: FeatureCollection;
      roads?: FeatureCollection;
      railways?: FeatureCollection;
      airports?: FeatureCollection;
    }
  ): Promise<InfrastructureProximityResult> {
    
    // Power Infrastructure
    const powerAnalysis = this.analyzePowerProximity(
      siteLocation,
      infrastructureData.substations,
      infrastructureData.transmissionLines
    );

    // Fiber Connectivity
    const fiberAnalysis = this.analyzeFiberProximity(
      siteLocation,
      infrastructureData.fiberRoutes
    );

    // Water Resources
    const waterAnalysis = this.analyzeWaterProximity(
      siteLocation,
      infrastructureData.waterBodies
    );

    // Transportation
    const transportAnalysis = this.analyzeTransportProximity(
      siteLocation,
      infrastructureData.roads,
      infrastructureData.railways,
      infrastructureData.airports
    );

    return {
      power: powerAnalysis,
      fiber: fiberAnalysis,
      water: waterAnalysis,
      transport: transportAnalysis
    };
  }

  private analyzePowerProximity(
    site: Point,
    substations?: FeatureCollection,
    transmissionLines?: FeatureCollection
  ): InfrastructureProximityResult['power'] {
    
    if (!substations || substations.features.length === 0) {
      return {
        nearestSubstation: {
          distance: -1,
          confidence: 'LOW'
        },
        riskLevel: 'HIGH',
        flag: 'No substation data available - manual verification required'
      };
    }

    // Find nearest substation
    const nearest = turf.nearestPoint(site, substations as any as any);
    const distance = turf.distance(site, nearest, { units: 'meters' });
    
    // Extract properties if available
    const props = nearest.properties || {};
    
    // Determine risk level based on distance
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    let flag: string | undefined;
    
    if (distance <= this.thresholds.power.excellent) {
      riskLevel = 'LOW';
      flag = `Substation within ${Math.round(distance/1000)}km - excellent proximity`;
    } else if (distance <= this.thresholds.power.acceptable) {
      riskLevel = 'MEDIUM';
      flag = `Substation ${Math.round(distance/1000)}km away - connection feasible but costly`;
    } else {
      riskLevel = 'HIGH';
      flag = `Substation ${Math.round(distance/1000)}km away - significant infrastructure investment required`;
    }

    // Check transmission line proximity if available
    let transmissionDistance: number | undefined;
    if (transmissionLines && transmissionLines.features.length > 0) {
      const nearestLine = this.findNearestLine(site, transmissionLines);
      transmissionDistance = nearestLine.distance;
    }

    return {
      nearestSubstation: {
        distance: Math.round(distance),
        name: (props as any).name || 'Unknown',
        voltageKv: (props as any).voltage_kv || 0,
        confidence: (props as any).source ? 'HIGH' : 'MEDIUM'
      },
      transmissionLineDistance: transmissionDistance,
      riskLevel,
      flag
    };
  }

  private analyzeFiberProximity(
    site: Point,
    fiberRoutes?: FeatureCollection
  ): InfrastructureProximityResult['fiber'] {
    
    if (!fiberRoutes || fiberRoutes.features.length === 0) {
      return {
        backboneDistance: -1,
        confidence: 'LOW',
        riskLevel: 'MEDIUM',
        flag: 'Fiber data unavailable - assume municipal connectivity exists'
      };
    }

    const nearestFiber = this.findNearestLine(site, fiberRoutes);
    const distance = nearestFiber.distance;
    
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    let flag: string | undefined;
    
    if (distance <= this.thresholds.fiber.excellent) {
      riskLevel = 'LOW';
      flag = `Fiber backbone within ${Math.round(distance/1000)}km - excellent connectivity`;
    } else if (distance <= this.thresholds.fiber.acceptable) {
      riskLevel = 'MEDIUM';
      flag = `Fiber ${Math.round(distance/1000)}km away - extension required`;
    } else {
      riskLevel = 'HIGH';
      flag = `Fiber ${Math.round(distance/1000)}km away - significant investment required`;
    }

    return {
      backboneDistance: Math.round(distance),
      provider: nearestFiber.properties?.operator,
      confidence: nearestFiber.properties?.verified ? 'HIGH' : 'MEDIUM',
      riskLevel,
      flag
    };
  }

  private analyzeWaterProximity(
    site: Point,
    waterBodies?: FeatureCollection
  ): InfrastructureProximityResult['water'] {
    
    if (!waterBodies || waterBodies.features.length === 0) {
      return {
        sourceDistance: -1,
        confidence: 'LOW',
        riskLevel: 'HIGH',
        flag: 'Water source data unavailable - detailed hydrology study required'
      };
    }

    // Find nearest water body
    const nearest = turf.nearestPoint(site, waterBodies as any as any);
    const distance = turf.distance(site, nearest, { units: 'meters' });
    const waterType = nearest.properties?.water_type || 'unknown';
    
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    let flag: string | undefined;
    
    if (distance <= this.thresholds.water.excellent) {
      riskLevel = 'LOW';
      flag = `${waterType} water source within ${Math.round(distance/1000)}km`;
    } else if (distance <= this.thresholds.water.acceptable) {
      riskLevel = 'MEDIUM';
      flag = `${waterType} water ${Math.round(distance/1000)}km away - piping required`;
    } else {
      riskLevel = 'HIGH';
      flag = `Nearest water ${Math.round(distance/1000)}km away - alternative cooling needed`;
    }

    return {
      sourceDistance: Math.round(distance),
      sourceType: waterType,
      confidence: 'MEDIUM',
      riskLevel,
      flag
    };
  }

  private analyzeTransportProximity(
    site: Point,
    roads?: FeatureCollection,
    railways?: FeatureCollection,
    airports?: FeatureCollection
  ): InfrastructureProximityResult['transport'] {
    
    let highwayDistance = -1;
    let railDistance: number | undefined;
    let airportDistance = -1;
    let accessQuality: 'EXCELLENT' | 'GOOD' | 'POOR' = 'POOR';
    let flag: string | undefined;

    // Check highway access
    if (roads && roads.features.length > 0) {
      const highways = {
        type: 'FeatureCollection' as const,
        features: roads.features.filter(f => 
          f.properties?.highway === 'motorway' || 
          f.properties?.highway === 'trunk' ||
          f.properties?.highway === 'primary'
        )
      };
      
      if (highways.features.length > 0) {
        const nearest = this.findNearestLine(site, highways);
        highwayDistance = Math.round(nearest.distance);
      }
    }

    // Check rail access
    if (railways && railways.features.length > 0) {
      const nearest = this.findNearestLine(site, railways);
      railDistance = Math.round(nearest.distance);
    }

    // Check airport proximity (for restrictions)
    if (airports && airports.features.length > 0) {
      const nearest = turf.nearestPoint(site, airports as any);
      airportDistance = Math.round(turf.distance(site, nearest, { units: 'meters' }));
    }

    // Determine access quality
    if (highwayDistance > 0 && highwayDistance <= this.thresholds.transport.highway) {
      if (airportDistance < this.thresholds.transport.airport) {
        accessQuality = 'GOOD';
        flag = 'Good highway access but check aviation height restrictions';
      } else {
        accessQuality = 'EXCELLENT';
        flag = 'Excellent transport access with no aviation conflicts';
      }
    } else if (highwayDistance > 0 && highwayDistance <= this.thresholds.transport.highway * 2) {
      accessQuality = 'GOOD';
      flag = 'Adequate transport access, may require road improvements';
    } else {
      accessQuality = 'POOR';
      flag = 'Limited transport access - significant infrastructure required';
    }

    return {
      highwayDistance,
      railDistance,
      portDistance: undefined, // Would need specific port data
      airportDistance,
      accessQuality,
      flag
    };
  }

  private findNearestLine(
    point: Point,
    lines: FeatureCollection
  ): { distance: number; properties?: any } {
    
    let minDistance = Infinity;
    let nearestProperties = {};

    for (const feature of lines.features) {
      if (feature.geometry.type === 'LineString' || feature.geometry.type === 'MultiLineString') {
        const distance = turf.pointToLineDistance(point, feature as any, { units: 'meters' });
        if (distance < minDistance) {
          minDistance = distance;
          nearestProperties = feature.properties || {};
        }
      }
    }

    return {
      distance: minDistance,
      properties: nearestProperties
    };
  }

  /**
   * Generate risk summary for scorecard
   */
  generateSummary(result: InfrastructureProximityResult): {
    overallRisk: 'LOW' | 'MEDIUM' | 'HIGH';
    criticalFlags: string[];
    nextSteps: string[];
  } {
    const risks = [
      result.power.riskLevel,
      result.fiber.riskLevel,
      result.water.riskLevel,
      result.transport.accessQuality === 'EXCELLENT' ? 'LOW' : 
        result.transport.accessQuality === 'GOOD' ? 'MEDIUM' : 'HIGH'
    ];

    const highRiskCount = risks.filter(r => r === 'HIGH').length;
    const mediumRiskCount = risks.filter(r => r === 'MEDIUM').length;

    let overallRisk: 'LOW' | 'MEDIUM' | 'HIGH';
    if (highRiskCount >= 2) {
      overallRisk = 'HIGH';
    } else if (highRiskCount === 1 || mediumRiskCount >= 2) {
      overallRisk = 'MEDIUM';
    } else {
      overallRisk = 'LOW';
    }

    const criticalFlags: string[] = [];
    const nextSteps: string[] = [];

    // Collect critical flags
    if (result.power.flag && result.power.riskLevel !== 'LOW') {
      criticalFlags.push(result.power.flag);
      nextSteps.push('Detailed grid connection study required');
    }
    if (result.water.flag && result.water.riskLevel === 'HIGH') {
      criticalFlags.push(result.water.flag);
      nextSteps.push('Alternative cooling strategy investigation needed');
    }
    if (result.transport.accessQuality === 'POOR') {
      criticalFlags.push(result.transport.flag || 'Poor transport access');
      nextSteps.push('Transportation infrastructure assessment required');
    }

    return {
      overallRisk,
      criticalFlags,
      nextSteps
    };
  }
}