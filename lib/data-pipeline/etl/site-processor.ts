/**
 * Site Data Processor
 * Coordinates data ingestion from multiple sources and transforms it
 * into our database schema for constraint analysis
 */

import { FingridClient, SubstationData, GridCapacityData } from '../ingestion/fingrid-client';
import { createClient } from '@supabase/supabase-js';

interface SiteCoordinates {
  longitude: number;
  latitude: number;
}

interface ProcessedSiteData {
  // Core site info
  name: string;
  coordinates: SiteCoordinates;
  municipality: string;
  country_code: string;
  
  // Requirements
  area_hectares: number;
  power_requirement_mw: number;
  
  // Assessment results
  overall_score: number;
  recommendation: 'proceed' | 'caution' | 'avoid';
  
  // Risk assessment data
  risk_assessment: {
    // Power infrastructure
    power_substation_distance: number;
    power_substation_name: string;
    power_voltage_kv: number;
    
    // Risk levels
    seismic_risk: 'LOW' | 'MEDIUM' | 'HIGH';
    flood_risk: 'LOW' | 'MEDIUM' | 'HIGH';
    heritage_risk: 'LOW' | 'MEDIUM' | 'HIGH';
    
    // Cost estimates (EUR)
    infrastructure_cost_min: number;
    infrastructure_cost_max: number;
    timeline_months_min: number;
    timeline_months_max: number;
  };
  
  // Data provenance
  data_sources: Array<{
    category: string;
    source_name: string;
    confidence_level: 'HIGH' | 'MEDIUM' | 'LOW';
    data_date: string;
  }>;
}

export class SiteProcessor {
  private fingridClient: FingridClient;
  private supabase: ReturnType<typeof createClient>;
  
