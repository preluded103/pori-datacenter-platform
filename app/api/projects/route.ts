import { NextRequest, NextResponse } from 'next/server';
import { getProjects, createProject, getProjectStats } from '@/lib/database/projects';
import { DatabaseError } from '@/lib/database/supabase';

/**
 * GET /api/projects
 * List all projects for current user's organization
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const params = {
      status: searchParams.get('status') as any,
      country_code: searchParams.get('country_code') || undefined,
      search: searchParams.get('search') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '10'),
      sort_field: searchParams.get('sort_field') as any || 'updated_at',
      sort_direction: searchParams.get('sort_direction') as 'asc' | 'desc' || 'desc'
    };

    const result = await getProjects(params);
    
    return NextResponse.json({
      success: true,
      data: result.projects,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        total_pages: Math.ceil(result.total / result.limit)
      }
    });
  } catch (error) {
    console.error('GET /api/projects error:', error);
    
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
 * POST /api/projects
 * Create new project
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.name || typeof body.name !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Project name is required' },
        { status: 400 }
      );
    }
    
    if (!body.country_code || typeof body.country_code !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Country code is required' },
        { status: 400 }
      );
    }
    
    if (body.name.trim().length < 3) {
      return NextResponse.json(
        { success: false, error: 'Project name must be at least 3 characters' },
        { status: 400 }
      );
    }
    
    const project = await createProject({
      name: body.name,
      description: body.description,
      country_code: body.country_code
    });
    
    return NextResponse.json({
      success: true,
      data: project
    }, { status: 201 });
  } catch (error) {
    console.error('POST /api/projects error:', error);
    
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