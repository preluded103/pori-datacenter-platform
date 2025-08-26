import { NextRequest, NextResponse } from 'next/server';
import { getSites, createSite, getSiteAssessmentSummary } from '@/lib/database/sites';
import { DatabaseError } from '@/lib/database/supabase';

/**
 * GET /api/projects/[id]/sites
 * Get all sites for a project
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const includeSummary = searchParams.get('include_summary') === 'true';
    
    const sites = await getSites(params.id);
    
    let summary = undefined;
    if (includeSummary) {
      summary = await getSiteAssessmentSummary(params.id);
    }
    
    return NextResponse.json({
      success: true,
      data: sites,
      summary
    });
  } catch (error) {
    console.error(`GET /api/projects/${params.id}/sites error:`, error);
    
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
 * POST /api/projects/[id]/sites
 * Create new site within project
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.name || typeof body.name !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Site name is required' },
        { status: 400 }
      );
    }
    
    if (!body.coordinates || !Array.isArray(body.coordinates) || body.coordinates.length !== 2) {
      return NextResponse.json(
        { success: false, error: 'Valid coordinates [longitude, latitude] are required' },
        { status: 400 }
      );
    }
    
    const [longitude, latitude] = body.coordinates;
    if (typeof longitude !== 'number' || typeof latitude !== 'number') {
      return NextResponse.json(
        { success: false, error: 'Coordinates must be valid numbers' },
        { status: 400 }
      );
    }
    
    if (longitude < -180 || longitude > 180 || latitude < -90 || latitude > 90) {
      return NextResponse.json(
        { success: false, error: 'Coordinates must be within valid ranges' },
        { status: 400 }
      );
    }
    
    if (body.name.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: 'Site name must be at least 2 characters' },
        { status: 400 }
      );
    }
    
    // Validate optional numeric fields
    if (body.area_hectares !== undefined && (typeof body.area_hectares !== 'number' || body.area_hectares <= 0)) {
      return NextResponse.json(
        { success: false, error: 'Area must be a positive number' },
        { status: 400 }
      );
    }
    
    if (body.power_requirement_mw !== undefined && (typeof body.power_requirement_mw !== 'number' || body.power_requirement_mw <= 0)) {
      return NextResponse.json(
        { success: false, error: 'Power requirement must be a positive number' },
        { status: 400 }
      );
    }
    
    const site = await createSite(params.id, {
      name: body.name,
      reference_code: body.reference_code,
      coordinates: body.coordinates,
      address: body.address,
      municipality: body.municipality,
      area_hectares: body.area_hectares,
      power_requirement_mw: body.power_requirement_mw
    });
    
    return NextResponse.json({
      success: true,
      data: site
    }, { status: 201 });
  } catch (error) {
    console.error(`POST /api/projects/${params.id}/sites error:`, error);
    
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