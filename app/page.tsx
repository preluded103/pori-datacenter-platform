'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, FolderOpen, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface Project {
  id: string;
  name: string;
  country: string;
  status: 'Active' | 'Draft' | 'Completed';
  lastModified: string;
}

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data for now - replace with actual API call later
  useEffect(() => {
    const mockProjects: Project[] = [
      {
        id: '1',
        name: 'Pori Finland DC',
        country: 'Finland',
        status: 'Active',
        lastModified: '2 days ago'
      },
      {
        id: '2',
        name: 'Stockholm Sweden DC',
        country: 'Sweden',
        status: 'Draft',
        lastModified: '1 week ago'
      },
      {
        id: '3',
        name: 'Oslo Norway DC',
        country: 'Norway',
        status: 'Completed',
        lastModified: '3 weeks ago'
      }
    ];
    setProjects(mockProjects);
  }, []);

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-[#fafafa]">
      <div className="max-w-6xl mx-auto px-6 py-8">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Feasibility Dashboard</h1>
          <p className="text-[#71717a]">Start Page, user selects NEW or an Existing Project</p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Sidebar - New Project */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Plus className="w-5 h-5 mr-2 text-blue-400" />
                  New
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/projects/new">
                  <Button variant="outline" className="w-full">
                    Project
                  </Button>
                </Link>
                <div className="text-sm text-muted-foreground">
                  Start a new datacenter feasibility analysis
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Main Area - Existing Projects */}
          <div className="lg:col-span-2">
            <div className="bg-[#131316] border border-[#27272a] rounded-lg p-6">
              
              {/* Header with Search */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <FolderOpen className="w-5 h-5 mr-2 text-green-400" />
                  <h2 className="text-lg font-semibold">Projects</h2>
                </div>
                
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#71717a]" />
                  <Input
                    type="text"
                    placeholder="Search projects..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-[#0a0a0b] border-[#27272a] text-[#fafafa] placeholder-[#71717a] focus:border-blue-600"
                  />
                </div>
              </div>

              {/* Projects List */}
              <div className="space-y-2">
                {filteredProjects.length > 0 ? (
                  filteredProjects.map((project) => (
                    <Link
                      key={project.id}
                      href={`/projects/${project.id}`}
                      className="block p-4 bg-[#1a1a1f] hover:bg-[#27272a] border border-[#27272a] rounded-md transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-[#fafafa]">{project.name}</h3>
                          <div className="flex items-center mt-1 text-sm text-[#a1a1aa]">
                            <span>{project.country}</span>
                            <span className="mx-2">•</span>
                            <span>Modified {project.lastModified}</span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <Badge 
                            variant={
                              project.status === 'Active' ? 'default' :
                              project.status === 'Draft' ? 'secondary' :
                              'outline'
                            }
                            className={
                              project.status === 'Active' ? 'bg-green-600 hover:bg-green-700' :
                              project.status === 'Draft' ? 'bg-yellow-600 hover:bg-yellow-700' :
                              ''
                            }
                          >
                            {project.status}
                          </Badge>
                        </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="text-center py-12 text-[#71717a]">
                    <FolderOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No projects found</p>
                  </div>
                )}
              </div>

              {/* Footer Note */}
              <div className="mt-6 pt-4 border-t border-[#27272a] text-sm text-[#71717a]">
                If user selects New, go to New Project Arrangement for uploading and drawing
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Note */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center px-4 py-2 bg-[#131316] border border-[#27272a] rounded-lg text-sm text-[#a1a1aa]">
            <span className="mr-2">💡</span>
            When analysis is done, project summary page
          </div>
        </div>
      </div>
    </div>
  );
}