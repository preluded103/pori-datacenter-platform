/**
 * Grid Intelligence Recommendation Engine
 * Generates site suitability scores and recommendations based on configurable weights
 */

import { GridAnalysisResult, TSO } from '@/lib/types/grid-types';

export interface RecommendationWeights {
  distance: number;
  capacity: number;
  timeline: number;
  cost: number;
  reliability: number;
  tso: number;
  risk: number;
}

export interface RecommendationThresholds {
  distance: { excellent: number; good: number; fair: number };
  capacity: { excellent: number; good: number; fair: number };
  timeline: { excellent: number; good: number; fair: number };
  cost: { excellent: number; good: number; fair: number };
}

export interface RegionalAdjustments {
  reliabilityMultiplier: number;
  timelineAdjustment: number; // percentage
  costAdjustment: number; // percentage
}

export interface RecommendationConfig {
  weights: RecommendationWeights;
  thresholds: RecommendationThresholds;
  regionalAdjustments: Record<string, RegionalAdjustments>;
  minimumRequirements: {
    minCapacityMW: number;
    maxDistanceKm: number;
    maxTimelineMonths: number;
  };
  tsoScores: Record<string, number>;
}

export interface ScoredRecommendation {
  id: string;
  overallScore: number;
  tier: 'excellent' | 'good' | 'fair' | 'poor';
  factorScores: {
    distance: number;
    capacity: number;
    timeline: number;
    cost: number;
    reliability: number;
    tso: number;
    risk: number;
  };
  weightedScores: {
    distance: number;
    capacity: number;
    timeline: number;
    cost: number;
    reliability: number;
    tso: number;
    risk: number;
  };
  bonusPoints: number;
  penalties: number;
  recommendation: string;
  keyStrengths: string[];
  concerns: string[];
  nextSteps: string[];
}

export class GridRecommendationEngine {
  private config: RecommendationConfig;

  constructor(config?: Partial<RecommendationConfig>) {
    this.config = this.getDefaultConfig();
    if (config) {
      this.config = { ...this.config, ...config };
    }
  }

  /**
   * Generate recommendations from grid analysis result
   */
  public generateRecommendations(analysisResult: GridAnalysisResult): ScoredRecommendation[] {
    const recommendations: ScoredRecommendation[] = [];

    // Score each connection opportunity
    if (analysisResult.connectionOpportunities?.opportunities) {
      analysisResult.connectionOpportunities.opportunities.forEach((opportunity, index) => {
        const recommendation = this.scoreOpportunity(opportunity, analysisResult, index);
        recommendations.push(recommendation);
      });
    } else {
      // Create a default recommendation based on nearest connection point
      if (analysisResult.capacityAnalysis?.nearestConnectionPoint) {
        const defaultOpportunity = {
          longitude: 0, // Will be filled from nearest connection
          latitude: 0,
          suitabilityScore: 70, // Default
          availableCapacity: analysisResult.capacityAnalysis.nearestConnectionPoint.availableCapacity,
          connectionCostEstimate: 3000000, // Default €3M
          timeToConnect: '12-18 months',
          description: analysisResult.capacityAnalysis.nearestConnectionPoint.name
        };

        const recommendation = this.scoreOpportunity(defaultOpportunity, analysisResult, 0);
        recommendations.push(recommendation);
      }
    }

    // Sort by overall score
    return recommendations.sort((a, b) => b.overallScore - a.overallScore);
  }

