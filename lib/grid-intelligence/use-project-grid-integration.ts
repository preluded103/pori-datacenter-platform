/**
 * Project Grid Integration Hook
 * Manages grid intelligence data integration with project analysis
 */

import { useState, useEffect, useCallback } from 'react';
import { GridAnalysisResult, PolygonFeature, AnalysisProgress, ProjectGridSummary } from '@/lib/types/grid-types';

interface ProjectGridIntegrationState {
  // Analysis state
  isAnalyzing: boolean;
  analysisProgress?: AnalysisProgress;
  analysisResult?: GridAnalysisResult;
  analysisError?: Error;
  
  // Project integration
  projectSummary?: ProjectGridSummary;
  hasGridData: boolean;
  needsRefresh: boolean;
  
  // Loading states
  isLoading: boolean;
  isSaving: boolean;
}

interface ProjectGridIntegrationOptions {
  autoSave?: boolean;
  cacheTimeoutMinutes?: number;
  enableRealtimeUpdates?: boolean;
}

export function useProjectGridIntegration(
  projectId: string,
  options: ProjectGridIntegrationOptions = {}
) {
  const {
    autoSave = true,
    cacheTimeoutMinutes = 30,
    enableRealtimeUpdates = false
  } = options;

  // State management
  const [state, setState] = useState<ProjectGridIntegrationState>({
    isAnalyzing: false,
    hasGridData: false,
    needsRefresh: false,
    isLoading: false,
    isSaving: false
  });

  // Load existing project grid data
  useEffect(() => {
    loadProjectGridData();
  }, [projectId]);

  // Auto-refresh logic
  useEffect(() => {
    if (enableRealtimeUpdates && state.hasGridData) {
      const interval = setInterval(() => {
        checkForUpdates();
      }, cacheTimeoutMinutes * 60 * 1000);

      return () => clearInterval(interval);
    }
  }, [state.hasGridData, cacheTimeoutMinutes, enableRealtimeUpdates]);

  /**
   * Load existing grid analysis data for project
   */
  const loadProjectGridData = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      // Check for existing project grid summary
      const response = await fetch(`/api/projects/${projectId}/grid-summary`);
      
      if (response.ok) {
        const projectSummary: ProjectGridSummary = await response.json();
        
        // Load full analysis result if available
        let analysisResult: GridAnalysisResult | undefined;
        if (projectSummary.gridAnalysisId) {
          const analysisResponse = await fetch(`/api/grid-intelligence/analysis/${projectSummary.gridAnalysisId}`);
          if (analysisResponse.ok) {
            analysisResult = await analysisResponse.json();
          }
        }

        setState(prev => ({
          ...prev,
          projectSummary,
          analysisResult,
          hasGridData: !!analysisResult,
          needsRefresh: projectSummary.needsRefresh || false,
          isLoading: false
        }));
      } else {
        setState(prev => ({
          ...prev,
          hasGridData: false,
          isLoading: false
        }));
      }
    } catch (error) {
      console.error('Failed to load project grid data:', error);
      setState(prev => ({
        ...prev,
        analysisError: error instanceof Error ? error : new Error('Failed to load data'),
        isLoading: false
      }));
    }
  }, [projectId]);

  /**
   * Trigger new grid analysis for polygon
   */
  const triggerGridAnalysis = useCallback(async (polygon: PolygonFeature) => {
    setState(prev => ({ ...prev, isAnalyzing: true, analysisError: undefined }));

    try {
      console.log('🔍 Starting grid analysis for project:', projectId);

      // Start analysis workflow
      const analysisResponse = await fetch('/api/grid-intelligence/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          polygon,
          coordinates: polygon.geometry.coordinates[0][0] // First coordinate
        })
      });

      if (!analysisResponse.ok) {
        throw new Error('Failed to start grid analysis');
      }

      const { analysisId } = await analysisResponse.json();

      // Poll for progress
      pollAnalysisProgress(analysisId);

    } catch (error) {
      console.error('Grid analysis failed:', error);
      setState(prev => ({
        ...prev,
        isAnalyzing: false,
        analysisError: error instanceof Error ? error : new Error('Analysis failed')
      }));
    }
  }, [projectId]);

  /**
   * Poll analysis progress
   */
  const pollAnalysisProgress = useCallback(async (analysisId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const progressResponse = await fetch(`/api/grid-intelligence/progress/${analysisId}`);
        
        if (progressResponse.ok) {
          const progress: AnalysisProgress = await progressResponse.json();
          
          setState(prev => ({ ...prev, analysisProgress: progress }));

          // Check if analysis is complete
          if (progress.percentage >= 100) {
            clearInterval(pollInterval);
            await fetchCompletedAnalysis(analysisId);
          }
        }
      } catch (error) {
        console.error('Failed to poll analysis progress:', error);
        clearInterval(pollInterval);
        setState(prev => ({
          ...prev,
          isAnalyzing: false,
          analysisError: new Error('Progress polling failed')
        }));
      }
    }, 2000); // Poll every 2 seconds

    // Timeout after 5 minutes
    setTimeout(() => {
      clearInterval(pollInterval);
      setState(prev => ({
        ...prev,
        isAnalyzing: false,
        analysisError: new Error('Analysis timeout')
      }));
    }, 5 * 60 * 1000);
  }, []);

  /**
   * Fetch completed analysis result
   */
  const fetchCompletedAnalysis = useCallback(async (analysisId: string) => {
    try {
      const resultResponse = await fetch(`/api/grid-intelligence/result/${analysisId}`);
      
      if (resultResponse.ok) {
        const analysisResult: GridAnalysisResult = await resultResponse.json();
        
        setState(prev => ({
          ...prev,
          analysisResult,
          isAnalyzing: false,
          analysisProgress: undefined,
          hasGridData: true,
          needsRefresh: false
        }));

        // Auto-save if enabled
        if (autoSave) {
          await saveGridAnalysis(analysisResult);
        }

        console.log('✅ Grid analysis completed for project:', projectId);
      } else {
        throw new Error('Failed to fetch analysis result');
      }
    } catch (error) {
      console.error('Failed to fetch completed analysis:', error);
      setState(prev => ({
        ...prev,
        isAnalyzing: false,
        analysisError: error instanceof Error ? error : new Error('Failed to fetch result')
      }));
    }
  }, [projectId, autoSave]);

  /**
   * Save grid analysis to project
   */
  const saveGridAnalysis = useCallback(async (analysisResult: GridAnalysisResult) => {
    setState(prev => ({ ...prev, isSaving: true }));

    try {
      const saveResponse = await fetch(`/api/projects/${projectId}/grid-analysis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(analysisResult)
      });

      if (!saveResponse.ok) {
        throw new Error('Failed to save grid analysis');
      }

      const projectSummary: ProjectGridSummary = await saveResponse.json();
      
      setState(prev => ({
        ...prev,
        projectSummary,
        isSaving: false
      }));

      console.log('💾 Grid analysis saved to project:', projectId);
    } catch (error) {
      console.error('Failed to save grid analysis:', error);
      setState(prev => ({
        ...prev,
        isSaving: false,
        analysisError: error instanceof Error ? error : new Error('Failed to save analysis')
      }));
    }
  }, [projectId]);

  /**
   * Check for data updates
   */
  const checkForUpdates = useCallback(async () => {
    if (!state.projectSummary?.gridAnalysisId) return;

    try {
      const response = await fetch(`/api/grid-intelligence/analysis/${state.projectSummary.gridAnalysisId}/status`);
      
      if (response.ok) {
        const { needsRefresh, lastModified } = await response.json();
        
        if (needsRefresh) {
          setState(prev => ({ ...prev, needsRefresh: true }));
        }
      }
    } catch (error) {
      console.error('Failed to check for updates:', error);
    }
  }, [state.projectSummary?.gridAnalysisId]);

  /**
   * Refresh grid analysis
   */
  const refreshGridAnalysis = useCallback(async (polygon: PolygonFeature) => {
    if (!state.hasGridData) return;
    
    // Clear existing data and trigger new analysis
    setState(prev => ({
      ...prev,
      analysisResult: undefined,
      needsRefresh: false,
      hasGridData: false
    }));

    await triggerGridAnalysis(polygon);
  }, [state.hasGridData, triggerGridAnalysis]);

  /**
   * Get analysis summary stats
   */
  const getAnalysisSummary = useCallback(() => {
    if (!state.analysisResult) return null;

    const result = state.analysisResult;
    return {
      suitabilityScore: result.summary?.overallSuitabilityScore || 0,
      nearestConnectionKm: result.capacityAnalysis?.nearestConnectionPoint?.distanceKm || 0,
      availableCapacityMW: result.capacityAnalysis?.totalAvailableCapacity || 0,
      connectionOpportunities: result.connectionOpportunities?.opportunities?.length || 0,
      majorConstraints: result.constraints?.constraints?.filter(c => c.severity === 'high').length || 0,
      primaryTSO: result.tsos?.[0]?.name || 'Unknown',
      lastAnalyzed: new Date(result.timestamp).toLocaleDateString()
    };
  }, [state.analysisResult]);

  /**
   * Export analysis data
   */
  const exportAnalysisData = useCallback(() => {
    if (!state.analysisResult) return null;

    const exportData = {
      project: {
        id: projectId,
        timestamp: new Date().toISOString()
      },
      analysis: state.analysisResult,
      summary: state.projectSummary
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `grid-analysis-${projectId}-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);

    return exportData;
  }, [projectId, state.analysisResult, state.projectSummary]);

  return {
    // State
    ...state,
    
    // Actions
    triggerGridAnalysis,
    refreshGridAnalysis,
    saveGridAnalysis,
    loadProjectGridData,
    
    // Utilities
    getAnalysisSummary,
    exportAnalysisData,
    
    // Status checks
    canTriggerAnalysis: !state.isAnalyzing && !state.isLoading,
    hasCompletedAnalysis: state.hasGridData && !!state.analysisResult,
    requiresRefresh: state.needsRefresh || false
  };
}