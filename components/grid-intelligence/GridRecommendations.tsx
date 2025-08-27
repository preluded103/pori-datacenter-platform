/**
 * Grid Recommendations Component
 * Displays connection recommendations with configurable scoring weights
 */

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, TrendingDown, Star, AlertTriangle, CheckCircle, 
  Settings, RefreshCw, Target, MapPin, Clock, DollarSign,
  Zap, Shield, Phone, Save, RotateCcw
} from 'lucide-react';
import { GridRecommendationEngine, RecommendationWeights, ScoredRecommendation } from '@/lib/grid-intelligence/recommendation-engine';
import { GridAnalysisResult } from '@/lib/types/grid-types';

interface GridRecommendationsProps {
  analysisResult?: GridAnalysisResult;
  className?: string;
}

interface WeightControl {
  key: keyof RecommendationWeights;
  label: string;
  icon: React.ComponentType<any>;
  description: string;
  min: number;
  max: number;
  step: number;
}

export default function GridRecommendations({ 
  analysisResult, 
  className = '' 
}: GridRecommendationsProps) {
  
  const [engine] = useState(() => new GridRecommendationEngine());
  const [weights, setWeights] = useState<RecommendationWeights>(engine.getConfig().weights);
  const [showWeightControls, setShowWeightControls] = useState(false);
  const [savedConfigs, setSavedConfigs] = useState<Record<string, RecommendationWeights>>({});

  // Weight control definitions
  const weightControls: WeightControl[] = [
    {
      key: 'distance',
      label: 'Distance',
      icon: MapPin,
      description: 'Distance to grid connection point',
      min: 0.05,
      max: 0.40,
      step: 0.01
    },
    {
      key: 'capacity',
      label: 'Capacity',
      icon: Zap,
      description: 'Available grid capacity',
      min: 0.10,
      max: 0.50,
      step: 0.01
    },
    {
      key: 'timeline',
      label: 'Timeline',
      icon: Clock,
      description: 'Connection timeline',
      min: 0.05,
      max: 0.30,
      step: 0.01
    },
    {
      key: 'cost',
      label: 'Cost',
      icon: DollarSign,
      description: 'Connection cost estimate',
      min: 0.05,
      max: 0.25,
      step: 0.01
    },
    {
      key: 'reliability',
      label: 'Reliability',
      icon: Shield,
      description: 'Grid reliability and redundancy',
      min: 0.05,
      max: 0.20,
      step: 0.01
    },
    {
      key: 'tso',
      label: 'TSO Quality',
      icon: Phone,
      description: 'TSO reliability and relationship',
      min: 0.05,
      max: 0.20,
      step: 0.01
    },
    {
      key: 'risk',
      label: 'Risk Level',
      icon: AlertTriangle,
      description: 'Project and technical risks',
      min: 0.05,
      max: 0.25,
      step: 0.01
    }
  ];

  // Pre-defined configurations
  const presetConfigs = {
    'Balanced': {
      distance: 0.20,
      capacity: 0.25,
      timeline: 0.15,
      cost: 0.10,
      reliability: 0.07,
      tso: 0.08,
      risk: 0.15
    },
    'Aggressive': {
      distance: 0.15,
      capacity: 0.30,
      timeline: 0.20,
      cost: 0.05,
      reliability: 0.10,
      tso: 0.12,
      risk: 0.08
    },
    'Conservative': {
      distance: 0.25,
      capacity: 0.20,
      timeline: 0.10,
      cost: 0.15,
      reliability: 0.15,
      tso: 0.10,
      risk: 0.05
    },
    'Cost-Optimized': {
      distance: 0.30,
      capacity: 0.20,
      timeline: 0.08,
      cost: 0.20,
      reliability: 0.10,
      tso: 0.07,
      risk: 0.05
    }
  };

  // Update engine weights when weights change
  useEffect(() => {
    engine.updateConfig({ weights });
  }, [weights, engine]);

  // Generate recommendations
  const recommendations = useMemo(() => {
    if (!analysisResult) return [];
    return engine.generateRecommendations(analysisResult);
  }, [analysisResult, engine, weights]);

  // Handle weight change
  const handleWeightChange = (key: keyof RecommendationWeights, value: number) => {
    setWeights(prev => ({ ...prev, [key]: value }));
  };

  // Normalize weights to sum to 1.0
  const normalizeWeights = () => {
    const total = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
    if (total === 0) return;
    
    const normalized = Object.fromEntries(
      Object.entries(weights).map(([key, value]) => [key, value / total])
    ) as RecommendationWeights;
    
    setWeights(normalized);
  };

  // Apply preset configuration
  const applyPreset = (presetName: string) => {
    const preset = presetConfigs[presetName as keyof typeof presetConfigs];
    if (preset) {
      setWeights(preset);
    }
  };

  // Save current configuration
  const saveConfiguration = (name: string) => {
    setSavedConfigs(prev => ({ ...prev, [name]: { ...weights } }));
    localStorage.setItem('grid-recommendation-configs', JSON.stringify({ ...savedConfigs, [name]: weights }));
  };

  // Load saved configurations from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('grid-recommendation-configs');
    if (saved) {
      try {
        setSavedConfigs(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to load saved configurations:', error);
      }
    }
  }, []);

  // Get tier styling
  const getTierStyling = (tier: string) => {
    switch (tier) {
      case 'excellent':
        return {
          bg: 'bg-green-600/20 border-green-600/30',
          text: 'text-green-400',
          icon: CheckCircle
        };
      case 'good':
        return {
          bg: 'bg-blue-600/20 border-blue-600/30',
          text: 'text-blue-400',
          icon: TrendingUp
        };
      case 'fair':
        return {
          bg: 'bg-yellow-600/20 border-yellow-600/30',
          text: 'text-yellow-400',
          icon: AlertTriangle
        };
      default:
        return {
          bg: 'bg-red-600/20 border-red-600/30',
          text: 'text-red-400',
          icon: TrendingDown
        };
    }
  };

  if (!analysisResult) {
    return (
      <div className={`bg-[#1a1a1f]/80 p-6 rounded-lg backdrop-blur-sm ${className}`}>
        <div className="text-center">
          <div className="w-12 h-12 bg-[#27272a] rounded-full flex items-center justify-center mx-auto mb-3">
            <Target className="w-6 h-6 text-[#71717a]" />
          </div>
          <p className="text-sm text-[#a1a1aa] mb-2">No analysis results</p>
          <p className="text-xs text-[#71717a]">Complete grid analysis to see recommendations</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Target className="w-5 h-5 text-green-400" />
          <h3 className="font-semibold text-[#fafafa]">Grid Recommendations</h3>
          <span className="text-xs text-[#71717a] bg-[#27272a] px-2 py-1 rounded">
            {recommendations.length} options
          </span>
        </div>
        
        <button
          onClick={() => setShowWeightControls(!showWeightControls)}
          className="flex items-center space-x-1 px-3 py-1 bg-[#27272a] hover:bg-[#3f3f46] text-[#a1a1aa] rounded-md transition-colors"
        >
          <Settings className="w-4 h-4" />
          <span className="text-xs">Configure</span>
        </button>
      </div>

      {/* Weight Controls */}
      {showWeightControls && (
        <div className="bg-[#1a1a1f]/80 border border-[#27272a] rounded-lg p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-[#fafafa]">Scoring Weights</h4>
            <div className="flex items-center space-x-2">
              <button
                onClick={normalizeWeights}
                className="flex items-center space-x-1 px-2 py-1 bg-blue-600/20 text-blue-400 rounded text-xs hover:bg-blue-600/30"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Normalize</span>
              </button>
              <span className="text-xs text-[#71717a]">
                Total: {Object.values(weights).reduce((sum, w) => sum + w, 0).toFixed(2)}
              </span>
            </div>
          </div>
          
          {/* Preset Configurations */}
          <div className="mb-4">
            <div className="text-xs text-[#a1a1aa] mb-2">Presets:</div>
            <div className="flex space-x-2">
              {Object.keys(presetConfigs).map((preset) => (
                <button
                  key={preset}
                  onClick={() => applyPreset(preset)}
                  className="px-2 py-1 bg-[#27272a] hover:bg-[#3f3f46] text-[#a1a1aa] rounded text-xs transition-colors"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Weight Sliders */}
          <div className="grid grid-cols-2 gap-4">
            {weightControls.map((control) => {
              const Icon = control.icon;
              return (
                <div key={control.key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Icon className="w-3 h-3 text-blue-400" />
                      <span className="text-xs text-[#fafafa]">{control.label}</span>
                    </div>
                    <span className="text-xs text-[#a1a1aa] font-mono">
                      {(weights[control.key] * 100).toFixed(0)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={control.min}
                    max={control.max}
                    step={control.step}
                    value={weights[control.key]}
                    onChange={(e) => handleWeightChange(control.key, parseFloat(e.target.value))}
                    className="w-full h-1 bg-[#27272a] rounded-lg appearance-none cursor-pointer slider-thumb"
                  />
                  <div className="text-xs text-[#71717a]">{control.description}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recommendations List */}
      <div className="space-y-3">
        {recommendations.map((recommendation, index) => {
          const styling = getTierStyling(recommendation.tier);
          const Icon = styling.icon;
          
          return (
            <div
              key={recommendation.id}
              className={`border rounded-lg p-4 ${styling.bg} transition-all duration-200 hover:scale-[1.01]`}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <Icon className={`w-5 h-5 ${styling.text}`} />
                  <div>
                    <h4 className="font-medium text-[#fafafa]">Connection Option {index + 1}</h4>
                    <div className="text-xs text-[#71717a] capitalize">{recommendation.tier} recommendation</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-2xl font-bold ${styling.text}`}>
                    {recommendation.overallScore}/100
                  </div>
                </div>
              </div>

              {/* Factor Scores */}
              <div className="grid grid-cols-4 gap-3 mb-3">
                {weightControls.slice(0, 4).map((control) => {
                  const score = recommendation.factorScores[control.key];
                  const weight = weights[control.key];
                  const Icon = control.icon;
                  
                  return (
                    <div key={control.key} className="text-center">
                      <Icon className="w-4 h-4 mx-auto mb-1 text-[#71717a]" />
                      <div className="text-sm font-medium text-[#fafafa]">{Math.round(score)}</div>
                      <div className="text-xs text-[#71717a]">({(weight * 100).toFixed(0)}%)</div>
                    </div>
                  );
                })}
              </div>

              {/* Recommendation Text */}
              <div className="mb-3">
                <p className="text-sm text-[#a1a1aa]">{recommendation.recommendation}</p>
              </div>

              {/* Key Strengths */}
              {recommendation.keyStrengths.length > 0 && (
                <div className="mb-2">
                  <div className="text-xs text-[#a1a1aa] mb-1">Key Strengths:</div>
                  <div className="flex flex-wrap gap-1">
                    {recommendation.keyStrengths.map((strength, idx) => (
                      <span
                        key={idx}
                        className="text-xs bg-green-600/20 text-green-400 px-2 py-1 rounded"
                      >
                        {strength}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Concerns */}
              {recommendation.concerns.length > 0 && (
                <div className="mb-2">
                  <div className="text-xs text-[#a1a1aa] mb-1">Concerns:</div>
                  <div className="flex flex-wrap gap-1">
                    {recommendation.concerns.map((concern, idx) => (
                      <span
                        key={idx}
                        className="text-xs bg-red-600/20 text-red-400 px-2 py-1 rounded"
                      >
                        {concern}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Next Steps */}
              {recommendation.nextSteps.length > 0 && (
                <div>
                  <div className="text-xs text-[#a1a1aa] mb-1">Next Steps:</div>
                  <div className="space-y-1">
                    {recommendation.nextSteps.map((step, idx) => (
                      <div key={idx} className="flex items-start space-x-2 text-xs">
                        <div className="w-4 h-4 bg-blue-600/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-blue-400 text-xs">{idx + 1}</span>
                        </div>
                        <span className="text-[#a1a1aa]">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary Statistics */}
      <div className="bg-[#1a1a1f]/80 border border-[#27272a] rounded-lg p-4 backdrop-blur-sm">
        <h4 className="font-medium text-[#fafafa] mb-3">Analysis Summary</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-[#a1a1aa]">Best Option:</span>
            <div className="text-[#fafafa] font-mono">
              {recommendations[0] ? `${recommendations[0].overallScore}/100` : 'N/A'}
            </div>
          </div>
          <div>
            <span className="text-[#a1a1aa]">Average Score:</span>
            <div className="text-[#fafafa] font-mono">
              {recommendations.length ? 
                `${Math.round(recommendations.reduce((sum, rec) => sum + rec.overallScore, 0) / recommendations.length)}/100` : 
                'N/A'
              }
            </div>
          </div>
          <div>
            <span className="text-[#a1a1aa]">Recommended Options:</span>
            <div className="text-[#fafafa] font-mono">
              {recommendations.filter(r => r.tier === 'excellent' || r.tier === 'good').length}/{recommendations.length}
            </div>
          </div>
          <div>
            <span className="text-[#a1a1aa]">Primary TSO:</span>
            <div className="text-[#fafafa] font-mono text-xs">
              {analysisResult.tsos?.[0]?.name.split(' ')[0] || 'Unknown'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}