  /**
   * Score individual connection opportunity
   */
  private scoreOpportunity(
    opportunity: any, 
    analysisResult: GridAnalysisResult, 
    index: number
  ): ScoredRecommendation {
    
    const oppId = `connection-${index + 1}`;
    
    // Extract relevant data
    const distanceKm = analysisResult.capacityAnalysis?.nearestConnectionPoint?.distanceKm || 5;
    const capacityMW = opportunity.availableCapacity || 100;
    const timelineMonths = this.extractTimelineMonths(opportunity.timeToConnect || '12-18 months');
    const costEur = opportunity.connectionCostEstimate || 3000000;
    const country = analysisResult.location.countryCode || 'FI';
    const primaryTSO = analysisResult.tsos?.[0];

    // Calculate factor scores (0-100)
    const factorScores = {
      distance: this.scoreDistance(distanceKm),
      capacity: this.scoreCapacity(capacityMW, 70), // Assuming 70MW requirement
      timeline: this.scoreTimeline(timelineMonths),
      cost: this.scoreCost(costEur),
      reliability: this.scoreReliability(analysisResult),
      tso: this.scoreTSO(primaryTSO),
      risk: this.scoreRisk(analysisResult)
    };

    // Apply weights
    const weightedScores = {
      distance: factorScores.distance * this.config.weights.distance,
      capacity: factorScores.capacity * this.config.weights.capacity,
      timeline: factorScores.timeline * this.config.weights.timeline,
      cost: factorScores.cost * this.config.weights.cost,
      reliability: factorScores.reliability * this.config.weights.reliability,
      tso: factorScores.tso * this.config.weights.tso,
      risk: factorScores.risk * this.config.weights.risk
    };

    // Calculate base score
    const baseScore = Object.values(weightedScores).reduce((sum, score) => sum + score, 0);

    // Apply regional adjustments
    const adjustedScore = this.applyRegionalAdjustments(baseScore, country);

    // Calculate bonus points and penalties
    const bonusPoints = this.calculateBonusPoints(analysisResult, opportunity);
    const penalties = this.calculatePenalties(analysisResult);

    // Final score (capped at 100)
    const overallScore = Math.min(100, Math.max(0, adjustedScore + bonusPoints - penalties));

    // Determine tier and generate recommendations
    const tier = this.determineTier(overallScore);
    const keyStrengths = this.identifyStrengths(factorScores, weightedScores);
    const concerns = this.identifyConcerns(factorScores, analysisResult);
    const recommendation = this.generateRecommendationText(tier, overallScore);
    const nextSteps = this.generateNextSteps(tier, factorScores, analysisResult);

    return {
      id: oppId,
      overallScore: Math.round(overallScore * 10) / 10,
      tier,
      factorScores,
      weightedScores,
      bonusPoints,
      penalties,
      recommendation,
      keyStrengths,
      concerns,
      nextSteps
    };
  }

  /**
   * Score distance factor
   */
  private scoreDistance(distanceKm: number): number {
    const thresholds = this.config.thresholds.distance;
    if (distanceKm <= thresholds.excellent) return 100;
    if (distanceKm <= thresholds.good) return 85;
    if (distanceKm <= thresholds.fair) return 60;
    return Math.max(0, 40 - (distanceKm - thresholds.fair) * 3);
  }

  /**
   * Score capacity factor
   */
  private scoreCapacity(availableMW: number, requiredMW: number): number {
    const ratio = availableMW / requiredMW;
    const thresholds = this.config.thresholds.capacity;
    
    if (ratio >= thresholds.excellent) return 100;
    if (ratio >= thresholds.good) return 85;
    if (ratio >= thresholds.fair) return 60;
    return Math.max(0, ratio * 50);
  }

  /**
   * Score timeline factor
   */
  private scoreTimeline(timelineMonths: number): number {
    const thresholds = this.config.thresholds.timeline;
    if (timelineMonths <= thresholds.excellent) return 100;
    if (timelineMonths <= thresholds.good) return 85;
    if (timelineMonths <= thresholds.fair) return 60;
    return Math.max(0, 40 - (timelineMonths - thresholds.fair) * 2);
  }

  /**
   * Score cost factor
   */
  private scoreCost(costEur: number): number {
    const costM = costEur / 1000000;
    const thresholds = this.config.thresholds.cost;
    
    if (costM <= thresholds.excellent) return 100;
    if (costM <= thresholds.good) return 85;
    if (costM <= thresholds.fair) return 60;
    return Math.max(0, 40 - (costM - thresholds.fair) * 5);
  }

  /**
   * Score reliability factor
   */
  private scoreReliability(analysisResult: GridAnalysisResult): number {
    let score = 70; // Base score
    
    // Check voltage level
    const voltage = analysisResult.capacityAnalysis?.nearestConnectionPoint?.voltage || 110;
    if (voltage >= 400) score += 20;
    else if (voltage >= 220) score += 10;
    else if (voltage >= 110) score += 5;
    
    // Check for redundancy (multiple connection points)
    if (analysisResult.connectionOpportunities?.opportunities?.length && 
        analysisResult.connectionOpportunities.opportunities.length > 1) {
      score += 10;
    }
    
    return Math.min(100, score);
  }

  /**
   * Score TSO factor
   */
  private scoreTSO(tso?: TSO): number {
    if (!tso) return 50;
    
    // Use configured TSO scores or default
    return this.config.tsoScores[tso.eicCode] || 
           this.config.tsoScores[tso.countryCode] || 
           70; // Default score
  }

