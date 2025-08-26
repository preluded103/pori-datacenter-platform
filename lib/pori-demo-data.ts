/**
 * Pori Demo Data Adapter
 * Converts existing constraint analysis into GIS platform format
 */

import { ConstraintAnalysis, Constraint } from '../components/ConstraintVisualization';

// Konepajanranta site coordinates (from analysis)
export const PORI_SITE_COORDINATES: [number, number] = [21.7972, 61.4851];

// Power substations identified in analysis
export const PORI_POWER_INFRASTRUCTURE = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [21.8030, 61.4890] // Approximate location for Isosannan
      },
      properties: {
        id: 'isosannan',
        name: 'Isosannan Sähköasema',
        operator: 'Pori Energia',
        voltage: 110,
        capacity_mva: 65,
        distance_km: 1.03,
        type: 'substation',
        status: 'primary_candidate'
      }
    },
    {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [21.8045, 61.4865] // Approximate location for Herralahden
      },
      properties: {
        id: 'herralahden',
        name: 'Herralahden sähköasema',
        operator: 'Fingrid',
        voltage: 110,
        capacity_mva: 80,
        distance_km: 1.29,
        type: 'substation',
        status: 'secondary_option'
      }
    },
    {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [21.7850, 61.4720] // Approximate location for Impolan
      },
      properties: {
        id: 'impolan',
        name: 'Impolan sähköasema',
        operator: 'Pori Energia',
        voltage: 20,
        capacity_mva: 25,
        distance_km: 3.43,
        type: 'substation',
        status: 'backup',
        ref: 'IMP'
      }
    },
    {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [21.7650, 61.4600] // Approximate location for Hyvelän
      },
      properties: {
        id: 'hyvelan',
        name: 'Hyvelän sähköasema',
        operator: 'Pori Energia',
        voltage: 20,
        capacity_mva: 20,
        distance_km: 4.17,
        type: 'substation',
        status: 'backup',
        ref: 'HYV'
      }
    }
  ]
};

// Environmental features
export const PORI_ENVIRONMENTAL_FEATURES = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [
          [21.7800, 61.4900],
          [21.8000, 61.4850],
          [21.8200, 61.4800],
          [21.8400, 61.4750]
        ]
      },
      properties: {
        id: 'kokemaenjoki',
        name: 'Kokemäenjoki River',
        type: 'river',
        flow_rate: '120-130 m³/s',
        cooling_capacity: '15000-25000 GPM',
        temperature_limit: '30°C at 500m',
        competing_users: ['Norilsk Nickel', 'Nuclear facility']
      }
    },
    {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [21.7500, 61.5200],
          [21.8500, 61.5200],
          [21.8500, 61.4400],
          [21.7500, 61.4400],
          [21.7500, 61.5200]
        ]]
      },
      properties: {
        id: 'kokemaenjoki-iba',
        name: 'Kokemäenjoki Estuary IBA',
        type: 'important_bird_area',
        designation: 'International Important Bird Area',
        description: 'Nordic Delta - largest in Nordic countries',
        protection_level: 'critical_ecosystem'
      }
    }
  ]
};

