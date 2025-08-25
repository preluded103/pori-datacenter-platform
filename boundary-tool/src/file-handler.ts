/**
 * File Handler - Manages import and export of boundary data in various formats
 */

import { MapController } from './map-controller.js';
import { DrawingTools } from './drawing-tools.js';

export class FileHandler {
    constructor(
        private mapController: MapController,
        private drawingTools: DrawingTools
    ) {}

    // Import methods
    async importFile(file: File): Promise<void> {
        const extension = file.name.toLowerCase().split('.').pop();
        
        try {
            switch (extension) {
                case 'json':
                case 'geojson':
                    await this.importGeoJSON(file);
                    break;
                case 'kml':
                case 'kmz':
                    await this.importKML(file);
                    break;
                case 'gpx':
                    await this.importGPX(file);
                    break;
                case 'csv':
                    await this.importCSV(file);
                    break;
                default:
                    throw new Error(`Unsupported file format: ${extension}`);
            }
            
            this.updateStatus(`Successfully imported ${file.name}`);
            
        } catch (error) {
            console.error('Import error:', error);
            this.updateStatus(`Error importing ${file.name}: ${error}`);
        }
    }

    private async importGeoJSON(file: File): Promise<void> {
        const text = await file.text();
        const geoJson = JSON.parse(text);
        
        // Validate GeoJSON structure
        if (!geoJson.type || !geoJson.geometry) {
            throw new Error('Invalid GeoJSON format');
        }

        this.drawingTools.addPolygonFromGeoJSON(geoJson);
    }

    private async importKML(file: File): Promise<void> {
        const text = await file.text();
        
        // Simple KML parser for polygon coordinates
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'text/xml');
        
        const coordinatesElement = doc.querySelector('coordinates');
        if (!coordinatesElement) {
            throw new Error('No coordinates found in KML file');
        }

        const coordsText = coordinatesElement.textContent?.trim();
        if (!coordsText) {
            throw new Error('Empty coordinates in KML file');
        }

        // Parse KML coordinates (lon,lat,alt format)
        const coordinates: [number, number][] = coordsText
            .split(/\s+/)
            .map(coord => {
                const [lon, lat] = coord.split(',').map(Number);
                return [lat, lon] as [number, number]; // Convert to lat,lng for Leaflet
            })
            .filter(coord => !isNaN(coord[0]) && !isNaN(coord[1]));

        if (coordinates.length < 3) {
            throw new Error('Insufficient coordinates for polygon');
        }

