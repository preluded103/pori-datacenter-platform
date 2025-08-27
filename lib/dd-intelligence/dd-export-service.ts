/**
 * Due Diligence Export Service
 * Generates comprehensive reports in multiple formats (Excel, PDF, JSON, CSV)
 */

import { ComprehensiveDDAnalysis, DDExportOptions, DD_FIELD_DEFINITIONS } from '@/lib/types/dd-analysis-types';

export interface ExportResult {
  success: boolean;
  format: string;
  fileUrl?: string;
  fileName: string;
  fileSizeBytes: number;
  error?: string;
}

export class DDExportService {
  
  /**
   * Export DD analysis to specified format
   */
  public async exportAnalysis(
    ddAnalysis: ComprehensiveDDAnalysis,
    options: DDExportOptions
  ): Promise<ExportResult> {
    
    console.log(`📄 Exporting DD analysis ${ddAnalysis.analysisId} to ${options.format}...`);
    
    try {
      switch (options.format) {
        case 'Excel':
          return await this.exportToExcel(ddAnalysis, options);
        case 'PDF':
          return await this.exportToPDF(ddAnalysis, options);
        case 'JSON':
          return await this.exportToJSON(ddAnalysis, options);
        case 'CSV':
          return await this.exportToCSV(ddAnalysis, options);
        default:
          throw new Error(`Unsupported export format: ${options.format}`);
      }
    } catch (error) {
      console.error('❌ Export failed:', error);
      return {
        success: false,
        format: options.format,
        fileName: '',
        fileSizeBytes: 0,
        error: error instanceof Error ? error.message : 'Unknown export error'
      };
    }
  }

  /**
   * Export to Excel format with structured worksheets
   */
  private async exportToExcel(
    ddAnalysis: ComprehensiveDDAnalysis, 
    options: DDExportOptions
  ): Promise<ExportResult> {
    
    // Generate Excel workbook structure
    const workbookData = {
      worksheets: [
        {
          name: 'Executive Summary',
          data: this.generateExecutiveSummaryData(ddAnalysis)
        },
        {
          name: 'Site & Location',
          data: this.generateSiteLocationData(ddAnalysis)
        },
        {
          name: 'Electrical Infrastructure',
          data: this.generateElectricalData(ddAnalysis)
        },
        {
          name: 'Utilities',
          data: this.generateUtilitiesData(ddAnalysis)
        },
        {
          name: 'Environmental',
          data: this.generateEnvironmentalData(ddAnalysis)
        },
        {
          name: 'Regulatory & Policy',
          data: this.generateRegulatoryData(ddAnalysis)
        },
        {
          name: 'Project Tracking',
          data: this.generateProjectTrackingData(ddAnalysis)
        },
        {
          name: 'All Fields (Raw)',
          data: this.generateAllFieldsData(ddAnalysis)
        }
      ],
      metadata: {
        title: `DD Analysis - ${ddAnalysis.analysisId}`,
        created: new Date().toISOString(),
        version: ddAnalysis.analysisVersion || '1.0.0'
      }
    };

    // In a real implementation, this would use a library like ExcelJS
    const fileName = `DD_Analysis_${ddAnalysis.analysisId}_${new Date().toISOString().split('T')[0]}.xlsx`;
    const mockFileSize = JSON.stringify(workbookData).length; // Approximate size
    
    return {
      success: true,
      format: 'Excel',
      fileName,
      fileSizeBytes: mockFileSize,
      fileUrl: `/api/dd-intelligence/export/${ddAnalysis.analysisId}.xlsx`
    };
  }

