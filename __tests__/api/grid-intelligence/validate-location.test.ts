/**
 * Test suite for Location Validation API
 * Tests API endpoints, validation logic, and error handling
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST, GET } from '@/app/api/grid-intelligence/validate-location/route';

// Mock validation module
vi.mock('@/lib/validation/grid-analysis-validation', () => ({
  createValidationMiddleware: vi.fn(() => vi.fn((data) => {
    // Mock successful validation
    if (data.coordinates && Array.isArray(data.coordinates) && data.coordinates.length === 2) {
      return {
        success: true,
        data: {
          coordinates: data.coordinates,
          polygon: data.polygon,
          country: data.country
        }
      };
    }
    return {
      success: false,
      errors: [{ field: 'coordinates', message: 'Invalid coordinates', code: 'invalid' }]
    };
  })),
  GridAnalysisValidator: {
    validateCoordinate: vi.fn(([lng, lat]) => 
      lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90
    ),
    isWithinEurope: vi.fn(([lng, lat]) => 
      lng >= -30 && lng <= 70 && lat >= 35 && lat <= 75
    ),
    validatePolygonFeature: vi.fn(() => ({
      valid: true,
      data: {
        id: 'test-polygon',
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [[[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]]
        },
        properties: {}
      }
    }))
  }
}));

// Test data
const validCoordinates: [number, number] = [24.9384, 60.1699]; // Helsinki
const invalidCoordinates: [number, number] = [200, 100]; // Invalid range
const outsideEuropeCoordinates: [number, number] = [-100, 40]; // North America

const validPolygon = {
  type: 'Polygon' as const,
  coordinates: [[[24.9, 60.1], [24.95, 60.1], [24.95, 60.15], [24.9, 60.15], [24.9, 60.1]]]
};

describe('Location Validation API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/grid-intelligence/validate-location', () => {
    const createRequest = (body: any): NextRequest => {
      return new NextRequest('http://localhost/api/grid-intelligence/validate-location', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
    };

    describe('Valid Requests', () => {
      it('should validate location with coordinates only', async () => {
        const request = createRequest({
          coordinates: validCoordinates
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.centroid).toEqual(validCoordinates);
        expect(data.country).toBeDefined();
        expect(data.region).toBeDefined();
        expect(data.tsoRelevance).toBeDefined();
        expect(data.tsoRelevance.primary).toBeDefined();
      });

      it('should validate location with coordinates and polygon', async () => {
        const request = createRequest({
          coordinates: validCoordinates,
          polygon: validPolygon
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.centroid).toEqual(validCoordinates);
        expect(data.bounds).toBeDefined();
        expect(data.bounds.north).toBeGreaterThan(data.bounds.south);
        expect(data.bounds.east).toBeGreaterThan(data.bounds.west);
      });

      it('should include TSO analysis in response', async () => {
        const request = createRequest({
          coordinates: validCoordinates
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.tsoRelevance.primary).toBeDefined();
        expect(data.gridRegion).toBeDefined();
        expect(data.analysisScope).toBeDefined();
        expect(data.analysisScope.radiusKm).toBeGreaterThan(0);
      });

      it('should identify Finnish location correctly', async () => {
        const finnishCoordinates: [number, number] = [25.0, 60.0];
        const request = createRequest({
          coordinates: finnishCoordinates
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.country).toBe('Finland');
        expect(data.countryCode).toBe('FI');
      });

      it('should identify German location correctly', async () => {
        const germanCoordinates: [number, number] = [10.0, 50.0];
        const request = createRequest({
          coordinates: germanCoordinates
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.country).toBe('Germany');
        expect(data.countryCode).toBe('DE');
      });

      it('should handle cross-border proximity analysis', async () => {
        const borderCoordinates: [number, number] = [13.0, 54.0]; // Near German-Danish border
        const request = createRequest({
          coordinates: borderCoordinates
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.analysisScope.includesCrossBorder).toBeDefined();
        expect(typeof data.analysisScope.includesCrossBorder).toBe('boolean');
      });
    });

    describe('Invalid Requests', () => {
      it('should reject request with missing coordinates', async () => {
        const request = createRequest({});

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Validation failed');
        expect(data.details).toBeDefined();
      });

      it('should reject request with invalid coordinate format', async () => {
        const request = createRequest({
          coordinates: [24.9384] // Missing latitude
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Validation failed');
      });

      it('should reject coordinates outside valid range', async () => {
        // Mock validation to reject invalid coordinates
        const mockValidation = vi.mocked(
          require('@/lib/validation/grid-analysis-validation').createValidationMiddleware
        );
        mockValidation.mockReturnValueOnce(() => ({
          success: true,
          data: { coordinates: invalidCoordinates }
        }));

        const mockValidator = vi.mocked(
          require('@/lib/validation/grid-analysis-validation').GridAnalysisValidator
        );
        mockValidator.validateCoordinate.mockReturnValueOnce(false);

        const request = createRequest({
          coordinates: invalidCoordinates
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Invalid coordinates');
      });

      it('should reject locations outside Europe', async () => {
        // Mock validation to accept the request format
        const mockValidation = vi.mocked(
          require('@/lib/validation/grid-analysis-validation').createValidationMiddleware
        );
        mockValidation.mockReturnValueOnce(() => ({
          success: true,
          data: { coordinates: outsideEuropeCoordinates }
        }));

        const mockValidator = vi.mocked(
          require('@/lib/validation/grid-analysis-validation').GridAnalysisValidator
        );
        mockValidator.validateCoordinate.mockReturnValueOnce(true);
        mockValidator.isWithinEurope.mockReturnValueOnce(false);

        const request = createRequest({
          coordinates: outsideEuropeCoordinates
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Location outside service area');
      });

      it('should handle malformed JSON', async () => {
        const request = new NextRequest('http://localhost/api/grid-intelligence/validate-location', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: 'invalid json{',
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBeDefined();
      });
    });

    describe('Polygon Validation', () => {
      it('should validate polygon geometry', async () => {
        const request = createRequest({
          coordinates: validCoordinates,
          polygon: validPolygon
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.bounds).toBeDefined();
      });

      it('should reject invalid polygon geometry', async () => {
        // Mock polygon validation to fail
        const mockValidator = vi.mocked(
          require('@/lib/validation/grid-analysis-validation').GridAnalysisValidator
        );
        mockValidator.validatePolygonFeature.mockReturnValueOnce({
          valid: false,
          errors: ['Invalid polygon geometry']
        });

        const request = createRequest({
          coordinates: validCoordinates,
          polygon: { type: 'Polygon', coordinates: [] } // Invalid
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Invalid polygon geometry');
      });
    });

    describe('Country Identification', () => {
      const testCases = [
        { coords: [25.0, 60.0], expectedCountry: 'Finland', expectedCode: 'FI' },
        { coords: [15.0, 59.0], expectedCountry: 'Sweden', expectedCode: 'SE' },
        { coords: [10.0, 62.0], expectedCountry: 'Norway', expectedCode: 'NO' },
        { coords: [10.0, 55.0], expectedCountry: 'Denmark', expectedCode: 'DK' },
        { coords: [10.0, 50.0], expectedCountry: 'Germany', expectedCode: 'DE' },
        { coords: [5.0, 52.0], expectedCountry: 'Netherlands', expectedCode: 'NL' }
      ];

      testCases.forEach(({ coords, expectedCountry, expectedCode }) => {
        it(`should identify ${expectedCountry} correctly`, async () => {
          const request = createRequest({
            coordinates: coords
          });

          const response = await POST(request);
          const data = await response.json();

          expect(response.status).toBe(200);
          expect(data.country).toBe(expectedCountry);
          expect(data.countryCode).toBe(expectedCode);
        });
      });

      it('should handle unknown locations', async () => {
        const unknownCoordinates: [number, number] = [0, 0]; // Ocean
        const request = createRequest({
          coordinates: unknownCoordinates
        });

        const response = await POST(request);

        // Should return 422 for unsupported regions
        expect(response.status).toBe(422);
      });
    });

    describe('Analysis Scope Calculation', () => {
      it('should calculate appropriate analysis radius for small polygon', async () => {
        const smallPolygon = {
          type: 'Polygon' as const,
          coordinates: [[[24.9, 60.1], [24.901, 60.1], [24.901, 60.101], [24.9, 60.101], [24.9, 60.1]]]
        };

        const request = createRequest({
          coordinates: validCoordinates,
          polygon: smallPolygon
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.analysisScope.radiusKm).toBeGreaterThan(0);
        expect(data.analysisScope.radiusKm).toBeLessThan(20); // Should be small radius
      });

      it('should calculate appropriate analysis radius for large polygon', async () => {
        const largePolygon = {
          type: 'Polygon' as const,
          coordinates: [[[24.9, 60.1], [25.0, 60.1], [25.0, 60.2], [24.9, 60.2], [24.9, 60.1]]]
        };

        const request = createRequest({
          coordinates: validCoordinates,
          polygon: largePolygon
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.analysisScope.radiusKm).toBeGreaterThan(20); // Should be larger radius
      });
    });
  });

  describe('GET /api/grid-intelligence/validate-location', () => {
    it('should handle GET request with query parameters', async () => {
      const url = 'http://localhost/api/grid-intelligence/validate-location?lng=24.9384&lat=60.1699';
      const request = new NextRequest(url, { method: 'GET' });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.centroid).toEqual([24.9384, 60.1699]);
    });

    it('should handle GET request with missing parameters', async () => {
      const url = 'http://localhost/api/grid-intelligence/validate-location';
      const request = new NextRequest(url, { method: 'GET' });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing lng and lat parameters');
    });

    it('should handle GET request with invalid parameters', async () => {
      const url = 'http://localhost/api/grid-intelligence/validate-location?lng=invalid&lat=invalid';
      const request = new NextRequest(url, { method: 'GET' });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing lng and lat parameters');
    });
  });

  describe('Regional Analysis', () => {
    it('should provide regional information for Finland', async () => {
      const request = createRequest({
        coordinates: [25.0, 60.5] // Southern Finland
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.region).toBeDefined();
      expect(data.gridRegion).toBe('Nordic Grid');
    });

    it('should provide regional information for Germany', async () => {
      const request = createRequest({
        coordinates: [10.0, 50.0] // Central Germany
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.region).toBeDefined();
      expect(data.gridRegion).toBe('Continental European Grid');
    });
  });

  describe('Error Handling', () => {
    it('should handle internal server errors gracefully', async () => {
      // Mock an internal error
      const originalConsoleError = console.error;
      console.error = vi.fn();

      // Force an error by mocking a failing function
      vi.doMock('@/lib/validation/grid-analysis-validation', () => {
        throw new Error('Internal validation error');
      });

      const request = createRequest({
        coordinates: validCoordinates
      });

      const response = await POST(request);

      expect(response.status).toBe(500);

      console.error = originalConsoleError;
    });

    it('should log errors appropriately', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Make validation fail
      const mockValidation = vi.mocked(
        require('@/lib/validation/grid-analysis-validation').createValidationMiddleware
      );
      mockValidation.mockReturnValueOnce(() => {
        throw new Error('Validation error');
      });

      const request = createRequest({
        coordinates: validCoordinates
      });

      await POST(request);

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});