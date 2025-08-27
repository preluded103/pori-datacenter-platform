/**
 * Due Diligence Analysis Types
 * Comprehensive datacenter site evaluation structure incorporating all critical DD fields
 */

import { PolygonFeature, LocationInfo, TSO, GridAnalysisResult } from './grid-types';

// Core DD field types
export type SiteType = 'Brownfield' | 'Greenfield' | 'Other';
export type PolicySentiment = 'Very Positive' | 'Positive' | 'Neutral' | 'Negative' | 'Very Negative';
export type FloodRisk = 'None' | 'Low' | 'Medium' | 'High';
export type YesNoUnknown = 'Yes' | 'No' | 'Unknown';
export type DDPhase = 'DD0' | 'DD1' | 'DD2' | 'Complete';
export type ApplicationStatus = 'Not Started' | 'Draft' | 'Submitted' | 'Under Review' | 'Approved' | 'Rejected';

// Site Fundamentals
export interface SiteFundamentals {
  estimatedHectares: number;
  siteType: SiteType;
  siteFolder?: string;
}

// Ownership Information
export interface OwnershipInfo {
  ownerName?: string;
  ownerContact?: {
    phone?: string;
    email?: string;
    address?: string;
  };
}

// Location Details (Enhanced)
export interface DetailedLocation extends LocationInfo {
  townCity?: string;
  municipality?: string;
  stateDepartment?: string;
  region?: string;
  distanceFromNearestAirportKm?: number;
  onFlightPath?: YesNoUnknown;
}

// Electrical Infrastructure (Comprehensive)
export interface ElectricalInfrastructure {
  estimatedCapacityMW?: number;
  estimatedCapacityMVA?: number;
  nearestSubstationDistanceKm?: number;
  nearestSubstationName?: string;
  nearestSubstationOperator?: string;
  nearestSubstationLatitude?: number;
  nearestSubstationLongitude?: number;
  electricalNotes?: string;
  powerApplicationStatus?: ApplicationStatus;
  powerCapacity?: number;
  powerCapacityUnit?: 'MW' | 'MVA' | 'kW' | 'kVA';
  tsoApplicationDate?: string;
  tsoApplicationNotes?: string;
}

// Utilities
export interface UtilitiesInfrastructure {
  // Gas
  gasConnection: YesNoUnknown;
  gasCapacityNm3h?: number;
  gasDistanceToPipelineKm?: number;
  
  // Water
  waterAvailable: YesNoUnknown;
  waterAvailableComments?: string;
  waterCapacityM3s?: number;
  waterConnectionSizeDN?: number;
  waterProximityToWater?: number; // km
  waterProximityToSewer?: number; // km
  waterNotes?: string;
}

// Environmental & Risk Assessment
export interface EnvironmentalAssessment {
  floodRisk: FloodRisk;
  flood500Year: YesNoUnknown;
  flood200Year: YesNoUnknown;
  floodAttachments?: string[]; // File references
  floodNotes?: string;
}

// Zoning & Regulatory
export interface ZoningRegulatory {
  zoned: YesNoUnknown;
  zoningDescriptions?: string;
  eiaInPlace: YesNoUnknown;
  buildingPermitInPlace: YesNoUnknown;
  zoningNotes?: string;
}

// Policy Analysis
export interface PolicyAnalysis {
  sentiment: PolicySentiment;
  notes?: string;
  incentivePrograms?: string[];
  regulatoryConstraints?: string[];
}

// Due Diligence Project Tracking
export interface DDProjectTracking {
  dd0StartDate?: string;
  dd1StartDate?: string;
  dd2StartDate?: string;
  exclusivitySignedDate?: string;
  siteVisitComplete?: YesNoUnknown;
  siteVisitNotes?: string;
  siteVisitPhotos?: string[]; // File references
}

// Comprehensive DD Analysis Result
export interface ComprehensiveDDAnalysis {
  // Core identifiers
  analysisId: string;
  timestamp: string;
  analysisVersion?: string;
  
  // Site basics
  siteFundamentals: SiteFundamentals;
  ownership: OwnershipInfo;
  location: DetailedLocation;
  
  // Infrastructure assessments
  electrical: ElectricalInfrastructure;
  utilities: UtilitiesInfrastructure;
  environmental: EnvironmentalAssessment;
  zoning: ZoningRegulatory;
  
  // Strategic analysis
  policy: PolicyAnalysis;
  projectTracking: DDProjectTracking;
  
