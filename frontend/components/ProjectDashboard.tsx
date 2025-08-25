/**
 * Project Dashboard for Phase 0 Screening Platform
 * Main interface for managing multi-site datacenter assessments
 */

'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, Zap, Droplets, Wifi, Clock, AlertTriangle, CheckCircle } from 'lucide-react';

interface Site {
  id: string;
  name: string;
  location: string;
  coordinates: [number, number];
  status: 'pending' | 'analyzing' | 'completed' | 'error';
  score?: {
    overall: number;
    recommendation: 'PROCEED' | 'CAUTION' | 'AVOID';
    confidence: 'HIGH' | 'MEDIUM' | 'LOW';
    criticalFlags: string[];
  };
  lastUpdated: string;
}

interface Project {
  id: string;
  name: string;
  description: string;
  country: string;
  sites: Site[];
  createdAt: string;
  status: 'active' | 'completed' | 'archived';
}

const ProjectDashboard: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  // Mock data for demonstration
  useEffect(() => {
    setTimeout(() => {
      setProjects([
        {
          id: '1',
          name: 'Nordic Datacenter Expansion',
          description: 'Multi-site screening across Finland, Norway, and Sweden',
          country: 'Multi-country',
          status: 'active',
          createdAt: '2025-01-20',
          sites: [
            {
              id: 'pori-1',
              name: 'Pori Konepajanranta',
              location: 'Pori, Finland',
              coordinates: [61.4957, 21.8110],
              status: 'completed',
              score: {
                overall: 7.8,
                recommendation: 'PROCEED',
                confidence: 'HIGH',
                criticalFlags: ['Grid connection requires 220kV investment']
              },
              lastUpdated: '2025-01-22'
            },
            {
              id: 'tampere-1',
              name: 'Tampere Industrial',
              location: 'Tampere, Finland',
              coordinates: [61.4991, 23.7871],
              status: 'analyzing',
              lastUpdated: '2025-01-23'
            },
            {
              id: 'oslo-1',
              name: 'Oslo South',
              location: 'Oslo, Norway',
              coordinates: [59.9139, 10.7522],
              status: 'pending',
              lastUpdated: '2025-01-23'
            }
          ]
        }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'analyzing': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-gray-100 text-gray-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'PROCEED': return 'text-green-600';
      case 'CAUTION': return 'text-yellow-600';
      case 'AVOID': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 7) return 'text-green-600';
    if (score >= 5) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0b] text-[#fafafa] flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-[#27272a] border-t-blue-600 rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-[#fafafa]">
      {/* Header */}
      <header className="border-b border-[#27272a] bg-[#131316]/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#fafafa]">Pre-DD Intelligence Platform</h1>
            <p className="text-sm text-[#a1a1aa]">Phase 0 Datacenter Site Screening</p>
          </div>
          <div className="flex items-center gap-3">
            <a 
              href="/demo" 
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md transition-all duration-200"
            >
              View Demo Results
            </a>
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-all duration-200">
              New Project
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Projects Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-[#131316] border border-[#27272a] rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#a1a1aa] text-sm">Active Projects</p>
                <p className="text-2xl font-bold text-[#fafafa]">
                  {projects.filter(p => p.status === 'active').length}
                </p>
              </div>
              <MapPin className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-[#131316] border border-[#27272a] rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#a1a1aa] text-sm">Sites Analyzed</p>
                <p className="text-2xl font-bold text-[#fafafa]">
                  {projects.reduce((total, p) => total + p.sites.filter(s => s.status === 'completed').length, 0)}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="bg-[#131316] border border-[#27272a] rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#a1a1aa] text-sm">Avg. Completion Time</p>
                <p className="text-2xl font-bold text-[#fafafa]">3.2d</p>
              </div>
              <Clock className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Projects List */}
        <div className="space-y-6">
          {projects.map((project) => (
            <div key={project.id} className="bg-[#131316] border border-[#27272a] rounded-lg">
              <div className="p-6 border-b border-[#27272a]">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-[#fafafa]">{project.name}</h2>
                    <p className="text-[#a1a1aa] mt-1">{project.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-[#71717a]">
                      <span>{project.country}</span>
                      <span>•</span>
                      <span>{project.sites.length} sites</span>
                      <span>•</span>
                      <span>Created {project.createdAt}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      project.status === 'active' ? 'bg-green-100 text-green-800' :
                      project.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {project.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Sites Grid */}
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {project.sites.map((site) => (
                    <div key={site.id} className="bg-[#1a1a1f] border border-[#27272a] rounded-lg p-4 hover:border-blue-600 transition-all cursor-pointer">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-medium text-[#fafafa]">{site.name}</h3>
                          <p className="text-sm text-[#a1a1aa]">{site.location}</p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(site.status)}`}>
                          {site.status.toUpperCase()}
                        </span>
                      </div>

                      {site.score ? (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-[#a1a1aa]">Score</span>
                            <span className={`font-bold ${getScoreColor(site.score.overall)}`}>
                              {site.score.overall}/10
                            </span>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-[#a1a1aa]">Recommendation</span>
                            <span className={`text-xs font-medium ${getRecommendationColor(site.score.recommendation)}`}>
                              {site.score.recommendation}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-sm text-[#a1a1aa]">Confidence</span>
                            <span className="text-xs font-medium text-[#fafafa]">
                              {site.score.confidence}
                            </span>
                          </div>

                          {site.score.criticalFlags.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-[#27272a]">
                              <div className="flex items-center gap-1 text-xs text-red-400">
                                <AlertTriangle className="h-3 w-3" />
                                <span>{site.score.criticalFlags.length} critical flag(s)</span>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="h-2 bg-[#27272a] rounded animate-pulse"></div>
                          <div className="h-2 bg-[#27272a] rounded animate-pulse w-3/4"></div>
                          <div className="h-2 bg-[#27272a] rounded animate-pulse w-1/2"></div>
                        </div>
                      )}

                      <div className="mt-3 pt-3 border-t border-[#27272a] flex items-center justify-between text-xs text-[#71717a]">
                        <span>Updated {site.lastUpdated}</span>
                        <button className="text-blue-400 hover:text-blue-300">
                          View Details →
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Add Site Card */}
                  <div className="bg-[#1a1a1f] border-2 border-dashed border-[#27272a] rounded-lg p-4 flex items-center justify-center hover:border-blue-600 transition-all cursor-pointer">
                    <div className="text-center">
                      <div className="w-8 h-8 bg-[#27272a] rounded-full flex items-center justify-center mx-auto mb-2">
                        <span className="text-[#a1a1aa]">+</span>
                      </div>
                      <p className="text-sm text-[#a1a1aa]">Add New Site</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {projects.length === 0 && (
          <div className="text-center py-12">
            <MapPin className="mx-auto h-12 w-12 text-[#71717a] mb-4" />
            <h3 className="text-lg font-medium text-[#fafafa] mb-2">No projects yet</h3>
            <p className="text-[#a1a1aa] mb-6">Get started by creating your first datacenter screening project.</p>
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-all duration-200">
              Create New Project
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectDashboard;