/**
 * Grid Infrastructure Layer Selector Component
 * Enhances existing layer selector with grid intelligence layers
 */

'use client';

import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Eye, EyeOff, Settings, Info, Zap, MapPin, AlertTriangle, CheckCircle } from 'lucide-react';
import { GridVisualizationLayer, GridInfrastructureLayerConfig } from '@/lib/types/grid-types';

interface GridInfrastructureLayerSelectorProps {
  layers: GridVisualizationLayer[];
  onLayerToggle: (layerId: string, visible: boolean) => void;
  onOpacityChange: (layerId: string, opacity: number) => void;
  config: GridInfrastructureLayerConfig;
  onConfigChange: (config: Partial<GridInfrastructureLayerConfig>) => void;
  isAnalyzing?: boolean;
  analysisProgress?: number;
}

interface LayerCategory {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  description: string;
  layers: GridVisualizationLayer[];
}

export default function GridInfrastructureLayerSelector({
  layers,
  onLayerToggle,
  onOpacityChange,
  config,
  onConfigChange,
  isAnalyzing = false,
  analysisProgress = 0
}: GridInfrastructureLayerSelectorProps) {
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

  // Organize layers into categories
  const layerCategories: LayerCategory[] = [
    {
      id: 'capacity',
      name: 'Grid Capacity',
      icon: Zap,
      description: 'Available grid capacity and connection points',
      layers: layers.filter(layer => layer.type === 'capacity')
    },
    {
      id: 'transmission',
      name: 'Transmission Lines',
      icon: MapPin,
      description: 'High voltage transmission infrastructure',
      layers: layers.filter(layer => layer.type === 'transmission')
    },
    {
      id: 'substations',
      name: 'Substations',
      icon: CheckCircle,
      description: 'Grid connection points and substations',
      layers: layers.filter(layer => layer.type === 'substations')
    },
    {
      id: 'opportunities',
      name: 'Connection Points',
      icon: CheckCircle,
      description: 'Viable connection opportunities',
      layers: layers.filter(layer => layer.type === 'opportunities')
    },
    {
      id: 'constraints',
      name: 'Grid Constraints',
      icon: AlertTriangle,
      description: 'Grid limitations and constraints',
      layers: layers.filter(layer => layer.type === 'constraints')
    }
  ];

  // Calculate total visible layers
  const visibleLayersCount = layers.filter(layer => layer.visible).length;
  const totalLayersCount = layers.length;

  return (
    <div className="bg-[#131316] border border-[#27272a] rounded-lg shadow-xl">
      {/* Header */}
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-[#1a1a1f] transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-600/20 rounded-lg">
            <Zap className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold text-[#fafafa]">Grid Infrastructure</h3>
            <p className="text-sm text-[#71717a]">
              {isAnalyzing ? (
                `Analyzing grid data... ${analysisProgress}%`
              ) : (
                `${visibleLayersCount}/${totalLayersCount} layers visible`
              )}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {isAnalyzing && (
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-600 rounded-full animate-pulse"></div>
              <span className="text-xs text-blue-400">{analysisProgress}%</span>
            </div>
          )}
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-[#71717a]" />
          ) : (
            <ChevronDown className="h-5 w-5 text-[#71717a]" />
          )}
        </div>
      </div>

      {/* Analysis Progress Bar */}
      {isAnalyzing && (
        <div className="px-4 pb-2">
          <div className="w-full bg-[#27272a] rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${analysisProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-[#27272a]">
          
          {/* Quick Actions */}
          <div className="p-4 border-b border-[#27272a]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-[#a1a1aa]">Quick Actions</span>
              <button
                onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                className="p-1 hover:bg-[#27272a] rounded"
              >
                <Settings className="h-4 w-4 text-[#71717a]" />
              </button>
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  layers.forEach(layer => {
                    if (!layer.visible) onLayerToggle(layer.id, true);
                  });
                }}
                className="flex-1 px-3 py-1 text-xs bg-blue-600/20 text-blue-400 rounded hover:bg-blue-600/30 transition-colors"
                disabled={isAnalyzing}
              >
                Show All
              </button>
              <button
                onClick={() => {
                  layers.forEach(layer => {
                    if (layer.visible) onLayerToggle(layer.id, false);
                  });
                }}
                className="flex-1 px-3 py-1 text-xs bg-[#27272a] text-[#a1a1aa] rounded hover:bg-[#3f3f46] transition-colors"
                disabled={isAnalyzing}
              >
                Hide All
              </button>
            </div>
          </div>

          {/* Layer Categories */}
          <div className="p-4">
            <div className="space-y-3">
              {layerCategories.map((category) => (
                <LayerCategoryItem
                  key={category.id}
                  category={category}
                  isExpanded={selectedCategory === category.id}
                  onToggleExpand={() => {
                    setSelectedCategory(selectedCategory === category.id ? null : category.id);
                  }}
                  onLayerToggle={onLayerToggle}
                  onOpacityChange={onOpacityChange}
                  disabled={isAnalyzing}
                />
              ))}
            </div>
          </div>

          {/* Advanced Settings */}
          {showAdvancedSettings && (
            <div className="border-t border-[#27272a] p-4">
              <h4 className="font-medium text-[#fafafa] mb-3">Advanced Settings</h4>
              
              <div className="space-y-4">
                {/* Capacity Analysis Settings */}
                <div>
                  <label className="text-sm text-[#a1a1aa] mb-2 block">
                    Capacity Heatmap Intensity
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="2"
                    step="0.1"
                    value={config.capacityAnalysis?.heatmapIntensity || 1}
                    onChange={(e) => {
                      onConfigChange({
                        capacityAnalysis: {
                          ...config.capacityAnalysis,
                          heatmapIntensity: parseFloat(e.target.value)
                        }
                      });
                    }}
                    className="w-full h-2 bg-[#27272a] rounded-lg appearance-none cursor-pointer slider-thumb"
                  />
                </div>

                {/* Substation Labels */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#a1a1aa]">Show Substation Labels</span>
                  <button
                    onClick={() => {
                      onConfigChange({
                        substations: {
                          ...config.substations,
                          showLabels: !config.substations?.showLabels
                        }
                      });
                    }}
                    className={`relative w-10 h-6 rounded-full transition-colors ${
                      config.substations?.showLabels ? 'bg-blue-600' : 'bg-[#27272a]'
                    }`}
                  >
                    <span 
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                        config.substations?.showLabels ? 'translate-x-4' : 'translate-x-0'
                      }`} 
                    />
                  </button>
                </div>

                {/* Icon Size by Capacity */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#a1a1aa]">Scale Icons by Capacity</span>
                  <button
                    onClick={() => {
                      onConfigChange({
                        substations: {
                          ...config.substations,
                          iconSizeByCapacity: !config.substations?.iconSizeByCapacity
                        }
                      });
                    }}
                    className={`relative w-10 h-6 rounded-full transition-colors ${
                      config.substations?.iconSizeByCapacity ? 'bg-blue-600' : 'bg-[#27272a]'
                    }`}
                  >
                    <span 
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                        config.substations?.iconSizeByCapacity ? 'translate-x-4' : 'translate-x-0'
                      }`} 
                    />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Data Status */}
          <div className="border-t border-[#27272a] p-4">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#71717a]">
                Last updated: {new Date().toLocaleTimeString()}
              </span>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-green-400">Live Data</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface LayerCategoryItemProps {
  category: LayerCategory;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onLayerToggle: (layerId: string, visible: boolean) => void;
  onOpacityChange: (layerId: string, opacity: number) => void;
  disabled: boolean;
}

function LayerCategoryItem({
  category,
  isExpanded,
  onToggleExpand,
  onLayerToggle,
  onOpacityChange,
  disabled
}: LayerCategoryItemProps) {
  
  const Icon = category.icon;
  const visibleLayers = category.layers.filter(layer => layer.visible);
  const hasData = category.layers.length > 0;

  return (
    <div className="border border-[#27272a] rounded-lg">
      {/* Category Header */}
      <div 
        className={`flex items-center justify-between p-3 cursor-pointer hover:bg-[#1a1a1f] transition-colors ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        onClick={disabled ? undefined : onToggleExpand}
      >
        <div className="flex items-center space-x-3">
          <div className={`p-1.5 rounded ${
            hasData ? 'bg-blue-600/20 text-blue-400' : 'bg-[#27272a] text-[#71717a]'
          }`}>
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <div className="font-medium text-[#fafafa] text-sm">{category.name}</div>
            <div className="text-xs text-[#71717a]">
              {hasData ? (
                `${visibleLayers.length}/${category.layers.length} visible`
              ) : (
                'No data available'
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {hasData && (
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-blue-400">{category.layers.length}</span>
            </div>
          )}
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-[#71717a]" />
          ) : (
            <ChevronDown className="h-4 w-4 text-[#71717a]" />
          )}
        </div>
      </div>

      {/* Individual Layers */}
      {isExpanded && hasData && (
        <div className="border-t border-[#27272a] p-3 space-y-2">
          {category.layers.map((layer) => (
            <div key={layer.id} className="flex items-center justify-between">
              <div className="flex items-center space-x-3 flex-1">
                <button
                  onClick={() => onLayerToggle(layer.id, !layer.visible)}
                  disabled={disabled}
                  className={`p-1 rounded hover:bg-[#27272a] transition-colors ${
                    disabled ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {layer.visible ? (
                    <Eye className="h-4 w-4 text-blue-400" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-[#71717a]" />
                  )}
                </button>
                
                <div className="flex-1">
                  <div className="text-sm text-[#fafafa]">{layer.name}</div>
                  <div className="text-xs text-[#71717a]">
                    Opacity: {Math.round(layer.opacity * 100)}%
                  </div>
                </div>
              </div>
              
              {layer.visible && (
                <div className="w-20">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={layer.opacity}
                    onChange={(e) => onOpacityChange(layer.id, parseFloat(e.target.value))}
                    disabled={disabled}
                    className="w-full h-1 bg-[#27272a] rounded appearance-none cursor-pointer slider-thumb"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* No Data State */}
      {isExpanded && !hasData && (
        <div className="border-t border-[#27272a] p-4 text-center">
          <Info className="h-8 w-8 text-[#71717a] mx-auto mb-2" />
          <p className="text-sm text-[#71717a]">
            No {category.name.toLowerCase()} data available for this area.
          </p>
          <p className="text-xs text-[#71717a] mt-1">
            Draw a polygon to analyze grid infrastructure.
          </p>
        </div>
      )}
    </div>
  );
}

// CSS for custom slider (add to global CSS)
export const sliderStyles = `
.slider-thumb::-webkit-slider-thumb {
  appearance: none;
  height: 16px;
  width: 16px;
  border-radius: 50%;
  background: #3b82f6;
  cursor: pointer;
  border: 2px solid #1a1a1f;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.slider-thumb::-moz-range-thumb {
  height: 16px;
  width: 16px;
  border-radius: 50%;
  background: #3b82f6;
  cursor: pointer;
  border: 2px solid #1a1a1f;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}
`;