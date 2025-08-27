/**
 * Comprehensive Due Diligence Dashboard
 * Displays all 50+ DD fields in an organized, intuitive interface
 */

'use client';

import React, { useState, useMemo } from 'react';
import { ComprehensiveDDAnalysis, DD_FIELD_DEFINITIONS } from '@/lib/types/dd-analysis-types';
import { 
  Building2, 
  Zap, 
  Droplets, 
  Flame, 
  MapPin, 
  FileText, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  User,
  Landmark,
  Shield,
  TrendingUp,
  Calendar
} from 'lucide-react';

interface ComprehensiveDDDashboardProps {
  ddAnalysis: ComprehensiveDDAnalysis;
  onFieldUpdate?: (fieldPath: string, value: any) => void;
  readonly?: boolean;
  className?: string;
}

interface DDSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  score?: number;
  completeness?: number;
}

const DDSection: React.FC<DDSectionProps> = ({ title, icon, children, score, completeness }) => (
  <div className="bg-[#131316] border border-[#27272a] rounded-lg p-6 mb-6">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center space-x-3">
        <div className="text-blue-400">{icon}</div>
        <h3 className="text-xl font-semibold text-[#fafafa]">{title}</h3>
      </div>
      <div className="flex items-center space-x-4">
        {completeness !== undefined && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-[#a1a1aa]">Complete:</span>
            <span className="text-sm font-medium text-[#fafafa]">{completeness}%</span>
          </div>
        )}
        {score !== undefined && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-[#a1a1aa]">Score:</span>
            <span className={`text-sm font-medium ${
              score >= 80 ? 'text-green-400' : 
              score >= 60 ? 'text-yellow-400' : 
              'text-red-400'
            }`}>
              {score}/100
            </span>
          </div>
        )}
      </div>
    </div>
    <div className="space-y-4">
      {children}
    </div>
  </div>
);

interface FieldRowProps {
  label: string;
  value: any;
  unit?: string;
  type?: 'text' | 'number' | 'select' | 'date' | 'textarea';
  status?: 'complete' | 'incomplete' | 'unknown';
}

