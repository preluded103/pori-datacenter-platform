/**
 * Constraint Visualization Components
 * Real-time constraint analysis and visualization for datacenter site screening
 */

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  AlertTriangle, 
  Zap, 
  Droplets, 
  Wifi, 
  Shield, 
  TreePine,
  Building,
  Plane,
  Radio,
  MapPin,
  Info,
  X,
  ChevronDown,
  ChevronRight,
  Filter,
  BarChart3
} from 'lucide-react';

export interface Constraint {
  id: string;
  name: string;
  category: 'power' | 'water' | 'connectivity' | 'environmental' | 'regulatory' | 'aviation' | 'emi';
  severity: 'low' | 'medium' | 'high' | 'critical';
  distance?: number; // meters
  impact: 'none' | 'minor' | 'moderate' | 'major' | 'blocking';
  description: string;
  mitigation?: string;
  cost_impact?: {
    min: number;
    max: number;
    currency: 'EUR' | 'USD';
  };
  timeline_impact?: {
    delay_months: number;
    description: string;
  };
  coordinates?: [number, number];
  buffer_radius?: number; // visualization buffer in meters
  metadata?: Record<string, any>;
}

export interface ConstraintAnalysis {
  site_id: string;
  site_name: string;
  coordinates: [number, number];
  constraints: Constraint[];
  overall_score: number;
  recommendation: 'proceed' | 'caution' | 'avoid';
  critical_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
  analyzed_at: string;
}

interface ConstraintVisualizationProps {
  analysis: ConstraintAnalysis;
  onConstraintSelect?: (constraint: Constraint) => void;
  onFilterChange?: (filters: ConstraintFilter) => void;
  className?: string;
}

interface ConstraintFilter {
  categories: string[];
  severities: string[];
  impacts: string[];
  maxDistance?: number;
}

