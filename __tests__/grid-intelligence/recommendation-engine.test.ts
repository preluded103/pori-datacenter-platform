/**
 * Test suite for Grid Recommendation Engine
 * Tests scoring algorithms, weight configurations, and recommendation logic
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { 
  GridRecommendationEngine,
  RecommendationConfig,
  ScoredRecommendation,
  ConnectionOpportunity
} from '@/lib/grid-intelligence/recommendation-engine';
import { GridAnalysisResult } from '@/lib/types/grid-types';

// Test data fixtures
const createMockConnectionOpportunity = (overrides: Partial<ConnectionOpportunity> = {}): ConnectionOpportunity => ({
  id: 'test-connection-1',
  name: 'Test Substation Connection',
  tsoName: 'Fingrid',
  country: 'Finland',
  distanceKm: 3.5,
  availableCapacityMW: 120,
  connectionVoltagekV: 110,
  estimatedTimelineMonths: 15,
  estimatedCostEUR: 3500000,
  connectionPoint: {
    id: 'sub-123',
    name: 'Test Substation',
    coordinates: [24.9384, 60.1699], // Helsinki
    type: 'substation',
    voltage: 110,
    operator: 'Fingrid'
  },
  technicalRequirements: {
    minimumCapacityMW: 70,
    preferredVoltagekV: 110,
    redundancyRequired: true
  },
  reliability: {
    historicalOutageHours: 2.5,
    redundantPaths: 2,
    emergencyResponseTime: 30
  },
  risks: {
    permittingRisk: 'Low',
    technicalComplexity: 'Medium',
    environmentalRisk: 'Low',
    commercialRisk: 'Low'
  },
  futureExpansionPotential: 150,
  renewableIntegrationScore: 85,
  strategicValue: 'High',
  ...overrides
});

const createMockAnalysisResult = (opportunities: ConnectionOpportunity[] = []): GridAnalysisResult => ({
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
  connectionOpportunities: opportunities,
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

describe('GridRecommendationEngine', () => {
  let engine: GridRecommendationEngine;
  let mockAnalysisResult: GridAnalysisResult;

  beforeEach(() => {
    engine = new GridRecommendationEngine();
    
    // Create mock data with varied characteristics for testing
    const opportunities = [
      createMockConnectionOpportunity({
        id: 'excellent-close',
        name: 'Excellent Close Connection',
        distanceKm: 1.5, // Excellent
        availableCapacityMW: 150, // Good buffer
        estimatedTimelineMonths: 10, // Excellent
        estimatedCostEUR: 1500000 // Excellent
      }),
      createMockConnectionOpportunity({
        id: 'good-medium',
        name: 'Good Medium Distance',
        distanceKm: 4.0, // Good
        availableCapacityMW: 100, // Fair
        estimatedTimelineMonths: 16, // Good
        estimatedCostEUR: 3000000 // Good
      }),
      createMockConnectionOpportunity({
        id: 'fair-expensive',
        name: 'Fair but Expensive',
        distanceKm: 8.0, // Fair
        availableCapacityMW: 80, // Poor
        estimatedTimelineMonths: 20, // Fair
        estimatedCostEUR: 6000000 // Fair
      }),
      createMockConnectionOpportunity({
        id: 'poor-distant',
        name: 'Poor Distant Connection',
        distanceKm: 12.0, // Poor
        availableCapacityMW: 75, // Poor
        estimatedTimelineMonths: 30, // Poor
        estimatedCostEUR: 9000000 // Poor
      })
    ];

    mockAnalysisResult = createMockAnalysisResult(opportunities);
  });

  describe('Configuration Management', () => {
    it('should use default configuration', () => {
      const config = engine.getConfig();
      expect(config).toBeDefined();
      expect(config.weights).toBeDefined();
      expect(config.thresholds).toBeDefined();
      expect(config.minimumRequirements).toBeDefined();
    });

    it('should update configuration', () => {
      const newConfig: Partial<RecommendationConfig> = {
        weights: {
          distance: 0.30,
          capacity: 0.20,
          timeline: 0.15,
          cost: 0.15,
          reliability: 0.10,
          tsoQuality: 0.05,
          risk: 0.05
        }
      };

      engine.updateConfig(newConfig);
      const config = engine.getConfig();
      
      expect(config.weights.distance).toBe(0.30);
      expect(config.weights.capacity).toBe(0.20);
    });

    it('should allow custom configuration in constructor', () => {
      const customEngine = new GridRecommendationEngine({
        weights: {
          distance: 0.15,
          capacity: 0.30, // Higher capacity weight
          timeline: 0.20,
          cost: 0.15,
          reliability: 0.10,
          tso: 0.05,
          risk: 0.05
        }
      });
      
      const config = customEngine.getConfig();
      expect(config.weights.capacity).toBe(0.30);
      expect(config.weights.timeline).toBe(0.20);
    });

    it('should validate configuration updates', () => {
      const newConfig: Partial<RecommendationConfig> = {
        weights: {
          distance: 0.25,
          capacity: 0.20,
          timeline: 0.15,
          cost: 0.15,
          reliability: 0.10,
          tso: 0.10,
          risk: 0.05
        }
      };

      expect(() => engine.updateConfig(newConfig)).not.toThrow();
      
      const config = engine.getConfig();
      expect(config.weights.distance).toBe(0.25);
    });
  });

  describe('Scoring Algorithm', () => {
    it('should score distance factor correctly', () => {
      const recommendations = engine.generateRecommendations(mockAnalysisResult);
      
      // Find our test connections
      const excellent = recommendations.find(r => r.opportunity.id === 'excellent-close');
      const poor = recommendations.find(r => r.opportunity.id === 'poor-distant');
      
      expect(excellent?.scores.distance).toBeGreaterThan(poor?.scores.distance || 0);
      expect(excellent?.scores.distance).toBeGreaterThanOrEqual(90); // Should be excellent range
      expect(poor?.scores.distance).toBeLessThan(50); // Should be poor range
    });

    it('should score capacity factor correctly', () => {
      const recommendations = engine.generateRecommendations(mockAnalysisResult);
      
      const highCapacity = recommendations.find(r => r.opportunity.availableCapacityMW === 150);
      const lowCapacity = recommendations.find(r => r.opportunity.availableCapacityMW === 75);
      
      expect(highCapacity?.scores.capacity).toBeGreaterThan(lowCapacity?.scores.capacity || 0);
    });

    it('should score timeline factor correctly', () => {
      const recommendations = engine.generateRecommendations(mockAnalysisResult);
      
      const fastTimeline = recommendations.find(r => r.opportunity.estimatedTimelineMonths === 10);
      const slowTimeline = recommendations.find(r => r.opportunity.estimatedTimelineMonths === 30);
      
      expect(fastTimeline?.scores.timeline).toBeGreaterThan(slowTimeline?.scores.timeline || 0);
    });

    it('should score cost factor correctly', () => {
      const recommendations = engine.generateRecommendations(mockAnalysisResult);
      
      const lowCost = recommendations.find(r => r.opportunity.estimatedCostEUR === 1500000);
      const highCost = recommendations.find(r => r.opportunity.estimatedCostEUR === 9000000);
      
      expect(lowCost?.scores.cost).toBeGreaterThan(highCost?.scores.cost || 0);
    });

    it('should apply weighted scoring correctly', () => {
      // Test with cost-optimized config (high cost weight)
      engine.applyPreset('Cost-Optimized');
      const recommendations = engine.generateRecommendations(mockAnalysisResult);
      
      // Should rank low-cost options higher
      const lowCost = recommendations.find(r => r.opportunity.estimatedCostEUR === 1500000);
      const highCost = recommendations.find(r => r.opportunity.estimatedCostEUR === 9000000);
      
      expect(lowCost?.finalScore).toBeGreaterThan(highCost?.finalScore || 0);
    });
  });

  describe('Regional Adjustments', () => {
    it('should apply Nordic bonus for Finnish connections', () => {
      const recommendations = engine.generateRecommendations(mockAnalysisResult);
      
      // All opportunities are Finnish, so all should get Nordic bonus
      recommendations.forEach(rec => {
        expect(rec.adjustments?.regional).toBeGreaterThan(0);
        expect(rec.adjustments?.description).toContain('Nordic');
      });
    });

    it('should apply different adjustments for Central European countries', () => {
      // Create German analysis result
      const germanResult = createMockAnalysisResult([
        createMockConnectionOpportunity({
          country: 'Germany',
          tsoName: 'TenneT'
        })
      ]);

      const recommendations = engine.generateRecommendations(germanResult);
      
      expect(recommendations[0].adjustments?.regional).toBeLessThan(0); // Should be penalty
      expect(recommendations[0].adjustments?.description).toContain('Central Europe');
    });
  });

  describe('Bonus Factors', () => {
    it('should apply future expansion bonus', () => {
      const highExpansionOpportunity = createMockConnectionOpportunity({
        futureExpansionPotential: 200, // High expansion potential
        availableCapacityMW: 100
      });

      const result = createMockAnalysisResult([highExpansionOpportunity]);
      const recommendations = engine.generateRecommendations(result);
      
      expect(recommendations[0].bonuses?.futureExpansion).toBeGreaterThan(0);
    });

    it('should apply renewable integration bonus', () => {
      const renewableFriendlyOpportunity = createMockConnectionOpportunity({
        renewableIntegrationScore: 95 // High renewable integration
      });

      const result = createMockAnalysisResult([renewableFriendlyOpportunity]);
      const recommendations = engine.generateRecommendations(result);
      
      expect(recommendations[0].bonuses?.renewableIntegration).toBeGreaterThan(0);
    });

    it('should apply strategic location bonus', () => {
      const strategicOpportunity = createMockConnectionOpportunity({
        strategicValue: 'High'
      });

      const result = createMockAnalysisResult([strategicOpportunity]);
      const recommendations = engine.generateRecommendations(result);
      
      expect(recommendations[0].bonuses?.strategicLocation).toBeGreaterThan(0);
    });
  });

  describe('Recommendation Tiers', () => {
    it('should classify recommendations into correct tiers', () => {
      const recommendations = engine.generateRecommendations(mockAnalysisResult);
      
      // Sort by score to check tier assignments
      const sorted = recommendations.sort((a, b) => b.finalScore - a.finalScore);
      
      // Highest scoring should be Tier 1 (if score >= 80)
      const highest = sorted[0];
      if (highest.finalScore >= 80) {
        expect(highest.tier).toBe(1);
        expect(highest.recommendation).toContain('Proceed with detailed feasibility');
      }
      
      // Lowest scoring should be lower tier
      const lowest = sorted[sorted.length - 1];
      expect(lowest.tier).toBeGreaterThanOrEqual(2);
    });

    it('should provide appropriate recommendations for each tier', () => {
      const recommendations = engine.generateRecommendations(mockAnalysisResult);
      
      recommendations.forEach(rec => {
        switch (rec.tier) {
          case 1:
            expect(rec.recommendation).toContain('Proceed with detailed feasibility');
            break;
          case 2:
            expect(rec.recommendation).toContain('Conditional proceed');
            break;
          case 3:
            expect(rec.recommendation).toContain('Detailed risk analysis');
            break;
          case 4:
            expect(rec.recommendation).toContain('Not recommended');
            break;
        }
      });
    });
  });

  describe('Minimum Qualifying Thresholds', () => {
    it('should filter out connections below minimum capacity', () => {
      const belowMinimum = createMockConnectionOpportunity({
        availableCapacityMW: 60 // Below 77 MW minimum
      });

      const result = createMockAnalysisResult([belowMinimum]);
      const recommendations = engine.generateRecommendations(result);
      
      expect(recommendations).toHaveLength(0); // Should be filtered out
    });

    it('should filter out connections too far away', () => {
      const tooFar = createMockConnectionOpportunity({
        distanceKm: 20 // Above 15 km maximum
      });

      const result = createMockAnalysisResult([tooFar]);
      const recommendations = engine.generateRecommendations(result);
      
      expect(recommendations).toHaveLength(0); // Should be filtered out
    });

    it('should filter out connections with excessive timeline', () => {
      const tooSlow = createMockConnectionOpportunity({
        estimatedTimelineMonths: 40 // Above 36 months maximum
      });

      const result = createMockAnalysisResult([tooSlow]);
      const recommendations = engine.generateRecommendations(result);
      
      expect(recommendations).toHaveLength(0); // Should be filtered out
    });
  });

  describe('TSO Quality Scoring', () => {
    it('should score TSOs according to quality matrix', () => {
      const fingridConnection = createMockConnectionOpportunity({
        tsoName: 'Fingrid',
        country: 'Finland'
      });

      const tennetConnection = createMockConnectionOpportunity({
        tsoName: 'TenneT NL',
        country: 'Netherlands'  
      });

      const fingridResult = createMockAnalysisResult([fingridConnection]);
      const tennetResult = createMockAnalysisResult([tennetConnection]);

      const fingridRecs = engine.generateRecommendations(fingridResult);
      const tennetRecs = engine.generateRecommendations(tennetResult);

      // Fingrid should score higher than TenneT NL according to our quality matrix
      expect(fingridRecs[0].scores.tsoQuality).toBeGreaterThan(tennetRecs[0].scores.tsoQuality);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty connection opportunities', () => {
      const emptyResult = createMockAnalysisResult([]);
      const recommendations = engine.generateRecommendations(emptyResult);
      
      expect(recommendations).toHaveLength(0);
    });

    it('should handle missing optional fields gracefully', () => {
      const minimalOpportunity: ConnectionOpportunity = {
        id: 'minimal',
        name: 'Minimal Connection',
        tsoName: 'Fingrid',
        country: 'Finland',
        distanceKm: 5,
        availableCapacityMW: 100,
        connectionVoltagekV: 110,
        estimatedTimelineMonths: 18,
        estimatedCostEUR: 4000000,
        connectionPoint: {
          id: 'sub-minimal',
          name: 'Minimal Sub',
          coordinates: [0, 0],
          type: 'substation',
          voltage: 110,
          operator: 'Fingrid'
        },
        technicalRequirements: {
          minimumCapacityMW: 70,
          preferredVoltagekV: 110,
          redundancyRequired: false
        }
        // Missing optional fields like reliability, risks, etc.
      };

      const result = createMockAnalysisResult([minimalOpportunity]);
      
      expect(() => engine.generateRecommendations(result)).not.toThrow();
      
      const recommendations = engine.generateRecommendations(result);
      expect(recommendations).toHaveLength(1);
      expect(recommendations[0].finalScore).toBeGreaterThan(0);
    });

    it('should cap final scores at 100', () => {
      // Create an artificially perfect opportunity
      const perfectOpportunity = createMockConnectionOpportunity({
        distanceKm: 0.5, // Excellent
        availableCapacityMW: 300, // Excellent  
        estimatedTimelineMonths: 6, // Excellent
        estimatedCostEUR: 500000, // Excellent
        futureExpansionPotential: 500, // High bonus
        renewableIntegrationScore: 100, // High bonus
        strategicValue: 'High' // High bonus
      });

      const result = createMockAnalysisResult([perfectOpportunity]);
      const recommendations = engine.generateRecommendations(result);
      
      expect(recommendations[0].finalScore).toBeLessThanOrEqual(100);
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle large numbers of connection opportunities', () => {
      // Generate 100 connection opportunities
      const manyOpportunities = Array.from({ length: 100 }, (_, i) =>
        createMockConnectionOpportunity({
          id: `connection-${i}`,
          name: `Connection ${i}`,
          distanceKm: Math.random() * 15,
          availableCapacityMW: 77 + Math.random() * 200,
          estimatedTimelineMonths: 12 + Math.random() * 24,
          estimatedCostEUR: 1000000 + Math.random() * 8000000
        })
      );

      const result = createMockAnalysisResult(manyOpportunities);
      
      const startTime = Date.now();
      const recommendations = engine.generateRecommendations(result);
      const endTime = Date.now();
      
      expect(recommendations).toHaveLength(100);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });
  });
});