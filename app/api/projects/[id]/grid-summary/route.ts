/**
 * Project Grid Summary API
 * Handles grid intelligence integration with project data
 */

import { NextRequest, NextResponse } from 'next/server';
import { ProjectGridSummary } from '@/lib/types/grid-types';

interface ProjectGridSummaryRequest {
  projectId: string;
}

// Mock data store - in production, this would use a database
const mockProjectSummaries = new Map<string, ProjectGridSummary>();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    console.log('📊 Fetching grid summary for project:', params.id);

    const projectSummary = mockProjectSummaries.get(params.id);

    if (!projectSummary) {
      return NextResponse.json(
        { error: 'Grid summary not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(projectSummary);

  } catch (error) {
    console.error('❌ Error fetching grid summary:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch grid summary',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    console.log('💾 Saving grid summary for project:', params.id);

    const body = await request.json();
    const { gridAnalysisResult } = body;

    if (!gridAnalysisResult) {
      return NextResponse.json(
        { error: 'Grid analysis result required' },
        { status: 400 }
      );
    }

    // Create project grid summary from analysis result
    const projectSummary: ProjectGridSummary = {
      projectId: params.id,
      gridAnalysisId: gridAnalysisResult.analysisId,
      lastAnalyzed: gridAnalysisResult.timestamp,
      
      // Extract key metrics
      suitabilityScore: gridAnalysisResult.summary?.overallSuitabilityScore || 0,
      nearestConnectionKm: gridAnalysisResult.capacityAnalysis?.nearestConnectionPoint?.distanceKm || 0,
      availableCapacityMW: gridAnalysisResult.capacityAnalysis?.totalAvailableCapacity || 0,
      estimatedTimelineMonths: extractTimelineMonths(gridAnalysisResult),
      
      // Extract key information
      primaryTSO: gridAnalysisResult.tsos?.[0],
      recommendedConnectionPoint: gridAnalysisResult.capacityAnalysis?.nearestConnectionPoint?.name,
      majorConstraints: extractMajorConstraints(gridAnalysisResult),
      keyRequirements: gridAnalysisResult.summary?.nextSteps || [],
      
      analysisStatus: 'completed',
      needsRefresh: false
    };

    // Store in mock data store
    mockProjectSummaries.set(params.id, projectSummary);

    console.log('✅ Grid summary saved for project:', params.id);

    return NextResponse.json(projectSummary);

  } catch (error) {
    console.error('❌ Error saving grid summary:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to save grid summary',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    console.log('🔄 Updating grid summary for project:', params.id);

    const body = await request.json();
    const existingSummary = mockProjectSummaries.get(params.id);

    if (!existingSummary) {
      return NextResponse.json(
        { error: 'Grid summary not found' },
        { status: 404 }
      );
    }

    // Update summary with provided fields
    const updatedSummary: ProjectGridSummary = {
      ...existingSummary,
      ...body,
      projectId: params.id // Ensure project ID doesn't change
    };

    mockProjectSummaries.set(params.id, updatedSummary);

    console.log('✅ Grid summary updated for project:', params.id);

    return NextResponse.json(updatedSummary);

  } catch (error) {
    console.error('❌ Error updating grid summary:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to update grid summary',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    console.log('🗑️ Deleting grid summary for project:', params.id);

    const deleted = mockProjectSummaries.delete(params.id);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Grid summary not found' },
        { status: 404 }
      );
    }

    console.log('✅ Grid summary deleted for project:', params.id);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('❌ Error deleting grid summary:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to delete grid summary',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Extract timeline in months from analysis result
 */
function extractTimelineMonths(gridAnalysisResult: any): number {
  if (!gridAnalysisResult.connectionOpportunities?.opportunities?.length) {
    return 12; // Default fallback
  }

  const timeString = gridAnalysisResult.connectionOpportunities.opportunities[0].timeToConnect;
  const match = timeString.match(/(\d+)-?(\d+)?\s*months?/i);
  
  if (match) {
    const min = parseInt(match[1]);
    const max = match[2] ? parseInt(match[2]) : min;
    return Math.round((min + max) / 2);
  }
  
  return 12;
}

/**
 * Extract major constraints from analysis result
 */
function extractMajorConstraints(gridAnalysisResult: any): string[] {
  const constraints: string[] = [];
  
  // Add high severity constraints
  if (gridAnalysisResult.constraints?.constraints) {
    gridAnalysisResult.constraints.constraints
      .filter((c: any) => c.severity === 'high')
      .forEach((c: any) => constraints.push(c.description));
  }
  
  // Add capacity limitations
  if (gridAnalysisResult.capacityAnalysis?.totalAvailableCapacity < 100) {
    constraints.push('Limited grid capacity');
  }
  
  // Add distance concerns
  if (gridAnalysisResult.capacityAnalysis?.nearestConnectionPoint?.distanceKm > 10) {
    constraints.push('Long distance to connection');
  }
  
  return constraints.slice(0, 5); // Limit to top 5
}