const ConstraintVisualization: React.FC<ConstraintVisualizationProps> = ({
  analysis,
  onConstraintSelect,
  onFilterChange,
  className = ""
}) => {
  const [selectedConstraint, setSelectedConstraint] = useState<Constraint | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['critical']));
  const [filters, setFilters] = useState<ConstraintFilter>({
    categories: ['power', 'water', 'connectivity', 'environmental', 'regulatory', 'aviation', 'emi'],
    severities: ['critical', 'high', 'medium', 'low'],
    impacts: ['blocking', 'major', 'moderate', 'minor', 'none']
  });
  const [showFilters, setShowFilters] = useState(false);

  // Category configuration
  const categoryConfig = {
    power: {
      icon: Zap,
      color: '#ef4444',
      name: 'Power Infrastructure'
    },
    water: {
      icon: Droplets,
      color: '#0ea5e9',
      name: 'Water Systems'
    },
    connectivity: {
      icon: Wifi,
      color: '#8b5cf6',
      name: 'Connectivity'
    },
    environmental: {
      icon: TreePine,
      color: '#22c55e',
      name: 'Environmental'
    },
    regulatory: {
      icon: Shield,
      color: '#f59e0b',
      name: 'Regulatory'
    },
    aviation: {
      icon: Plane,
      color: '#06b6d4',
      name: 'Aviation'
    },
    emi: {
      icon: Radio,
      color: '#ec4899',
      name: 'EMI/Radio'
    }
  };

  const severityConfig = {
    critical: { color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
    high: { color: '#ea580c', bg: '#fff7ed', border: '#fed7aa' },
    medium: { color: '#ca8a04', bg: '#fefce8', border: '#fde68a' },
    low: { color: '#65a30d', bg: '#f7fee7', border: '#d9f99d' }
  };

  // Filter constraints based on current filters
  const filteredConstraints = useMemo(() => {
    return analysis.constraints.filter(constraint => {
      if (!filters.categories.includes(constraint.category)) return false;
      if (!filters.severities.includes(constraint.severity)) return false;
      if (!filters.impacts.includes(constraint.impact)) return false;
      if (filters.maxDistance && constraint.distance && constraint.distance > filters.maxDistance) return false;
      return true;
    });
  }, [analysis.constraints, filters]);

  // Group constraints by category and severity
  const groupedConstraints = useMemo(() => {
    const grouped: Record<string, Record<string, Constraint[]>> = {};
    
    filteredConstraints.forEach(constraint => {
      if (!grouped[constraint.category]) {
        grouped[constraint.category] = {};
      }
      if (!grouped[constraint.category][constraint.severity]) {
        grouped[constraint.category][constraint.severity] = [];
      }
      grouped[constraint.category][constraint.severity].push(constraint);
    });

    return grouped;
  }, [filteredConstraints]);

  const handleConstraintClick = (constraint: Constraint) => {
    setSelectedConstraint(constraint);
    onConstraintSelect?.(constraint);
  };

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const updateFilters = (newFilters: Partial<ConstraintFilter>) => {
    const updated = { ...filters, ...newFilters };
    setFilters(updated);
    onFilterChange?.(updated);
  };

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'proceed': return 'text-green-600 bg-green-50 border-green-200';
      case 'caution': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'avoid': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const formatDistance = (distance?: number) => {
    if (!distance) return 'On-site';
    if (distance < 1000) return `${Math.round(distance)}m`;
    return `${(distance / 1000).toFixed(1)}km`;
  };

  const formatCost = (cost?: { min: number; max: number; currency: string }) => {
    if (!cost) return null;
    const format = (num: number) => {
      if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
      if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
      return num.toString();
    };
    
    return `${format(cost.min)}-${format(cost.max)} ${cost.currency}`;
  };

  // Summary statistics
  const summaryStats = useMemo(() => {
    const stats = {
      total: filteredConstraints.length,
      by_severity: { critical: 0, high: 0, medium: 0, low: 0 },
      by_category: {} as Record<string, number>,
      avg_distance: 0,
      total_cost_impact: { min: 0, max: 0 }
    };

    let totalDistance = 0;
    let distanceCount = 0;

    filteredConstraints.forEach(constraint => {
      stats.by_severity[constraint.severity]++;
      stats.by_category[constraint.category] = (stats.by_category[constraint.category] || 0) + 1;
      
      if (constraint.distance) {
        totalDistance += constraint.distance;
        distanceCount++;
      }

      if (constraint.cost_impact) {
        stats.total_cost_impact.min += constraint.cost_impact.min;
        stats.total_cost_impact.max += constraint.cost_impact.max;
      }
    });

    stats.avg_distance = distanceCount > 0 ? totalDistance / distanceCount : 0;

    return stats;
  }, [filteredConstraints]);

  return (
    <div className={`bg-[#131316] border border-[#27272a] rounded-lg ${className}`}>
      {/* Header */}
      <div className="border-b border-[#27272a] p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-lg font-semibold text-[#fafafa] flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              {analysis.site_name} - Constraint Analysis
            </h3>
            <p className="text-sm text-[#a1a1aa]">
              Analyzed {new Date(analysis.analyzed_at).toLocaleDateString()}
            </p>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="p-2 text-[#71717a] hover:text-[#fafafa] hover:bg-[#1a1a1f] rounded transition-colors"
            title="Toggle Filters"
          >
            <Filter className="h-4 w-4" />
          </button>
        </div>

        {/* Overall Score and Recommendation */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-[#fafafa]">
              {analysis.overall_score.toFixed(1)}/10
            </div>
            <div className="text-sm text-[#a1a1aa]">Overall Score</div>
          </div>
          <div className="text-center">
            <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${getRecommendationColor(analysis.recommendation)}`}>
              {analysis.recommendation.toUpperCase()}
            </div>
          </div>
        </div>

        {/* Summary Statistics */}
        <div className="grid grid-cols-4 gap-2 mt-4 text-sm">
          <div className="text-center p-2 bg-red-950/20 rounded border border-red-900/20">
            <div className="font-semibold text-red-400">{analysis.critical_count}</div>
            <div className="text-red-300 text-xs">Critical</div>
          </div>
          <div className="text-center p-2 bg-orange-950/20 rounded border border-orange-900/20">
            <div className="font-semibold text-orange-400">{analysis.high_count}</div>
            <div className="text-orange-300 text-xs">High</div>
          </div>
          <div className="text-center p-2 bg-yellow-950/20 rounded border border-yellow-900/20">
            <div className="font-semibold text-yellow-400">{analysis.medium_count}</div>
            <div className="text-yellow-300 text-xs">Medium</div>
          </div>
          <div className="text-center p-2 bg-green-950/20 rounded border border-green-900/20">
            <div className="font-semibold text-green-400">{analysis.low_count}</div>
            <div className="text-green-300 text-xs">Low</div>
          </div>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="border-b border-[#27272a] p-4 bg-[#1a1a1f]">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#a1a1aa] mb-2">Categories</label>
              <div className="space-y-1">
                {Object.entries(categoryConfig).map(([key, config]) => (
                  <label key={key} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={filters.categories.includes(key)}
                      onChange={(e) => {
                        const newCategories = e.target.checked
                          ? [...filters.categories, key]
                          : filters.categories.filter(c => c !== key);
                        updateFilters({ categories: newCategories });
                      }}
                      className="rounded"
                    />
                    <config.icon className="h-4 w-4" style={{ color: config.color }} />
                    <span className="text-sm text-[#fafafa]">{config.name}</span>
                  </label>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[#a1a1aa] mb-2">Severities</label>
              <div className="space-y-1">
                {Object.entries(severityConfig).map(([key, config]) => (
                  <label key={key} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={filters.severities.includes(key)}
                      onChange={(e) => {
                        const newSeverities = e.target.checked
                          ? [...filters.severities, key]
                          : filters.severities.filter(s => s !== key);
                        updateFilters({ severities: newSeverities });
                      }}
                      className="rounded"
                    />
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: config.color }}
                    />
                    <span className="text-sm text-[#fafafa] capitalize">{key}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Constraints List */}
      <div className="max-h-96 overflow-y-auto">
        {Object.entries(groupedConstraints).length === 0 ? (
          <div className="p-8 text-center text-[#71717a]">
            <Info className="h-8 w-8 mx-auto mb-2" />
            <p>No constraints match the current filters</p>
          </div>
        ) : (
          Object.entries(groupedConstraints).map(([category, severityGroups]) => {
            const config = categoryConfig[category as keyof typeof categoryConfig];
            const Icon = config.icon;
            const isExpanded = expandedCategories.has(category);
            const categoryTotal = Object.values(severityGroups).reduce((sum, arr) => sum + arr.length, 0);

            return (
              <div key={category} className="border-b border-[#27272a] last:border-b-0">
                <button
                  onClick={() => toggleCategory(category)}
                  className="w-full p-4 flex items-center justify-between text-left hover:bg-[#1a1a1f] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5" style={{ color: config.color }} />
                    <span className="font-medium text-[#fafafa]">{config.name}</span>
                    <span className="px-2 py-1 bg-[#27272a] rounded-full text-xs text-[#a1a1aa]">
                      {categoryTotal}
                    </span>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-[#71717a]" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-[#71717a]" />
                  )}
                </button>

                {isExpanded && (
                  <div className="pb-2">
                    {Object.entries(severityGroups)
                      .sort(([a], [b]) => {
                        const order = { critical: 0, high: 1, medium: 2, low: 3 };
                        return order[a as keyof typeof order] - order[b as keyof typeof order];
                      })
                      .map(([severity, constraints]) => (
                        <div key={severity} className="ml-4">
                          {constraints.map((constraint, index) => {
                            const severityStyle = severityConfig[severity as keyof typeof severityConfig];
                            return (
                              <div
                                key={constraint.id}
                                onClick={() => handleConstraintClick(constraint)}
                                className={`mx-2 mb-2 p-3 rounded border cursor-pointer transition-all hover:shadow-md ${
                                  selectedConstraint?.id === constraint.id 
                                    ? 'border-blue-500 bg-blue-950/20' 
                                    : 'border-gray-700 hover:border-gray-600'
                                }`}
                                style={{
                                  backgroundColor: severityStyle.bg + '10',
                                  borderColor: severityStyle.border + '40'
                                }}
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <div
                                        className="w-2 h-2 rounded-full"
                                        style={{ backgroundColor: severityStyle.color }}
                                      />
                                      <span className="font-medium text-[#fafafa] text-sm">
                                        {constraint.name}
                                      </span>
                                      {constraint.distance && (
                                        <span className="text-xs text-[#a1a1aa] bg-[#27272a] px-2 py-1 rounded">
                                          {formatDistance(constraint.distance)}
                                        </span>
                                      )}
                                    </div>
                                    
                                    <p className="text-xs text-[#a1a1aa] mb-2">
                                      {constraint.description}
                                    </p>

                                    {constraint.impact !== 'none' && (
                                      <div className="flex items-center gap-4 text-xs">
                                        <span className="text-[#71717a]">
                                          Impact: <span className="capitalize text-[#a1a1aa]">{constraint.impact}</span>
                                        </span>
                                        
                                        {constraint.cost_impact && (
                                          <span className="text-[#71717a]">
                                            Cost: <span className="text-[#a1a1aa]">{formatCost(constraint.cost_impact)}</span>
                                          </span>
                                        )}
                                        
                                        {constraint.timeline_impact && (
                                          <span className="text-[#71717a]">
                                            Delay: <span className="text-[#a1a1aa]">+{constraint.timeline_impact.delay_months}mo</span>
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                  
                                  {constraint.severity === 'critical' && (
                                    <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0 ml-2" />
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Selected Constraint Detail Panel */}
      {selectedConstraint && (
        <div className="border-t border-[#27272a] p-4 bg-[#1a1a1f]">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-[#fafafa]">Constraint Details</h4>
            <button
              onClick={() => setSelectedConstraint(null)}
              className="text-[#71717a] hover:text-[#fafafa]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          
          <div className="space-y-3 text-sm">
            <div>
              <span className="text-[#a1a1aa]">Description:</span>
              <p className="text-[#fafafa] mt-1">{selectedConstraint.description}</p>
            </div>
            
            {selectedConstraint.mitigation && (
              <div>
                <span className="text-[#a1a1aa]">Mitigation:</span>
                <p className="text-[#fafafa] mt-1">{selectedConstraint.mitigation}</p>
              </div>
            )}
            
            {selectedConstraint.coordinates && (
              <div>
                <span className="text-[#a1a1aa]">Location:</span>
                <p className="text-[#fafafa] font-mono">
                  {selectedConstraint.coordinates[1].toFixed(5)}, {selectedConstraint.coordinates[0].toFixed(5)}
                </p>
              </div>
            )}

            {selectedConstraint.metadata && Object.keys(selectedConstraint.metadata).length > 0 && (
              <div>
                <span className="text-[#a1a1aa]">Additional Info:</span>
                <div className="mt-1 space-y-1">
                  {Object.entries(selectedConstraint.metadata).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-[#71717a] capitalize">{key.replace('_', ' ')}:</span>
                      <span className="text-[#fafafa]">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ConstraintVisualization;