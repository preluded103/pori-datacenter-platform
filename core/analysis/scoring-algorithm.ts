/**
 * Site Scoring Algorithm for Phase 0 Screening
 * Generates weighted scores and Go/No-Go recommendations
 */

export interface SiteScore {
  overall: number; // 0-10 scale
  infrastructure: number; // 0-10
  environmental: number; // 0-10
  regulatory: number; // 0-10
  technical: number; // 0-10
  timeline: number; // 0-10
  recommendation: 'PROCEED' | 'CAUTION' | 'AVOID';
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  criticalFlags: string[];
  strengthFlags: string[];
}

export interface ScoringWeights {
  infrastructure: number;
  environmental: number;
  regulatory: number;
  technical: number;
  timeline: number;
}

export interface RiskInputs {
  // Infrastructure (from proximity analysis)
  powerDistance: number; // meters
  powerRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  fiberDistance: number;
  fiberRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  waterDistance: number;
  waterRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  transportQuality: 'EXCELLENT' | 'GOOD' | 'POOR';
  
  // Environmental
  floodRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  protectedAreaDistance: number; // meters
  environmentalPermitsRequired: boolean;
  
  // Regulatory
  zoningCompatible: boolean;
  zoningChangeRequired: boolean;
  eiaRequired: boolean;
  waterPermitRequired: boolean;
  
  // Technical
  seismicRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  geotechnicalRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  aviationRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  heritageRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  emiRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  
  // Timeline
  estimatedTimelineMonths: number;
  gridConnectionComplexity: 'SIMPLE' | 'STANDARD' | 'COMPLEX';
  
  // Data Quality
  dataCompleteness: number; // 0-100%
  dataConfidence: 'HIGH' | 'MEDIUM' | 'LOW';
}

export class SiteScoreCalculator {
  private weights: ScoringWeights;
  
  constructor(weights?: ScoringWeights) {
    // Default weights for datacenter site selection
    this.weights = weights || {
      infrastructure: 0.35, // Most critical for datacenters
      environmental: 0.15,
      regulatory: 0.20,
      technical: 0.20,
      timeline: 0.10
    };
  }

  /**
   * Calculate comprehensive site score for Phase 0 screening
   */
  calculateScore(inputs: RiskInputs): SiteScore {
    const criticalFlags: string[] = [];
    const strengthFlags: string[] = [];

    // Calculate sub-scores
    const infrastructureScore = this.scoreInfrastructure(inputs, criticalFlags, strengthFlags);
    const environmentalScore = this.scoreEnvironmental(inputs, criticalFlags, strengthFlags);
    const regulatoryScore = this.scoreRegulatory(inputs, criticalFlags, strengthFlags);
    const technicalScore = this.scoreTechnical(inputs, criticalFlags, strengthFlags);
    const timelineScore = this.scoreTimeline(inputs, criticalFlags, strengthFlags);

    // Calculate weighted overall score
    const overall = (
      infrastructureScore * this.weights.infrastructure +
      environmentalScore * this.weights.environmental +
      regulatoryScore * this.weights.regulatory +
      technicalScore * this.weights.technical +
      timelineScore * this.weights.timeline
    );

    // Determine recommendation
    const recommendation = this.getRecommendation(
      overall,
      criticalFlags,
      inputs
    );

    // Assess confidence based on data quality
    const confidence = this.assessConfidence(inputs);

    return {
      overall: Math.round(overall * 10) / 10,
      infrastructure: Math.round(infrastructureScore * 10) / 10,
      environmental: Math.round(environmentalScore * 10) / 10,
      regulatory: Math.round(regulatoryScore * 10) / 10,
      technical: Math.round(technicalScore * 10) / 10,
      timeline: Math.round(timelineScore * 10) / 10,
      recommendation,
      confidence,
      criticalFlags,
      strengthFlags
    };
  }

