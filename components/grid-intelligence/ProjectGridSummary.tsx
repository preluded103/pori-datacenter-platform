/**
 * Project Grid Summary Component
 * Enhanced project summary with comprehensive grid intelligence sections
 */

'use client';

import React, { useState, useEffect } from 'react';
import { 
  Zap, AlertTriangle, CheckCircle, Clock, TrendingUp, 
  MapPin, DollarSign, Calendar, Phone, ExternalLink,
  ChevronDown, ChevronUp, Info, Layers, BarChart3
} from 'lucide-react';
import { GridAnalysisResult, TSO, ProjectGridSummary as IProjectGridSummary } from '@/lib/types/grid-types';

interface ProjectGridSummaryProps {
  projectId: string;
  analysisResult?: GridAnalysisResult;
  className?: string;
}

interface SummarySection {
  id: string;
  title: string;
  icon: React.ComponentType<any>;
  expanded: boolean;
  priority: 'high' | 'medium' | 'low';
}

export default function ProjectGridSummary({ 
  projectId, 
  analysisResult, 
  className = '' 
}: ProjectGridSummaryProps) {
  
  const [sections, setSections] = useState<SummarySection[]>([
    { id: 'overview', title: 'Grid Overview', icon: Zap, expanded: true, priority: 'high' },
    { id: 'capacity', title: 'Available Capacity', icon: BarChart3, expanded: true, priority: 'high' },
    { id: 'connections', title: 'Connection Points', icon: MapPin, expanded: false, priority: 'medium' },
    { id: 'timeline', title: 'Connection Timeline', icon: Clock, expanded: false, priority: 'medium' },
    { id: 'costs', title: 'Cost Analysis', icon: DollarSign, expanded: false, priority: 'medium' },
    { id: 'tsos', title: 'TSO Contacts', icon: Phone, expanded: false, priority: 'low' },
    { id: 'risks', title: 'Risk Assessment', icon: AlertTriangle, expanded: false, priority: 'medium' }
  ]);

  const [gridSummary, setGridSummary] = useState<IProjectGridSummary | null>(null);

  // Generate summary from analysis result
  useEffect(() => {
    if (analysisResult) {
      const summary: IProjectGridSummary = {
        projectId,
        gridAnalysisId: analysisResult.analysisId,
        lastAnalyzed: analysisResult.timestamp,
        
        // Calculate summary stats
        suitabilityScore: analysisResult.summary?.overallSuitabilityScore || 0,
        nearestConnectionKm: analysisResult.capacityAnalysis?.nearestConnectionPoint?.distanceKm || 0,
        availableCapacityMW: analysisResult.capacityAnalysis?.totalAvailableCapacity || 0,
        estimatedTimelineMonths: calculateTimelineMonths(analysisResult),
        
        // Extract key information
        primaryTSO: analysisResult.tsos?.[0],
        recommendedConnectionPoint: analysisResult.capacityAnalysis?.nearestConnectionPoint?.name,
        majorConstraints: extractMajorConstraints(analysisResult),
        keyRequirements: analysisResult.summary?.nextSteps || [],
        
        analysisStatus: 'completed',
        needsRefresh: false
      };
      
      setGridSummary(summary);
    }
  }, [analysisResult, projectId]);

  const toggleSection = (sectionId: string) => {
    setSections(prev => 
      prev.map(section => 
        section.id === sectionId 
          ? { ...section, expanded: !section.expanded }
          : section
      )
    );
  };

  const getSuitabilityColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getSuitabilityLabel = (score: number) => {
    if (score >= 80) return 'EXCELLENT';
    if (score >= 60) return 'GOOD';
    if (score >= 40) return 'FAIR';
    return 'POOR';
  };

  if (!analysisResult && !gridSummary) {
    return (
      <div className={`bg-[#1a1a1f]/80 p-4 rounded-lg backdrop-blur-sm ${className}`}>
        <div className="flex items-center space-x-3 mb-3">
          <Zap className="w-5 h-5 text-blue-400" />
          <h3 className="font-semibold text-[#fafafa]">Grid Intelligence</h3>
        </div>
        <div className="text-center py-8">
          <div className="w-12 h-12 bg-[#27272a] rounded-full flex items-center justify-center mx-auto mb-3">
            <Zap className="w-6 h-6 text-[#71717a]" />
          </div>
          <p className="text-sm text-[#a1a1aa] mb-2">No grid analysis available</p>
          <p className="text-xs text-[#71717a]">Draw a polygon on the map to analyze grid infrastructure</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Grid Overview Section */}
      {sections.find(s => s.id === 'overview')?.expanded && (
        <div className="bg-[#1a1a1f]/80 p-4 rounded-lg backdrop-blur-sm">
          <button
            onClick={() => toggleSection('overview')}
            className="flex items-center justify-between w-full mb-3 hover:text-blue-400 transition-colors"
          >
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4 text-blue-400" />
              <h3 className="font-semibold text-[#fafafa]">Grid Overview</h3>
            </div>
            <ChevronUp className="w-4 h-4" />
          </button>
          
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="text-center">
              <div className={`text-2xl font-bold ${getSuitabilityColor(gridSummary?.suitabilityScore || 0)}`}>
                {gridSummary?.suitabilityScore || 0}/100
              </div>
              <div className="text-xs text-[#a1a1aa]">Grid Suitability</div>
              <div className={`text-xs px-2 py-1 rounded mt-1 ${
                (gridSummary?.suitabilityScore || 0) >= 80 
                  ? 'bg-green-600/20 text-green-400' 
                  : (gridSummary?.suitabilityScore || 0) >= 60 
                    ? 'bg-yellow-600/20 text-yellow-400'
                    : 'bg-red-600/20 text-red-400'
              }`}>
                {getSuitabilityLabel(gridSummary?.suitabilityScore || 0)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[#fafafa]">
                {gridSummary?.nearestConnectionKm?.toFixed(1) || 'N/A'} km
              </div>
              <div className="text-xs text-[#a1a1aa]">Nearest Connection</div>
              <div className="text-xs text-[#71717a] mt-1">
                {gridSummary?.recommendedConnectionPoint || 'Unknown'}
              </div>
            </div>
          </div>

          <div className="text-xs text-[#71717a]">
            Primary TSO: {gridSummary?.primaryTSO?.name || 'Unknown'}
          </div>
          <div className="text-xs text-[#71717a]">
            Last analyzed: {gridSummary?.lastAnalyzed ? new Date(gridSummary.lastAnalyzed).toLocaleDateString() : 'Never'}
          </div>
        </div>
      )}

      {/* Available Capacity Section */}
      {sections.find(s => s.id === 'capacity')?.expanded && (
        <div className="bg-[#1a1a1f]/80 p-4 rounded-lg backdrop-blur-sm">
          <button
            onClick={() => toggleSection('capacity')}
            className="flex items-center justify-between w-full mb-3 hover:text-blue-400 transition-colors"
          >
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4 text-green-400" />
              <h3 className="font-semibold text-[#fafafa]">Available Capacity</h3>
            </div>
            <ChevronUp className="w-4 h-4" />
          </button>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-[#fafafa]">Total Available</span>
              <span className="text-sm font-mono text-green-400">
                {gridSummary?.availableCapacityMW || 0} MW
              </span>
            </div>
            
            {analysisResult?.capacityAnalysis?.nearestConnectionPoint && (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[#fafafa]">Nearest Point</span>
                  <span className="text-sm font-mono text-[#a1a1aa]">
                    {analysisResult.capacityAnalysis.nearestConnectionPoint.availableCapacity} MW
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[#fafafa]">Voltage Level</span>
                  <span className="text-sm font-mono text-[#a1a1aa]">
                    {analysisResult.capacityAnalysis.nearestConnectionPoint.voltage} kV
                  </span>
                </div>
              </>
            )}
            
            {analysisResult?.capacityAnalysis?.gridPoints && analysisResult.capacityAnalysis.gridPoints.length > 1 && (
              <div className="pt-2 border-t border-[#27272a]">
                <div className="text-xs text-[#a1a1aa] mb-2">Alternative Connection Points:</div>
                <div className="space-y-1">
                  {analysisResult.capacityAnalysis.gridPoints.slice(1, 3).map((point, idx) => (
                    <div key={idx} className="flex justify-between text-xs">
                      <span className="text-[#71717a]">
                        {point.voltage} @ {point.distanceKm.toFixed(1)}km
                      </span>
                      <span className="text-[#71717a]">{point.availableCapacity} MW</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Connection Points Section */}
      <div className="bg-[#1a1a1f]/80 p-4 rounded-lg backdrop-blur-sm">
        <button
          onClick={() => toggleSection('connections')}
          className="flex items-center justify-between w-full hover:text-blue-400 transition-colors"
        >
          <div className="flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-purple-400" />
            <h3 className="font-semibold text-[#fafafa]">Connection Points</h3>
            <span className="text-xs text-[#71717a] bg-[#27272a] px-2 py-1 rounded">
              {analysisResult?.connectionOpportunities?.opportunities?.length || 0}
            </span>
          </div>
          {sections.find(s => s.id === 'connections')?.expanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>
        
        {sections.find(s => s.id === 'connections')?.expanded && analysisResult?.connectionOpportunities && (
          <div className="mt-3 space-y-2">
            {analysisResult.connectionOpportunities.opportunities.slice(0, 3).map((opp, idx) => (
              <div key={idx} className="flex justify-between items-center py-2 border-b border-[#27272a] last:border-b-0">
                <div>
                  <div className="text-sm text-[#fafafa]">Option {idx + 1}</div>
                  <div className="text-xs text-[#71717a]">{opp.availableCapacity} MW</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-mono text-green-400">{opp.suitabilityScore}/100</div>
                  <div className="text-xs text-[#71717a]">{opp.timeToConnect}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Timeline Section */}
      <div className="bg-[#1a1a1f]/80 p-4 rounded-lg backdrop-blur-sm">
        <button
          onClick={() => toggleSection('timeline')}
          className="flex items-center justify-between w-full hover:text-blue-400 transition-colors"
        >
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-blue-400" />
            <h3 className="font-semibold text-[#fafafa]">Connection Timeline</h3>
          </div>
          {sections.find(s => s.id === 'timeline')?.expanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>
        
        {sections.find(s => s.id === 'timeline')?.expanded && (
          <div className="mt-3 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-[#fafafa]">Estimated Timeline</span>
              <span className="text-sm font-mono text-blue-400">
                {gridSummary?.estimatedTimelineMonths || 'TBD'} months
              </span>
            </div>
            
            {analysisResult?.connectionOpportunities?.opportunities?.[0] && (
              <div className="text-xs text-[#71717a]">
                Fastest connection: {analysisResult.connectionOpportunities.opportunities[0].timeToConnect}
              </div>
            )}
            
            <div className="space-y-2 pt-2 border-t border-[#27272a]">
              <div className="text-xs text-[#a1a1aa]">Typical phases:</div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-[#71717a]">Planning & Permits</span>
                  <span className="text-[#71717a]">3-6 months</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#71717a]">TSO Application</span>
                  <span className="text-[#71717a]">2-4 months</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#71717a]">Construction</span>
                  <span className="text-[#71717a]">6-12 months</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Cost Analysis Section */}
      <div className="bg-[#1a1a1f]/80 p-4 rounded-lg backdrop-blur-sm">
        <button
          onClick={() => toggleSection('costs')}
          className="flex items-center justify-between w-full hover:text-blue-400 transition-colors"
        >
          <div className="flex items-center space-x-2">
            <DollarSign className="w-4 h-4 text-yellow-400" />
            <h3 className="font-semibold text-[#fafafa]">Cost Analysis</h3>
          </div>
          {sections.find(s => s.id === 'costs')?.expanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>
        
        {sections.find(s => s.id === 'costs')?.expanded && analysisResult?.connectionOpportunities && (
          <div className="mt-3 space-y-2">
            {analysisResult.connectionOpportunities.opportunities.slice(0, 2).map((opp, idx) => (
              <div key={idx} className="flex justify-between items-center">
                <span className="text-sm text-[#fafafa]">Option {idx + 1}</span>
                <span className="text-sm font-mono text-yellow-400">
                  ${(opp.connectionCostEstimate / 1000000).toFixed(1)}M
                </span>
              </div>
            ))}
            <div className="pt-2 border-t border-[#27272a] text-xs text-[#71717a]">
              Estimates exclude permit and regulatory costs
            </div>
          </div>
        )}
      </div>

      {/* TSO Contacts Section */}
      <div className="bg-[#1a1a1f]/80 p-4 rounded-lg backdrop-blur-sm">
        <button
          onClick={() => toggleSection('tsos')}
          className="flex items-center justify-between w-full hover:text-blue-400 transition-colors"
        >
          <div className="flex items-center space-x-2">
            <Phone className="w-4 h-4 text-indigo-400" />
            <h3 className="font-semibold text-[#fafafa]">TSO Contacts</h3>
          </div>
          {sections.find(s => s.id === 'tsos')?.expanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>
        
        {sections.find(s => s.id === 'tsos')?.expanded && analysisResult?.tsos && (
          <div className="mt-3 space-y-3">
            {analysisResult.tsos.slice(0, 2).map((tso, idx) => (
              <div key={idx} className="border border-[#27272a] rounded p-3">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="text-sm font-medium text-[#fafafa]">{tso.name}</div>
                    <div className="text-xs text-[#71717a]">{tso.country}</div>
                  </div>
                  <div className="text-xs text-[#a1a1aa]">
                    Score: {tso.relevanceScore || 100}/100
                  </div>
                </div>
                {tso.contactInfo?.website && (
                  <a 
                    href={tso.contactInfo.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1 text-xs text-blue-400 hover:text-blue-300"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>Visit Website</span>
                  </a>
                )}
                {tso.contactInfo?.email && (
                  <div className="text-xs text-[#71717a] mt-1">
                    {tso.contactInfo.email}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Risk Assessment Section */}
      <div className="bg-[#1a1a1f]/80 p-4 rounded-lg backdrop-blur-sm">
        <button
          onClick={() => toggleSection('risks')}
          className="flex items-center justify-between w-full hover:text-blue-400 transition-colors"
        >
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <h3 className="font-semibold text-[#fafafa]">Risk Assessment</h3>
            {gridSummary?.majorConstraints && gridSummary.majorConstraints.length > 0 && (
              <span className="text-xs text-[#71717a] bg-red-600/20 px-2 py-1 rounded">
                {gridSummary.majorConstraints.length}
              </span>
            )}
          </div>
          {sections.find(s => s.id === 'risks')?.expanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>
        
        {sections.find(s => s.id === 'risks')?.expanded && (
          <div className="mt-3 space-y-2">
            {gridSummary?.majorConstraints && gridSummary.majorConstraints.length > 0 ? (
              gridSummary.majorConstraints.map((constraint, idx) => (
                <div key={idx} className="flex items-center space-x-2 text-sm">
                  <AlertTriangle className="w-3 h-3 text-yellow-400" />
                  <span className="text-[#fafafa]">{constraint}</span>
                </div>
              ))
            ) : (
              <div className="flex items-center space-x-2 text-sm">
                <CheckCircle className="w-3 h-3 text-green-400" />
                <span className="text-green-400">No major risks identified</span>
              </div>
            )}
            
            {analysisResult?.constraints?.constraints && analysisResult.constraints.constraints.length > 0 && (
              <div className="pt-2 border-t border-[#27272a] space-y-1">
                <div className="text-xs text-[#a1a1aa]">Grid constraints identified:</div>
                {analysisResult.constraints.constraints.slice(0, 3).map((constraint, idx) => (
                  <div key={idx} className="flex justify-between text-xs">
                    <span className="text-[#71717a]">{constraint.type}</span>
                    <span className={`px-1 rounded ${
                      constraint.severity === 'high' ? 'bg-red-600/20 text-red-400' :
                      constraint.severity === 'medium' ? 'bg-yellow-600/20 text-yellow-400' :
                      'bg-green-600/20 text-green-400'
                    }`}>
                      {constraint.severity.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Next Steps */}
      <div className="bg-blue-600/10 border border-blue-600/20 p-4 rounded-lg">
        <h3 className="font-semibold text-blue-400 mb-3 flex items-center space-x-2">
          <Info className="w-4 h-4" />
          <span>Next Steps</span>
        </h3>
        <div className="space-y-2">
          {analysisResult?.summary?.nextSteps?.slice(0, 3).map((step, idx) => (
            <div key={idx} className="flex items-start space-x-2">
              <div className="w-5 h-5 bg-blue-600/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs text-blue-400">{idx + 1}</span>
              </div>
              <span className="text-sm text-[#fafafa]">{step}</span>
            </div>
          )) || (
            <div className="text-sm text-[#a1a1aa]">Complete grid analysis to see recommendations</div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Calculate estimated timeline from analysis result
 */
function calculateTimelineMonths(analysisResult: GridAnalysisResult): number {
  if (!analysisResult.connectionOpportunities?.opportunities?.length) return 12;
  
  // Extract months from time strings like "12-18 months"
  const timeString = analysisResult.connectionOpportunities.opportunities[0].timeToConnect;
  const match = timeString.match(/(\d+)-?(\d+)?\s*months?/i);
  
  if (match) {
    const min = parseInt(match[1]);
    const max = match[2] ? parseInt(match[2]) : min;
    return Math.round((min + max) / 2);
  }
  
  return 12; // Default fallback
}

/**
 * Extract major constraints from analysis result
 */
function extractMajorConstraints(analysisResult: GridAnalysisResult): string[] {
  const constraints: string[] = [];
  
  if (analysisResult.constraints?.constraints) {
    analysisResult.constraints.constraints
      .filter(c => c.severity === 'high')
      .forEach(c => constraints.push(c.description));
  }
  
  // Add capacity limitations
  if (analysisResult.capacityAnalysis?.totalAvailableCapacity && 
      analysisResult.capacityAnalysis.totalAvailableCapacity < 100) {
    constraints.push('Limited grid capacity in area');
  }
  
  // Add distance concerns
  if (analysisResult.capacityAnalysis?.nearestConnectionPoint?.distanceKm && 
      analysisResult.capacityAnalysis.nearestConnectionPoint.distanceKm > 10) {
    constraints.push('Long distance to grid connection');
  }
  
  return constraints.slice(0, 3); // Limit to top 3
}