  /**
   * Score risk factor
   */
  private scoreRisk(analysisResult: GridAnalysisResult): number {
    let riskScore = 80; // Start with good score, deduct for risks
    
    // Environmental risks
    if (analysisResult.constraints?.constraints) {
      const highRiskConstraints = analysisResult.constraints.constraints.filter(c => c.severity === 'high');
      const mediumRiskConstraints = analysisResult.constraints.constraints.filter(c => c.severity === 'medium');
      
      riskScore -= highRiskConstraints.length * 15;
      riskScore -= mediumRiskConstraints.length * 8;
    }
    
    // Distance risk
    const distance = analysisResult.capacityAnalysis?.nearestConnectionPoint?.distanceKm || 5;
    if (distance > 10) riskScore -= 10;
    else if (distance > 5) riskScore -= 5;
    
    return Math.max(0, riskScore);
  }

  /**
   * Apply regional adjustments
   */
  private applyRegionalAdjustments(baseScore: number, countryCode: string): number {
    const adjustments = this.config.regionalAdjustments[countryCode];
    if (!adjustments) return baseScore;
    
    return baseScore * adjustments.reliabilityMultiplier;
  }

  /**
   * Calculate bonus points
   */
  private calculateBonusPoints(analysisResult: GridAnalysisResult, opportunity: any): number {
    let bonus = 0;
    
    // High capacity bonus
    if (opportunity.availableCapacity > 200) bonus += 3;
    
    // Multiple TSOs bonus (cross-border opportunities)
    if (analysisResult.tsos && analysisResult.tsos.length > 1) bonus += 2;
    
    // Excellent suitability score bonus
    if (opportunity.suitabilityScore > 90) bonus += 2;
    
    return Math.min(10, bonus); // Cap at 10 points
  }

  /**
   * Calculate penalties
   */
  private calculatePenalties(analysisResult: GridAnalysisResult): number {
    let penalties = 0;
    
    // Missing data penalty
    if (!analysisResult.capacityAnalysis) penalties += 10;
    if (!analysisResult.transmissionLines) penalties += 5;
    if (!analysisResult.substations) penalties += 5;
    
    // Data quality penalty
    const dataAge = this.calculateDataAge(analysisResult.timestamp);
    if (dataAge > 365) penalties += 5; // > 1 year old
    else if (dataAge > 180) penalties += 3; // > 6 months old
    
    return penalties;
  }

  /**
   * Determine recommendation tier
   */
  private determineTier(score: number): 'excellent' | 'good' | 'fair' | 'poor' {
    if (score >= 80) return 'excellent';
    if (score >= 60) return 'good';
    if (score >= 40) return 'fair';
    return 'poor';
  }

  /**
   * Identify key strengths
   */
  private identifyStrengths(factorScores: any, weightedScores: any): string[] {
    const strengths: string[] = [];
    
    if (factorScores.distance >= 85) strengths.push('Excellent grid proximity');
    if (factorScores.capacity >= 85) strengths.push('Ample available capacity');
    if (factorScores.timeline >= 85) strengths.push('Fast connection timeline');
    if (factorScores.cost >= 85) strengths.push('Cost-effective connection');
    if (factorScores.tso >= 90) strengths.push('Highly reliable TSO');
    if (factorScores.reliability >= 85) strengths.push('Robust grid infrastructure');
    if (factorScores.risk >= 85) strengths.push('Low project risk');
    
    return strengths.slice(0, 3); // Top 3 strengths
  }

  /**
   * Identify concerns
   */
  private identifyConcerns(factorScores: any, analysisResult: GridAnalysisResult): string[] {
    const concerns: string[] = [];
    
    if (factorScores.distance < 60) concerns.push('Long distance to grid connection');
    if (factorScores.capacity < 60) concerns.push('Limited available capacity');
    if (factorScores.timeline < 60) concerns.push('Extended connection timeline');
    if (factorScores.cost < 60) concerns.push('High connection costs');
    if (factorScores.risk < 60) concerns.push('Elevated project risks');
    
    // Specific constraint concerns
    if (analysisResult.constraints?.constraints) {
      const highRiskConstraints = analysisResult.constraints.constraints.filter(c => c.severity === 'high');
      if (highRiskConstraints.length > 0) {
        concerns.push(`${highRiskConstraints.length} high-severity constraints identified`);
      }
    }
    
    return concerns.slice(0, 3); // Top 3 concerns
  }

