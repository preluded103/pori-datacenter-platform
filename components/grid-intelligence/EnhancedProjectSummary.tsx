/**
 * Enhanced Project Summary Component
 * Integrates grid intelligence with existing project analysis
 */

'use client';

import React, { useState } from 'react';
import { 
  BarChart3, Zap, AlertTriangle, ChevronDown, ChevronUp,
  TrendingUp, MapPin, Calendar, DollarSign, CheckCircle,
  Info, Layers, Clock
} from 'lucide-react';
import ProjectGridSummary from './ProjectGridSummary';
import { GridAnalysisResult } from '@/lib/types/grid-types';

interface EnhancedProjectSummaryProps {
  projectId: string;
  projectName: string;
  coordinates: { lat: number; lng: number };
  layers: any[];
  analysisResult?: GridAnalysisResult;
  className?: string;
}

interface SummaryTab {
  id: 'overview' | 'grid' | 'environmental' | 'costs';
  name: string;
  icon: React.ComponentType<any>;
  count?: number;
}

export default function EnhancedProjectSummary({
  projectId,
  projectName,
  coordinates,
  layers,
  analysisResult,
  className = ''
}: EnhancedProjectSummaryProps) {
  
  const [activeTab, setActiveTab] = useState<'overview' | 'grid' | 'environmental' | 'costs'>('overview');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['metrics', 'grid']));

  const tabs: SummaryTab[] = [
    { id: 'overview', name: 'Overview', icon: BarChart3 },
    { 
      id: 'grid', 
      name: 'Grid', 
      icon: Zap,
      count: analysisResult ? 1 : 0
    },
    { id: 'environmental', name: 'Environment', icon: AlertTriangle, count: 3 },
    { id: 'costs', name: 'Economics', icon: DollarSign }
  ];

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const getOverallScore = () => {
    if (analysisResult?.summary?.overallSuitabilityScore) {
      return Math.round((analysisResult.summary.overallSuitabilityScore + 87) / 2); // Blend with site score
    }
    return 87; // Default site score
  };

  const getRiskLevel = () => {
    const score = getOverallScore();
    if (score >= 80) return { level: 'Low', color: 'text-green-400' };
    if (score >= 60) return { level: 'Medium', color: 'text-yellow-400' };
    return { level: 'High', color: 'text-red-400' };
  };

  return (
    <div className={`h-full flex flex-col ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[#27272a]">
        <div className="flex items-center">
          <BarChart3 className="w-5 h-5 mr-2 text-green-400" />
          <h2 className="font-semibold">Site Analysis</h2>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-[#27272a]">
        <div className="flex">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-400'
                    : 'border-transparent text-[#a1a1aa] hover:text-[#fafafa]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.name}</span>
                {tab.count !== undefined && (
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    tab.count > 0 ? 'bg-blue-600/20 text-blue-400' : 'bg-[#27272a] text-[#71717a]'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'overview' && (
          <div className="p-4 space-y-4">
            {/* Site Score Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#1a1a1f]/80 p-3 rounded-lg backdrop-blur-sm">
                <div className="text-xs text-[#a1a1aa] mb-1">Overall Score</div>
                <div className="text-lg font-bold text-green-400">{getOverallScore()}/100</div>
              </div>
              <div className="bg-[#1a1a1f]/80 p-3 rounded-lg backdrop-blur-sm">
                <div className="text-xs text-[#a1a1aa] mb-1">Risk Level</div>
                <div className={`text-lg font-bold ${getRiskLevel().color}`}>{getRiskLevel().level}</div>
              </div>
            </div>

            {/* Key Metrics Section */}
            <div className="bg-[#1a1a1f]/80 p-4 rounded-lg backdrop-blur-sm">
              <button
                onClick={() => toggleSection('metrics')}
                className="flex items-center justify-between w-full mb-3 hover:text-blue-400 transition-colors"
              >
                <div className="text-sm font-medium text-[#a1a1aa]">Infrastructure Metrics</div>
                {expandedSections.has('metrics') ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
              
              {expandedSections.has('metrics') && (
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-[#fafafa]">Power Capacity</span>
                    <span className="text-[#a1a1aa] font-mono">
                      {analysisResult?.capacityAnalysis?.totalAvailableCapacity || 70} MW
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#fafafa]">Grid Distance</span>
                    <span className="text-[#a1a1aa] font-mono">
                      {analysisResult?.capacityAnalysis?.nearestConnectionPoint?.distanceKm || 2.3} km
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#fafafa]">Fiber Distance</span>
                    <span className="text-[#a1a1aa] font-mono">0.8 km</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#fafafa]">Land Area</span>
                    <span className="text-[#a1a1aa] font-mono">15 ha</span>
                  </div>
                  {analysisResult?.tsos?.[0] && (
                    <div className="flex justify-between items-center">
                      <span className="text-[#fafafa]">Primary TSO</span>
                      <span className="text-[#a1a1aa] font-mono text-xs">
                        {analysisResult.tsos[0].name.split(' ')[0]}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Grid Intelligence Quick Summary */}
            {analysisResult && (
              <div className="bg-blue-600/10 border border-blue-600/20 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Zap className="w-4 h-4 text-blue-400" />
                  <span className="text-sm font-medium text-blue-400">Grid Intelligence</span>
                  <CheckCircle className="w-3 h-3 text-green-400" />
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <div className="text-[#a1a1aa]">Suitability</div>
                    <div className="text-[#fafafa] font-mono">
                      {analysisResult.summary?.overallSuitabilityScore || 0}/100
                    </div>
                  </div>
                  <div>
                    <div className="text-[#a1a1aa]">Connection</div>
                    <div className="text-[#fafafa] font-mono">
                      {analysisResult.capacityAnalysis?.nearestConnectionPoint?.distanceKm?.toFixed(1) || 'N/A'} km
                    </div>
                  </div>
                </div>
                <div className="mt-2 text-xs text-blue-300">
                  Click &quot;Grid&quot; tab for detailed analysis
                </div>
              </div>
            )}

            {/* Analysis Status */}
            <div className="bg-[#1a1a1f]/80 p-4 rounded-lg backdrop-blur-sm">
              <div className="text-sm font-medium text-[#a1a1aa] mb-2">Analysis Status</div>
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-[#fafafa]">
                  {analysisResult ? 'Grid Analysis Complete' : 'Data Loading'}
                </span>
              </div>
              <div className="space-y-1 text-xs text-[#71717a]">
                <div>Last updated: {new Date().toLocaleString()}</div>
                <div>{layers.filter(l => l.enabled).length} active layers</div>
                <div>Map center: {coordinates.lat.toFixed(4)}, {coordinates.lng.toFixed(4)}</div>
                {analysisResult && (
                  <div>Grid analysis: {new Date(analysisResult.timestamp).toLocaleDateString()}</div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'grid' && (
          <div className="p-4">
            <ProjectGridSummary
              projectId={projectId}
              analysisResult={analysisResult}
            />
          </div>
        )}

        {activeTab === 'environmental' && (
          <div className="p-4 space-y-4">
            {/* Environmental Factors */}
            <div className="bg-[#1a1a1f]/80 p-4 rounded-lg backdrop-blur-sm">
              <div className="text-sm font-medium text-[#a1a1aa] mb-3">Environmental Assessment</div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[#fafafa]">Flood Risk</span>
                  <span className="px-2 py-1 bg-green-600/20 text-green-400 rounded text-xs">LOW</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#fafafa]">Seismic Risk</span>
                  <span className="px-2 py-1 bg-green-600/20 text-green-400 rounded text-xs">LOW</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#fafafa]">Heritage Risk</span>
                  <span className="px-2 py-1 bg-yellow-600/20 text-yellow-400 rounded text-xs">MEDIUM</span>
                </div>
                {analysisResult?.constraints?.constraints?.length && analysisResult.constraints.constraints.length > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-[#fafafa]">Grid Constraints</span>
                    <span className="px-2 py-1 bg-red-600/20 text-red-400 rounded text-xs">
                      {analysisResult.constraints.constraints.length} FOUND
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Protected Areas */}
            <div className="bg-[#1a1a1f]/80 p-4 rounded-lg backdrop-blur-sm">
              <div className="text-sm font-medium text-[#a1a1aa] mb-3">Protected Areas</div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#fafafa]">Natura 2000</span>
                  <span className="text-[#71717a]">3.2 km away</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#fafafa]">National Parks</span>
                  <span className="text-[#71717a]">None nearby</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#fafafa]">Water Bodies</span>
                  <span className="text-[#71717a]">River 1.8 km</span>
                </div>
              </div>
            </div>

            {/* Climate Data */}
            <div className="bg-[#1a1a1f]/80 p-4 rounded-lg backdrop-blur-sm">
              <div className="text-sm font-medium text-[#a1a1aa] mb-3">Climate Conditions</div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-[#fafafa]">Avg. Temperature</span>
                  <div className="text-[#71717a]">4.2°C annual</div>
                </div>
                <div>
                  <span className="text-[#fafafa]">Annual Rainfall</span>
                  <div className="text-[#71717a]">625mm</div>
                </div>
                <div>
                  <span className="text-[#fafafa]">Wind Speed</span>
                  <div className="text-[#71717a]">4.8 m/s avg</div>
                </div>
                <div>
                  <span className="text-[#fafafa]">Cooling Days</span>
                  <div className="text-[#71717a]">280 days/year</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'costs' && (
          <div className="p-4 space-y-4">
            {/* Cost Overview */}
            <div className="bg-[#1a1a1f]/80 p-4 rounded-lg backdrop-blur-sm">
              <div className="text-sm font-medium text-[#a1a1aa] mb-3">Cost Overview</div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-[#fafafa]">Land Acquisition</span>
                  <span className="text-[#a1a1aa] font-mono">€2.5M</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#fafafa]">Grid Connection</span>
                  <span className="text-[#a1a1aa] font-mono">
                    €{analysisResult?.connectionOpportunities?.opportunities?.[0]?.connectionCostEstimate 
                      ? (analysisResult.connectionOpportunities.opportunities[0].connectionCostEstimate / 1000000).toFixed(1)
                      : '3.2'}M
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#fafafa]">Permits & Approvals</span>
                  <span className="text-[#a1a1aa] font-mono">€0.8M</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#fafafa]">Site Preparation</span>
                  <span className="text-[#a1a1aa] font-mono">€1.2M</span>
                </div>
              </div>
              <div className="pt-3 border-t border-[#27272a] mt-3">
                <div className="flex justify-between items-center text-sm font-semibold">
                  <span className="text-[#fafafa]">Total Site Costs</span>
                  <span className="text-green-400 font-mono">€7.7M</span>
                </div>
              </div>
            </div>

            {/* Timeline Costs */}
            <div className="bg-[#1a1a1f]/80 p-4 rounded-lg backdrop-blur-sm">
              <div className="text-sm font-medium text-[#a1a1aa] mb-3">Timeline Impact</div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#fafafa]">Holding Costs (12 months)</span>
                  <span className="text-[#71717a]">€0.5M</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#fafafa]">Delay Risk Premium</span>
                  <span className="text-[#71717a]">€0.3M</span>
                </div>
                {analysisResult?.connectionOpportunities?.opportunities?.[0] && (
                  <div className="flex justify-between">
                    <span className="text-[#fafafa]">Grid Timeline</span>
                    <span className="text-[#71717a]">
                      {analysisResult.connectionOpportunities.opportunities[0].timeToConnect}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* ROI Analysis */}
            <div className="bg-[#1a1a1f]/80 p-4 rounded-lg backdrop-blur-sm">
              <div className="text-sm font-medium text-[#a1a1aa] mb-3">Investment Analysis</div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="text-center">
                  <div className="text-lg font-bold text-green-400">12.3%</div>
                  <div className="text-xs text-[#a1a1aa]">Expected IRR</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-400">4.2 yrs</div>
                  <div className="text-xs text-[#a1a1aa]">Payback Period</div>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-[#27272a] text-xs text-[#71717a]">
                Based on 70MW datacenter capacity and regional power pricing
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}