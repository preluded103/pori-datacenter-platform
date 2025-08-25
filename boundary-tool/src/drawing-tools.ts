/**
 * Drawing Tools - Handles polygon drawing and editing using Leaflet.draw
 */

import { MapController } from './map-controller.js';

// Use global Leaflet from CDN
declare const L: any;

export class DrawingTools {
    private map: L.Map;
    private drawnItems: L.FeatureGroup;
    private drawControl: any = null;
    private currentPolygon: L.Polygon | null = null;
    private polygonChangeCallback: ((polygon: any) => void) | null = null;

    constructor(private mapController: MapController) {
        this.map = mapController.getMap()!;
        this.drawnItems = mapController.getDrawnItems();
        this.setupDrawControl();
        this.setupEventHandlers();
    }

    private setupDrawControl() {
        // Configure draw control options
        const drawOptions: any = {
            position: 'topright',
            draw: {
                polygon: {
                    allowIntersection: false,
                    showArea: true,
                    drawError: {
                        color: '#ef4444',
                        message: '<strong>Error:</strong> Shape edges cannot cross!'
                    },
                    shapeOptions: {
                        color: '#3b82f6',
                        fillColor: '#3b82f6',
                        fillOpacity: 0.2,
                        weight: 2
                    }
                },
                rectangle: {
                    shapeOptions: {
                        color: '#8b5cf6',
                        fillColor: '#8b5cf6',
                        fillOpacity: 0.2,
                        weight: 2
                    }
                },
                circle: false,
                circlemarker: false,
                marker: false,
                polyline: false
            },
            edit: {
                featureGroup: this.drawnItems,
                remove: true,
                edit: {
                    selectedPathOptions: {
                        maintainColor: true,
                        dashArray: '10,5'
                    }
                }
            }
        };

        this.drawControl = new (L.Control as any).Draw(drawOptions);
        this.map.addControl(this.drawControl);
    }

    private setupEventHandlers() {
        // Handle draw created events
        this.map.on('draw:created', (e: any) => {
            const { layerType, layer } = e;
            
            // Remove existing polygon if any
            this.deletePolygon();
            
            // Add new polygon
            this.drawnItems.addLayer(layer);
            this.currentPolygon = layer;
            
            // Convert to GeoJSON and notify listeners
            this.notifyPolygonChange();
            
            console.log(`Created ${layerType}:`, layer);
        });

        // Handle edit events
        this.map.on('draw:edited', () => {
            this.notifyPolygonChange();
            console.log('Polygon edited');
        });

        // Handle delete events
        this.map.on('draw:deleted', () => {
            this.currentPolygon = null;
            this.notifyPolygonChange();
            console.log('Polygon deleted');
        });

        // Handle draw start/stop for UI feedback
        this.map.on('draw:drawstart', () => {
            this.updateDrawingStatus('Drawing... Click points to create polygon. Double-click to finish.');
        });

        this.map.on('draw:drawstop', () => {
            this.updateDrawingStatus('Drawing completed.');
        });

        this.map.on('draw:editstart', () => {
            this.updateDrawingStatus('Editing mode active. Drag vertices to modify shape.');
        });

        this.map.on('draw:editstop', () => {
            this.updateDrawingStatus('Editing completed.');
        });
    }

    private notifyPolygonChange() {
        if (this.polygonChangeCallback) {
            const geoJson = this.getCurrentPolygonGeoJSON();
            this.polygonChangeCallback(geoJson);
        }
    }

    private updateDrawingStatus(message: string) {
        const statusElement = document.getElementById('status-message');
        if (statusElement) {
            statusElement.textContent = message;
        }
    }

    // Public methods
    enablePolygonDrawing() {
        // Trigger polygon draw mode
        const polygonButton = document.querySelector('.leaflet-draw-draw-polygon') as HTMLElement;
        if (polygonButton) {
            polygonButton.click();
        } else {
            console.warn('Polygon draw button not found');
        }
    }

    enableRectangleDrawing() {
        // Trigger rectangle draw mode
        const rectButton = document.querySelector('.leaflet-draw-draw-rectangle') as HTMLElement;
        if (rectButton) {
            rectButton.click();
        } else {
            console.warn('Rectangle draw button not found');
        }
    }

    enableEditing() {
        if (!this.currentPolygon) {
            this.updateDrawingStatus('No polygon to edit. Draw one first.');
            return;
        }

        // Trigger edit mode
        const editButton = document.querySelector('.leaflet-draw-edit-edit') as HTMLElement;
        if (editButton) {
            editButton.click();
        } else {
            console.warn('Edit button not found');
        }
    }

    deletePolygon() {
        if (this.currentPolygon) {
            this.drawnItems.removeLayer(this.currentPolygon);
            this.currentPolygon = null;
            this.notifyPolygonChange();
            this.updateDrawingStatus('Polygon deleted.');
        } else {
            this.updateDrawingStatus('No polygon to delete.');
        }
    }