        this.drawingTools.addPolygonFromCoordinates(coordinates);
    }

    private async importGPX(file: File): Promise<void> {
        const text = await file.text();
        
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'text/xml');
        
        // Look for track points
        const trackPoints = doc.querySelectorAll('trkpt');
        
        if (trackPoints.length === 0) {
            throw new Error('No track points found in GPX file');
        }

        const coordinates: [number, number][] = Array.from(trackPoints).map(point => {
            const lat = parseFloat(point.getAttribute('lat') || '0');
            const lon = parseFloat(point.getAttribute('lon') || '0');
            return [lat, lon] as [number, number];
        });

        this.drawingTools.addPolygonFromCoordinates(coordinates);
    }

    private async importCSV(file: File): Promise<void> {
        const text = await file.text();
        const lines = text.split('\n');
        
        if (lines.length < 2) {
            throw new Error('CSV file must contain at least header and one data row');
        }

        const header = lines[0].toLowerCase();
        const coordinates: [number, number][] = [];

        // Detect column format
        let latCol = -1, lonCol = -1;
        const headerCols = header.split(',').map(col => col.trim());
        
        headerCols.forEach((col, index) => {
            if (col.includes('lat') || col.includes('y')) latCol = index;
            if (col.includes('lon') || col.includes('lng') || col.includes('x')) lonCol = index;
        });

        if (latCol === -1 || lonCol === -1) {
            throw new Error('CSV must contain latitude and longitude columns');
        }

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const values = line.split(',');
            const lat = parseFloat(values[latCol]);
            const lon = parseFloat(values[lonCol]);

            if (!isNaN(lat) && !isNaN(lon)) {
                coordinates.push([lat, lon]);
            }
        }

        if (coordinates.length < 3) {
            throw new Error('Need at least 3 coordinate points for polygon');
        }

        this.drawingTools.addPolygonFromCoordinates(coordinates);
    }

    importWKT(wktString: string): void {
        try {
            // Simple WKT parser for POLYGON format
            const wkt = wktString.trim().toUpperCase();
            
            if (!wkt.startsWith('POLYGON')) {
                throw new Error('Only POLYGON WKT format is supported');
            }

            // Extract coordinates from POLYGON((x y, x y, ...))
            const coordMatch = wkt.match(/POLYGON\s*\(\s*\(([^)]+)\)\s*\)/);
            if (!coordMatch) {
                throw new Error('Invalid POLYGON WKT format');
            }

            const coordString = coordMatch[1];
            const coordinates: [number, number][] = coordString
                .split(',')
                .map(pair => {
                    const [lon, lat] = pair.trim().split(/\s+/).map(Number);
                    return [lat, lon] as [number, number]; // Convert from lon,lat to lat,lon
                })
                .filter(coord => !isNaN(coord[0]) && !isNaN(coord[1]));

            if (coordinates.length < 4) { // WKT polygons should close (first = last)
                throw new Error('Insufficient coordinates in WKT polygon');
            }

            // Remove last coordinate if it's identical to first (WKT closing)
            const coords = coordinates[0][0] === coordinates[coordinates.length - 1][0] &&
                         coordinates[0][1] === coordinates[coordinates.length - 1][1]
                ? coordinates.slice(0, -1)
                : coordinates;

            this.drawingTools.addPolygonFromCoordinates(coords);
            this.updateStatus('WKT polygon imported successfully');

        } catch (error) {
            console.error('WKT import error:', error);
            this.updateStatus(`Error importing WKT: ${error}`);
        }
    }

    // Export methods
    exportGeoJSON(): void {
        const geoJson = this.drawingTools.getCurrentPolygonGeoJSON();
        if (!geoJson) {
            this.updateStatus('No polygon to export');
            return;
        }

        const dataStr = JSON.stringify(geoJson, null, 2);
        this.downloadFile(dataStr, 'pori-datacenter-boundary.geojson', 'application/json');
        this.updateStatus('GeoJSON exported successfully');
    }

    exportKML(): void {
        const coordinates = this.drawingTools.getCurrentPolygonCoordinates();
        if (!coordinates) {
            this.updateStatus('No polygon to export');
            return;
        }

        // Convert to KML format (lon,lat,0)
        const kmlCoords = coordinates
            .map(coord => `${coord[1]},${coord[0]},0`)
            .join(' ');

        const kml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>Pori Datacenter Site Boundary</name>
    <description>Datacenter site boundary for Konepajanranta, Pori, Finland</description>
    <Placemark>
      <name>Site Boundary</name>
      <description>Phase I & II development area</description>
      <Polygon>
        <tessellate>1</tessellate>
        <outerBoundaryIs>
          <LinearRing>
            <coordinates>${kmlCoords} ${kmlCoords.split(' ')[0]}</coordinates>
          </LinearRing>
        </outerBoundaryIs>
      </Polygon>
    </Placemark>
  </Document>
</kml>`;

        this.downloadFile(kml, 'pori-datacenter-boundary.kml', 'application/vnd.google-earth.kml+xml');
        this.updateStatus('KML exported successfully');
    }

    exportWKT(): void {
        const wkt = this.drawingTools.getCurrentPolygonWKT();
        if (!wkt) {
            this.updateStatus('No polygon to export');
            return;
        }

        this.downloadFile(wkt, 'pori-datacenter-boundary.wkt', 'text/plain');
        this.updateStatus('WKT exported successfully');
    }

    exportCoordinates(): void {
        const coordinates = this.drawingTools.getCurrentPolygonCoordinates();
        if (!coordinates) {
            this.updateStatus('No polygon to export');
            return;
        }

        // Create CSV format
        const csv = 'latitude,longitude,point_order\n' +
            coordinates
                .map((coord, index) => `${coord[0]},${coord[1]},${index + 1}`)
                .join('\n');

        this.downloadFile(csv, 'pori-datacenter-coordinates.csv', 'text/csv');
        this.updateStatus('Coordinates exported as CSV');
    }

    // Utility methods
    private downloadFile(content: string, filename: string, mimeType: string): void {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up URL
        setTimeout(() => URL.revokeObjectURL(url), 100);
    }

    private updateStatus(message: string): void {
        const statusElement = document.getElementById('status-message');
        if (statusElement) {
            statusElement.textContent = message;
        }
        
        console.log('FileHandler:', message);
    }
}