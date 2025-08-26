/**
 * Project Database Operations
 * CRUD operations for datacenter development projects
 */

import { 
  supabase, 
  supabaseAdmin, 
  DatabaseError, 
  handleDatabaseError, 
  isValidUUID,
  getCurrentUserOrgId 
} from './supabase';
import { Project, CreateProjectRequest, UpdateProjectRequest } from '@/lib/types/project-types';

/**
 * Get all projects for current user's organization
 */
export async function getProjects(params?: {
  status?: Project['status'];
  country_code?: string;
  search?: string;
  page?: number;
  limit?: number;
  sort_field?: keyof Project;
  sort_direction?: 'asc' | 'desc';
}): Promise<{
  projects: Project[];
  total: number;
  page: number;
  limit: number;
}> {
  try {
    const {
      status,
      country_code,
      search,
      page = 1,
      limit = 10,
      sort_field = 'updated_at',
      sort_direction = 'desc'
    } = params || {};

    let query = supabase
      .from('projects')
      .select(`
        *,
        organization:organizations(name, slug),
        creator:users(full_name, email),
        sites(id, name, assessment_status, power_requirement_mw, overall_score)
      `)
      .order(sort_field, { ascending: sort_direction === 'asc' });

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }
    if (country_code) {
      query = query.eq('country_code', country_code);
    }
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      handleDatabaseError(error, 'getProjects');
    }

    // Transform data with computed fields
    const projects: Project[] = (data || []).map(project => ({
      ...project,
      sites_count: project.sites?.length || 0,
      sites_assessed: project.sites?.filter(s => s.assessment_status === 'completed').length || 0,
      sites_recommended: project.sites?.filter(s => s.overall_score && s.overall_score >= 7).length || 0,
      total_capacity_mw: project.sites?.reduce((sum, s) => sum + (s.power_requirement_mw || 0), 0) || 0,
      total_investment_eur: project.sites?.reduce((sum, s) => sum + 5000000, 0) || 0, // Placeholder calculation
      sites: undefined // Remove from response to avoid circular reference
    }));

    return {
      projects,
      total: count || 0,
      page,
      limit
    };
  } catch (error) {
    if (error instanceof DatabaseError) throw error;
    handleDatabaseError(error, 'getProjects');
  }
}

/**
 * Get single project by ID with full details
 */
export async function getProject(id: string): Promise<Project | null> {
  try {
    if (!isValidUUID(id)) {
      throw new DatabaseError('Invalid project ID format');
    }

    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        organization:organizations(name, slug, subscription_tier),
        creator:users(full_name, email),
        sites(
          id, name, reference_code, location, address, municipality,
          area_hectares, power_requirement_mw, assessment_status,
          overall_score, recommendation, created_at, updated_at
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found or no access
      }
      handleDatabaseError(error, 'getProject');
    }

    if (!data) return null;

    // Transform with computed fields
    const project: Project = {
      ...(data as any),
      sites_count: (data as any).sites?.length || 0,
      sites_assessed: (data as any).sites?.filter((s: any) => s.assessment_status === 'completed').length || 0,
      sites_recommended: (data as any).sites?.filter((s: any) => s.overall_score && s.overall_score >= 7).length || 0,
      total_capacity_mw: (data as any).sites?.reduce((sum: number, s: any) => sum + (s.power_requirement_mw || 0), 0) || 0,
      total_investment_eur: (data as any).sites?.reduce((sum: number, s: any) => sum + 5000000, 0) || 0
    };

    return project;
  } catch (error) {
    if (error instanceof DatabaseError) throw error;
    handleDatabaseError(error, 'getProject');
  }
}

/**
 * Create new project
 */
export async function createProject(data: CreateProjectRequest): Promise<Project> {
  try {
    const orgId = await getCurrentUserOrgId();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new DatabaseError('User not authenticated');
    }

    const projectData = {
      organization_id: orgId,
      name: data.name.trim(),
      description: data.description?.trim() || null,
      country_code: data.country_code,
      created_by: user.id,
      status: 'draft' as const
    };

    const { data: project, error } = await supabase
      .from('projects')
      .insert(projectData as any)
      .select(`
        *,
        organization:organizations(name, slug),
        creator:users(full_name, email)
      `)
      .single();

    if (error) {
      handleDatabaseError(error, 'createProject');
    }

    // Return with computed fields
    return {
      ...(project as any),
      sites_count: 0,
      sites_assessed: 0,
      sites_recommended: 0,
      total_capacity_mw: 0,
      total_investment_eur: 0,
      sites: []
    };
  } catch (error) {
    if (error instanceof DatabaseError) throw error;
    handleDatabaseError(error, 'createProject');
  }
}