  // Related grid analysis (from existing system)
  gridAnalysis?: GridAnalysisResult;
  
  // Summary metrics
  overallScore?: number; // 0-100
  readinessLevel?: 'Ready' | 'Near Ready' | 'Development Required' | 'Not Viable';
  keyRisks?: string[];
  keyOpportunities?: string[];
  nextSteps?: string[];
  
  // Data quality indicators
  dataCompleteness?: number; // 0-100, percentage of fields populated
  dataConfidenceLevel?: 'High' | 'Medium' | 'Low';
  lastUpdated?: string;
}

// DD Analysis Configuration
export interface DDAnalysisConfig {
  enabledModules: {
    siteAnalysis: boolean;
    electricalAnalysis: boolean;
    utilitiesAnalysis: boolean;
    environmentalAnalysis: boolean;
    policyAnalysis: boolean;
    trackingIntegration: boolean;
  };
  
  analysisDepth: 'Basic' | 'Standard' | 'Comprehensive';
  
  thresholds: {
    minimumSizeHectares: number;
    maximumFloodRisk: FloodRisk;
    minimumPowerCapacityMW: number;
    maximumSubstationDistanceKm: number;
  };
  
  regionalSettings: {
    country: string;
    preferredLanguage: string;
    localRegulations: boolean;
    currencyUnit: string;
  };
}

// Export format options
export interface DDExportOptions {
  format: 'Excel' | 'PDF' | 'JSON' | 'CSV';
  includeImages: boolean;
  includeGISData: boolean;
  templateStyle: 'Standard' | 'Executive' | 'Technical';
  sections: string[]; // Which sections to include
}

