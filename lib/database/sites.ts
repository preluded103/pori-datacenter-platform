/**
 * Site Database Operations
 * CRUD operations for individual datacenter sites within projects
 */

import { 
  supabase, 
  DatabaseError, 
  handleDatabaseError, 
  isValidUUID,
  coordinatesToPoint,
  pointToCoordinates,
  coordinatesToPolygon,
  polygonToCoordinates
} from './supabase';
import { Site, CreateSiteRequest, UpdateSiteRequest, RiskAssessment } from '@/lib/types/project-types';

/**
 * Get all sites for a project
 */
export async function getSites(projectId: string): Promise<Site[]> {
  try {
    if (!isValidUUID(projectId)) {
      throw new DatabaseError('Invalid project ID format');
    }

    const { data, error } = await supabase
      .from('sites')
      .select(`
        *,
        risk_assessment:risk_assessments(*),
        data_sources(*)
      `)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) {
      handleDatabaseError(error, 'getSites');
    }

    return (data || []).map(transformSiteFromDB);
  } catch (error) {
    if (error instanceof DatabaseError) throw error;
    handleDatabaseError(error, 'getSites');
  }
}

/**
 * Get single site by ID with full details
 */
export async function getSite(id: string): Promise<Site | null> {
  try {
    if (!isValidUUID(id)) {
      throw new DatabaseError('Invalid site ID format');
    }

    const { data, error } = await supabase
      .from('sites')
      .select(`
        *,
        project:projects(id, name, organization_id),
        risk_assessment:risk_assessments(*),
        data_sources(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found or no access
      }
      handleDatabaseError(error, 'getSite');
    }

    if (!data) return null;

    return transformSiteFromDB(data);
  } catch (error) {
    if (error instanceof DatabaseError) throw error;
    handleDatabaseError(error, 'getSite');
  }
}

/**
 * Create new site
 */
export async function createSite(projectId: string, data: CreateSiteRequest): Promise<Site> {
  try {
    if (!isValidUUID(projectId)) {
      throw new DatabaseError('Invalid project ID format');
    }

    // Verify project exists and user has access
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, country_code')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      throw new DatabaseError('Project not found or access denied');
    }

    const siteData = {
      project_id: projectId,
      name: data.name.trim(),
      reference_code: data.reference_code?.trim() || null,
      location: coordinatesToPoint(data.coordinates),
      address: data.address?.trim() || null,
      municipality: data.municipality?.trim() || null,
      country_code: (project as any).country_code,
      area_hectares: data.area_hectares || null,
      power_requirement_mw: data.power_requirement_mw || null,
      assessment_status: 'pending' as const
    };

    const { data: site, error } = await (supabase as any)
      .from('sites')
      .insert(siteData)
      .select('*')
      .single();

    if (error) {
      handleDatabaseError(error, 'createSite');
    }

    return transformSiteFromDB(site);
  } catch (error) {
    if (error instanceof DatabaseError) throw error;
    handleDatabaseError(error, 'createSite');
  }
}

/**
 * Update existing site
 */
export async function updateSite(id: string, data: UpdateSiteRequest): Promise<Site> {
  try {
    if (!isValidUUID(id)) {
      throw new DatabaseError('Invalid site ID format');
    }

    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.reference_code !== undefined) updateData.reference_code = data.reference_code?.trim() || null;
    if (data.coordinates !== undefined) updateData.location = coordinatesToPoint(data.coordinates);
    if (data.address !== undefined) updateData.address = data.address?.trim() || null;
    if (data.municipality !== undefined) updateData.municipality = data.municipality?.trim() || null;
    if (data.area_hectares !== undefined) updateData.area_hectares = data.area_hectares;
    if (data.power_requirement_mw !== undefined) updateData.power_requirement_mw = data.power_requirement_mw;

    const { data: site, error } = await (supabase as any)
      .from('sites')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        risk_assessment:risk_assessments(*),
        data_sources(*)
      `)
      .single();

    if (error) {
      handleDatabaseError(error, 'updateSite');
    }

    return transformSiteFromDB(site);
  } catch (error) {
    if (error instanceof DatabaseError) throw error;
    handleDatabaseError(error, 'updateSite');
  }
}

/**
 * Delete site
 */
export async function deleteSite(id: string): Promise<void> {
  try {
    if (!isValidUUID(id)) {
      throw new DatabaseError('Invalid site ID format');
    }

    // Delete in correct order due to foreign key constraints
    // 1. Delete data sources
    await supabase.from('data_sources').delete().eq('site_id', id);
    
    // 2. Delete risk assessments  
    await supabase.from('risk_assessments').delete().eq('site_id', id);
    
    // 3. Delete site
    const { error } = await supabase
      .from('sites')
      .delete()
      .eq('id', id);

    if (error) {
      handleDatabaseError(error, 'deleteSite');
    }
  } catch (error) {
    if (error instanceof DatabaseError) throw error;
    handleDatabaseError(error, 'deleteSite');
  }
}

/**
 * Update site assessment status
 */
export async function updateSiteAssessmentStatus(
  id: string, 
  status: Site['assessment_status'],
  score?: number,
  recommendation?: Site['recommendation']
): Promise<void> {
  try {
    if (!isValidUUID(id)) {
      throw new DatabaseError('Invalid site ID format');
    }

    const updateData: any = {
      assessment_status: status,
      updated_at: new Date().toISOString()
    };

    if (status === 'completed') {
      updateData.assessment_date = new Date().toISOString();
      if (score !== undefined) updateData.overall_score = score;
      if (recommendation !== undefined) updateData.recommendation = recommendation;
    }

    const { error } = await (supabase as any)
      .from('sites')
      .update(updateData)
      .eq('id', id);

    if (error) {
      handleDatabaseError(error, 'updateSiteAssessmentStatus');
    }
  } catch (error) {
    if (error instanceof DatabaseError) throw error;
    handleDatabaseError(error, 'updateSiteAssessmentStatus');
  }
}

