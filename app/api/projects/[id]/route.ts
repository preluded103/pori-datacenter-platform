import { NextRequest, NextResponse } from 'next/server';
import { getProject, updateProject, deleteProject } from '@/lib/database/projects';
import { DatabaseError } from '@/lib/database/supabase';

/**
 * GET /api/projects/[id]
 * Get single project with full details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const project = await getProject(params.id);
    
    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: project
    });
  } catch (error) {
    console.error(`GET /api/projects/${params.id} error:`, error);
    
    if (error instanceof DatabaseError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/projects/[id]
 * Update existing project
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    
    // Validate fields if provided
    if (body.name !== undefined && (typeof body.name !== 'string' || body.name.trim().length < 3)) {
      return NextResponse.json(
        { success: false, error: 'Project name must be at least 3 characters' },
        { status: 400 }
      );
    }
    
    if (body.status !== undefined && !['draft', 'active', 'completed', 'archived'].includes(body.status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid project status' },
        { status: 400 }
      );
    }
    
    const project = await updateProject(params.id, {
      name: body.name,
      description: body.description,
      status: body.status
    });
    
    return NextResponse.json({
      success: true,
      data: project
    });
  } catch (error) {
    console.error(`PUT /api/projects/${params.id} error:`, error);
    
    if (error instanceof DatabaseError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/projects/[id]
 * Delete project (only if no sites exist)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await deleteProject(params.id);
    
    return NextResponse.json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    console.error(`DELETE /api/projects/${params.id} error:`, error);
    
    if (error instanceof DatabaseError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}