// Convert real analysis data to constraint format
export function generatePoriConstraintAnalysis(): ConstraintAnalysis {
  const constraints: Constraint[] = [
    // Power Infrastructure Constraints
    {
      id: 'power_capacity_exceeded',
      name: 'Power Capacity Exceeds Single Connection',
      category: 'power',
      severity: 'critical',
      distance: 1030, // 1.03km to Isosannan
      impact: 'blocking',
      description: '70MW = 82 MVA demand exceeds single 110kV connection limit of 65 MVA. Dual connections or transmission upgrade required.',
      mitigation: 'Dual 110kV connections or direct transmission connection. Estimated 24-36 months implementation.',
      cost_impact: {
        min: 4000000,
        max: 8000000,
        currency: 'EUR'
      },
      timeline_impact: {
        delay_months: 24,
        description: 'Fingrid transmission connection timeline'
      },
      coordinates: [21.8030, 61.4890],
      metadata: {
        substations_analyzed: 4,
        primary_option: 'Isosannan + Herralahden dual connection',
        operator_approval: 'Required from Fingrid and Pori Energia'
      }
    },
    {
      id: 'transmission_distance',
      name: 'Transmission Infrastructure Distance',
      category: 'power',
      severity: 'high',
      distance: 14000, // 14km to transmission
      impact: 'major',
      description: '14km distance to transmission infrastructure requires dedicated line construction at €200-400k/km.',
      mitigation: 'Dedicated transmission line construction with right-of-way acquisition.',
      cost_impact: {
        min: 2800000,
        max: 5600000,
        currency: 'EUR'
      },
      timeline_impact: {
        delay_months: 18,
        description: 'Line construction and right-of-way procurement'
      }
    },
    {
      id: 'grid_reinforcement_risk',
      name: 'Grid Reinforcement May Be Required',
      category: 'power',
      severity: 'high',
      impact: 'major',
      description: 'Regional grid may require reinforcement for 200MW+ loads, potentially extending timeline by 24-48 months.',
      mitigation: 'Early Fingrid engagement for system impact studies. Consider phased development approach.',
      cost_impact: {
        min: 10000000,
        max: 20000000,
        currency: 'EUR'
      },
      timeline_impact: {
        delay_months: 36,
        description: 'System reinforcement and upgrade timeline'
      }
    },

    // Environmental Constraints
    {
      id: 'heat_dissipation_scale',
      name: 'Massive Heat Dissipation Requirements',
      category: 'environmental',
      severity: 'high',
      impact: 'major',
      description: '91-105 MW thermal load requiring 15,000-25,000 GPM river cooling from Kokemäenjoki.',
      mitigation: 'River cooling system with temperature monitoring. Hybrid cooling for peak loads.',
      cost_impact: {
        min: 3000000,
        max: 7000000,
        currency: 'EUR'
      },
      timeline_impact: {
        delay_months: 12,
        description: 'Water permits and cooling infrastructure'
      },
      coordinates: [21.8000, 61.4825]
    },
    {
      id: 'bird_migration_iba',
      name: 'Important Bird Area Designation',
      category: 'environmental',
      severity: 'critical',
      distance: 500,
      impact: 'blocking',
      description: 'Site within Kokemäenjoki estuary International Important Bird Area - largest Nordic delta ecosystem.',
      mitigation: 'Comprehensive EIA required (10-13 months). Baseline studies and mitigation measures.',
      cost_impact: {
        min: 2000000,
        max: 5000000,
        currency: 'EUR'
      },
      timeline_impact: {
        delay_months: 13,
        description: 'Environmental Impact Assessment process'
      },
      coordinates: [21.8000, 61.4600],
      metadata: {
        designation: 'International Important Bird Area',
        ecosystem_type: 'Nordic Delta',
        protection_status: 'Critical ecosystem protection required'
      }
    },
    {
      id: 'river_discharge_temperature',
      name: 'River Discharge Temperature Limits',
      category: 'environmental',
      severity: 'medium',
      impact: 'moderate',
      description: '30°C maximum discharge temperature at 500m distance limits cooling efficiency.',
      mitigation: 'Advanced cooling systems and temperature monitoring network.',
      cost_impact: {
        min: 1000000,
        max: 3000000,
        currency: 'EUR'
      },
      timeline_impact: {
        delay_months: 6,
        description: 'Cooling system design and permitting'
      }
    },

    // Regulatory Constraints
    {
      id: 'environmental_permits',
      name: 'Multiple Environmental Permits Required',
      category: 'regulatory',
      severity: 'high',
      impact: 'major',
      description: 'Water Act permit, Environmental permit, and KVVY coordination required for river cooling.',
      mitigation: 'Parallel permit processing with early stakeholder engagement.',
      timeline_impact: {
        delay_months: 18,
        description: 'Environmental permitting timeline'
      },
      cost_impact: {
        min: 500000,
        max: 1500000,
        currency: 'EUR'
      }
    },
    {
      id: 'municipal_approvals',
      name: 'Municipal Development Approvals',
      category: 'regulatory',
      severity: 'medium',
      impact: 'moderate',
      description: 'City Council approval, public participation, and development agreements required.',
      mitigation: 'Community benefits package and local partnership development.',
      timeline_impact: {
        delay_months: 9,
        description: 'Municipal approval process including public consultation'
      },
      cost_impact: {
        min: 200000,
        max: 800000,
        currency: 'EUR'
      }
    },

    // Operational Constraints
    {
      id: 'acoustic_impact',
      name: 'Severe Acoustic Impact on Residential Areas',
      category: 'environmental',
      severity: 'high',
      distance: 200,
      impact: 'major',
      description: '70-85 dBA equipment noise vs 55 dB day/50 dB night residential limits. Requires 15-35 dB reduction.',
      mitigation: 'Comprehensive acoustic barriers and equipment enclosures. Advanced noise reduction systems.',
      cost_impact: {
        min: 5000000,
        max: 15000000,
        currency: 'EUR'
      },
      timeline_impact: {
        delay_months: 6,
        description: 'Acoustic mitigation design and implementation'
      },
      coordinates: [21.7950, 61.4830]
    },
    {
      id: 'seasonal_constraints',
      name: 'Seasonal Operational Limitations',
      category: 'environmental',
      severity: 'medium',
      impact: 'moderate',
      description: 'Winter peak heating demand reduces available grid capacity. Summer construction windows for environmental protection.',
      mitigation: 'Seasonal operation planning and energy storage integration.',
      timeline_impact: {
        delay_months: 3,
        description: 'Seasonal construction and operation adjustments'
      }
    },

    // Infrastructure Integration
    {
      id: 'district_heating_mismatch',
      name: 'District Heating Integration Challenges',
      category: 'connectivity',
      severity: 'medium',
      impact: 'moderate',
      description: 'Scale mismatch: 70-500MW datacenter vs 80MW existing Pori Energia system. Temperature mismatch: 35-45°C waste heat vs 60-80°C requirement.',
      mitigation: 'Heat pump integration and phased district heating expansion.',
      cost_impact: {
        min: 3000000,
        max: 8000000,
        currency: 'EUR'
      },
      timeline_impact: {
        delay_months: 12,
        description: 'District heating infrastructure expansion'
      }
    }
  ];

  // Calculate summary statistics
  const criticalCount = constraints.filter(c => c.severity === 'critical').length;
  const highCount = constraints.filter(c => c.severity === 'high').length;
  const mediumCount = constraints.filter(c => c.severity === 'medium').length;
  const lowCount = constraints.filter(c => c.severity === 'low').length;

  // Calculate overall score based on constraints - adjusted for realistic Pori assessment
  let score = 10.0;
  constraints.forEach(constraint => {
    switch (constraint.severity) {
      case 'critical':
        score -= 1.2; // Reduced impact for more realistic scoring
        break;
      case 'high':
        score -= 0.8;
        break;
      case 'medium':
        score -= 0.4;
        break;
      case 'low':
        score -= 0.1;
        break;
    }
  });
  score = Math.max(3.5, Math.min(10, score)); // Realistic minimum score

  const recommendation = score >= 7 ? 'proceed' : score >= 4 ? 'caution' : 'avoid';

  return {
    site_id: 'pori-konepajanranta',
    site_name: 'Konepajanranta Datacenter Site',
    coordinates: PORI_SITE_COORDINATES,
    constraints,
    overall_score: Math.round(score * 10) / 10,
    recommendation,
    critical_count: criticalCount,
    high_count: highCount,
    medium_count: mediumCount,
    low_count: lowCount,
    analyzed_at: '2025-01-22T00:00:00Z'
  };
}

// Site boundary polygon (approximate industrial area)
export const PORI_SITE_BOUNDARY = {
  type: 'Feature',
  geometry: {
    type: 'Polygon',
    coordinates: [[
      [21.7920, 61.4870],
      [21.8020, 61.4870],
      [21.8020, 61.4820],
      [21.7920, 61.4820],
      [21.7920, 61.4870]
    ]]
  },
  properties: {
    id: 'konepajanranta-site',
    name: 'Konepajanranta Industrial Area',
    area_hectares: 60,
    phase1_area: 6,
    phase2_area: 9,
    zoning: 'Industrial',
    development_status: 'Available'
  }
};

// Demo sites including Pori + comparison sites
export const DEMO_SITES = [
  {
    id: 'pori-konepajanranta',
    name: 'Pori Konepajanranta',
    coordinates: PORI_SITE_COORDINATES,
    properties: {
      powerRequirement: 70,
      area: 15,
      status: 'completed',
      score: 4.2,
      country: 'Finland',
      region: 'Satakunta'
    }
  }
];