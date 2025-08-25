/**
 * Site Scorecard Template for Phase 0 Screening
 * Professional 1-2 page summary with Go/No-Go recommendation
 */

import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';
import { SiteScore } from '../analysis/scoring-algorithm';
import { InfrastructureProximityResult } from '../../modules/proximity/infrastructure-analysis';

// Register fonts
Font.register({
  family: 'Inter',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2', fontWeight: 400 },
    { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuDyfAZ9hiA.woff2', fontWeight: 600 },
    { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuI6fAZ9hiA.woff2', fontWeight: 700 }
  ]
});

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Inter',
    fontSize: 10,
    padding: 40,
    backgroundColor: '#FFFFFF',
    color: '#1a1a1a'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottom: '2px solid #2563eb',
    paddingBottom: 10
  },
  title: {
    fontSize: 18,
    fontWeight: 700,
    color: '#1e40af'
  },
  subtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2
  },
  logo: {
    width: 80,
    height: 30
  },
  scoreContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20
  },
  scoreCard: {
    backgroundColor: '#f8fafc',
    padding: 15,
    borderRadius: 8,
    width: '30%',
    alignItems: 'center'
  },
  scoreValue: {
    fontSize: 36,
    fontWeight: 700,
    marginBottom: 5
  },
  scoreLabel: {
    fontSize: 10,
    color: '#6b7280',
    textAlign: 'center'
  },
  recommendationCard: {
    backgroundColor: '#f0f9ff',
    padding: 15,
    borderRadius: 8,
    width: '35%',
    alignItems: 'center'
  },
  recommendationText: {
    fontSize: 16,
    fontWeight: 700,
    marginBottom: 5
  },
  confidenceText: {
    fontSize: 10,
    color: '#6b7280'
  },
  section: {
    marginBottom: 15
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 600,
    marginBottom: 8,
    color: '#1e40af',
    borderBottom: '1px solid #e5e7eb',
    paddingBottom: 2
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  infoItem: {
    width: '48%',
    marginBottom: 8
  },
  infoLabel: {
    fontSize: 9,
    color: '#6b7280',
    marginBottom: 2
  },
  infoValue: {
    fontSize: 10,
    fontWeight: 500
  },
  riskMatrix: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15
  },
  riskColumn: {
    width: '23%'
  },
  riskHeader: {
    fontSize: 9,
    fontWeight: 600,
    textAlign: 'center',
    marginBottom: 8,
    color: '#374151'
  },
  riskIndicator: {
    padding: 8,
    borderRadius: 4,
    textAlign: 'center',
    marginBottom: 4
  },
  riskLabel: {
    fontSize: 8,
    textAlign: 'center',
    color: '#6b7280'
  },
  flagsList: {
    marginTop: 10
  },
  flagItem: {
    fontSize: 9,
    marginBottom: 3,
    paddingLeft: 8
  },
  criticalFlag: {
    color: '#dc2626'
  },
  strengthFlag: {
    color: '#059669'
  },
  costIndicators: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15
  },
  costItem: {
    width: '32%',
    backgroundColor: '#fafafa',
    padding: 10,
    borderRadius: 4,
    alignItems: 'center'
  },
  costValue: {
    fontSize: 14,
    fontWeight: 600,
    marginBottom: 2
  },
  costLabel: {
    fontSize: 8,
    color: '#6b7280',
    textAlign: 'center'
  },
  nextSteps: {
    backgroundColor: '#f8fafc',
    padding: 15,
    borderRadius: 8,
    marginTop: 15
  },
  nextStepsList: {
    marginTop: 8
  },
  nextStepItem: {
    fontSize: 9,
    marginBottom: 4,
    paddingLeft: 10
  },
  disclaimer: {
    backgroundColor: '#fef3c7',
    padding: 12,
    borderRadius: 6,
    marginTop: 20,
    border: '1px solid #f59e0b'
  },
  disclaimerTitle: {
    fontSize: 10,
    fontWeight: 600,
    color: '#92400e',
    marginBottom: 6
  },
  disclaimerText: {
    fontSize: 8,
    lineHeight: 1.3,
    color: '#92400e'
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 40,
    right: 40,
    fontSize: 8,
    color: '#9ca3af',
    textAlign: 'center',
    borderTop: '1px solid #e5e7eb',
    paddingTop: 8
  }
});

