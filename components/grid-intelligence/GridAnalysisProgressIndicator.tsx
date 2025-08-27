/**
 * Grid Analysis Progress Indicator Component
 * Shows real-time progress of grid intelligence analysis
 */

'use client';

import React, { useState, useEffect } from 'react';
import { X, Zap, MapPin, Database, BarChart3, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { AnalysisProgress } from '@/lib/types/grid-types';

interface GridAnalysisProgressIndicatorProps {
  progress?: AnalysisProgress;
  onCancel?: () => void;
  showDetails?: boolean;
  className?: string;
}

interface ProgressStage {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  estimatedDuration: number; // seconds
}

const ANALYSIS_STAGES: ProgressStage[] = [
  {
    id: 'validation',
    name: 'Location Validation',
    description: 'Validating coordinates and identifying region',
    icon: MapPin,
    estimatedDuration: 2
  },
  {
    id: 'tso-identification',
    name: 'TSO Identification',
    description: 'Finding relevant transmission system operators',
    icon: Zap,
    estimatedDuration: 3
  },
  {
    id: 'data-collection',
    name: 'Data Collection',
    description: 'Gathering grid infrastructure information',
    icon: Database,
    estimatedDuration: 15
  },
  {
    id: 'analysis',
    name: 'Grid Analysis',
    description: 'Processing capacity and connection data',
    icon: BarChart3,
    estimatedDuration: 8
  },
  {
    id: 'completion',
    name: 'Finalizing Results',
    description: 'Generating recommendations and visualizations',
    icon: CheckCircle,
    estimatedDuration: 2
  }
];

export default function GridAnalysisProgressIndicator({
  progress,
  onCancel,
  showDetails = true,
  className = ''
}: GridAnalysisProgressIndicatorProps) {
  
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState(0);

  // Update current stage based on progress percentage
  useEffect(() => {
    if (!progress) return;

    const percentage = progress.percentage;
    let stageIndex = 0;
    
    if (percentage >= 90) stageIndex = 4;      // Completion
    else if (percentage >= 75) stageIndex = 3; // Analysis
    else if (percentage >= 25) stageIndex = 2; // Data Collection
    else if (percentage >= 10) stageIndex = 1; // TSO Identification
    else stageIndex = 0;                       // Validation

    setCurrentStageIndex(stageIndex);
  }, [progress?.percentage]);

  // Calculate elapsed and remaining time
  useEffect(() => {
    if (!progress) return;

    const startTime = new Date(progress.timestamp).getTime();
    const now = Date.now();
    const elapsed = Math.floor((now - startTime) / 1000);
    
    setElapsedTime(elapsed);

    // Calculate estimated time remaining based on current progress
    const totalEstimatedTime = ANALYSIS_STAGES.reduce((sum, stage) => sum + stage.estimatedDuration, 0);
    const progressRatio = progress.percentage / 100;
    const estimated = Math.max(0, totalEstimatedTime - (totalEstimatedTime * progressRatio));
    
    setEstimatedTimeRemaining(Math.ceil(estimated));
  }, [progress]);

  // Auto-update timer
  useEffect(() => {
    const timer = setInterval(() => {
      if (progress) {
        const startTime = new Date(progress.timestamp).getTime();
        const now = Date.now();
        const elapsed = Math.floor((now - startTime) / 1000);
        setElapsedTime(elapsed);
        
        if (estimatedTimeRemaining > 0) {
          setEstimatedTimeRemaining(prev => Math.max(0, prev - 1));
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [progress, estimatedTimeRemaining]);

  if (!progress) return null;

  const currentStage = ANALYSIS_STAGES[currentStageIndex];

  return (
    <div className={`fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 ${className}`}>
      <div className="bg-[#131316] border border-[#27272a] rounded-xl shadow-2xl w-full max-w-md mx-4">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#27272a]">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600/20 rounded-lg">
              <Zap className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-[#fafafa]">Grid Intelligence Analysis</h3>
              <p className="text-sm text-[#71717a]">Analyzing your site location...</p>
            </div>
          </div>
          
          {onCancel && (
            <button
              onClick={onCancel}
              className="p-2 hover:bg-[#27272a] rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-[#71717a]" />
            </button>
          )}
        </div>

        {/* Progress Bar */}
        <div className="p-6 pb-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-[#fafafa]">
              {Math.round(progress.percentage)}% Complete
            </span>
            <div className="flex items-center space-x-2 text-xs text-[#71717a]">
              <Clock className="h-3 w-3" />
              <span>~{estimatedTimeRemaining}s remaining</span>
            </div>
          </div>
          
          <div className="w-full bg-[#27272a] rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-blue-600 to-blue-500 h-3 rounded-full transition-all duration-500 ease-out relative overflow-hidden"
              style={{ width: `${progress.percentage}%` }}
            >
              {/* Animated shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
            </div>
          </div>
        </div>

        {/* Current Stage */}
        <div className="px-6 pb-4">
          <div className="flex items-center space-x-3 p-3 bg-[#1a1a1f] rounded-lg">
            <div className="p-2 bg-blue-600/20 rounded">
              <currentStage.icon className="h-4 w-4 text-blue-400" />
            </div>
            <div>
              <div className="font-medium text-[#fafafa] text-sm">{currentStage.name}</div>
              <div className="text-xs text-[#71717a]">{progress.stage || currentStage.description}</div>
            </div>
          </div>
        </div>

        {/* Detailed Progress */}
        {showDetails && (
          <div className="px-6 pb-4">
            <div className="space-y-2">
              {ANALYSIS_STAGES.map((stage, index) => (
                <div key={stage.id} className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${
                    index < currentStageIndex ? 'bg-green-500' : 
                    index === currentStageIndex ? 'bg-blue-500 animate-pulse' :
                    'bg-[#27272a]'
                  }`} />
                  <div className={`text-xs ${
                    index < currentStageIndex ? 'text-green-400' :
                    index === currentStageIndex ? 'text-[#fafafa]' :
                    'text-[#71717a]'
                  }`}>
                    {stage.name}
                    {index < currentStageIndex && (
                      <CheckCircle className="inline h-3 w-3 ml-1" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Analysis Details */}
        {progress.details && (
          <div className="border-t border-[#27272a] p-6">
            {progress.details.currentTask && (
              <div className="mb-3">
                <div className="text-xs text-[#a1a1aa] mb-1">Current Task:</div>
                <div className="text-sm text-[#fafafa]">{progress.details.currentTask}</div>
              </div>
            )}
            
            {progress.details.completedTasks && progress.details.completedTasks.length > 0 && (
              <div className="mb-3">
                <div className="text-xs text-[#a1a1aa] mb-2">Completed Tasks:</div>
                <div className="space-y-1">
                  {progress.details.completedTasks.slice(-3).map((task, index) => (
                    <div key={index} className="flex items-center space-x-2 text-xs">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      <span className="text-[#a1a1aa]">{task}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {progress.details.errors && progress.details.errors.length > 0 && (
              <div>
                <div className="text-xs text-[#a1a1aa] mb-2">Issues:</div>
                <div className="space-y-1">
                  {progress.details.errors.slice(-2).map((error, index) => (
                    <div key={index} className="flex items-center space-x-2 text-xs">
                      <AlertCircle className="h-3 w-3 text-yellow-500" />
                      <span className="text-yellow-400">{error}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-[#27272a] p-4">
          <div className="flex items-center justify-between text-xs text-[#71717a]">
            <div className="flex items-center space-x-4">
              <span>Analysis ID: {progress.analysisId.slice(-8)}</span>
              <span>Elapsed: {Math.floor(elapsedTime / 60)}:{(elapsedTime % 60).toString().padStart(2, '0')}</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-green-400">Processing</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Compact version for inline display
 */
export function GridAnalysisProgressCompact({
  progress,
  onCancel,
  className = ''
}: GridAnalysisProgressIndicatorProps) {
  
  if (!progress) return null;

  return (
    <div className={`bg-[#131316] border border-[#27272a] rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="p-1.5 bg-blue-600/20 rounded">
            <Zap className="h-4 w-4 text-blue-400 animate-pulse" />
          </div>
          <div>
            <div className="font-medium text-[#fafafa] text-sm">Grid Analysis</div>
            <div className="text-xs text-[#71717a]">{Math.round(progress.percentage)}% complete</div>
          </div>
        </div>
        
        {onCancel && (
          <button
            onClick={onCancel}
            className="p-1 hover:bg-[#27272a] rounded text-[#71717a] hover:text-[#fafafa]"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      
      <div className="w-full bg-[#27272a] rounded-full h-2">
        <div 
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress.percentage}%` }}
        />
      </div>
      
      {progress.stage && (
        <div className="mt-2 text-xs text-[#a1a1aa]">
          {progress.stage}
        </div>
      )}
    </div>
  );
}

/**
 * Mini version for status bars
 */
export function GridAnalysisProgressMini({
  progress,
  className = ''
}: { progress?: AnalysisProgress; className?: string }) {
  
  if (!progress) return null;

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className="w-3 h-3 bg-blue-600 rounded-full animate-pulse"></div>
      <span className="text-xs text-blue-400">
        Grid analysis {Math.round(progress.percentage)}%
      </span>
    </div>
  );
}