/**
 * Update existing project
 */
export async function updateProject(id: string, data: UpdateProjectRequest): Promise<Project> {
  try {
    if (!isValidUUID(id)) {
      throw new DatabaseError('Invalid project ID format');
    }

    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.description !== undefined) updateData.description = data.description?.trim() || null;
    if (data.status !== undefined) updateData.status = data.status;

    const { data: project, error } = await (supabase as any)
      .from('projects')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        organization:organizations(name, slug),
        creator:users(full_name, email),
        sites(id, assessment_status, power_requirement_mw, overall_score)
      `)
      .single();

    if (error) {
      handleDatabaseError(error, 'updateProject');
    }

    // Return with computed fields
    return {
      ...project,
      sites_count: project.sites?.length || 0,
      sites_assessed: project.sites?.filter(s => s.assessment_status === 'completed').length || 0,
      sites_recommended: project.sites?.filter(s => s.overall_score && s.overall_score >= 7).length || 0,
      total_capacity_mw: project.sites?.reduce((sum, s) => sum + (s.power_requirement_mw || 0), 0) || 0,
      total_investment_eur: project.sites?.reduce((sum, s) => sum + 5000000, 0) || 0,
      sites: undefined
    };
  } catch (error) {
    if (error instanceof DatabaseError) throw error;
    handleDatabaseError(error, 'updateProject');
  }
}

/**
 * Delete project (only if no sites exist)
 */
export async function deleteProject(id: string): Promise<void> {
  try {
    if (!isValidUUID(id)) {
      throw new DatabaseError('Invalid project ID format');
    }

    // Check if project has sites
    const { count } = await supabase
      .from('sites')
      .select('id', { count: 'exact', head: true })
      .eq('project_id', id);

    if (count && count > 0) {
      throw new DatabaseError('Cannot delete project with existing sites. Remove sites first.');
    }

    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);

    if (error) {
      handleDatabaseError(error, 'deleteProject');
    }
  } catch (error) {
    if (error instanceof DatabaseError) throw error;
    handleDatabaseError(error, 'deleteProject');
  }
}

/**
 * Archive project (soft delete)
 */
export async function archiveProject(id: string): Promise<Project> {
  try {
    return await updateProject(id, { status: 'archived' });
  } catch (error) {
    if (error instanceof DatabaseError) throw error;
    handleDatabaseError(error, 'archiveProject');
  }
}

/**
 * Get project statistics for dashboard
 */
export async function getProjectStats(): Promise<{
  total_projects: number;
  active_projects: number;
  total_sites: number;
  sites_assessed: number;
  total_capacity_mw: number;
  recommended_sites: number;
}> {
  try {
    const orgId = await getCurrentUserOrgId();

    // Get project counts
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('status, sites(assessment_status, power_requirement_mw, overall_score)')
      .eq('organization_id', orgId);

    if (projectsError) {
      handleDatabaseError(projectsError, 'getProjectStats');
    }

    const allSites = (projects as any)?.flatMap((p: any) => p.sites || []) || [];
    
    return {
      total_projects: (projects as any)?.length || 0,
      active_projects: (projects as any)?.filter((p: any) => p.status === 'active').length || 0,
      total_sites: allSites.length,
      sites_assessed: allSites.filter((s: any) => s.assessment_status === 'completed').length,
      total_capacity_mw: allSites.reduce((sum: number, s: any) => sum + (s.power_requirement_mw || 0), 0),
      recommended_sites: allSites.filter((s: any) => s.overall_score && s.overall_score >= 7).length
    };
  } catch (error) {
    if (error instanceof DatabaseError) throw error;
    handleDatabaseError(error, 'getProjectStats');
  }
}

/**
 * Duplicate project with new name
 */
export async function duplicateProject(id: string, newName: string): Promise<Project> {
  try {
    if (!isValidUUID(id)) {
      throw new DatabaseError('Invalid project ID format');
    }

    const originalProject = await getProject(id);
    if (!originalProject) {
      throw new DatabaseError('Original project not found');
    }

    const duplicatedProject = await createProject({
      name: newName,
      description: originalProject.description || undefined,
      country_code: originalProject.country_code
    });

    return duplicatedProject;
  } catch (error) {
    if (error instanceof DatabaseError) throw error;
    handleDatabaseError(error, 'duplicateProject');
  }
}