/**
 * TSO Identification API for Grid Intelligence
 * Identifies relevant Transmission System Operators based on validated location
 */

import { NextRequest, NextResponse } from 'next/server';
import { TSO, LocationInfo } from '@/lib/types/grid-types';

// TSO Database with contact information and capabilities
const TSO_DATABASE: Record<string, TSO> = {
  '10YFI-1--------U': {
    name: 'Fingrid Oyj',
    country: 'Finland',
    countryCode: 'FI',
    eicCode: '10YFI-1--------U',
    apiEndpoint: 'https://api.fingrid.fi/v1',
    contactInfo: {
      website: 'https://www.fingrid.fi/en/',
      email: 'info@fingrid.fi',
      phone: '+358 30 395 5000'
    },
    gridVoltageLevel: ['400kV', '220kV', '110kV']
  },
  '10YSE-1--------K': {
    name: 'Svenska kraftnät',
    country: 'Sweden', 
    countryCode: 'SE',
    eicCode: '10YSE-1--------K',
    apiEndpoint: 'https://www.svk.se/en/stakeholder-portal/electricity-market/',
    contactInfo: {
      website: 'https://www.svk.se/en/',
      email: 'info@svk.se',
      phone: '+46 10 475 80 00'
    },
    gridVoltageLevel: ['400kV', '220kV', '130kV']
  },
  '10YNO-0--------C': {
    name: 'Statnett SF',
    country: 'Norway',
    countryCode: 'NO', 
    eicCode: '10YNO-0--------C',
    apiEndpoint: 'https://www.statnett.no/en/',
    contactInfo: {
      website: 'https://www.statnett.no/en/',
      email: 'post@statnett.no',
      phone: '+47 23 90 30 00'
    },
    gridVoltageLevel: ['420kV', '300kV', '132kV']
  },
  '10YDK-1--------W': {
    name: 'Energinet',
    country: 'Denmark',
    countryCode: 'DK',
    eicCode: '10YDK-1--------W', 
    apiEndpoint: 'https://energinet.dk/en/',
    contactInfo: {
      website: 'https://energinet.dk/en/',
      email: 'info@energinet.dk',
      phone: '+45 70 10 22 44'
    },
    gridVoltageLevel: ['400kV', '150kV', '132kV']
  },
  '10Y1001A1001A83F': {
    name: 'German TSOs (50Hertz, Amprion, TenneT DE, TransnetBW)',
    country: 'Germany',
    countryCode: 'DE',
    eicCode: '10Y1001A1001A83F',
    contactInfo: {
      website: 'https://www.netzentwicklungsplan.de/en',
      email: 'info@netzentwicklungsplan.de'
    },
    gridVoltageLevel: ['380kV', '220kV', '110kV']
  },
  '10YNL----------L': {
    name: 'TenneT Nederland',
    country: 'Netherlands',
    countryCode: 'NL',
    eicCode: '10YNL----------L',
    apiEndpoint: 'https://www.tennet.eu/electricity-market/',
    contactInfo: {
      website: 'https://www.tennet.eu/',
      email: 'info@tennet.eu',
      phone: '+31 26 373 1111'
    },
    gridVoltageLevel: ['380kV', '220kV', '150kV']
  }
};

interface TSO_Identification_Request {
  centroid: [number, number];
  country: string;
  countryCode: string;
  region?: string;
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  tsoRelevance?: {
    primary: string;
    secondary?: string[];
  };
}

interface TSO_Identification_Response {
  primaryTSO: TSO;
  secondaryTSOs: TSO[];
  crossBorderTSOs: TSO[];
  recommendedApiSources: {
    tso: TSO;
    priority: 'high' | 'medium' | 'low';
    dataTypes: string[];
    accessInfo: {
      requiresApiKey: boolean;
      publicEndpoints: string[];
      contactForAccess?: string;
    };
  }[];
  analysisScope: {
    primaryRegion: string;
    includesCrossBorder: boolean;
    relevantInterconnections: string[];
  };
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    console.log('🏢 Processing TSO identification request...');
    