/**
 * Get sites within geographic bounds
 */
export async function getSitesInBounds(
  projectId: string,
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  }
): Promise<Site[]> {
  try {
    if (!isValidUUID(projectId)) {
      throw new DatabaseError('Invalid project ID format');
    }

    // Use PostGIS ST_Within for geographic queries
    const { data, error } = await supabase
      .from('sites')
      .select('*')
      .eq('project_id', projectId)
      .gte('ST_Y(location)', bounds.south)
      .lte('ST_Y(location)', bounds.north)
      .gte('ST_X(location)', bounds.west)
      .lte('ST_X(location)', bounds.east);

    if (error) {
      handleDatabaseError(error, 'getSitesInBounds');
    }

    return (data || []).map(transformSiteFromDB);
  } catch (error) {
    if (error instanceof DatabaseError) throw error;
    handleDatabaseError(error, 'getSitesInBounds');
  }
}

/**
 * Find sites by distance from coordinates
 */
export async function getSitesNearby(
  coordinates: [number, number],
  radiusKm: number,
  projectId?: string
): Promise<Site[]> {
  try {
    const point = coordinatesToPoint(coordinates);
    
    let query = supabase
      .from('sites')
      .select('*, ST_Distance(location, ST_GeomFromText($1)) as distance')
      .lte('ST_Distance(location, ST_GeomFromText($1))', radiusKm * 1000); // Convert to meters

    if (projectId) {
      if (!isValidUUID(projectId)) {
        throw new DatabaseError('Invalid project ID format');
      }
      query = query.eq('project_id', projectId);
    }

    const { data, error } = await query;

    if (error) {
      handleDatabaseError(error, 'getSitesNearby');
    }

    return (data || []).map(transformSiteFromDB);
  } catch (error) {
    if (error instanceof DatabaseError) throw error;
    handleDatabaseError(error, 'getSitesNearby');
  }
}

/**
 * Bulk import sites from CSV/Excel data
 */
export async function bulkCreateSites(
  projectId: string, 
  sites: CreateSiteRequest[]
): Promise<Site[]> {
  try {
    if (!isValidUUID(projectId)) {
      throw new DatabaseError('Invalid project ID format');
    }

    // Verify project exists and get country code
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, country_code')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      throw new DatabaseError('Project not found or access denied');
    }

    // Prepare bulk insert data
    const sitesData = sites.map(site => ({
      project_id: projectId,
      name: site.name.trim(),
      reference_code: site.reference_code?.trim() || null,
      location: coordinatesToPoint(site.coordinates),
      address: site.address?.trim() || null,
      municipality: site.municipality?.trim() || null,
      country_code: (project as any).country_code,
      area_hectares: site.area_hectares || null,
      power_requirement_mw: site.power_requirement_mw || null,
      assessment_status: 'pending' as const
    }));

    const { data, error } = await (supabase as any)
      .from('sites')
      .insert(sitesData)
      .select('*');

    if (error) {
      handleDatabaseError(error, 'bulkCreateSites');
    }

    return (data || []).map(transformSiteFromDB);
  } catch (error) {
    if (error instanceof DatabaseError) throw error;
    handleDatabaseError(error, 'bulkCreateSites');
  }
}

/**
 * Get site assessment summary for project dashboard
 */
export async function getSiteAssessmentSummary(projectId: string): Promise<{
  total: number;
  pending: number;
  analyzing: number;
  completed: number;
  error: number;
  recommended: number;
  average_score: number | null;
}> {
  try {
    if (!isValidUUID(projectId)) {
      throw new DatabaseError('Invalid project ID format');
    }

    const { data, error } = await supabase
      .from('sites')
      .select('assessment_status, overall_score')
      .eq('project_id', projectId);

    if (error) {
      handleDatabaseError(error, 'getSiteAssessmentSummary');
    }

    const sites = data || [];
    const scores = sites
      .map(s => s.overall_score)
      .filter(s => s !== null) as number[];

    return {
      total: sites.length,
      pending: sites.filter(s => s.assessment_status === 'pending').length,
      analyzing: sites.filter(s => s.assessment_status === 'analyzing').length,
      completed: sites.filter(s => s.assessment_status === 'completed').length,
      error: sites.filter(s => s.assessment_status === 'error').length,
      recommended: sites.filter(s => s.overall_score && s.overall_score >= 7).length,
      average_score: scores.length > 0 ? scores.reduce((sum, s) => sum + s, 0) / scores.length : null
    };
  } catch (error) {
    if (error instanceof DatabaseError) throw error;
    handleDatabaseError(error, 'getSiteAssessmentSummary');
  }
}

/**
 * Transform site data from database format to application format
 */
function transformSiteFromDB(dbSite: any): Site {
  const site: Site = {
    ...dbSite,
    location: dbSite.location ? {
      type: 'Point',
      coordinates: pointToCoordinates(dbSite.location)
    } : { type: 'Point', coordinates: [0, 0] },
    boundary: dbSite.boundary ? {
      type: 'Polygon',
      coordinates: polygonToCoordinates(dbSite.boundary)
    } : undefined
  };

  return site;
}