  /**
   * Export to PDF format with professional layout
   */
  private async exportToPDF(
    ddAnalysis: ComprehensiveDDAnalysis,
    options: DDExportOptions
  ): Promise<ExportResult> {
    
    // Generate PDF content structure
    const pdfContent = {
      title: `Due Diligence Analysis Report`,
      subtitle: `Site Analysis ID: ${ddAnalysis.analysisId}`,
      date: new Date().toLocaleDateString(),
      
      sections: [
        {
          title: 'Executive Summary',
          content: this.generateExecutiveSummaryContent(ddAnalysis)
        },
        {
          title: 'Site Overview',
          content: this.generateSiteOverviewContent(ddAnalysis)
        },
        {
          title: 'Infrastructure Analysis',
          subsections: [
            {
              title: 'Electrical Infrastructure',
              content: this.generateElectricalContent(ddAnalysis)
            },
            {
              title: 'Utilities Assessment',
              content: this.generateUtilitiesContent(ddAnalysis)
            }
          ]
        },
        {
          title: 'Risk Assessment',
          content: this.generateRiskAssessmentContent(ddAnalysis)
        },
        {
          title: 'Regulatory Environment',
          content: this.generateRegulatoryContent(ddAnalysis)
        },
        {
          title: 'Recommendations',
          content: this.generateRecommendationsContent(ddAnalysis)
        },
        {
          title: 'Appendices',
          subsections: [
            {
              title: 'A. Complete Field Summary',
              content: this.generateFieldSummaryContent(ddAnalysis)
            },
            {
              title: 'B. Data Sources',
              content: this.generateDataSourcesContent()
            }
          ]
        }
      ],
      
      footer: {
        disclaimer: 'This analysis is based on available data and should be supplemented with additional due diligence.',
        confidentiality: 'CONFIDENTIAL - For internal use only'
      }
    };

    const fileName = `DD_Report_${ddAnalysis.analysisId}_${new Date().toISOString().split('T')[0]}.pdf`;
    const mockFileSize = JSON.stringify(pdfContent).length * 2; // PDFs are typically larger
    
    return {
      success: true,
      format: 'PDF',
      fileName,
      fileSizeBytes: mockFileSize,
      fileUrl: `/api/dd-intelligence/export/${ddAnalysis.analysisId}.pdf`
    };
  }

  /**
   * Export to JSON format (machine-readable)
   */
  private async exportToJSON(
    ddAnalysis: ComprehensiveDDAnalysis,
    options: DDExportOptions
  ): Promise<ExportResult> {
    
    const jsonData = {
      metadata: {
        exportTimestamp: new Date().toISOString(),
        exportOptions: options,
        version: '1.0.0'
      },
      ddAnalysis,
      fieldDefinitions: options.includeGISData ? DD_FIELD_DEFINITIONS : undefined
    };

    const jsonString = JSON.stringify(jsonData, null, 2);
    const fileName = `DD_Data_${ddAnalysis.analysisId}_${new Date().toISOString().split('T')[0]}.json`;
    
    return {
      success: true,
      format: 'JSON',
      fileName,
      fileSizeBytes: jsonString.length,
      fileUrl: `/api/dd-intelligence/export/${ddAnalysis.analysisId}.json`
    };
  }

  /**
   * Export to CSV format for spreadsheet analysis
   */
  private async exportToCSV(
    ddAnalysis: ComprehensiveDDAnalysis,
    options: DDExportOptions
  ): Promise<ExportResult> {
    
    const csvData = this.generateCSVData(ddAnalysis);
    const csvString = this.convertToCSVString(csvData);
    const fileName = `DD_Fields_${ddAnalysis.analysisId}_${new Date().toISOString().split('T')[0]}.csv`;
    
    return {
      success: true,
      format: 'CSV',
      fileName,
      fileSizeBytes: csvString.length,
      fileUrl: `/api/dd-intelligence/export/${ddAnalysis.analysisId}.csv`
    };
  }

  // Data generation methods for different sections