// DD Field Mapping (for UI forms and data validation)
export const DD_FIELD_DEFINITIONS = {
  // Site Fundamentals
  'site.estimatedHectares': { label: 'Site Estimated Hectares', type: 'number', required: true, unit: 'ha' },
  'site.siteType': { label: 'Brownfield/Greenfield/Other', type: 'select', options: ['Brownfield', 'Greenfield', 'Other'], required: true },
  
  // Policy
  'policy.sentiment': { label: 'Policy - Sentiment', type: 'select', options: ['Very Positive', 'Positive', 'Neutral', 'Negative', 'Very Negative'] },
  'policy.notes': { label: 'Policy - Notes', type: 'textarea', maxLength: 1000 },
  
  // Owner
  'ownership.ownerName': { label: 'Owner: Name', type: 'text', maxLength: 200 },
  'ownership.ownerContact.phone': { label: 'Owner: Contact Info', type: 'text', maxLength: 100 },
  
  // Electrical
  'electrical.estimatedCapacityMW': { label: 'Electrical - Estimated Capacity MW', type: 'number', unit: 'MW' },
  'electrical.estimatedCapacityMVA': { label: 'Electrical - Estimated Capacity MVA', type: 'number', unit: 'MVA' },
  'electrical.nearestSubstationDistanceKm': { label: 'Electrical - Nearest Substation Distance (km)', type: 'number', unit: 'km' },
  'electrical.nearestSubstationName': { label: 'Electrical - Nearest Substation Name and Operator', type: 'text' },
  'electrical.nearestSubstationLatitude': { label: 'Electrical - Nearest Substation Latitude', type: 'number', range: [-90, 90] },
  'electrical.nearestSubstationLongitude': { label: 'Electrical - Nearest Substation Longitude', type: 'number', range: [-180, 180] },
  'electrical.electricalNotes': { label: 'Electrical - Notes', type: 'textarea' },
  
  // Utilities
  'utilities.gasConnection': { label: 'Gas Connection (Y/N)', type: 'select', options: ['Yes', 'No', 'Unknown'] },
  'utilities.waterAvailable': { label: 'Water - Available (Y/N)', type: 'select', options: ['Yes', 'No', 'Unknown'] },
  'utilities.waterAvailableComments': { label: 'Water - Available Comments', type: 'textarea' },
  
  // Environmental
  'environmental.floodRisk': { label: 'Flood - Risk (None, Low, Medium, High)', type: 'select', options: ['None', 'Low', 'Medium', 'High'] },
  'environmental.flood500Year': { label: 'Flood - 1:500 Year (Y/N)', type: 'select', options: ['Yes', 'No', 'Unknown'] },
  'environmental.flood200Year': { label: 'Flood - 1:200 Year (Y/N)', type: 'select', options: ['Yes', 'No', 'Unknown'] },
  
  // Location
  'location.townCity': { label: 'Town/City', type: 'text', maxLength: 100 },
  'location.municipality': { label: 'Municipality', type: 'text', maxLength: 100 },
  'location.stateDepartment': { label: 'State/Department', type: 'text', maxLength: 100 },
  'location.region': { label: 'Region', type: 'text', maxLength: 100 },
  'location.distanceFromNearestAirportKm': { label: 'Distance from Nearest Airport', type: 'number', unit: 'km' },
  'location.onFlightPath': { label: 'On Flight Path', type: 'select', options: ['Yes', 'No', 'Unknown'] },
  
  // Project Tracking
  'projectTracking.dd0StartDate': { label: 'DD0 Start Date', type: 'date' },
  'projectTracking.exclusivitySignedDate': { label: 'Exclusivity Signed Date', type: 'date' },
  'projectTracking.siteVisitComplete': { label: 'Site Visit - Complete?', type: 'select', options: ['Yes', 'No', 'Unknown'] },
  'projectTracking.siteVisitNotes': { label: 'Site Visit - Notes/Photos', type: 'textarea' },
  
  // Additional detailed fields
  'utilities.waterCapacityM3s': { label: 'Water - Capacity (M3/S)', type: 'number', unit: 'M3/S' },
  'utilities.waterConnectionSizeDN': { label: 'Water - Connection Size (DN)', type: 'number', unit: 'DN' },
  'utilities.waterProximityToWater': { label: 'Water - Proximity to Water', type: 'number', unit: 'km' },
  'utilities.waterProximityToSewer': { label: 'Water - Proximity to Sewer', type: 'number', unit: 'km' },
  'utilities.waterNotes': { label: 'Water - Notes', type: 'textarea' },
  
  'environmental.floodAttachments': { label: 'Flood - Attachments', type: 'file', multiple: true },
  'environmental.floodNotes': { label: 'Flood - Notes', type: 'textarea' },
  
  'zoning.zoned': { label: 'Zoning: Zoned?', type: 'select', options: ['Yes', 'No', 'Unknown'] },
  'zoning.eiaInPlace': { label: 'Zoning - EIA in place?', type: 'select', options: ['Yes', 'No', 'Unknown'] },
  'zoning.zoningDescriptions': { label: 'Zoning - Descriptions (Types, etc)', type: 'textarea' },
  'zoning.buildingPermitInPlace': { label: 'Zoning - Building Permit in place?', type: 'select', options: ['Yes', 'No', 'Unknown'] },
  'zoning.zoningNotes': { label: 'Zoning - Notes', type: 'textarea' },
  
  'utilities.gasCapacityNm3h': { label: 'Gas - Capacity (Nm³/h)', type: 'number', unit: 'Nm³/h' },
  'utilities.gasDistanceToPipelineKm': { label: 'Gas - Distance to Pipeline (km)', type: 'number', unit: 'km' },
  
  'projectTracking.dd1StartDate': { label: 'DD1 Start Date', type: 'date' },
  'projectTracking.dd2StartDate': { label: 'DD2 Start Date', type: 'date' },
  
  'electrical.powerApplicationStatus': { label: 'Power Application Status', type: 'select', options: ['Not Started', 'Draft', 'Submitted', 'Under Review', 'Approved', 'Rejected'] },
  'electrical.powerCapacity': { label: 'Power Capacity', type: 'number' },
  'electrical.powerCapacityUnit': { label: 'Power Capacity Unit', type: 'select', options: ['MW', 'MVA', 'kW', 'kVA'] },
  'electrical.tsoApplicationDate': { label: 'Electrical: T/DSO Application Date', type: 'date' },
  'electrical.tsoApplicationNotes': { label: 'Electrical: T/DSO Application Notes', type: 'textarea' },
} as const;

// Helper function to get all DD field keys
export const getAllDDFields = (): string[] => {
  return Object.keys(DD_FIELD_DEFINITIONS);
};

// Calculate data completeness percentage
export const calculateDataCompleteness = (ddAnalysis: Partial<ComprehensiveDDAnalysis>): number => {
  const totalFields = getAllDDFields().length;
  let completedFields = 0;
  
  // This would need to be implemented to traverse the nested object structure
  // and check which fields are populated
  
  return Math.round((completedFields / totalFields) * 100);
};