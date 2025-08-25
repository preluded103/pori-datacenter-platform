'use client';

import React from 'react';
import { MapPin, Zap, Droplets, Wifi, Clock, AlertTriangle, CheckCircle, Download, Eye, TrendingUp } from 'lucide-react';

const DemoPage = () => {
  // Mock data showing our Pori success transformed into Phase 0 format
  const demoProject = {
    name: 'Nordic Datacenter Expansion',
    client: 'European DC Development Ltd.',
    analysisDate: '2025-01-25',
    sites: [
      {
        id: 'pori-1',
        name: 'Pori Konepajanranta',
        location: 'Pori, Finland',
        coordinates: '61.4957°N, 21.8110°E',
        area: 15,
        powerReq: 70,
        status: 'completed',
        score: {
          overall: 7.8,
          infrastructure: 8.2,
          environmental: 7.1,
          regulatory: 8.5,
          technical: 7.4,
          timeline: 6.8,
          recommendation: 'PROCEED',
          confidence: 'HIGH'
        },
        flags: {
          critical: [
            'Grid connection requires 220kV investment (€8-15M)',
            'River cooling permits required (12-18 months)'
          ],
          strengths: [
            'Industrial zoning pre-approved for datacenters',
            'Excellent transport connectivity via Highway 11',
            'Municipal district heating integration opportunity'
          ]
        },
        costs: {
          infrastructure: '€8-15M',
          timeline: '36-48mo',
          complexity: 'MEDIUM'
        }
      },
      {
        id: 'tampere-1',
        name: 'Tampere Industrial',
        location: 'Tampere, Finland',
        coordinates: '61.4991°N, 23.7871°E',
        area: 12,
        powerReq: 50,
        status: 'completed',
        score: {
          overall: 6.2,
          infrastructure: 5.8,
          environmental: 6.5,
          regulatory: 7.1,
          technical: 6.9,
          timeline: 5.4,
          recommendation: 'CAUTION',
          confidence: 'MEDIUM'
        },
        flags: {
          critical: [
            'Power infrastructure 18km away - high connection cost',
            'Limited water cooling options identified',
            'Complex municipal approval process'
          ],
          strengths: [
            'Strong fiber connectivity infrastructure',
            'No protected area conflicts'
          ]
        },
        costs: {
          infrastructure: '€15-25M',
          timeline: '48-60mo',
          complexity: 'HIGH'
        }
      },
      {
        id: 'oslo-1',
        name: 'Oslo South',
        location: 'Oslo, Norway',
        coordinates: '59.9139°N, 10.7522°E',
        area: 20,
        powerReq: 100,
        status: 'completed',
        score: {
          overall: 8.4,
          infrastructure: 9.1,
          environmental: 7.8,
          regulatory: 8.2,
          technical: 8.5,
          timeline: 7.9,
          recommendation: 'PROCEED',
          confidence: 'HIGH'
        },
        flags: {
          critical: [
            'Height restrictions due to airport proximity'
          ],
          strengths: [
            'Excellent grid infrastructure within 3km',
            'Abundant hydroelectric power availability',
            'Strong regulatory support for datacenters',
            'Fjord cooling water access'
          ]
        },
        costs: {
          infrastructure: '€5-10M',
          timeline: '24-36mo',
          complexity: 'LOW'
        }
      }
    ]
  };

  const getScoreColor = (score: number) => {
    if (score >= 7.5) return 'text-green-400';
    if (score >= 6) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getRecommendationColor = (rec: string) => {
    switch (rec) {
      case 'PROCEED': return 'text-green-400 bg-green-400/10';
      case 'CAUTION': return 'text-yellow-400 bg-yellow-400/10';
      case 'AVOID': return 'text-red-400 bg-red-400/10';
      default: return 'text-gray-400 bg-gray-400/10';
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-[#fafafa]">
      {/* Header */}
      <header className="border-b border-[#27272a] bg-[#131316]/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#fafafa]">Pre-DD Intelligence Platform</h1>
            <p className="text-sm text-[#a1a1aa]">Phase 0 Screening Results</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 bg-[#1a1a1f] hover:bg-[#27272a] text-[#fafafa] border border-[#27272a] rounded-md flex items-center gap-2 transition-all">
              <Download className="h-4 w-4" />
              Export Report
            </button>
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center gap-2 transition-all">
              <Eye className="h-4 w-4" />
              Live Platform
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Project Summary */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-3xl font-bold text-[#fafafa] mb-2">{demoProject.name}</h2>
              <p className="text-[#a1a1aa]">Client: {demoProject.client} • Analysis Date: {demoProject.analysisDate}</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-400">3 Sites</div>
              <div className="text-sm text-[#a1a1aa]">Analyzed in 8 days</div>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-[#131316] border border-[#27272a] rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[#a1a1aa] text-sm">Proceed</p>
                  <p className="text-2xl font-bold text-green-400">2</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-400" />
              </div>
            </div>

            <div className="bg-[#131316] border border-[#27272a] rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[#a1a1aa] text-sm">Caution</p>
                  <p className="text-2xl font-bold text-yellow-400">1</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-yellow-400" />
              </div>
            </div>

            <div className="bg-[#131316] border border-[#27272a] rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[#a1a1aa] text-sm">Avg Score</p>
                  <p className="text-2xl font-bold text-blue-400">7.5</p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-400" />
              </div>
            </div>

            <div className="bg-[#131316] border border-[#27272a] rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[#a1a1aa] text-sm">Total Investment</p>
                  <p className="text-2xl font-bold text-purple-400">€28-50M</p>
                </div>
                <Clock className="h-8 w-8 text-purple-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Site Comparison Matrix */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-[#fafafa] mb-4">Site Comparison Matrix</h3>
          <div className="bg-[#131316] border border-[#27272a] rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#1a1a1f] border-b border-[#27272a]">
                  <tr>
                    <th className="text-left py-3 px-4 text-[#a1a1aa] font-medium">Site</th>
                    <th className="text-center py-3 px-4 text-[#a1a1aa] font-medium">Score</th>
                    <th className="text-center py-3 px-4 text-[#a1a1aa] font-medium">Infrastructure</th>
                    <th className="text-center py-3 px-4 text-[#a1a1aa] font-medium">Environmental</th>
                    <th className="text-center py-3 px-4 text-[#a1a1aa] font-medium">Regulatory</th>
                    <th className="text-center py-3 px-4 text-[#a1a1aa] font-medium">Investment</th>
                    <th className="text-center py-3 px-4 text-[#a1a1aa] font-medium">Timeline</th>
                    <th className="text-center py-3 px-4 text-[#a1a1aa] font-medium">Recommendation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#27272a]">
                  {demoProject.sites.map((site, index) => (
                    <tr key={site.id} className="hover:bg-[#1a1a1f] transition-colors">
                      <td className="py-4 px-4">
                        <div>
                          <div className="font-medium text-[#fafafa]">{site.name}</div>
                          <div className="text-sm text-[#a1a1aa]">{site.location}</div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className={`text-xl font-bold ${getScoreColor(site.score.overall)}`}>
                          {site.score.overall}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className={`font-medium ${getScoreColor(site.score.infrastructure)}`}>
                          {site.score.infrastructure}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className={`font-medium ${getScoreColor(site.score.environmental)}`}>
                          {site.score.environmental}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className={`font-medium ${getScoreColor(site.score.regulatory)}`}>
                          {site.score.regulatory}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center text-[#fafafa] font-medium">
                        {site.costs.infrastructure}
                      </td>
                      <td className="py-4 px-4 text-center text-[#fafafa] font-medium">
                        {site.costs.timeline}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRecommendationColor(site.score.recommendation)}`}>
                          {site.score.recommendation}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Detailed Site Cards */}
        <div className="space-y-6">
          <h3 className="text-xl font-semibold text-[#fafafa]">Detailed Site Analysis</h3>
          
          {demoProject.sites.map((site) => (
            <div key={site.id} className="bg-[#131316] border border-[#27272a] rounded-lg p-6">
              {/* Site Header */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h4 className="text-xl font-semibold text-[#fafafa] mb-1">{site.name}</h4>
                  <p className="text-[#a1a1aa] mb-2">{site.location}</p>
                  <div className="flex items-center gap-4 text-sm text-[#71717a]">
                    <span>{site.area} hectares</span>
                    <span>•</span>
                    <span>{site.powerReq}MW requirement</span>
                    <span>•</span>
                    <span>{site.coordinates}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-3xl font-bold mb-1 ${getScoreColor(site.score.overall)}`}>
                    {site.score.overall}
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRecommendationColor(site.score.recommendation)}`}>
                    {site.score.recommendation}
                  </span>
                </div>
              </div>

              {/* Score Breakdown */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                {[
                  { label: 'Infrastructure', value: site.score.infrastructure, icon: Zap },
                  { label: 'Environmental', value: site.score.environmental, icon: Droplets },
                  { label: 'Regulatory', value: site.score.regulatory, icon: MapPin },
                  { label: 'Technical', value: site.score.technical, icon: Wifi },
                  { label: 'Timeline', value: site.score.timeline, icon: Clock }
                ].map((item, index) => (
                  <div key={index} className="bg-[#1a1a1f] rounded-lg p-3 text-center">
                    <item.icon className="h-5 w-5 mx-auto mb-2 text-[#a1a1aa]" />
                    <div className={`text-lg font-bold ${getScoreColor(item.value)}`}>
                      {item.value}
                    </div>
                    <div className="text-xs text-[#71717a]">{item.label}</div>
                  </div>
                ))}
              </div>

              {/* Development Indicators */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-[#1a1a1f] rounded-lg p-4 text-center">
                  <div className="text-xl font-bold text-[#fafafa] mb-1">{site.costs.infrastructure}</div>
                  <div className="text-sm text-[#a1a1aa]">Infrastructure Investment</div>
                </div>
                <div className="bg-[#1a1a1f] rounded-lg p-4 text-center">
                  <div className="text-xl font-bold text-[#fafafa] mb-1">{site.costs.timeline}</div>
                  <div className="text-sm text-[#a1a1aa]">Development Timeline</div>
                </div>
                <div className="bg-[#1a1a1f] rounded-lg p-4 text-center">
                  <div className={`text-xl font-bold mb-1 ${
                    site.costs.complexity === 'LOW' ? 'text-green-400' :
                    site.costs.complexity === 'MEDIUM' ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {site.costs.complexity}
                  </div>
                  <div className="text-sm text-[#a1a1aa]">Project Complexity</div>
                </div>
              </div>

              {/* Flags */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {site.flags.critical.length > 0 && (
                  <div>
                    <h5 className="text-sm font-semibold text-red-400 mb-3 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Critical Issues
                    </h5>
                    <ul className="space-y-2">
                      {site.flags.critical.map((flag, index) => (
                        <li key={index} className="text-sm text-[#a1a1aa] flex items-start gap-2">
                          <span className="text-red-400 mt-1">•</span>
                          {flag}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {site.flags.strengths.length > 0 && (
                  <div>
                    <h5 className="text-sm font-semibold text-green-400 mb-3 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Site Strengths
                    </h5>
                    <ul className="space-y-2">
                      {site.flags.strengths.map((flag, index) => (
                        <li key={index} className="text-sm text-[#a1a1aa] flex items-start gap-2">
                          <span className="text-green-400 mt-1">•</span>
                          {flag}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Platform Capabilities */}
        <div className="mt-12 bg-[#131316] border border-[#27272a] rounded-lg p-8">
          <h3 className="text-2xl font-bold text-[#fafafa] mb-4">Platform Capabilities Demonstrated</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h4 className="text-lg font-semibold text-blue-400 mb-3">Phase 0 Screening Features</h4>
              <ul className="space-y-2 text-[#a1a1aa]">
                <li>• Infrastructure proximity analysis (not capacity modeling)</li>
                <li>• Regulatory requirement flagging (not detailed process analysis)</li>
                <li>• Order-of-magnitude cost estimates (±20-30% accuracy)</li>
                <li>• Go/No-Go recommendations with confidence levels</li>
                <li>• Professional disclaimers for preliminary assessment</li>
                <li>• Multi-site comparison and ranking</li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-green-400 mb-3">Business Impact</h4>
              <ul className="space-y-2 text-[#a1a1aa]">
                <li>• <strong>Time:</strong> 3-5 days per site (not weeks)</li>
                <li>• <strong>Cost:</strong> €15-25k per site screening</li>
                <li>• <strong>Value:</strong> Save €2-5M by avoiding unsuitable sites</li>
                <li>• <strong>Scale:</strong> Screen 20 sites → Identify 3-5 for full DD</li>
                <li>• <strong>Quality:</strong> Based on proven Pori analysis methodology</li>
                <li>• <strong>Coverage:</strong> Modular expansion across EU/Nordic countries</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemoPage;