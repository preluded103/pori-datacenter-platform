/**
 * Location Validation API for Grid Intelligence
 * Validates polygon coordinates and identifies relevant geographic information
 */

import { NextRequest, NextResponse } from 'next/server';
import { LocationInfo, PolygonFeature } from '@/lib/types/grid-types';
import { 
  LocationValidationRequestSchema, 
  createValidationMiddleware,
  GridAnalysisValidator 
} from '@/lib/validation/grid-analysis-validation';
import { gridIntelligenceApiSecurity } from '@/lib/middleware/api-security';

// Country boundary detection using coordinate ranges
const COUNTRY_BOUNDARIES = {
  'FI': { // Finland
    bounds: { north: 70.1, south: 59.5, east: 31.6, west: 19.1 },
    name: 'Finland',
    eicCode: '10YFI-1--------U'
  },
  'SE': { // Sweden  
    bounds: { north: 69.1, south: 55.3, east: 24.2, west: 11.0 },
    name: 'Sweden',
    eicCode: '10YSE-1--------K'
  },
  'NO': { // Norway
    bounds: { north: 71.2, south: 57.9, east: 31.1, west: 4.6 },
    name: 'Norway', 
    eicCode: '10YNO-0--------C'
  },
  'DK': { // Denmark
    bounds: { north: 57.8, south: 54.5, east: 15.2, west: 8.0 },
    name: 'Denmark',
    eicCode: '10YDK-1--------W'
  },
  'DE': { // Germany
    bounds: { north: 55.1, south: 47.3, east: 15.0, west: 5.9 },
    name: 'Germany',
    eicCode: '10Y1001A1001A83F'
  },
  'NL': { // Netherlands
    bounds: { north: 53.6, south: 50.8, east: 7.2, west: 3.4 },
    name: 'Netherlands',
    eicCode: '10YNL----------L'
  }
};

interface ValidationRequest {
  coordinates: [number, number]; // [longitude, latitude] 
  polygon?: PolygonFeature;
}

interface ValidationResponse extends LocationInfo {
  tsoRelevance: {
    primary: string;
    secondary?: string[];
  };
  gridRegion: string;
  analysisScope: {
    radiusKm: number;
    includesCrossBorder: boolean;
  };
}

const validateRequest = createValidationMiddleware(LocationValidationRequestSchema);