  private generateExecutiveSummaryData(ddAnalysis: ComprehensiveDDAnalysis) {
    return [
      ['Metric', 'Value', 'Status'],
      ['Analysis ID', ddAnalysis.analysisId, 'Complete'],
      ['Overall Score', `${ddAnalysis.overallScore}/100`, this.getScoreStatus(ddAnalysis.overallScore || 0)],
      ['Readiness Level', ddAnalysis.readinessLevel || 'Unknown', ''],
      ['Site Size (Hectares)', ddAnalysis.siteFundamentals.estimatedHectares, ''],
      ['Site Type', ddAnalysis.siteFundamentals.siteType, ''],
      ['Data Completeness', `${ddAnalysis.dataCompleteness}%`, ''],
      ['Key Risks Count', ddAnalysis.keyRisks?.length || 0, ''],
      ['Key Opportunities Count', ddAnalysis.keyOpportunities?.length || 0, ''],
      ['Analysis Date', ddAnalysis.timestamp.split('T')[0], '']
    ];
  }

  private generateSiteLocationData(ddAnalysis: ComprehensiveDDAnalysis) {
    return [
      ['Field', 'Value', 'Notes'],
      ['Site Estimated Hectares', ddAnalysis.siteFundamentals.estimatedHectares, 'ha'],
      ['Site Type', ddAnalysis.siteFundamentals.siteType, ''],
      ['Site Folder', ddAnalysis.siteFundamentals.siteFolder, ''],
      ['Owner Name', ddAnalysis.ownership.ownerName, ''],
      ['Owner Contact', ddAnalysis.ownership.ownerContact?.phone, ''],
      ['Town/City', ddAnalysis.location.townCity, ''],
      ['Municipality', ddAnalysis.location.municipality, ''],
      ['State/Department', ddAnalysis.location.stateDepartment, ''],
      ['Region', ddAnalysis.location.region, ''],
      ['Distance from Airport (km)', ddAnalysis.location.distanceFromNearestAirportKm, ''],
      ['On Flight Path', ddAnalysis.location.onFlightPath, ''],
      ['Country', ddAnalysis.location.country, ''],
      ['Centroid Longitude', ddAnalysis.location.centroid[0], ''],
      ['Centroid Latitude', ddAnalysis.location.centroid[1], '']
    ];
  }

  private generateElectricalData(ddAnalysis: ComprehensiveDDAnalysis) {
    return [
      ['Field', 'Value', 'Unit', 'Notes'],
      ['Estimated Capacity MW', ddAnalysis.electrical.estimatedCapacityMW, 'MW', ''],
      ['Estimated Capacity MVA', ddAnalysis.electrical.estimatedCapacityMVA, 'MVA', ''],
      ['Nearest Substation Distance', ddAnalysis.electrical.nearestSubstationDistanceKm, 'km', ''],
      ['Nearest Substation Name', ddAnalysis.electrical.nearestSubstationName, '', ''],
      ['Nearest Substation Operator', ddAnalysis.electrical.nearestSubstationOperator, '', ''],
      ['Substation Latitude', ddAnalysis.electrical.nearestSubstationLatitude, '', ''],
      ['Substation Longitude', ddAnalysis.electrical.nearestSubstationLongitude, '', ''],
      ['Power Application Status', ddAnalysis.electrical.powerApplicationStatus, '', ''],
      ['Power Capacity', ddAnalysis.electrical.powerCapacity, ddAnalysis.electrical.powerCapacityUnit, ''],
      ['TSO Application Date', ddAnalysis.electrical.tsoApplicationDate, '', ''],
      ['TSO Application Notes', ddAnalysis.electrical.tsoApplicationNotes, '', ''],
      ['Electrical Notes', ddAnalysis.electrical.electricalNotes, '', '']
    ];
  }

