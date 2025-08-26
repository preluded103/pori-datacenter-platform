'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Filter, MapPin, Clock, TrendingUp, 
  AlertTriangle, CheckCircle, Eye, Settings, FileText,
  MoreHorizontal, Edit3, Trash2, Archive, Zap
} from 'lucide-react';
import Link from 'next/link';
import { Project, ProjectListView, CreateProjectRequest } from '@/lib/types/project-types';

export default function ProjectsPage() {
  const [view, setView] = useState<ProjectListView>({
    projects: [],
    loading: true,
    error: null,
    filters: {},
    sorting: { field: 'updated_at', direction: 'desc' },
    pagination: { page: 1, limit: 10, total: 0 }
  });

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadProjects();
  }, [view.filters, view.sorting, view.pagination.page]);

  const loadProjects = async () => {
    setView(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const params = new URLSearchParams();
      if (view.filters.status) params.set('status', view.filters.status);
      if (view.filters.country_code) params.set('country_code', view.filters.country_code);
      if (view.filters.search) params.set('search', view.filters.search);
      params.set('page', view.pagination.page.toString());
      params.set('limit', view.pagination.limit.toString());
      params.set('sort_field', view.sorting.field);
      params.set('sort_direction', view.sorting.direction);

      const response = await fetch(`/api/projects?${params.toString()}`);
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to load projects');
      }

      setView(prev => ({
        ...prev,
        projects: result.data,
        loading: false,
        pagination: { 
          ...prev.pagination, 
          total: result.pagination.total,
          page: result.pagination.page
        }
      }));
    } catch (error) {
      console.error('Error loading projects:', error);
      setView(prev => ({ 
        ...prev, 
        loading: false, 
        error: error instanceof Error ? error.message : 'Failed to load projects'
      }));
    }
  };

  const getStatusColor = (status: Project['status']) => {
    switch (status) {
      case 'active': return 'text-green-400 bg-green-400/10';
      case 'draft': return 'text-yellow-400 bg-yellow-400/10';
      case 'completed': return 'text-blue-400 bg-blue-400/10';
      case 'archived': return 'text-gray-400 bg-gray-400/10';
      default: return 'text-gray-400 bg-gray-400/10';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-[#fafafa]">
      {/* Header */}
      <header className="border-b border-[#27272a] bg-[#131316]/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[#fafafa]">Datacenter Projects</h1>
              <p className="text-[#a1a1aa] mt-1">Manage site assessment and development projects</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-4 py-2 bg-[#1a1a1f] hover:bg-[#27272a] text-[#fafafa] border border-[#27272a] rounded-md flex items-center gap-2 transition-all"
              >
                <Filter className="h-4 w-4" />
                Filters
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center gap-2 transition-all"
              >
                <Plus className="h-4 w-4" />
                New Project
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Filters */}
        {showFilters && (
          <div className="mb-6 bg-[#131316] border border-[#27272a] rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm text-[#a1a1aa] mb-2">Status</label>
                <select className="w-full px-3 py-2 bg-[#0a0a0b] border border-[#27272a] rounded-md text-[#fafafa] focus:border-blue-600 focus:outline-none">
                  <option value="">All Statuses</option>
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-[#a1a1aa] mb-2">Country</label>
                <select className="w-full px-3 py-2 bg-[#0a0a0b] border border-[#27272a] rounded-md text-[#fafafa] focus:border-blue-600 focus:outline-none">
                  <option value="">All Countries</option>
                  <option value="FI">Finland</option>
                  <option value="SE">Sweden</option>
                  <option value="NO">Norway</option>
                  <option value="DE">Germany</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-[#a1a1aa] mb-2">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#71717a]" />
                  <input
                    type="text"
                    placeholder="Search projects..."
                    className="w-full pl-10 pr-4 py-2 bg-[#0a0a0b] border border-[#27272a] rounded-md text-[#fafafa] placeholder-[#71717a] focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex items-end">
                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-all">
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#131316] border border-[#27272a] rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#a1a1aa] text-sm">Total Projects</p>
                <p className="text-2xl font-bold text-[#fafafa]">{view.projects.length}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-400" />
            </div>
          </div>
          
          <div className="bg-[#131316] border border-[#27272a] rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#a1a1aa] text-sm">Active Assessments</p>
                <p className="text-2xl font-bold text-[#fafafa]">{view.projects.filter(p => p.status === 'active').length}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-400" />
            </div>
          </div>
          
          <div className="bg-[#131316] border border-[#27272a] rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#a1a1aa] text-sm">Total Sites</p>
                <p className="text-2xl font-bold text-[#fafafa]">{view.projects.reduce((sum, p) => sum + p.sites_count, 0)}</p>
              </div>
              <MapPin className="h-8 w-8 text-green-400" />
            </div>
          </div>
          
          <div className="bg-[#131316] border border-[#27272a] rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#a1a1aa] text-sm">Total Capacity</p>
                <p className="text-2xl font-bold text-[#fafafa]">{view.projects.reduce((sum, p) => sum + p.total_capacity_mw, 0)}MW</p>
              </div>
              <Zap className="h-8 w-8 text-purple-400" />
            </div>
          </div>
        </div>

        {/* Projects List */}
        <div className="bg-[#131316] border border-[#27272a] rounded-lg overflow-hidden">
          {view.loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin h-8 w-8 border-2 border-[#27272a] border-t-blue-600 rounded-full mx-auto mb-4"></div>
              <p className="text-[#a1a1aa]">Loading projects...</p>
            </div>
          ) : view.error ? (
            <div className="p-8 text-center">
              <AlertTriangle className="h-8 w-8 text-red-400 mx-auto mb-4" />
              <p className="text-red-400">{view.error}</p>
              <button 
                onClick={loadProjects}
                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
              >
                Retry
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#1a1a1f] border-b border-[#27272a]">
                  <tr>
                    <th className="text-left py-3 px-4 text-[#a1a1aa] font-medium">Project</th>
                    <th className="text-left py-3 px-4 text-[#a1a1aa] font-medium">Status</th>
                    <th className="text-center py-3 px-4 text-[#a1a1aa] font-medium">Sites</th>
                    <th className="text-center py-3 px-4 text-[#a1a1aa] font-medium">Assessed</th>
                    <th className="text-center py-3 px-4 text-[#a1a1aa] font-medium">Capacity</th>
                    <th className="text-right py-3 px-4 text-[#a1a1aa] font-medium">Investment</th>
                    <th className="text-center py-3 px-4 text-[#a1a1aa] font-medium">Updated</th>
                    <th className="text-center py-3 px-4 text-[#a1a1aa] font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#27272a]">
                  {view.projects.map((project) => (
                    <tr key={project.id} className="hover:bg-[#1a1a1f] transition-colors">
                      <td className="py-4 px-4">
                        <div>
                          <Link 
                            href={`/projects/${project.id}`}
                            className="font-medium text-[#fafafa] hover:text-blue-400 transition-colors"
                          >
                            {project.name}
                          </Link>
                          <p className="text-sm text-[#a1a1aa] mt-1">{project.description}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-[#71717a] bg-[#1a1a1f] px-2 py-1 rounded">{project.country_code}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                          {project.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="text-[#fafafa] font-medium">{project.sites_count}</span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <span className="text-[#fafafa] font-medium">{project.sites_assessed}</span>
                          <span className="text-[#71717a]">/ {project.sites_count}</span>
                          {project.sites_assessed > 0 && (
                            <CheckCircle className="h-4 w-4 text-green-400 ml-1" />
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="text-[#fafafa] font-medium">{project.total_capacity_mw}MW</span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className="text-[#fafafa] font-medium">{formatCurrency(project.total_investment_eur)}</span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="text-[#71717a] text-sm">
                          {new Date(project.updated_at).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <Link
                            href={`/projects/${project.id}`}
                            className="p-2 hover:bg-[#27272a] rounded-md transition-colors"
                            title="View Project"
                          >
                            <Eye className="h-4 w-4 text-[#a1a1aa]" />
                          </Link>
                          <button
                            className="p-2 hover:bg-[#27272a] rounded-md transition-colors"
                            title="Edit Project"
                          >
                            <Edit3 className="h-4 w-4 text-[#a1a1aa]" />
                          </button>
                          <button
                            className="p-2 hover:bg-[#27272a] rounded-md transition-colors"
                            title="More Options"
                          >
                            <MoreHorizontal className="h-4 w-4 text-[#a1a1aa]" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-6">
          <p className="text-[#71717a] text-sm">
            Showing {view.projects.length} of {view.pagination.total} projects
          </p>
          <div className="flex items-center gap-2">
            <button 
              disabled={view.pagination.page === 1}
              className="px-3 py-2 bg-[#1a1a1f] hover:bg-[#27272a] disabled:opacity-50 disabled:cursor-not-allowed text-[#fafafa] border border-[#27272a] rounded-md"
            >
              Previous
            </button>
            <span className="px-3 py-2 bg-blue-600 text-white rounded-md">{view.pagination.page}</span>
            <button 
              disabled={view.pagination.page * view.pagination.limit >= view.pagination.total}
              className="px-3 py-2 bg-[#1a1a1f] hover:bg-[#27272a] disabled:opacity-50 disabled:cursor-not-allowed text-[#fafafa] border border-[#27272a] rounded-md"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Create Project Modal */}
      {showCreateModal && <CreateProjectModal onClose={() => setShowCreateModal(false)} onSuccess={loadProjects} />}
    </div>
  );
}

function CreateProjectModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState<CreateProjectRequest>({
    name: '',
    country_code: 'FI'
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      const result = await response.json();
      
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to create project');
      }
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating project:', error);
      // You might want to show an error message to the user here
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#131316] border border-[#27272a] rounded-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-semibold text-[#fafafa] mb-4">Create New Project</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-[#a1a1aa] mb-2">Project Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 bg-[#0a0a0b] border border-[#27272a] rounded-md text-[#fafafa] placeholder-[#71717a] focus:border-blue-600 focus:outline-none"
              placeholder="Enter project name..."
            />
          </div>
          
          <div>
            <label className="block text-sm text-[#a1a1aa] mb-2">Description (Optional)</label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 bg-[#0a0a0b] border border-[#27272a] rounded-md text-[#fafafa] placeholder-[#71717a] focus:border-blue-600 focus:outline-none h-20"
              placeholder="Project description..."
            />
          </div>
          
          <div>
            <label className="block text-sm text-[#a1a1aa] mb-2">Primary Country</label>
            <select
              value={formData.country_code}
              onChange={(e) => setFormData({ ...formData, country_code: e.target.value })}
              className="w-full px-4 py-2 bg-[#0a0a0b] border border-[#27272a] rounded-md text-[#fafafa] focus:border-blue-600 focus:outline-none"
            >
              <option value="FI">Finland</option>
              <option value="SE">Sweden</option>
              <option value="NO">Norway</option>
              <option value="DE">Germany</option>
              <option value="DK">Denmark</option>
            </select>
          </div>
          
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-[#1a1a1f] hover:bg-[#27272a] text-[#fafafa] border border-[#27272a] rounded-md transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.name}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-md transition-all"
            >
              {loading ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}