    const locationInfo: TSO_Identification_Request = await request.json();
    
    // Validate input
    if (!locationInfo.countryCode || !locationInfo.centroid) {
      return NextResponse.json(
        { error: 'Missing required location information' },
        { status: 400 }
      );
    }

    console.log(`🎯 Identifying TSOs for: ${locationInfo.country} (${locationInfo.countryCode})`);

    // Get primary TSO
    const primaryTSOCode = locationInfo.tsoRelevance?.primary || 
                          getTSOCodeForCountry(locationInfo.countryCode);
    
    const primaryTSO = TSO_DATABASE[primaryTSOCode];
    
    if (!primaryTSO) {
      return NextResponse.json(
        { error: `No TSO found for country: ${locationInfo.countryCode}` },
        { status: 422 }
      );
    }

    // Get secondary TSOs (neighboring/cross-border)
    const secondaryTSOs: TSO[] = [];
    const crossBorderTSOs: TSO[] = [];
    
    if (locationInfo.tsoRelevance?.secondary) {
      for (const tsoCode of locationInfo.tsoRelevance.secondary) {
        const tso = TSO_DATABASE[tsoCode];
        if (tso && tso.eicCode !== primaryTSO.eicCode) {
          if (isDirectNeighbor(locationInfo.countryCode, tso.countryCode)) {
            secondaryTSOs.push(tso);
          } else {
            crossBorderTSOs.push(tso);
          }
        }
      }
    }

    // Add neighboring country TSOs based on geography
    const neighborTSOs = getNeighboringTSOs(locationInfo.countryCode, locationInfo.centroid);
    for (const tso of neighborTSOs) {
      if (!secondaryTSOs.find(s => s.eicCode === tso.eicCode) &&
          !crossBorderTSOs.find(c => c.eicCode === tso.eicCode)) {
        secondaryTSOs.push(tso);
      }
    }

    // Build API source recommendations
    const recommendedApiSources = buildApiSourceRecommendations(
      primaryTSO, 
      secondaryTSOs, 
      locationInfo
    );

    // Identify relevant interconnections
    const relevantInterconnections = identifyInterconnections(
      locationInfo.countryCode,
      secondaryTSOs.map(tso => tso.countryCode)
    );

    const response: TSO_Identification_Response = {
      primaryTSO,
      secondaryTSOs,
      crossBorderTSOs,
      recommendedApiSources,
      analysisScope: {
        primaryRegion: `${primaryTSO.country} (${primaryTSO.name})`,
        includesCrossBorder: secondaryTSOs.length > 0,
        relevantInterconnections
      }
    };

    console.log('✅ TSO identification completed:', {
      primary: primaryTSO.name,
      secondary: secondaryTSOs.map(tso => tso.name),
      crossBorder: crossBorderTSOs.map(tso => tso.name)
    });

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ TSO identification error:', error);
    