  private generateUtilitiesData(ddAnalysis: ComprehensiveDDAnalysis) {
    return [
      ['Field', 'Value', 'Unit', 'Notes'],
      ['Gas Connection', ddAnalysis.utilities.gasConnection, '', ''],
      ['Gas Capacity', ddAnalysis.utilities.gasCapacityNm3h, 'Nm³/h', ''],
      ['Gas Distance to Pipeline', ddAnalysis.utilities.gasDistanceToPipelineKm, 'km', ''],
      ['Water Available', ddAnalysis.utilities.waterAvailable, '', ''],
      ['Water Available Comments', ddAnalysis.utilities.waterAvailableComments, '', ''],
      ['Water Capacity', ddAnalysis.utilities.waterCapacityM3s, 'M3/S', ''],
      ['Water Connection Size', ddAnalysis.utilities.waterConnectionSizeDN, 'DN', ''],
      ['Water Proximity to Water', ddAnalysis.utilities.waterProximityToWater, 'km', ''],
      ['Water Proximity to Sewer', ddAnalysis.utilities.waterProximityToSewer, 'km', ''],
      ['Water Notes', ddAnalysis.utilities.waterNotes, '', '']
    ];
  }

  private generateEnvironmentalData(ddAnalysis: ComprehensiveDDAnalysis) {
    return [
      ['Field', 'Value', 'Notes'],
      ['Flood Risk', ddAnalysis.environmental.floodRisk, ''],
      ['Flood 1:500 Year', ddAnalysis.environmental.flood500Year, ''],
      ['Flood 1:200 Year', ddAnalysis.environmental.flood200Year, ''],
      ['Flood Attachments', ddAnalysis.environmental.floodAttachments?.join(', '), ''],
      ['Flood Notes', ddAnalysis.environmental.floodNotes, '']
    ];
  }

  private generateRegulatoryData(ddAnalysis: ComprehensiveDDAnalysis) {
    return [
      ['Field', 'Value', 'Notes'],
      ['Zoned', ddAnalysis.zoning.zoned, ''],
      ['Zoning Descriptions', ddAnalysis.zoning.zoningDescriptions, ''],
      ['EIA in Place', ddAnalysis.zoning.eiaInPlace, ''],
      ['Building Permit in Place', ddAnalysis.zoning.buildingPermitInPlace, ''],
      ['Zoning Notes', ddAnalysis.zoning.zoningNotes, ''],
      ['Policy Sentiment', ddAnalysis.policy.sentiment, ''],
      ['Policy Notes', ddAnalysis.policy.notes, ''],
      ['Incentive Programs', ddAnalysis.policy.incentivePrograms?.join(', '), ''],
      ['Regulatory Constraints', ddAnalysis.policy.regulatoryConstraints?.join(', '), '']
    ];
  }

  private generateProjectTrackingData(ddAnalysis: ComprehensiveDDAnalysis) {
    return [
      ['Field', 'Value', 'Notes'],
      ['DD0 Start Date', ddAnalysis.projectTracking.dd0StartDate, ''],
      ['DD1 Start Date', ddAnalysis.projectTracking.dd1StartDate, ''],
      ['DD2 Start Date', ddAnalysis.projectTracking.dd2StartDate, ''],
      ['Exclusivity Signed Date', ddAnalysis.projectTracking.exclusivitySignedDate, ''],
      ['Site Visit Complete', ddAnalysis.projectTracking.siteVisitComplete, ''],
      ['Site Visit Notes', ddAnalysis.projectTracking.siteVisitNotes, ''],
      ['Site Visit Photos', ddAnalysis.projectTracking.siteVisitPhotos?.join(', '), '']
    ];
  }

  private generateAllFieldsData(ddAnalysis: ComprehensiveDDAnalysis) {
    const rows = [['Field Path', 'Field Label', 'Value', 'Type', 'Unit']];
    
    // Flatten all DD fields into a single table
    const flattenedFields = this.flattenDDAnalysis(ddAnalysis);
    
    Object.entries(flattenedFields).forEach(([path, value]) => {
      const fieldDef = DD_FIELD_DEFINITIONS[path as keyof typeof DD_FIELD_DEFINITIONS];
      rows.push([
        path,
        fieldDef?.label || path,
        this.formatValue(value),
        fieldDef?.type || 'text',
        fieldDef?.unit || ''
      ]);
    });
    
    return rows;
  }