  private scoreInfrastructure(
    inputs: RiskInputs,
    criticalFlags: string[],
    strengthFlags: string[]
  ): number {
    let score = 10;
    
    // Power (40% of infrastructure score)
    if (inputs.powerRisk === 'HIGH') {
      score -= 4;
      criticalFlags.push('Power infrastructure >15km away');
    } else if (inputs.powerRisk === 'MEDIUM') {
      score -= 2;
    } else {
      strengthFlags.push('Excellent power infrastructure proximity');
    }

    // Fiber (25% of infrastructure score)
    if (inputs.fiberRisk === 'HIGH') {
      score -= 2.5;
      criticalFlags.push('Fiber connectivity >10km - significant cost');
    } else if (inputs.fiberRisk === 'MEDIUM') {
      score -= 1.25;
    } else if (inputs.fiberDistance < 2000) {
      strengthFlags.push('Fiber backbone <2km away');
    }

    // Water (25% of infrastructure score)
    if (inputs.waterRisk === 'HIGH') {
      score -= 2.5;
      criticalFlags.push('Water cooling source >10km away');
    } else if (inputs.waterRisk === 'MEDIUM') {
      score -= 1.25;
    } else if (inputs.waterDistance < 5000) {
      strengthFlags.push('Water source within 5km');
    }

    // Transport (10% of infrastructure score)
    if (inputs.transportQuality === 'POOR') {
      score -= 1;
      criticalFlags.push('Poor transport access');
    } else if (inputs.transportQuality === 'EXCELLENT') {
      strengthFlags.push('Excellent transport connectivity');
    }

    return Math.max(0, score);
  }

  private scoreEnvironmental(
    inputs: RiskInputs,
    criticalFlags: string[],
    strengthFlags: string[]
  ): number {
    let score = 10;

    // Flood risk (40% of environmental score)
    if (inputs.floodRisk === 'HIGH') {
      score -= 4;
      criticalFlags.push('High flood risk - detailed study required');
    } else if (inputs.floodRisk === 'MEDIUM') {
      score -= 2;
    } else {
      strengthFlags.push('Low flood risk');
    }

    // Protected areas (30% of environmental score)
    if (inputs.protectedAreaDistance < 1000) {
      score -= 3;
      criticalFlags.push('Protected area <1km - restrictions likely');
    } else if (inputs.protectedAreaDistance < 5000) {
      score -= 1.5;
    } else if (inputs.protectedAreaDistance > 10000) {
      strengthFlags.push('No protected area conflicts');
    }

    // Environmental permits (30% of environmental score)
    if (inputs.environmentalPermitsRequired) {
      score -= 3;
      criticalFlags.push('Environmental permits required');
    }

    return Math.max(0, score);
  }

  private scoreRegulatory(
    inputs: RiskInputs,
    criticalFlags: string[],
    strengthFlags: string[]
  ): number {
    let score = 10;

    // Zoning (40% of regulatory score)
    if (!inputs.zoningCompatible) {
      if (inputs.zoningChangeRequired) {
        score -= 4;
        criticalFlags.push('Zoning change required - 12-24 month process');
      } else {
        score -= 2;
        criticalFlags.push('Conditional use permit required');
      }
    } else {
      strengthFlags.push('Zoning compatible with datacenter use');
    }

    // EIA requirement (30% of regulatory score)
    if (inputs.eiaRequired) {
      score -= 3;
      criticalFlags.push('Environmental Impact Assessment required');
    }

    // Water permits (30% of regulatory score)
    if (inputs.waterPermitRequired) {
      score -= 3;
      // Don't double-flag if already noted in environmental
      if (!criticalFlags.some(f => f.includes('permit'))) {
        criticalFlags.push('Water use permits required');
      }
    }

    return Math.max(0, score);
  }

  private scoreTechnical(
    inputs: RiskInputs,
    criticalFlags: string[],
    strengthFlags: string[]
  ): number {
    let score = 10;
    const risks = [
      { risk: inputs.seismicRisk, name: 'Seismic', weight: 2.5 },
      { risk: inputs.geotechnicalRisk, name: 'Geotechnical', weight: 2.5 },
      { risk: inputs.aviationRisk, name: 'Aviation', weight: 2 },
      { risk: inputs.heritageRisk, name: 'Heritage', weight: 1.5 },
      { risk: inputs.emiRisk, name: 'EMI', weight: 1.5 }
    ];

    for (const { risk, name, weight } of risks) {
      if (risk === 'HIGH') {
        score -= weight;
        criticalFlags.push(`High ${name.toLowerCase()} risk identified`);
      } else if (risk === 'MEDIUM') {
        score -= weight / 2;
      }
    }

    // Add strength flags for low technical risks
    const highRiskCount = risks.filter(r => r.risk === 'HIGH').length;
    const mediumRiskCount = risks.filter(r => r.risk === 'MEDIUM').length;
    
    if (highRiskCount === 0 && mediumRiskCount <= 1) {
      strengthFlags.push('Minimal technical risks identified');
    }

    return Math.max(0, score);
  }