export interface ScorecardData {
  site: {
    id: string;
    name: string;
    location: string;
    coordinates: string;
    area: number; // hectares
    powerRequirement: number; // MW
  };
  assessment: {
    date: string;
    analyst: string;
    confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  };
  score: SiteScore;
  infrastructure: InfrastructureProximityResult;
  costIndicators: {
    infrastructureCost: string; // "€8-15M"
    timelineMonths: string; // "24-36"
    complexity: 'LOW' | 'MEDIUM' | 'HIGH';
  };
  dataSources: Array<{
    category: string;
    source: string;
    confidence: 'HIGH' | 'MEDIUM' | 'LOW';
    date?: string;
  }>;
}

const getRiskColor = (risk: 'LOW' | 'MEDIUM' | 'HIGH'): string => {
  switch (risk) {
    case 'LOW': return '#10b981';
    case 'MEDIUM': return '#f59e0b';
    case 'HIGH': return '#ef4444';
    default: return '#6b7280';
  }
};

const getRiskBackground = (risk: 'LOW' | 'MEDIUM' | 'HIGH'): string => {
  switch (risk) {
    case 'LOW': return '#dcfce7';
    case 'MEDIUM': return '#fef3c7';
    case 'HIGH': return '#fee2e2';
    default: return '#f3f4f6';
  }
};

const getRecommendationColor = (rec: 'PROCEED' | 'CAUTION' | 'AVOID'): string => {
  switch (rec) {
    case 'PROCEED': return '#10b981';
    case 'CAUTION': return '#f59e0b';
    case 'AVOID': return '#ef4444';
    default: return '#6b7280';
  }
};