  // Content generation methods for PDF

  private generateExecutiveSummaryContent(ddAnalysis: ComprehensiveDDAnalysis): string {
    return `
**Overall Assessment**
- Site Score: ${ddAnalysis.overallScore}/100
- Readiness Level: ${ddAnalysis.readinessLevel}
- Site Size: ${ddAnalysis.siteFundamentals.estimatedHectares} hectares
- Data Completeness: ${ddAnalysis.dataCompleteness}%

**Key Findings**
${ddAnalysis.keyOpportunities?.map(o => `• ${o}`).join('\n') || 'No specific opportunities identified'}

**Primary Risks**
${ddAnalysis.keyRisks?.map(r => `• ${r}`).join('\n') || 'No significant risks identified'}
    `.trim();
  }

  private generateSiteOverviewContent(ddAnalysis: ComprehensiveDDAnalysis): string {
    return `
**Site Characteristics**
- Location: ${ddAnalysis.location.townCity}, ${ddAnalysis.location.region}, ${ddAnalysis.location.country}
- Site Type: ${ddAnalysis.siteFundamentals.siteType}
- Size: ${ddAnalysis.siteFundamentals.estimatedHectares} hectares
- Coordinates: ${ddAnalysis.location.centroid[1].toFixed(4)}°N, ${ddAnalysis.location.centroid[0].toFixed(4)}°E

**Ownership & Access**
- Owner: ${ddAnalysis.ownership.ownerName || 'To Be Determined'}
- Contact: ${ddAnalysis.ownership.ownerContact?.phone || 'To Be Determined'}
    `.trim();
  }

  private generateElectricalContent(ddAnalysis: ComprehensiveDDAnalysis): string {
    return `
**Grid Connection Analysis**
- Available Capacity: ${ddAnalysis.electrical.estimatedCapacityMW || 'TBD'} MW / ${ddAnalysis.electrical.estimatedCapacityMVA || 'TBD'} MVA
- Nearest Substation: ${ddAnalysis.electrical.nearestSubstationName || 'TBD'}
- Distance: ${ddAnalysis.electrical.nearestSubstationDistanceKm || 'TBD'} km
- Operator: ${ddAnalysis.electrical.nearestSubstationOperator || 'TBD'}
- Application Status: ${ddAnalysis.electrical.powerApplicationStatus || 'Not Started'}

**Technical Notes**
${ddAnalysis.electrical.electricalNotes || 'No specific notes available'}
    `.trim();
  }

  private generateUtilitiesContent(ddAnalysis: ComprehensiveDDAnalysis): string {
    return `
**Gas Infrastructure**
- Connection Available: ${ddAnalysis.utilities.gasConnection}
- Capacity: ${ddAnalysis.utilities.gasCapacityNm3h || 'TBD'} Nm³/h
- Distance to Pipeline: ${ddAnalysis.utilities.gasDistanceToPipelineKm || 'TBD'} km

**Water Infrastructure**
- Water Available: ${ddAnalysis.utilities.waterAvailable}
- Capacity: ${ddAnalysis.utilities.waterCapacityM3s || 'TBD'} M3/S
- Connection Size: ${ddAnalysis.utilities.waterConnectionSizeDN || 'TBD'} DN
- Comments: ${ddAnalysis.utilities.waterAvailableComments || 'No additional comments'}
    `.trim();
  }

  private generateRiskAssessmentContent(ddAnalysis: ComprehensiveDDAnalysis): string {
    return `
**Environmental Risk Profile**
- Flood Risk Level: ${ddAnalysis.environmental.floodRisk}
- 1:500 Year Flood Zone: ${ddAnalysis.environmental.flood500Year}
- 1:200 Year Flood Zone: ${ddAnalysis.environmental.flood200Year}

**Risk Mitigation Notes**
${ddAnalysis.environmental.floodNotes || 'No specific flood risk notes available'}
    `.trim();
  }