// Apply security middleware
export const POST = gridIntelligenceApiSecurity(async (request: NextRequest): Promise<NextResponse> => {
  try {
    console.log('🌍 Processing location validation request...');
    
    const body = await request.json();
    
    // Validate input using comprehensive validation
    const validation = validateRequest(body);
    if (!validation.success) {
      console.log('❌ Validation failed:', 'errors' in validation ? validation.errors : 'Unknown error');
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: 'errors' in validation ? validation.errors : []
        },
        { status: 400 }
      );
    }

    const { coordinates, polygon, country } = validation.data;
    const [longitude, latitude] = coordinates;

    // Additional security checks
    if (!GridAnalysisValidator.validateCoordinate(coordinates as [number, number])) {
      return NextResponse.json(
        {
          error: 'Invalid coordinates',
          details: 'Coordinates must be within valid longitude/latitude bounds'
        },
        { status: 400 }
      );
    }

    // Check if coordinates are within European bounds
    if (!GridAnalysisValidator.isWithinEurope(coordinates as [number, number])) {
      return NextResponse.json(
        {
          error: 'Location outside service area',
          details: 'This service currently supports European locations only'
        },
        { status: 400 }
      );
    }

    console.log(`📍 Validating location: [${longitude}, ${latitude}]`);

    // Identify country based on coordinates
    const countryInfo = identifyCountry(longitude, latitude);
    
    if (!countryInfo) {
      console.log('⚠️ Location outside supported regions');
      return NextResponse.json(
        { error: 'Location outside supported European regions' },
        { status: 422 }
      );
    }

    // Calculate polygon bounds if provided
    let polygonBounds;
    if (polygon) {
      // Validate polygon geometry using comprehensive validator
      const polygonValidation = GridAnalysisValidator.validatePolygonFeature({
        id: 'validation-polygon',
        type: 'Feature',
        geometry: polygon,
        properties: {}
      });
      
      if (!polygonValidation.valid) {
        return NextResponse.json(
          {
            error: 'Invalid polygon geometry',
            details: polygonValidation.errors
          },
          { status: 400 }
        );
      }
      
      polygonBounds = calculatePolygonBounds({ id: 'temp', type: 'Feature', geometry: polygon, properties: {} } as PolygonFeature);
    }

    // Build location information
    const locationInfo: ValidationResponse = {
      centroid: [longitude, latitude],
      country: countryInfo.name,
      countryCode: countryInfo.code,
      region: await getRegion(countryInfo.code, longitude, latitude),
      bounds: polygonBounds || {
        north: latitude + 0.01,
        south: latitude - 0.01, 
        east: longitude + 0.01,
        west: longitude - 0.01
      },
      tsoRelevance: {
        primary: countryInfo.eicCode,
        secondary: await getSecondaryCrossBorderTSOs(longitude, latitude)
      },
      gridRegion: await getGridRegion(countryInfo.code, longitude, latitude),
      analysisScope: {
        radiusKm: calculateAnalysisRadius(polygonBounds),
        includesCrossBorder: await checkCrossBorderProximity(longitude, latitude)
      }
    };

    console.log('✅ Location validation completed:', {
      country: locationInfo.country,
      region: locationInfo.region,
      primaryTSO: locationInfo.tsoRelevance.primary
    });

    return NextResponse.json(locationInfo);

  } catch (error) {
    console.error('❌ Location validation error:', error);
    
    return NextResponse.json(
      { 
        error: 'Location validation failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
});

/**
 * Identify country based on coordinates
 */
function identifyCountry(longitude: number, latitude: number): { code: string; name: string; eicCode: string } | null {
  for (const [code, info] of Object.entries(COUNTRY_BOUNDARIES)) {
    const { bounds } = info;
    
    if (longitude >= bounds.west && longitude <= bounds.east &&
        latitude >= bounds.south && latitude <= bounds.north) {
      return {
        code,
        name: info.name,
        eicCode: info.eicCode
      };
    }
  }
  
  return null;
}

/**
 * Calculate bounds of polygon
 */
function calculatePolygonBounds(polygon: PolygonFeature): LocationInfo['bounds'] {
  if (!polygon.geometry?.coordinates?.[0]) {
    throw new Error('Invalid polygon geometry');
  }

  const coordinates = polygon.geometry.coordinates[0];
  
  let minLng = Infinity, maxLng = -Infinity;
  let minLat = Infinity, maxLat = -Infinity;

  for (const [lng, lat] of coordinates) {
    minLng = Math.min(minLng, lng);
    maxLng = Math.max(maxLng, lng);
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
  }

  return {
    north: maxLat,
    south: minLat,
    east: maxLng,
    west: minLng
  };
}

/**
 * Get administrative region within country
 */
async function getRegion(countryCode: string, longitude: number, latitude: number): Promise<string | undefined> {
  // Regional mappings for supported countries
  const regions: Record<string, any> = {
    'FI': {
      'Northern Finland': { north: 70, south: 65 },
      'Central Finland': { north: 65, south: 62 },
      'Southern Finland': { north: 62, south: 59.5 }
    },
    'SE': {
      'Northern Sweden': { north: 69, south: 63 },
      'Central Sweden': { north: 63, south: 58 },
      'Southern Sweden': { north: 58, south: 55 }
    },
    'DE': {
      'Northern Germany': { north: 55, south: 52 },
      'Central Germany': { north: 52, south: 49 },
      'Southern Germany': { north: 49, south: 47 }
    }
  };

  const countryRegions = regions[countryCode];
  if (!countryRegions) return undefined;

  for (const [regionName, bounds] of Object.entries(countryRegions)) {
    if (latitude >= (bounds as any).south && latitude <= (bounds as any).north) {
      return regionName;
    }
  }

  return undefined;
}

/**
 * Get grid region identifier
 */
async function getGridRegion(countryCode: string, longitude: number, latitude: number): Promise<string> {
  // Grid region mappings based on TSO operational areas
  const gridRegions: Record<string, string> = {
    'FI': 'Nordic Grid',
    'SE': 'Nordic Grid', 
    'NO': 'Nordic Grid',
    'DK': 'Nordic Grid',
    'DE': 'Continental European Grid',
    'NL': 'Continental European Grid'
  };

  return gridRegions[countryCode] || 'Unknown Grid';
}

/**
 * Get secondary TSOs for cross-border analysis
 */
async function getSecondaryCrossBorderTSOs(longitude: number, latitude: number): Promise<string[] | undefined> {
  const secondary: string[] = [];

  // Check proximity to country borders and add relevant TSOs
  for (const [code, info] of Object.entries(COUNTRY_BOUNDARIES)) {
    const { bounds } = info;
    
    // Check if within 50km of border (approximately 0.5 degrees)
    const borderProximity = 0.5;
    
    if (longitude >= (bounds.west - borderProximity) && longitude <= (bounds.east + borderProximity) &&
        latitude >= (bounds.south - borderProximity) && latitude <= (bounds.north + borderProximity)) {
      secondary.push(info.eicCode);
    }
  }

  return secondary.length > 0 ? secondary : undefined;
}

/**
 * Calculate analysis radius based on polygon size
 */
function calculateAnalysisRadius(bounds?: LocationInfo['bounds']): number {
  if (!bounds) return 10; // Default 10km radius
  
  // Calculate approximate area and adjust radius accordingly
  const width = Math.abs(bounds.east - bounds.west);
  const height = Math.abs(bounds.north - bounds.south);
  const area = width * height;
  
  // Larger sites need broader analysis
  if (area > 0.01) return 50;      // Very large sites: 50km
  if (area > 0.001) return 25;     // Large sites: 25km  
  if (area > 0.0001) return 15;    // Medium sites: 15km
  return 10;                       // Small sites: 10km
}

/**
 * Check if location is near country borders
 */
async function checkCrossBorderProximity(longitude: number, latitude: number): Promise<boolean> {
  const proximity = 0.2; // ~20km in degrees
  
  for (const info of Object.values(COUNTRY_BOUNDARIES)) {
    const { bounds } = info;
    
    // Check if close to any border
    if ((Math.abs(longitude - bounds.west) < proximity) ||
        (Math.abs(longitude - bounds.east) < proximity) ||
        (Math.abs(latitude - bounds.north) < proximity) ||
        (Math.abs(latitude - bounds.south) < proximity)) {
      return true;
    }
  }
  
  return false;
}

// GET endpoint for testing with security
export const GET = gridIntelligenceApiSecurity(async (request: NextRequest): Promise<NextResponse> => {
  const searchParams = request.nextUrl.searchParams;
  const lng = parseFloat(searchParams.get('lng') || '0');
  const lat = parseFloat(searchParams.get('lat') || '0');
  
  if (!lng || !lat) {
    return NextResponse.json({ error: 'Missing lng and lat parameters' }, { status: 400 });
  }

  // Create test request
  const testRequest = {
    coordinates: [lng, lat] as [number, number]
  };

  // Process validation
  try {
    const result = await POST(new NextRequest('http://localhost/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testRequest)
    }));
    
    return result;
  } catch (error) {
    return NextResponse.json({ error: 'Validation failed' }, { status: 500 });
  }
});