  /**
   * Generate recommendation text
   */
  private generateRecommendationText(tier: string, score: number): string {
    switch (tier) {
      case 'excellent':
        return `Highly recommended (${score}/100). Proceed with detailed feasibility study and TSO engagement.`;
      case 'good':
        return `Recommended with conditions (${score}/100). Negotiate improvements and validate assumptions.`;
      case 'fair':
        return `Marginal viability (${score}/100). Detailed risk analysis and mitigation planning required.`;
      default:
        return `Not recommended (${score}/100). Significant improvements needed or alternative sites should be considered.`;
    }
  }

  /**
   * Generate next steps
   */
  private generateNextSteps(tier: string, factorScores: any, analysisResult: GridAnalysisResult): string[] {
    const steps: string[] = [];
    
    // Common first steps
    if (tier !== 'poor') {
      steps.push('Contact TSO for formal connection study');
    }
    
    // Specific steps based on concerns
    if (factorScores.capacity < 70) {
      steps.push('Verify actual available capacity with TSO');
    }
    
    if (factorScores.cost < 70) {
      steps.push('Request detailed connection cost breakdown');
    }
    
    if (factorScores.timeline < 70) {
      steps.push('Explore options to accelerate connection timeline');
    }
    
    if (analysisResult.constraints?.constraints?.length) {
      steps.push('Conduct detailed environmental and permitting assessment');
    }
    
    // Final steps
    if (tier === 'excellent' || tier === 'good') {
      steps.push('Prepare business case for management approval');
    }
    
    return steps.slice(0, 4); // Limit to 4 next steps
  }

  /**
   * Extract timeline in months from string
   */
  private extractTimelineMonths(timeString: string): number {
    const match = timeString.match(/(\d+)-?(\d+)?\s*months?/i);
    if (match) {
      const min = parseInt(match[1]);
      const max = match[2] ? parseInt(match[2]) : min;
      return (min + max) / 2;
    }
    return 12; // Default
  }

  /**
   * Calculate data age in days
   */
  private calculateDataAge(timestamp: string): number {
    const dataDate = new Date(timestamp);
    const now = new Date();
    return Math.floor((now.getTime() - dataDate.getTime()) / (1000 * 60 * 60 * 24));
  }

  /**
   * Get default configuration
   */
  private getDefaultConfig(): RecommendationConfig {
    return {
      weights: {
        distance: 0.20,
        capacity: 0.25,
        timeline: 0.15,
        cost: 0.10,
        reliability: 0.07,
        tso: 0.08,
        risk: 0.15
      },
      thresholds: {
        distance: { excellent: 2, good: 5, fair: 10 },
        capacity: { excellent: 2.0, good: 1.5, fair: 1.1 }, // Ratio to requirement
        timeline: { excellent: 12, good: 18, fair: 24 },
        cost: { excellent: 2, good: 4, fair: 8 } // Million EUR
      },
      regionalAdjustments: {
        'FI': { reliabilityMultiplier: 1.05, timelineAdjustment: -10, costAdjustment: 15 },
        'SE': { reliabilityMultiplier: 1.05, timelineAdjustment: -10, costAdjustment: 15 },
        'NO': { reliabilityMultiplier: 1.05, timelineAdjustment: -5, costAdjustment: 20 },
        'DK': { reliabilityMultiplier: 1.05, timelineAdjustment: -10, costAdjustment: 15 },
        'DE': { reliabilityMultiplier: 0.95, timelineAdjustment: 20, costAdjustment: 25 },
        'NL': { reliabilityMultiplier: 0.95, timelineAdjustment: 15, costAdjustment: 25 }
      },
      minimumRequirements: {
        minCapacityMW: 77, // 110% of 70MW requirement
        maxDistanceKm: 15,
        maxTimelineMonths: 36
      },
      tsoScores: {
        '10YFI-1--------U': 95, // Fingrid
        '10YSE-1--------K': 90, // Svenska Kraftnät
        '10YNO-0--------C': 87, // Statnett
        '10YDK-1--------W': 88, // Energinet
        '10Y1001A1001A83F': 85, // German TSOs
        '10YNL----------L': 83  // TenneT NL
      }
    };
  }

  /**
   * Update configuration
   */
  public updateConfig(config: Partial<RecommendationConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  public getConfig(): RecommendationConfig {
    return { ...this.config };
  }
}