  constructor() {
    this.fingridClient = new FingridClient();
    
    // Initialize Supabase client
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  /**
   * Process a site location and generate comprehensive assessment
   * This is the main entry point for data pipeline
   */
  async processSite(
    name: string,
    coordinates: SiteCoordinates,
    powerRequirementMw: number,
    areaHectares: number = 15
  ): Promise<ProcessedSiteData> {
    // Processing site: ${name} at [${coordinates.longitude}, ${coordinates.latitude}]
    
    try {
      // 1. Gather data from multiple sources
      const [
        substations,
        gridCapacity,
        environmentalData,
        regulatoryData
      ] = await Promise.allSettled([
        this.fingridClient.getNearbySubstations([coordinates.longitude, coordinates.latitude]),
        this.fingridClient.getGridCapacity([coordinates.longitude, coordinates.latitude]),
        this.getEnvironmentalData(coordinates),
        this.getRegulatoryData(coordinates)
      ]);

      // 2. Extract successful results
      const substationData = substations.status === 'fulfilled' ? substations.value : [];
      const capacityData = gridCapacity.status === 'fulfilled' ? gridCapacity.value : null;
      const envData = environmentalData.status === 'fulfilled' ? environmentalData.value : {};
      const regData = regulatoryData.status === 'fulfilled' ? regulatoryData.value : {};

      // 3. Process and score the data
      const processedData = await this.transformToSiteData(
        name,
        coordinates,
        powerRequirementMw,
        areaHectares,
        substationData,
        capacityData,
        envData as any,
        regData as any
      );

      // 4. Store in database
      await this.storeSiteData(processedData);
      
      return processedData;
    } catch (error) {
      console.error(`Error processing site ${name}:`, error);
      throw error;
    }
  }

  private async transformToSiteData(
    name: string,
    coordinates: SiteCoordinates,
    powerRequirementMw: number,
    areaHectares: number,
    substations: SubstationData[],
    gridCapacity: GridCapacityData | null,
    environmentalData: any,
    regulatoryData: any
  ): Promise<ProcessedSiteData> {
    
    // Find closest high-voltage substation
    const primarySubstation = substations
      .filter(s => s.voltage_kv >= 110)
      .sort((a, b) => 
        this.calculateDistance(coordinates, { longitude: a.coordinates[0], latitude: a.coordinates[1] }) -
        this.calculateDistance(coordinates, { longitude: b.coordinates[0], latitude: b.coordinates[1] })
      )[0];

    const substationDistance = primarySubstation ? 
      Math.round(this.calculateDistance(coordinates, { longitude: primarySubstation.coordinates[0], latitude: primarySubstation.coordinates[1] }) * 1000) : 
      15000; // 15km fallback

    // Calculate constraint-based scoring
    const constraints = this.calculateConstraints(
      powerRequirementMw,
      substations,
      gridCapacity,
      environmentalData,
      substationDistance
    );

    // Generate overall score and recommendation
    const { score, recommendation } = this.calculateOverallAssessment(constraints);

    return {
      name,
      coordinates,
      municipality: this.getMunicipality(coordinates),
      country_code: 'FI',
      area_hectares: areaHectares,
      power_requirement_mw: powerRequirementMw,
      overall_score: score,
      recommendation,
      risk_assessment: {
        power_substation_distance: substationDistance,
        power_substation_name: primarySubstation?.name || 'Unknown',
        power_voltage_kv: primarySubstation?.voltage_kv || 110,
        seismic_risk: 'LOW', // Finland is low seismic risk
        flood_risk: this.assessFloodRisk(coordinates, environmentalData),
        heritage_risk: this.assessHeritageRisk(coordinates, environmentalData),
        infrastructure_cost_min: constraints.minCost,
        infrastructure_cost_max: constraints.maxCost,
        timeline_months_min: constraints.minTimeline,
        timeline_months_max: constraints.maxTimeline
      },
      data_sources: [
        {
          category: 'power',
          source_name: 'Fingrid API',
          confidence_level: gridCapacity ? 'HIGH' : 'MEDIUM',
          data_date: new Date().toISOString().split('T')[0]
        },
        {
          category: 'environmental',
          source_name: 'SYKE Environmental Data',
          confidence_level: 'MEDIUM',
          data_date: new Date().toISOString().split('T')[0]
        }
      ]
    };
  }

  private calculateConstraints(
    powerRequirementMw: number,
    substations: SubstationData[],
    gridCapacity: GridCapacityData | null,
    environmentalData: any,
    substationDistance: number
  ) {
    let minCost = 1000000; // Base €1M
    let maxCost = 3000000; // Base €3M
    let minTimeline = 12;   // Base 12 months
    let maxTimeline = 24;   // Base 24 months
    
    // Power capacity constraints (critical for our Pori analysis)
    const maxSingleConnection = Math.max(...substations.map(s => s.capacity_mva), 65);
    const requiredMva = powerRequirementMw * 1.17; // Convert MW to MVA (approximate)
    
    if (requiredMva > maxSingleConnection) {
      // Dual connection or transmission upgrade required
      minCost += 3000000;
      maxCost += 8000000;
      minTimeline += 18;
      maxTimeline += 36;
    }
    
    // Distance penalties
    if (substationDistance > 5000) { // > 5km
      const extraDistance = substationDistance - 5000;
      minCost += extraDistance * 300; // €300/meter
      maxCost += extraDistance * 600; // €600/meter
      minTimeline += Math.floor(extraDistance / 1000) * 2; // 2 months per km
      maxTimeline += Math.floor(extraDistance / 1000) * 4; // 4 months per km
    }

    return { minCost, maxCost, minTimeline, maxTimeline };
  }

  private calculateOverallAssessment(constraints: {
    minCost: number;
    maxCost: number;
    minTimeline: number;
    maxTimeline: number;
  }): { score: number; recommendation: 'proceed' | 'caution' | 'avoid' } {
    
    let score = 10.0;
    
    // Cost-based deductions
    if (constraints.maxCost > 10000000) score -= 2.0; // €10M+
    else if (constraints.maxCost > 5000000) score -= 1.5; // €5M+
    else if (constraints.maxCost > 3000000) score -= 1.0; // €3M+
    
    // Timeline deductions
    if (constraints.maxTimeline > 48) score -= 2.0; // 4+ years
    else if (constraints.maxTimeline > 36) score -= 1.5; // 3+ years
    else if (constraints.maxTimeline > 24) score -= 1.0; // 2+ years
    
    // Environmental considerations (placeholder)
    score -= 0.5; // General environmental complexity
    
    score = Math.max(2.0, Math.min(10.0, score));
    
    const recommendation = score >= 7 ? 'proceed' : score >= 4 ? 'caution' : 'avoid';
    
    return { score: Math.round(score * 10) / 10, recommendation };
  }

  private async storeSiteData(data: ProcessedSiteData): Promise<void> {
    try {
      // 1. Insert/update site record
      const { data: siteData, error: siteError } = await this.supabase
        .from('sites')
        .upsert({
          name: data.name,
          location: `POINT(${data.coordinates.longitude} ${data.coordinates.latitude})`,
          municipality: data.municipality,
          country_code: data.country_code,
          area_hectares: data.area_hectares,
          power_requirement_mw: data.power_requirement_mw,
          overall_score: data.overall_score,
          recommendation: data.recommendation,
          assessment_status: 'completed',
          assessment_date: new Date().toISOString()
        }, { onConflict: 'name' })
        .select()
        .single();

      if (siteError) {
        console.error('Error storing site data:', siteError);
        return;
      }

      const siteId = siteData.id;

      // 2. Insert risk assessment
      const { error: riskError } = await this.supabase
        .from('risk_assessments')
        .upsert({
          site_id: siteId,
          ...data.risk_assessment,
          assessed_at: new Date().toISOString()
        }, { onConflict: 'site_id' });

      if (riskError) {
        console.error('Error storing risk assessment:', riskError);
      }

      // 3. Insert data sources
      for (const source of data.data_sources) {
        const { error: sourceError } = await this.supabase
          .from('data_sources')
          .upsert({
            site_id: siteId,
            category: source.category,
            source_name: source.source_name,
            confidence_level: source.confidence_level,
            data_date: source.data_date,
            created_at: new Date().toISOString()
          });

        if (sourceError) {
          console.error('Error storing data source:', sourceError);
        }
      }

      // Site data stored successfully for ${data.name} with score ${data.overall_score}
    } catch (error) {
      console.error('Database storage error:', error);
      throw error;
    }
  }

  // Utility methods
  private getMunicipality(coordinates: SiteCoordinates): string {
    // In a real implementation, this would query municipal boundary data
    // For Pori coordinates, return Pori
    if (coordinates.latitude > 61.4 && coordinates.latitude < 61.6 &&
        coordinates.longitude > 21.7 && coordinates.longitude < 21.9) {
      return 'Pori';
    }
    return 'Unknown';
  }

  private assessFloodRisk(coordinates: SiteCoordinates, environmentalData: any): 'LOW' | 'MEDIUM' | 'HIGH' {
    // Placeholder - would integrate with flood zone data
    return 'LOW';
  }

  private assessHeritageRisk(coordinates: SiteCoordinates, environmentalData: any): 'LOW' | 'MEDIUM' | 'HIGH' {
    // Pori area has significant bird migration areas
    return 'HIGH';
  }

  private async getEnvironmentalData(coordinates: SiteCoordinates): Promise<any> {
    // Placeholder for SYKE and other environmental data sources
    return {
      protected_areas: [],
      water_bodies: [],
      biodiversity_zones: ['Important Bird Area']
    };
  }

  private async getRegulatoryData(coordinates: SiteCoordinates): Promise<any> {
    // Placeholder for municipal zoning and regulatory data
    return {
      zoning: 'Industrial',
      permits_required: ['Environmental', 'Water', 'Construction']
    };
  }

  private calculateDistance(coord1: SiteCoordinates, coord2: SiteCoordinates): number {
    const R = 6371; // Earth's radius in km
    const dLat = (coord2.latitude - coord1.latitude) * Math.PI / 180;
    const dLon = (coord2.longitude - coord1.longitude) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(coord1.latitude * Math.PI / 180) * Math.cos(coord2.latitude * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
}