export const SiteScorecard: React.FC<{ data: ScorecardData }> = ({ data }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>DATACENTER SITE SCORECARD</Text>
          <Text style={styles.subtitle}>Phase 0 Preliminary Assessment</Text>
        </View>
        <View>
          <Text style={{ fontSize: 9, color: '#6b7280' }}>
            Assessment Date: {data.assessment.date}
          </Text>
          <Text style={{ fontSize: 8, color: '#9ca3af' }}>
            Analyst: {data.assessment.analyst}
          </Text>
        </View>
      </View>

      {/* Site Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>SITE IDENTIFICATION</Text>
        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Site Name</Text>
            <Text style={styles.infoValue}>{data.site.name}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Location</Text>
            <Text style={styles.infoValue}>{data.site.location}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Coordinates</Text>
            <Text style={styles.infoValue}>{data.site.coordinates}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Site Area</Text>
            <Text style={styles.infoValue}>{data.site.area} hectares</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Power Requirement</Text>
            <Text style={styles.infoValue}>{data.site.powerRequirement} MW</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Assessment ID</Text>
            <Text style={styles.infoValue}>{data.site.id}</Text>
          </View>
        </View>
      </View>

      {/* Score Summary */}
      <View style={styles.scoreContainer}>
        <View style={styles.scoreCard}>
          <Text style={[styles.scoreValue, { color: '#2563eb' }]}>
            {data.score.overall}
          </Text>
          <Text style={styles.scoreLabel}>OVERALL SCORE{'\n'}(0-10 Scale)</Text>
        </View>
        <View style={styles.scoreCard}>
          <Text style={[styles.scoreValue, { color: '#6b7280', fontSize: 24 }]}>
            {data.score.criticalFlags.length}
          </Text>
          <Text style={styles.scoreLabel}>CRITICAL{'\n'}FLAGS</Text>
        </View>
        <View style={[styles.recommendationCard, { 
          backgroundColor: getRiskBackground(
            data.score.recommendation === 'PROCEED' ? 'LOW' : 
            data.score.recommendation === 'CAUTION' ? 'MEDIUM' : 'HIGH'
          )
        }]}>
          <Text style={[styles.recommendationText, { 
            color: getRecommendationColor(data.score.recommendation)
          }]}>
            {data.score.recommendation}
          </Text>
          <Text style={styles.confidenceText}>
            {data.score.confidence} Confidence
          </Text>
        </View>
      </View>

      {/* Risk Matrix */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>RISK ASSESSMENT MATRIX</Text>
        <View style={styles.riskMatrix}>
          <View style={styles.riskColumn}>
            <Text style={styles.riskHeader}>INFRASTRUCTURE</Text>
            <View style={[styles.riskIndicator, { 
              backgroundColor: getRiskBackground(data.infrastructure.power.riskLevel),
              borderLeft: `4px solid ${getRiskColor(data.infrastructure.power.riskLevel)}`
            }]}>
              <Text style={{ fontSize: 10, fontWeight: 600 }}>
                {data.score.infrastructure.toFixed(1)}
              </Text>
            </View>
            <Text style={styles.riskLabel}>
              Power: {Math.round(data.infrastructure.power.nearestSubstation.distance/1000)}km
            </Text>
            <Text style={styles.riskLabel}>
              Fiber: {Math.round(data.infrastructure.fiber.backboneDistance/1000)}km
            </Text>
          </View>

          <View style={styles.riskColumn}>
            <Text style={styles.riskHeader}>ENVIRONMENTAL</Text>
            <View style={[styles.riskIndicator, { 
              backgroundColor: '#f0f9ff',
              borderLeft: '4px solid #2563eb'
            }]}>
              <Text style={{ fontSize: 10, fontWeight: 600 }}>
                {data.score.environmental.toFixed(1)}
              </Text>
            </View>
            <Text style={styles.riskLabel}>Flood Risk</Text>
            <Text style={styles.riskLabel}>Protected Areas</Text>
          </View>

          <View style={styles.riskColumn}>
            <Text style={styles.riskHeader}>REGULATORY</Text>
            <View style={[styles.riskIndicator, { 
              backgroundColor: '#f0f9ff',
              borderLeft: '4px solid #2563eb'
            }]}>
              <Text style={{ fontSize: 10, fontWeight: 600 }}>
                {data.score.regulatory.toFixed(1)}
              </Text>
            </View>
            <Text style={styles.riskLabel}>Zoning Status</Text>
            <Text style={styles.riskLabel}>Permits Required</Text>
          </View>

          <View style={styles.riskColumn}>
            <Text style={styles.riskHeader}>TECHNICAL</Text>
            <View style={[styles.riskIndicator, { 
              backgroundColor: '#f0f9ff',
              borderLeft: '4px solid #2563eb'
            }]}>
              <Text style={{ fontSize: 10, fontWeight: 600 }}>
                {data.score.technical.toFixed(1)}
              </Text>
            </View>
            <Text style={styles.riskLabel}>Seismic/Geotech</Text>
            <Text style={styles.riskLabel}>Aviation/Heritage</Text>
          </View>
        </View>
      </View>

      {/* Cost Indicators */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>DEVELOPMENT INDICATORS</Text>
        <View style={styles.costIndicators}>
          <View style={styles.costItem}>
            <Text style={styles.costValue}>{data.costIndicators.infrastructureCost}</Text>
            <Text style={styles.costLabel}>INFRASTRUCTURE{'\n'}INVESTMENT</Text>
          </View>
          <View style={styles.costItem}>
            <Text style={styles.costValue}>{data.costIndicators.timelineMonths}mo</Text>
            <Text style={styles.costLabel}>ESTIMATED{'\n'}TIMELINE</Text>
          </View>
          <View style={styles.costItem}>
            <Text style={[styles.costValue, { 
              color: data.costIndicators.complexity === 'LOW' ? '#10b981' :
                     data.costIndicators.complexity === 'MEDIUM' ? '#f59e0b' : '#ef4444'
            }]}>
              {data.costIndicators.complexity}
            </Text>
            <Text style={styles.costLabel}>PROJECT{'\n'}COMPLEXITY</Text>
          </View>
        </View>
      </View>

      {/* Critical Issues & Strengths */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>KEY FINDINGS</Text>
        
        {data.score.criticalFlags.length > 0 && (
          <View style={styles.flagsList}>
            <Text style={{ fontSize: 10, fontWeight: 600, color: '#dc2626', marginBottom: 4 }}>
              Critical Issues:
            </Text>
            {data.score.criticalFlags.map((flag, index) => (
              <Text key={index} style={[styles.flagItem, styles.criticalFlag]}>
                • {flag}
              </Text>
            ))}
          </View>
        )}

        {data.score.strengthFlags.length > 0 && (
          <View style={styles.flagsList}>
            <Text style={{ fontSize: 10, fontWeight: 600, color: '#059669', marginBottom: 4 }}>
              Site Strengths:
            </Text>
            {data.score.strengthFlags.map((flag, index) => (
              <Text key={index} style={[styles.flagItem, styles.strengthFlag]}>
                • {flag}
              </Text>
            ))}
          </View>
        )}
      </View>

      {/* Next Steps */}
      <View style={styles.nextSteps}>
        <Text style={[styles.sectionTitle, { color: '#1f2937', marginBottom: 6 }]}>
          RECOMMENDED NEXT STEPS
        </Text>
        <View style={styles.nextStepsList}>
          {data.score.recommendation === 'PROCEED' && (
            <>
              <Text style={styles.nextStepItem}>
                1. Commission detailed geotechnical investigation
              </Text>
              <Text style={styles.nextStepItem}>
                2. Initiate grid connection discussions with TSO
              </Text>
              <Text style={styles.nextStepItem}>
                3. Begin environmental baseline studies
              </Text>
              <Text style={styles.nextStepItem}>
                4. Engage local planning authorities
              </Text>
            </>
          )}
          {data.score.recommendation === 'CAUTION' && (
            <>
              <Text style={styles.nextStepItem}>
                1. Address critical infrastructure gaps identified
              </Text>
              <Text style={styles.nextStepItem}>
                2. Conduct detailed feasibility for high-risk areas
              </Text>
              <Text style={styles.nextStepItem}>
                3. Develop risk mitigation strategies
              </Text>
              <Text style={styles.nextStepItem}>
                4. Validate cost estimates with professional consultants
              </Text>
            </>
          )}
          {data.score.recommendation === 'AVOID' && (
            <>
              <Text style={styles.nextStepItem}>
                1. Consider alternative sites in region
              </Text>
              <Text style={styles.nextStepItem}>
                2. Re-evaluate if project requirements can be modified
              </Text>
              <Text style={styles.nextStepItem}>
                3. Archive analysis for future reference
              </Text>
            </>
          )}
        </View>
      </View>

      {/* Professional Disclaimer */}
      <View style={styles.disclaimer}>
        <Text style={styles.disclaimerTitle}>PRELIMINARY ASSESSMENT NOTICE</Text>
        <Text style={styles.disclaimerText}>
          This analysis represents initial desktop research based on publicly available data sources. 
          It is intended for site screening purposes only and should not be relied upon for investment 
          decisions or detailed planning activities. Accuracy: ±20-30% for cost estimates and timeline 
          projections. Sites recommended as "PROCEED" require comprehensive Phase 1 due diligence 
          including field investigations and professional engineering review before any investment commitment.
        </Text>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text>
          Generated by Pre-DD Intelligence Platform | Valid for 6 months from assessment date | 
          Data sources: {data.dataSources.map(s => s.source).join(', ')}
        </Text>
      </View>
    </Page>
  </Document>
);

export default SiteScorecard;