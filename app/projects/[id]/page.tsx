'use client';

import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Settings, FileText, MapPin, Clock, 
  TrendingUp, AlertTriangle, CheckCircle, Eye, 
  Plus, Edit3, Trash2, Map, Filter, Download
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Project, Site, ProjectDetailView, CreateSiteRequest } from '@/lib/types/project-types';

interface ProjectDetailPageProps {
  params: { id: string };
}

export default function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const router = useRouter();
  const [view, setView] = useState<ProjectDetailView>({
    project: null,
    sites: [],
    loading: true,
    error: null,
    activeTab: 'overview'
  });
  const [showAddSite, setShowAddSite] = useState(false);

  useEffect(() => {
    loadProject();
  }, [params.id]);

  const loadProject = async () => {
    setView(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      // Load project details
      const projectResponse = await fetch(`/api/projects/${params.id}`);
      const projectResult = await projectResponse.json();

      if (!projectResponse.ok || !projectResult.success) {
        throw new Error(projectResult.error || 'Failed to load project');
      }

      // Load sites
      const sitesResponse = await fetch(`/api/projects/${params.id}/sites?include_summary=true`);
      const sitesResult = await sitesResponse.json();

      if (!sitesResponse.ok || !sitesResult.success) {
        throw new Error(sitesResult.error || 'Failed to load sites');
      }

      setView(prev => ({
        ...prev,
        project: projectResult.data,
        sites: sitesResult.data,
        loading: false
      }));
    } catch (error) {
      console.error('Error loading project:', error);
      setView(prev => ({ 
        ...prev, 
        loading: false, 
        error: error instanceof Error ? error.message : 'Failed to load project'
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

  const getSiteStatusColor = (status: Site['assessment_status']) => {
    switch (status) {
      case 'completed': return 'text-green-400 bg-green-400/10';
      case 'analyzing': return 'text-blue-400 bg-blue-400/10';
      case 'pending': return 'text-yellow-400 bg-yellow-400/10';
      case 'error': return 'text-red-400 bg-red-400/10';
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

  if (view.loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0b] text-[#fafafa] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-[#27272a] border-t-blue-600 rounded-full mx-auto mb-4"></div>
          <p className="text-[#a1a1aa]">Loading project...</p>
        </div>
      </div>
    );
  }

  if (view.error) {
    return (
      <div className="min-h-screen bg-[#0a0a0b] text-[#fafafa] flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 text-red-400 mx-auto mb-4" />
          <p className="text-red-400 mb-4">{view.error}</p>
          <button 
            onClick={loadProject}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!view.project) {
    return (
      <div className="min-h-screen bg-[#0a0a0b] text-[#fafafa] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#a1a1aa] mb-4">Project not found</p>
          <Link 
            href="/projects"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
          >
            Back to Projects
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-[#fafafa]">
      {/* Header */}
      <header className="border-b border-[#27272a] bg-[#131316]/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                href="/projects"
                className="p-2 hover:bg-[#27272a] rounded-md transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-[#fafafa]">{view.project.name}</h1>
                <div className="flex items-center gap-3 mt-1">
                  <p className="text-[#a1a1aa]">{view.project.description || 'No description'}</p>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(view.project.status)}`}>
                    {view.project.status}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="px-4 py-2 bg-[#1a1a1f] hover:bg-[#27272a] text-[#fafafa] border border-[#27272a] rounded-md flex items-center gap-2 transition-all">
                <Download className="h-4 w-4" />
                Export
              </button>
              <button className="px-4 py-2 bg-[#1a1a1f] hover:bg-[#27272a] text-[#fafafa] border border-[#27272a] rounded-md flex items-center gap-2 transition-all">
                <Settings className="h-4 w-4" />
                Settings
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-6 mt-6">
            {[
              { id: 'overview', label: 'Overview', icon: Eye },
              { id: 'sites', label: 'Sites', icon: MapPin },
              { id: 'reports', label: 'Reports', icon: FileText },
              { id: 'settings', label: 'Settings', icon: Settings }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setView(prev => ({ ...prev, activeTab: tab.id as any }))}
                className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${
                  view.activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'text-[#a1a1aa] hover:text-[#fafafa] hover:bg-[#1a1a1f]'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Overview Tab */}
        {view.activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-[#131316] border border-[#27272a] rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[#a1a1aa] text-sm">Total Sites</p>
                    <p className="text-2xl font-bold text-[#fafafa]">{view.project.sites_count}</p>
                  </div>
                  <MapPin className="h-8 w-8 text-blue-400" />
                </div>
              </div>
              
              <div className="bg-[#131316] border border-[#27272a] rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[#a1a1aa] text-sm">Assessed</p>
                    <p className="text-2xl font-bold text-[#fafafa]">{view.project.sites_assessed}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-400" />
                </div>
              </div>
              
              <div className="bg-[#131316] border border-[#27272a] rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[#a1a1aa] text-sm">Capacity</p>
                    <p className="text-2xl font-bold text-[#fafafa]">{view.project.total_capacity_mw}MW</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-purple-400" />
                </div>
              </div>
              
              <div className="bg-[#131316] border border-[#27272a] rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[#a1a1aa] text-sm">Investment</p>
                    <p className="text-2xl font-bold text-[#fafafa]">{formatCurrency(view.project.total_investment_eur)}</p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-400" />
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-[#131316] border border-[#27272a] rounded-lg p-6">
              <h3 className="text-lg font-semibold text-[#fafafa] mb-4">Recent Activity</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-[#1a1a1f] rounded-md">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-[#fafafa] text-sm">Project created</p>
                    <p className="text-[#71717a] text-xs">{new Date(view.project.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                {view.project.sites_count > 0 && (
                  <div className="flex items-center gap-3 p-3 bg-[#1a1a1f] rounded-md">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-[#fafafa] text-sm">{view.project.sites_count} sites added</p>
                      <p className="text-[#71717a] text-xs">Various dates</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Sites Tab */}
        {view.activeTab === 'sites' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-[#fafafa]">Project Sites</h3>
              <button
                onClick={() => setShowAddSite(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center gap-2 transition-all"
              >
                <Plus className="h-4 w-4" />
                Add Site
              </button>
            </div>

            {view.sites.length === 0 ? (
              <div className="bg-[#131316] border border-[#27272a] rounded-lg p-8 text-center">
                <MapPin className="h-12 w-12 text-[#71717a] mx-auto mb-4" />
                <h4 className="text-lg font-medium text-[#fafafa] mb-2">No sites yet</h4>
                <p className="text-[#a1a1aa] mb-4">Start by adding your first datacenter site location</p>
                <button
                  onClick={() => setShowAddSite(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                >
                  Add First Site
                </button>
              </div>
            ) : (
              <div className="bg-[#131316] border border-[#27272a] rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-[#1a1a1f] border-b border-[#27272a]">
                    <tr>
                      <th className="text-left py-3 px-4 text-[#a1a1aa] font-medium">Site</th>
                      <th className="text-center py-3 px-4 text-[#a1a1aa] font-medium">Status</th>
                      <th className="text-center py-3 px-4 text-[#a1a1aa] font-medium">Power</th>
                      <th className="text-center py-3 px-4 text-[#a1a1aa] font-medium">Score</th>
                      <th className="text-center py-3 px-4 text-[#a1a1aa] font-medium">Location</th>
                      <th className="text-center py-3 px-4 text-[#a1a1aa] font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#27272a]">
                    {view.sites.map((site) => (
                      <tr key={site.id} className="hover:bg-[#1a1a1f] transition-colors">
                        <td className="py-4 px-4">
                          <div>
                            <div className="font-medium text-[#fafafa]">{site.name}</div>
                            {site.reference_code && (
                              <div className="text-sm text-[#a1a1aa]">{site.reference_code}</div>
                            )}
                            {site.municipality && (
                              <div className="text-sm text-[#71717a]">{site.municipality}</div>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSiteStatusColor(site.assessment_status)}`}>
                            {site.assessment_status}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className="text-[#fafafa] font-medium">
                            {site.power_requirement_mw ? `${site.power_requirement_mw}MW` : '-'}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          {site.overall_score !== null ? (
                            <span className={`font-medium ${
                              site.overall_score >= 7 ? 'text-green-400' :
                              site.overall_score >= 4 ? 'text-yellow-400' : 'text-red-400'
                            }`}>
                              {site.overall_score}/10
                            </span>
                          ) : (
                            <span className="text-[#71717a]">-</span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className="text-[#71717a] text-sm font-mono">
                            {site.location.coordinates[1].toFixed(4)}, {site.location.coordinates[0].toFixed(4)}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center justify-center gap-2">
                            <Link
                              href={`/projects/${params.id}/sites/${site.id}`}
                              className="p-2 hover:bg-[#27272a] rounded-md transition-colors"
                              title="View Site"
                            >
                              <Eye className="h-4 w-4 text-[#a1a1aa]" />
                            </Link>
                            <button
                              className="p-2 hover:bg-[#27272a] rounded-md transition-colors"
                              title="Edit Site"
                            >
                              <Edit3 className="h-4 w-4 text-[#a1a1aa]" />
                            </button>
                            <button
                              className="p-2 hover:bg-[#27272a] rounded-md transition-colors"
                              title="Delete Site"
                            >
                              <Trash2 className="h-4 w-4 text-[#a1a1aa]" />
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
        )}

        {/* Reports Tab */}
        {view.activeTab === 'reports' && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-[#fafafa]">Project Reports</h3>
            <div className="bg-[#131316] border border-[#27272a] rounded-lg p-8 text-center">
              <FileText className="h-12 w-12 text-[#71717a] mx-auto mb-4" />
              <h4 className="text-lg font-medium text-[#fafafa] mb-2">Reports coming soon</h4>
              <p className="text-[#a1a1aa]">Generate comprehensive assessment reports once sites are analyzed</p>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {view.activeTab === 'settings' && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-[#fafafa]">Project Settings</h3>
            <div className="bg-[#131316] border border-[#27272a] rounded-lg p-8 text-center">
              <Settings className="h-12 w-12 text-[#71717a] mx-auto mb-4" />
              <h4 className="text-lg font-medium text-[#fafafa] mb-2">Settings coming soon</h4>
              <p className="text-[#a1a1aa]">Configure project parameters and team access</p>
            </div>
          </div>
        )}
      </div>

      {/* Add Site Modal */}
      {showAddSite && (
        <AddSiteModal 
          projectId={params.id} 
          onClose={() => setShowAddSite(false)} 
          onSuccess={loadProject} 
        />
      )}
    </div>
  );
}

function AddSiteModal({ 
  projectId, 
  onClose, 
  onSuccess 
}: { 
  projectId: string; 
  onClose: () => void; 
  onSuccess: () => void; 
}) {
  const [formData, setFormData] = useState<CreateSiteRequest>({
    name: '',
    coordinates: [21.7972, 61.4851], // Default to Pori
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch(`/api/projects/${projectId}/sites`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      const result = await response.json();
      
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to create site');
      }
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating site:', error);
      // You might want to show an error message to the user here
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#131316] border border-[#27272a] rounded-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-semibold text-[#fafafa] mb-4">Add New Site</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-[#a1a1aa] mb-2">Site Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 bg-[#0a0a0b] border border-[#27272a] rounded-md text-[#fafafa] placeholder-[#71717a] focus:border-blue-600 focus:outline-none"
              placeholder="Enter site name..."
            />
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-[#a1a1aa] mb-2">Longitude</label>
              <input
                type="number"
                step="any"
                required
                value={formData.coordinates[0]}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  coordinates: [parseFloat(e.target.value), formData.coordinates[1]]
                })}
                className="w-full px-4 py-2 bg-[#0a0a0b] border border-[#27272a] rounded-md text-[#fafafa] placeholder-[#71717a] focus:border-blue-600 focus:outline-none"
                placeholder="21.7972"
              />
            </div>
            <div>
              <label className="block text-sm text-[#a1a1aa] mb-2">Latitude</label>
              <input
                type="number"
                step="any"
                required
                value={formData.coordinates[1]}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  coordinates: [formData.coordinates[0], parseFloat(e.target.value)]
                })}
                className="w-full px-4 py-2 bg-[#0a0a0b] border border-[#27272a] rounded-md text-[#fafafa] placeholder-[#71717a] focus:border-blue-600 focus:outline-none"
                placeholder="61.4851"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm text-[#a1a1aa] mb-2">Power Requirement (MW)</label>
            <input
              type="number"
              step="0.1"
              min="0"
              value={formData.power_requirement_mw || ''}
              onChange={(e) => setFormData({ 
                ...formData, 
                power_requirement_mw: e.target.value ? parseFloat(e.target.value) : undefined
              })}
              className="w-full px-4 py-2 bg-[#0a0a0b] border border-[#27272a] rounded-md text-[#fafafa] placeholder-[#71717a] focus:border-blue-600 focus:outline-none"
              placeholder="70"
            />
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
              {loading ? 'Adding...' : 'Add Site'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}