  private scoreTimeline(
    inputs: RiskInputs,
    criticalFlags: string[],
    strengthFlags: string[]
  ): number {
    let score = 10;

    // Timeline assessment
    if (inputs.estimatedTimelineMonths > 48) {
      score -= 5;
      criticalFlags.push(`Extended timeline: ${inputs.estimatedTimelineMonths}+ months`);
    } else if (inputs.estimatedTimelineMonths > 36) {
      score -= 3;
    } else if (inputs.estimatedTimelineMonths > 24) {
      score -= 1;
    } else if (inputs.estimatedTimelineMonths <= 18) {
      strengthFlags.push('Fast-track development possible (<18 months)');
    }

    // Grid connection complexity
    if (inputs.gridConnectionComplexity === 'COMPLEX') {
      score -= 3;
      if (!criticalFlags.some(f => f.includes('timeline'))) {
        criticalFlags.push('Complex grid connection process');
      }
    } else if (inputs.gridConnectionComplexity === 'SIMPLE') {
      score -= 0;
      strengthFlags.push('Straightforward grid connection process');
    } else {
      score -= 1.5;
    }

    return Math.max(0, score);
  }

  private getRecommendation(
    overall: number,
    criticalFlags: string[],
    inputs: RiskInputs
  ): 'PROCEED' | 'CAUTION' | 'AVOID' {
    
    // Check for absolute deal-breakers
    const dealBreakers = [
      inputs.powerRisk === 'HIGH' && inputs.waterRisk === 'HIGH',
      inputs.powerDistance > 30000, // >30km to power
      criticalFlags.length > 5,
      overall < 4
    ];

    if (dealBreakers.some(db => db)) {
      return 'AVOID';
    }

    // Check for caution conditions
    const cautionConditions = [
      overall < 6.5,
      criticalFlags.length >= 3,
      inputs.dataConfidence === 'LOW',
      inputs.gridConnectionComplexity === 'COMPLEX',
      inputs.estimatedTimelineMonths > 36
    ];

    const cautionCount = cautionConditions.filter(c => c).length;
    
    if (cautionCount >= 2) {
      return 'CAUTION';
    }

    // Default to PROCEED if score is good
    if (overall >= 7 && criticalFlags.length <= 2) {
      return 'PROCEED';
    }

    return 'CAUTION';
  }

  private assessConfidence(inputs: RiskInputs): 'HIGH' | 'MEDIUM' | 'LOW' {
    // Base confidence on data completeness and quality
    if (inputs.dataCompleteness >= 80 && inputs.dataConfidence !== 'LOW') {
      return 'HIGH';
    } else if (inputs.dataCompleteness >= 60) {
      return 'MEDIUM';
    } else {
      return 'LOW';
    }
  }

  /**
   * Compare multiple sites for ranking
   */
  rankSites(sites: Array<{ id: string; score: SiteScore }>): Array<{
    rank: number;
    id: string;
    score: SiteScore;
    comparison: string;
  }> {
    // Sort by overall score, then by critical flags count
    const sorted = sites.sort((a, b) => {
      if (a.score.overall !== b.score.overall) {
        return b.score.overall - a.score.overall;
      }
      return a.score.criticalFlags.length - b.score.criticalFlags.length;
    });

    return sorted.map((site, index) => {
      let comparison = '';
      if (index === 0) {
        comparison = 'Top candidate';
      } else {
        const scoreDiff = sorted[0].score.overall - site.score.overall;
        comparison = `${scoreDiff.toFixed(1)} points below top site`;
      }

      return {
        rank: index + 1,
        id: site.id,
        score: site.score,
        comparison
      };
    });
  }
}