    return NextResponse.json(
      { 
        error: 'TSO identification failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Get TSO code for a country
 */
function getTSOCodeForCountry(countryCode: string): string {
  const mapping: Record<string, string> = {
    'FI': '10YFI-1--------U',
    'SE': '10YSE-1--------K', 
    'NO': '10YNO-0--------C',
    'DK': '10YDK-1--------W',
    'DE': '10Y1001A1001A83F',
    'NL': '10YNL----------L'
  };
  
  return mapping[countryCode] || '';
}

/**
 * Check if two countries are direct neighbors
 */
function isDirectNeighbor(country1: string, country2: string): boolean {
  const neighbors: Record<string, string[]> = {
    'FI': ['SE', 'NO'],
    'SE': ['FI', 'NO', 'DK', 'DE'],
    'NO': ['FI', 'SE', 'DK'],
    'DK': ['SE', 'NO', 'DE'],
    'DE': ['DK', 'NL'],
    'NL': ['DE']
  };
  
  return neighbors[country1]?.includes(country2) || false;
}

/**
 * Get neighboring TSOs based on location
 */
function getNeighboringTSOs(countryCode: string, coordinates: [number, number]): TSO[] {
  const [longitude, latitude] = coordinates;
  const neighborTSOs: TSO[] = [];

  // Nordic region proximity logic
  if (['FI', 'SE', 'NO', 'DK'].includes(countryCode)) {
    // Add Nordic TSOs based on proximity
    if (countryCode === 'FI') {
      neighborTSOs.push(TSO_DATABASE['10YSE-1--------K']); // Sweden
      if (latitude > 65) { // Northern Finland
        neighborTSOs.push(TSO_DATABASE['10YNO-0--------C']); // Norway
      }
    }
    
    if (countryCode === 'SE') {
      neighborTSOs.push(TSO_DATABASE['10YFI-1--------U']); // Finland
      neighborTSOs.push(TSO_DATABASE['10YNO-0--------C']); // Norway
      if (latitude < 58) { // Southern Sweden
        neighborTSOs.push(TSO_DATABASE['10YDK-1--------W']); // Denmark
      }
    }
    
    if (countryCode === 'NO') {
      neighborTSOs.push(TSO_DATABASE['10YSE-1--------K']); // Sweden
      if (longitude > 20) { // Eastern Norway
        neighborTSOs.push(TSO_DATABASE['10YFI-1--------U']); // Finland
      }
      if (latitude < 62) { // Southern Norway
        neighborTSOs.push(TSO_DATABASE['10YDK-1--------W']); // Denmark
      }
    }
    
    if (countryCode === 'DK') {
      neighborTSOs.push(TSO_DATABASE['10YSE-1--------K']); // Sweden
      neighborTSOs.push(TSO_DATABASE['10YNO-0--------C']); // Norway
      neighborTSOs.push(TSO_DATABASE['10Y1001A1001A83F']); // Germany
    }
  }

  // Continental Europe proximity logic
  if (['DE', 'NL'].includes(countryCode)) {
    if (countryCode === 'DE') {
      neighborTSOs.push(TSO_DATABASE['10YNL----------L']); // Netherlands
      if (latitude > 54) { // Northern Germany
        neighborTSOs.push(TSO_DATABASE['10YDK-1--------W']); // Denmark
      }
    }
    
    if (countryCode === 'NL') {
      neighborTSOs.push(TSO_DATABASE['10Y1001A1001A83F']); // Germany
    }
  }

  return neighborTSOs.filter(tso => tso); // Remove undefined entries
}

/**
 * Build API source recommendations with priorities
 */
function buildApiSourceRecommendations(
  primaryTSO: TSO,
  secondaryTSOs: TSO[],
  locationInfo: TSO_Identification_Request
): TSO_Identification_Response['recommendedApiSources'] {
  
  const sources: TSO_Identification_Response['recommendedApiSources'] = [];

  // Primary TSO - highest priority
  sources.push({
    tso: primaryTSO,
    priority: 'high',
    dataTypes: ['capacity_data', 'transmission_lines', 'substations', 'development_plans'],
    accessInfo: {
      requiresApiKey: primaryTSO.apiEndpoint ? true : false,
      publicEndpoints: getPublicEndpoints(primaryTSO),
      contactForAccess: primaryTSO.contactInfo?.email
    }
  });

  // Secondary TSOs - medium priority
  for (const tso of secondaryTSOs.slice(0, 2)) { // Limit to top 2 secondary TSOs
    sources.push({
      tso,
      priority: 'medium',
      dataTypes: ['cross_border_flows', 'interconnection_capacity', 'regional_constraints'],
      accessInfo: {
        requiresApiKey: tso.apiEndpoint ? true : false,
        publicEndpoints: getPublicEndpoints(tso),
        contactForAccess: tso.contactInfo?.email
      }
    });
  }

  // ENTSO-E - always include as fallback
  sources.push({
    tso: {
      name: 'ENTSO-E Transparency Platform',
      country: 'Pan-European',
      countryCode: 'EU',
      eicCode: 'ENTSOE',
      apiEndpoint: 'https://web-api.tp.entsoe.eu/api',
      contactInfo: {
        website: 'https://transparency.entsoe.eu/',
        email: 'transparency@entsoe.eu'
      },
      gridVoltageLevel: ['All voltage levels']
    },
    priority: 'medium',
    dataTypes: ['generation_forecast', 'load_forecast', 'cross_border_flows', 'congestion_management'],
    accessInfo: {
      requiresApiKey: true,
      publicEndpoints: ['https://transparency.entsoe.eu/'],
      contactForAccess: 'transparency@entsoe.eu'
    }
  });

  return sources;
}

/**
 * Get public endpoints for a TSO
 */
function getPublicEndpoints(tso: TSO): string[] {
  const endpoints: string[] = [];
  
  if (tso.contactInfo?.website) {
    endpoints.push(tso.contactInfo.website);
  }
  
  // Add known public data portals
  const publicPortals: Record<string, string[]> = {
    'FI': ['https://data.fingrid.fi/', 'https://www.fingrid.fi/en/electricity-market/'],
    'SE': ['https://www.svk.se/en/stakeholder-portal/electricity-market/'],
    'NO': ['https://www.statnett.no/en/for-stakeholders-in-the-power-industry/'],
    'DK': ['https://energinet.dk/en/electricity/'],
    'DE': ['https://www.netzentwicklungsplan.de/en'],
    'NL': ['https://www.tennet.eu/electricity-market/']
  };
  
  const countryPortals = publicPortals[tso.countryCode];
  if (countryPortals) {
    endpoints.push(...countryPortals);
  }
  
  return endpoints;
}

/**
 * Identify relevant interconnections
 */
function identifyInterconnections(primaryCountry: string, secondaryCountries: string[]): string[] {
  const interconnections: string[] = [];
  
  // Known major interconnections
  const majorInterconnections: Record<string, Record<string, string>> = {
    'FI': {
      'SE': 'Fenno-Skan (HVDC)',
      'NO': 'Nordic Synchronous Grid'
    },
    'SE': {
      'FI': 'Fenno-Skan (HVDC)',
      'NO': 'Nordic AC Grid',
      'DK': 'Öresund Connection',
      'DE': 'Baltic Cable (HVDC)'
    },
    'NO': {
      'SE': 'Nordic AC Grid',
      'DK': 'Skagerrak (HVDC)'
    },
    'DK': {
      'SE': 'Öresund + Great Belt (AC/HVDC)',
      'NO': 'Skagerrak (HVDC)',
      'DE': 'Kontek (HVDC)'
    },
    'DE': {
      'DK': 'Kontek (HVDC)',
      'NL': 'AC Interconnections'
    },
    'NL': {
      'DE': 'AC Grid Interconnections'
    }
  };
  
  const primaryConnections = majorInterconnections[primaryCountry];
  if (primaryConnections) {
    for (const country of secondaryCountries) {
      if (primaryConnections[country]) {
        interconnections.push(primaryConnections[country]);
      }
    }
  }
  
  return interconnections;
}

// GET endpoint for testing
export async function GET(request: NextRequest): Promise<NextResponse> {
  const searchParams = request.nextUrl.searchParams;
  const countryCode = searchParams.get('country')?.toUpperCase();
  
  if (!countryCode) {
    return NextResponse.json({ error: 'Missing country parameter' }, { status: 400 });
  }

  // Create test location info
  const testLocationInfo = {
    centroid: [24.9384, 60.1699] as [number, number], // Helsinki
    country: 'Finland',
    countryCode,
    bounds: {
      north: 60.2,
      south: 60.1,
      east: 25.0,
      west: 24.9
    }
  };

  try {
    const result = await POST(new NextRequest('http://localhost/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testLocationInfo)
    }));
    
    return result;
  } catch (error) {
    return NextResponse.json({ error: 'TSO identification failed' }, { status: 500 });
  }
}