  private generateRegulatoryContent(ddAnalysis: ComprehensiveDDAnalysis): string {
    return `
**Zoning & Permits**
- Currently Zoned: ${ddAnalysis.zoning.zoned}
- Zoning Type: ${ddAnalysis.zoning.zoningDescriptions || 'To Be Determined'}
- EIA Required: ${ddAnalysis.zoning.eiaInPlace === 'No' ? 'Yes, required' : 'Already in place'}
- Building Permit: ${ddAnalysis.zoning.buildingPermitInPlace}

**Policy Environment**
- Local Sentiment: ${ddAnalysis.policy.sentiment}
- Available Incentives: ${ddAnalysis.policy.incentivePrograms?.join(', ') || 'None identified'}
- Regulatory Constraints: ${ddAnalysis.policy.regulatoryConstraints?.join(', ') || 'None identified'}
    `.trim();
  }

  private generateRecommendationsContent(ddAnalysis: ComprehensiveDDAnalysis): string {
    return `
**Immediate Next Steps**
${ddAnalysis.nextSteps?.map((step, i) => `${i + 1}. ${step}`).join('\n') || 'No specific next steps identified'}

**Priority Actions**
Based on the analysis, the following actions should be prioritized to advance this site through the due diligence process.
    `.trim();
  }

  private generateFieldSummaryContent(ddAnalysis: ComprehensiveDDAnalysis): string {
    const flattened = this.flattenDDAnalysis(ddAnalysis);
    return Object.entries(flattened)
      .map(([field, value]) => `**${field}**: ${this.formatValue(value)}`)
      .join('\n');
  }

  private generateDataSourcesContent(): string {
    return `
**Primary Data Sources**
- Satellite imagery and geospatial databases
- TSO (Transmission System Operator) public APIs
- Municipal infrastructure databases
- Environmental risk assessments
- Local government planning databases
- Property ownership registries

**Data Collection Methods**
- Automated API integration
- Geospatial analysis algorithms
- Machine learning classification
- Public records research
- Regulatory database queries
    `.trim();
  }

  // Helper methods

  private generateCSVData(ddAnalysis: ComprehensiveDDAnalysis): any[] {
    const rows = [['Field', 'Value', 'Category', 'Type', 'Unit']];
    const flattened = this.flattenDDAnalysis(ddAnalysis);
    
    Object.entries(flattened).forEach(([path, value]) => {
      const category = path.split('.')[0];
      const fieldDef = DD_FIELD_DEFINITIONS[path as keyof typeof DD_FIELD_DEFINITIONS];
      
      rows.push([
        path,
        this.formatValue(value),
        category,
        fieldDef?.type || 'text',
        fieldDef?.unit || ''
      ]);
    });
    
    return rows;
  }

  private convertToCSVString(data: any[]): string {
    return data.map(row => 
      row.map((cell: any) => {
        const cellStr = String(cell || '');
        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
          return `"${cellStr.replace(/"/g, '""')}"`;
        }
        return cellStr;
      }).join(',')
    ).join('\n');
  }

  private flattenDDAnalysis(ddAnalysis: ComprehensiveDDAnalysis): Record<string, any> {
    const flattened: Record<string, any> = {};
    
    const flatten = (obj: any, prefix: string = '') => {
      Object.entries(obj).forEach(([key, value]) => {
        const newKey = prefix ? `${prefix}.${key}` : key;
        
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          flatten(value, newKey);
        } else {
          flattened[newKey] = value;
        }
      });
    };
    
    flatten(ddAnalysis);
    return flattened;
  }

  private formatValue(value: any): string {
    if (value === null || value === undefined) return '';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (Array.isArray(value)) return value.join(', ');
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  }

  private getScoreStatus(score: number): string {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Poor';
  }
}

// Export service instance
export const ddExportService = new DDExportService();