    addPolygonFromCoordinates(coordinates: [number, number][], options?: L.PathOptions) {
        // Remove existing polygon
        this.deletePolygon();

        // Create polygon from coordinates
        const polygon = L.polygon(coordinates as L.LatLngExpression[], {
            color: options?.color || '#3b82f6',
            fillColor: options?.fillColor || '#3b82f6',
            fillOpacity: options?.fillOpacity || 0.2,
            weight: options?.weight || 2,
            dashArray: options?.dashArray
        });

        // Add to drawn items
        this.drawnItems.addLayer(polygon);
        this.currentPolygon = polygon;

        // Fit map to polygon bounds
        const bounds = polygon.getBounds();
        this.mapController.fitBounds(bounds, { padding: [20, 20] });

        // Notify change
        this.notifyPolygonChange();

        console.log('Polygon added from coordinates:', coordinates);
    }

    addPolygonFromGeoJSON(geoJson: any) {
        try {
            const layer = L.geoJSON(geoJson as any, {
                style: {
                    color: '#10b981',
                    fillColor: '#10b981',
                    fillOpacity: 0.2,
                    weight: 2
                }
            });

            // Remove existing polygon
            this.deletePolygon();

            // Add to drawn items
            layer.eachLayer((l: any) => {
                this.drawnItems.addLayer(l);
                if (l instanceof L.Polygon) {
                    this.currentPolygon = l;
                }
            });

            // Fit map to polygon bounds
            const bounds = layer.getBounds();
            this.mapController.fitBounds(bounds, { padding: [20, 20] });

            // Notify change
            this.notifyPolygonChange();

            this.updateDrawingStatus('Polygon imported from GeoJSON.');
            console.log('Polygon added from GeoJSON:', geoJson);

        } catch (error) {
            console.error('Error adding polygon from GeoJSON:', error);
            this.updateDrawingStatus('Error: Invalid GeoJSON format.');
        }
    }

    getCurrentPolygon(): L.Polygon | null {
        return this.currentPolygon;
    }

    getCurrentPolygonGeoJSON(): any {
        if (!this.currentPolygon) {
            return null;
        }

        try {
            // Convert to GeoJSON using Leaflet's toGeoJSON method
            const geoJson = this.currentPolygon.toGeoJSON();
            
            // Add properties
            geoJson.properties = {
                name: 'Datacenter Site Boundary',
                location: 'Konepajanranta, Pori, Finland',
                created: new Date().toISOString(),
                ...geoJson.properties
            };

            return geoJson;

        } catch (error) {
            console.error('Error converting to GeoJSON:', error);
            return null;
        }
    }

    getCurrentPolygonCoordinates(): [number, number][] | null {
        if (!this.currentPolygon) {
            return null;
        }

        try {
            const latlngs = this.currentPolygon.getLatLngs()[0] as L.LatLng[];
            return latlngs.map(latlng => [latlng.lat, latlng.lng]);
        } catch (error) {
            console.error('Error getting coordinates:', error);
            return null;
        }
    }

    getCurrentPolygonWKT(): string | null {
        const coordinates = this.getCurrentPolygonCoordinates();
        if (!coordinates) {
            return null;
        }

        try {
            // Convert to WKT format: POLYGON((lon lat, lon lat, ...))
            const wktCoords = coordinates.map(coord => `${coord[1]} ${coord[0]}`).join(', ');
            // Close the polygon by repeating first coordinate
            const firstCoord = coordinates[0];
            const wkt = `POLYGON((${wktCoords}, ${firstCoord[1]} ${firstCoord[0]}))`;
            
            return wkt;
        } catch (error) {
            console.error('Error creating WKT:', error);
            return null;
        }
    }

    // Validation methods
    validatePolygon(): { valid: boolean; errors: string[] } {
        const polygon = this.getCurrentPolygonGeoJSON();
        const errors: string[] = [];

        if (!polygon) {
            return { valid: false, errors: ['No polygon defined'] };
        }

        try {
            // Use Turf.js for validation if available
            const turf = (window as any).turf;
            
            if (turf) {
                // Check for self-intersection
                const kinks = turf.kinks(polygon);
                if (kinks.features.length > 0) {
                    errors.push('Polygon has self-intersections');
                }

                // Check minimum area (1 hectare = 10,000 m²)
                const area = turf.area(polygon);
                if (area < 10000) {
                    errors.push('Polygon area is too small (minimum 1 hectare)');
                }

                // Check maximum area (reasonable limit)
                if (area > 1000000) {
                    errors.push('Polygon area is too large (maximum 100 hectares)');
                }

                // Check minimum vertices
                const coords = polygon.geometry.coordinates[0];
                if (coords.length < 4) {
                    errors.push('Polygon must have at least 3 vertices');
                }
            }

            return { valid: errors.length === 0, errors };

        } catch (error) {
            console.error('Validation error:', error);
            return { valid: false, errors: ['Validation failed: ' + error] };
        }
    }

    // Event callback registration
    onPolygonChange(callback: (polygon: any) => void) {
        this.polygonChangeCallback = callback;
    }
}