const FieldRow: React.FC<FieldRowProps> = ({ label, value, unit, type, status }) => {
  const displayValue = useMemo(() => {
    if (value === undefined || value === null || value === '') return 'Not Available';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'number') return unit ? `${value} ${unit}` : value.toString();
    if (typeof value === 'string') return value;
    if (Array.isArray(value)) return value.join(', ') || 'None';
    return JSON.stringify(value);
  }, [value, unit]);

  const statusColor = useMemo(() => {
    if (value === undefined || value === null || value === '' || value === 'Unknown' || value === 'Not Available') {
      return 'text-[#71717a]';
    }
    return 'text-[#fafafa]';
  }, [value]);

  const statusIcon = useMemo(() => {
    if (value === undefined || value === null || value === '' || value === 'Unknown' || value === 'Not Available') {
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  }, [value]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-3 border-b border-[#27272a] last:border-b-0">
      <div className="flex items-center space-x-2">
        {statusIcon}
        <span className="text-sm font-medium text-[#a1a1aa]">{label}:</span>
      </div>
      <div className={`text-sm ${statusColor}`}>
        {displayValue}
      </div>
    </div>
  );
};

const ComprehensiveDDDashboard: React.FC<ComprehensiveDDDashboardProps> = ({
  ddAnalysis,
  onFieldUpdate,
  readonly = false,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState('overview');

  const overallMetrics = useMemo(() => ({
    totalScore: ddAnalysis.overallScore || 0,
    readinessLevel: ddAnalysis.readinessLevel || 'Unknown',
    dataCompleteness: ddAnalysis.dataCompleteness || 0,
    keyRisks: ddAnalysis.keyRisks?.length || 0,
    keyOpportunities: ddAnalysis.keyOpportunities?.length || 0
  }), [ddAnalysis]);

  const sectionScores = useMemo(() => ({
    site: calculateSiteScore(ddAnalysis),
    electrical: calculateElectricalScore(ddAnalysis),
    utilities: calculateUtilitiesScore(ddAnalysis),
    environmental: calculateEnvironmentalScore(ddAnalysis),
    policy: calculatePolicyScore(ddAnalysis),
    project: calculateProjectScore(ddAnalysis)
  }), [ddAnalysis]);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <TrendingUp className="h-4 w-4" /> },
    { id: 'site', label: 'Site & Location', icon: <MapPin className="h-4 w-4" /> },
    { id: 'electrical', label: 'Electrical', icon: <Zap className="h-4 w-4" /> },
    { id: 'utilities', label: 'Utilities', icon: <Droplets className="h-4 w-4" /> },
    { id: 'environmental', label: 'Environmental', icon: <Shield className="h-4 w-4" /> },
    { id: 'regulatory', label: 'Regulatory', icon: <FileText className="h-4 w-4" /> },
    { id: 'tracking', label: 'Project Tracking', icon: <Calendar className="h-4 w-4" /> }
  ];

  return (
    <div className={`min-h-screen bg-[#0a0a0b] text-[#fafafa] ${className}`}>
      {/* Header */}
      <div className="bg-[#131316] border-b border-[#27272a] px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#fafafa]">Due Diligence Analysis</h1>
            <p className="text-[#a1a1aa] mt-1">
              Analysis ID: {ddAnalysis.analysisId} • {ddAnalysis.timestamp.split('T')[0]}
            </p>
          </div>
          
          {/* Overall Status */}
          <div className="flex items-center space-x-6">
            <div className="text-center">
              <div className={`text-3xl font-bold ${
                overallMetrics.totalScore >= 80 ? 'text-green-400' : 
                overallMetrics.totalScore >= 60 ? 'text-yellow-400' : 
                'text-red-400'
              }`}>
                {overallMetrics.totalScore}
              </div>
              <div className="text-sm text-[#a1a1aa]">Overall Score</div>
            </div>
            
            <div className="text-center">
              <div className={`text-lg font-semibold ${
                overallMetrics.readinessLevel === 'Ready' ? 'text-green-400' :
                overallMetrics.readinessLevel === 'Near Ready' ? 'text-yellow-400' :
                'text-red-400'
              }`}>
                {overallMetrics.readinessLevel}
              </div>
              <div className="text-sm text-[#a1a1aa]">Readiness Level</div>
            </div>
            
            <div className="text-center">
              <div className="text-lg font-semibold text-blue-400">
                {overallMetrics.dataCompleteness}%
              </div>
              <div className="text-sm text-[#a1a1aa]">Data Complete</div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-[#131316] border-b border-[#27272a] px-6">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 py-4 px-2 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-[#a1a1aa] hover:text-[#fafafa]'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Content Area */}
      <div className="px-6 py-6">
        {activeTab === 'overview' && (
          <OverviewTab 
            ddAnalysis={ddAnalysis} 
            sectionScores={sectionScores}
            overallMetrics={overallMetrics}
          />
        )}
        
        {activeTab === 'site' && (
          <DDSection 
            title="Site Fundamentals & Location" 
            icon={<MapPin className="h-5 w-5" />}
            score={sectionScores.site}
          >
            <FieldRow 
              label="Site Estimated Hectares" 
              value={ddAnalysis.siteFundamentals.estimatedHectares}
              unit="ha"
              type="number"
            />
            <FieldRow 
              label="Site Type" 
              value={ddAnalysis.siteFundamentals.siteType}
              type="select"
            />
            <FieldRow 
              label="Site Folder" 
              value={ddAnalysis.siteFundamentals.siteFolder}
              type="text"
            />
            <FieldRow 
              label="Town/City" 
              value={ddAnalysis.location.townCity}
              type="text"
            />
            <FieldRow 
              label="Municipality" 
              value={ddAnalysis.location.municipality}
              type="text"
            />
            <FieldRow 
              label="State/Department" 
              value={ddAnalysis.location.stateDepartment}
              type="text"
            />
            <FieldRow 
              label="Region" 
              value={ddAnalysis.location.region}
              type="text"
            />
            <FieldRow 
              label="Distance from Nearest Airport" 
              value={ddAnalysis.location.distanceFromNearestAirportKm}
              unit="km"
              type="number"
            />
            <FieldRow 
              label="On Flight Path" 
              value={ddAnalysis.location.onFlightPath}
              type="select"
            />
            <FieldRow 
              label="Owner: Name" 
              value={ddAnalysis.ownership.ownerName}
              type="text"
            />
            <FieldRow 
              label="Owner: Contact Info" 
              value={ddAnalysis.ownership.ownerContact?.phone}
              type="text"
            />
          </DDSection>
        )}

        {activeTab === 'electrical' && (
          <DDSection 
            title="Electrical Infrastructure" 
            icon={<Zap className="h-5 w-5" />}
            score={sectionScores.electrical}
          >
            <FieldRow 
              label="Estimated Capacity MW" 
              value={ddAnalysis.electrical.estimatedCapacityMW}
              unit="MW"
              type="number"
            />
            <FieldRow 
              label="Estimated Capacity MVA" 
              value={ddAnalysis.electrical.estimatedCapacityMVA}
              unit="MVA"
              type="number"
            />
            <FieldRow 
              label="Nearest Substation Distance" 
              value={ddAnalysis.electrical.nearestSubstationDistanceKm}
              unit="km"
              type="number"
            />
            <FieldRow 
              label="Nearest Substation Name and Operator" 
              value={ddAnalysis.electrical.nearestSubstationName}
              type="text"
            />
            <FieldRow 
              label="Nearest Substation Latitude" 
              value={ddAnalysis.electrical.nearestSubstationLatitude}
              type="number"
            />
            <FieldRow 
              label="Nearest Substation Longitude" 
              value={ddAnalysis.electrical.nearestSubstationLongitude}
              type="number"
            />
            <FieldRow 
              label="Power Application Status" 
              value={ddAnalysis.electrical.powerApplicationStatus}
              type="select"
            />
            <FieldRow 
              label="Power Capacity" 
              value={ddAnalysis.electrical.powerCapacity}
              unit={ddAnalysis.electrical.powerCapacityUnit}
              type="number"
            />
            <FieldRow 
              label="T/DSO Application Date" 
              value={ddAnalysis.electrical.tsoApplicationDate}
              type="date"
            />
            <FieldRow 
              label="Electrical Notes" 
              value={ddAnalysis.electrical.electricalNotes}
              type="textarea"
            />
          </DDSection>
        )}

        {activeTab === 'utilities' && (
          <DDSection 
            title="Utilities Infrastructure" 
            icon={<Droplets className="h-5 w-5" />}
            score={sectionScores.utilities}
          >
            <FieldRow 
              label="Gas Connection" 
              value={ddAnalysis.utilities.gasConnection}
              type="select"
            />
            <FieldRow 
              label="Gas Capacity" 
              value={ddAnalysis.utilities.gasCapacityNm3h}
              unit="Nm³/h"
              type="number"
            />
            <FieldRow 
              label="Gas Distance to Pipeline" 
              value={ddAnalysis.utilities.gasDistanceToPipelineKm}
              unit="km"
              type="number"
            />
            <FieldRow 
              label="Water Available" 
              value={ddAnalysis.utilities.waterAvailable}
              type="select"
            />
            <FieldRow 
              label="Water Available Comments" 
              value={ddAnalysis.utilities.waterAvailableComments}
              type="textarea"
            />
            <FieldRow 
              label="Water Capacity" 
              value={ddAnalysis.utilities.waterCapacityM3s}
              unit="M3/S"
              type="number"
            />
            <FieldRow 
              label="Water Connection Size" 
              value={ddAnalysis.utilities.waterConnectionSizeDN}
              unit="DN"
              type="number"
            />
            <FieldRow 
              label="Water Proximity to Water" 
              value={ddAnalysis.utilities.waterProximityToWater}
              unit="km"
              type="number"
            />
            <FieldRow 
              label="Water Proximity to Sewer" 
              value={ddAnalysis.utilities.waterProximityToSewer}
              unit="km"
              type="number"
            />
            <FieldRow 
              label="Water Notes" 
              value={ddAnalysis.utilities.waterNotes}
              type="textarea"
            />
          </DDSection>
        )}

        {activeTab === 'environmental' && (
          <DDSection 
            title="Environmental & Risk Assessment" 
            icon={<Shield className="h-5 w-5" />}
            score={sectionScores.environmental}
          >
            <FieldRow 
              label="Flood Risk" 
              value={ddAnalysis.environmental.floodRisk}
              type="select"
            />
            <FieldRow 
              label="Flood 1:500 Year" 
              value={ddAnalysis.environmental.flood500Year}
              type="select"
            />
            <FieldRow 
              label="Flood 1:200 Year" 
              value={ddAnalysis.environmental.flood200Year}
              type="select"
            />
            <FieldRow 
              label="Flood Attachments" 
              value={ddAnalysis.environmental.floodAttachments}
              type="text"
            />
            <FieldRow 
              label="Flood Notes" 
              value={ddAnalysis.environmental.floodNotes}
              type="textarea"
            />
          </DDSection>
        )}

        {activeTab === 'regulatory' && (
          <>
            <DDSection 
              title="Zoning & Regulatory" 
              icon={<FileText className="h-5 w-5" />}
              score={sectionScores.policy}
            >
              <FieldRow 
                label="Zoned?" 
                value={ddAnalysis.zoning.zoned}
                type="select"
              />
              <FieldRow 
                label="EIA in place?" 
                value={ddAnalysis.zoning.eiaInPlace}
                type="select"
              />
              <FieldRow 
                label="Zoning Descriptions" 
                value={ddAnalysis.zoning.zoningDescriptions}
                type="textarea"
              />
              <FieldRow 
                label="Building Permit in place?" 
                value={ddAnalysis.zoning.buildingPermitInPlace}
                type="select"
              />
              <FieldRow 
                label="Zoning Notes" 
                value={ddAnalysis.zoning.zoningNotes}
                type="textarea"
              />
            </DDSection>

            <DDSection 
              title="Policy Environment" 
              icon={<Landmark className="h-5 w-5" />}
            >
              <FieldRow 
                label="Policy Sentiment" 
                value={ddAnalysis.policy.sentiment}
                type="select"
              />
              <FieldRow 
                label="Policy Notes" 
                value={ddAnalysis.policy.notes}
                type="textarea"
              />
              <FieldRow 
                label="Incentive Programs" 
                value={ddAnalysis.policy.incentivePrograms}
                type="text"
              />
              <FieldRow 
                label="Regulatory Constraints" 
                value={ddAnalysis.policy.regulatoryConstraints}
                type="text"
              />
            </DDSection>
          </>
        )}

        {activeTab === 'tracking' && (
          <DDSection 
            title="Due Diligence Project Tracking" 
            icon={<Calendar className="h-5 w-5" />}
            score={sectionScores.project}
          >
            <FieldRow 
              label="DD0 Start Date" 
              value={ddAnalysis.projectTracking.dd0StartDate}
              type="date"
            />
            <FieldRow 
              label="DD1 Start Date" 
              value={ddAnalysis.projectTracking.dd1StartDate}
              type="date"
            />
            <FieldRow 
              label="DD2 Start Date" 
              value={ddAnalysis.projectTracking.dd2StartDate}
              type="date"
            />
            <FieldRow 
              label="Exclusivity Signed Date" 
              value={ddAnalysis.projectTracking.exclusivitySignedDate}
              type="date"
            />
            <FieldRow 
              label="Site Visit Complete?" 
              value={ddAnalysis.projectTracking.siteVisitComplete}
              type="select"
            />
            <FieldRow 
              label="Site Visit Notes/Photos" 
              value={ddAnalysis.projectTracking.siteVisitNotes}
              type="textarea"
            />
          </DDSection>
        )}
      </div>
    </div>
  );
};

// Overview Tab Component
const OverviewTab: React.FC<{
  ddAnalysis: ComprehensiveDDAnalysis;
  sectionScores: any;
  overallMetrics: any;
}> = ({ ddAnalysis, sectionScores, overallMetrics }) => (
  <div className="space-y-6">
    {/* Key Metrics Cards */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <MetricCard 
        title="Site Size"
        value={`${ddAnalysis.siteFundamentals.estimatedHectares} ha`}
        subtitle={ddAnalysis.siteFundamentals.siteType}
        color="blue"
      />
      <MetricCard 
        title="Electrical Capacity"
        value={`${ddAnalysis.electrical.estimatedCapacityMW || 'TBD'} MW`}
        subtitle={`${ddAnalysis.electrical.nearestSubstationDistanceKm || '?'} km to substation`}
        color="yellow"
      />
      <MetricCard 
        title="Environmental Risk"
        value={ddAnalysis.environmental.floodRisk}
        subtitle="Flood Risk Level"
        color={ddAnalysis.environmental.floodRisk === 'Low' || ddAnalysis.environmental.floodRisk === 'None' ? 'green' : 'red'}
      />
      <MetricCard 
        title="Policy Environment"
        value={ddAnalysis.policy.sentiment}
        subtitle="Local Government Sentiment"
        color="purple"
      />
    </div>

    {/* Section Scores */}
    <DDSection title="Section Scores" icon={<TrendingUp className="h-5 w-5" />}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <ScoreCard title="Site & Location" score={sectionScores.site} />
        <ScoreCard title="Electrical Infrastructure" score={sectionScores.electrical} />
        <ScoreCard title="Utilities" score={sectionScores.utilities} />
        <ScoreCard title="Environmental" score={sectionScores.environmental} />
        <ScoreCard title="Policy & Regulatory" score={sectionScores.policy} />
        <ScoreCard title="Project Tracking" score={sectionScores.project} />
      </div>
    </DDSection>

    {/* Risks and Opportunities */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <DDSection title="Key Risks" icon={<AlertTriangle className="h-5 w-5" />}>
        {ddAnalysis.keyRisks && ddAnalysis.keyRisks.length > 0 ? (
          <ul className="space-y-2">
            {ddAnalysis.keyRisks.map((risk, index) => (
              <li key={index} className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-red-400 flex-shrink-0" />
                <span className="text-[#fafafa]">{risk}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[#71717a]">No significant risks identified</p>
        )}
      </DDSection>

      <DDSection title="Key Opportunities" icon={<CheckCircle className="h-5 w-5" />}>
        {ddAnalysis.keyOpportunities && ddAnalysis.keyOpportunities.length > 0 ? (
          <ul className="space-y-2">
            {ddAnalysis.keyOpportunities.map((opportunity, index) => (
              <li key={index} className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0" />
                <span className="text-[#fafafa]">{opportunity}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[#71717a]">No specific opportunities identified</p>
        )}
      </DDSection>
    </div>

    {/* Next Steps */}
    <DDSection title="Recommended Next Steps" icon={<Clock className="h-5 w-5" />}>
      {ddAnalysis.nextSteps && ddAnalysis.nextSteps.length > 0 ? (
        <ol className="space-y-2">
          {ddAnalysis.nextSteps.map((step, index) => (
            <li key={index} className="flex items-start space-x-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white text-sm rounded-full flex items-center justify-center">
                {index + 1}
              </span>
              <span className="text-[#fafafa]">{step}</span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-[#71717a]">No specific next steps identified</p>
      )}
    </DDSection>
  </div>
);

// Helper Components
const MetricCard: React.FC<{
  title: string;
  value: string;
  subtitle: string;
  color: string;
}> = ({ title, value, subtitle, color }) => {
  const colorMap = {
    blue: 'border-blue-500 text-blue-400',
    yellow: 'border-yellow-500 text-yellow-400', 
    green: 'border-green-500 text-green-400',
    red: 'border-red-500 text-red-400',
    purple: 'border-purple-500 text-purple-400'
  };

  return (
    <div className={`bg-[#131316] border-2 ${colorMap[color as keyof typeof colorMap] || colorMap.blue} rounded-lg p-4`}>
      <h4 className="text-sm font-medium text-[#a1a1aa] mb-2">{title}</h4>
      <div className={`text-xl font-bold mb-1 ${colorMap[color as keyof typeof colorMap] || colorMap.blue}`}>
        {value}
      </div>
      <div className="text-sm text-[#71717a]">{subtitle}</div>
    </div>
  );
};

const ScoreCard: React.FC<{ title: string; score: number }> = ({ title, score }) => (
  <div className="bg-[#1a1a1f] border border-[#27272a] rounded-lg p-4">
    <div className="flex items-center justify-between mb-2">
      <h4 className="text-sm font-medium text-[#a1a1aa]">{title}</h4>
      <span className={`text-lg font-bold ${
        score >= 80 ? 'text-green-400' : 
        score >= 60 ? 'text-yellow-400' : 
        'text-red-400'
      }`}>
        {score}
      </span>
    </div>
    <div className="w-full bg-[#27272a] rounded-full h-2">
      <div 
        className={`h-2 rounded-full ${
          score >= 80 ? 'bg-green-400' : 
          score >= 60 ? 'bg-yellow-400' : 
          'bg-red-400'
        }`}
        style={{ width: `${score}%` }}
      />
    </div>
  </div>
);

// Helper functions for section scores
function calculateSiteScore(ddAnalysis: ComprehensiveDDAnalysis): number {
  let score = 50;
  const hectares = ddAnalysis.siteFundamentals.estimatedHectares;
  
  if (hectares >= 10 && hectares <= 100) score += 30;
  if (ddAnalysis.siteFundamentals.siteType === 'Brownfield') score += 20;
  if (ddAnalysis.location.townCity) score += 10;
  
  return Math.min(100, score);
}

function calculateElectricalScore(ddAnalysis: ComprehensiveDDAnalysis): number {
  let score = 0;
  
  if (ddAnalysis.electrical.nearestSubstationDistanceKm !== undefined) {
    score += Math.max(0, 60 - (ddAnalysis.electrical.nearestSubstationDistanceKm * 2));
  }
  
  if (ddAnalysis.electrical.estimatedCapacityMW && ddAnalysis.electrical.estimatedCapacityMW > 50) {
    score += 40;
  }
  
  return Math.min(100, score);
}

function calculateUtilitiesScore(ddAnalysis: ComprehensiveDDAnalysis): number {
  let score = 0;
  
  if (ddAnalysis.utilities.gasConnection === 'Yes') score += 30;
  if (ddAnalysis.utilities.waterAvailable === 'Yes') score += 50;
  if (ddAnalysis.utilities.waterCapacityM3s && ddAnalysis.utilities.waterCapacityM3s > 10) score += 20;
  
  return Math.min(100, score);
}

function calculateEnvironmentalScore(ddAnalysis: ComprehensiveDDAnalysis): number {
  const floodRisk = ddAnalysis.environmental.floodRisk;
  
  switch (floodRisk) {
    case 'None': return 100;
    case 'Low': return 85;
    case 'Medium': return 60;
    case 'High': return 30;
    default: return 70;
  }
}

function calculatePolicyScore(ddAnalysis: ComprehensiveDDAnalysis): number {
  const sentiment = ddAnalysis.policy.sentiment;
  
  switch (sentiment) {
    case 'Very Positive': return 100;
    case 'Positive': return 85;
    case 'Neutral': return 65;
    case 'Negative': return 40;
    case 'Very Negative': return 20;
    default: return 65;
  }
}

function calculateProjectScore(ddAnalysis: ComprehensiveDDAnalysis): number {
  let score = 0;
  
  if (ddAnalysis.projectTracking.dd0StartDate) score += 25;
  if (ddAnalysis.projectTracking.dd1StartDate) score += 25;
  if (ddAnalysis.projectTracking.siteVisitComplete === 'Yes') score += 25;
  if (ddAnalysis.ownership.ownerName && !ddAnalysis.ownership.ownerName.includes('Unknown')) score += 25;
  
  return score;
}

export default ComprehensiveDDDashboard;