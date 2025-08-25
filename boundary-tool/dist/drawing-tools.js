export class DrawingTools {
    constructor(mapController) {
        this.mapController = mapController;
        this.drawControl = null;
        this.currentPolygon = null;
        this.polygonChangeCallback = null;
        this.map = mapController.getMap();
        this.drawnItems = mapController.getDrawnItems();
        this.setupDrawControl();
        this.setupEventHandlers();
    }
    setupDrawControl() {
        const drawOptions = {
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
        this.drawControl = new L.Control.Draw(drawOptions);
        this.map.addControl(this.drawControl);
    }
    setupEventHandlers() {
        this.map.on('draw:created', (e) => {
            const { layerType, layer } = e;
            this.deletePolygon();
            this.drawnItems.addLayer(layer);
            this.currentPolygon = layer;
            this.notifyPolygonChange();
            console.log(`Created ${layerType}:`, layer);
        });
        this.map.on('draw:edited', () => {
            this.notifyPolygonChange();
            console.log('Polygon edited');
        });
        this.map.on('draw:deleted', () => {
            this.currentPolygon = null;
            this.notifyPolygonChange();
            console.log('Polygon deleted');
        });
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
    notifyPolygonChange() {
        if (this.polygonChangeCallback) {
            const geoJson = this.getCurrentPolygonGeoJSON();
            this.polygonChangeCallback(geoJson);
        }
    }
    updateDrawingStatus(message) {
        const statusElement = document.getElementById('status-message');
        if (statusElement) {
            statusElement.textContent = message;
        }
    }
    enablePolygonDrawing() {
        const polygonButton = document.querySelector('.leaflet-draw-draw-polygon');
        if (polygonButton) {
            polygonButton.click();
        }
        else {
            console.warn('Polygon draw button not found');
        }
    }
    enableRectangleDrawing() {
        const rectButton = document.querySelector('.leaflet-draw-draw-rectangle');
        if (rectButton) {
            rectButton.click();
        }
        else {
            console.warn('Rectangle draw button not found');
        }
    }
    enableEditing() {
        if (!this.currentPolygon) {
            this.updateDrawingStatus('No polygon to edit. Draw one first.');
            return;
        }
        const editButton = document.querySelector('.leaflet-draw-edit-edit');
        if (editButton) {
            editButton.click();
        }
        else {
            console.warn('Edit button not found');
        }
    }
    deletePolygon() {
        if (this.currentPolygon) {
            this.drawnItems.removeLayer(this.currentPolygon);
            this.currentPolygon = null;
            this.notifyPolygonChange();
            this.updateDrawingStatus('Polygon deleted.');
        }
        else {
            this.updateDrawingStatus('No polygon to delete.');
        }
    }
    addPolygonFromCoordinates(coordinates, options) {
        this.deletePolygon();
        const polygon = L.polygon(coordinates, {
            color: options?.color || '#3b82f6',
            fillColor: options?.fillColor || '#3b82f6',
            fillOpacity: options?.fillOpacity || 0.2,
            weight: options?.weight || 2,
            dashArray: options?.dashArray
        });
        this.drawnItems.addLayer(polygon);
        this.currentPolygon = polygon;
        const bounds = polygon.getBounds();
        this.mapController.fitBounds(bounds, { padding: [20, 20] });
        this.notifyPolygonChange();
        console.log('Polygon added from coordinates:', coordinates);
    }
    addPolygonFromGeoJSON(geoJson) {
        try {
            const layer = L.geoJSON(geoJson, {
                style: {
                    color: '#10b981',
                    fillColor: '#10b981',
                    fillOpacity: 0.2,
                    weight: 2
                }
            });
            this.deletePolygon();
            layer.eachLayer((l) => {
                this.drawnItems.addLayer(l);
                if (l instanceof L.Polygon) {
                    this.currentPolygon = l;
                }
            });
            const bounds = layer.getBounds();
            this.mapController.fitBounds(bounds, { padding: [20, 20] });
            this.notifyPolygonChange();
            this.updateDrawingStatus('Polygon imported from GeoJSON.');
            console.log('Polygon added from GeoJSON:', geoJson);
        }
        catch (error) {
            console.error('Error adding polygon from GeoJSON:', error);
            this.updateDrawingStatus('Error: Invalid GeoJSON format.');
        }
    }
    getCurrentPolygon() {
        return this.currentPolygon;
    }
    getCurrentPolygonGeoJSON() {
        if (!this.currentPolygon) {
            return null;
        }
        try {
            const geoJson = this.currentPolygon.toGeoJSON();
            geoJson.properties = {
                name: 'Datacenter Site Boundary',
                location: 'Konepajanranta, Pori, Finland',
                created: new Date().toISOString(),
                ...geoJson.properties
            };
            return geoJson;
        }
        catch (error) {
            console.error('Error converting to GeoJSON:', error);
            return null;
        }
    }
    getCurrentPolygonCoordinates() {
        if (!this.currentPolygon) {
            return null;
        }
        try {
            const latlngs = this.currentPolygon.getLatLngs()[0];
            return latlngs.map(latlng => [latlng.lat, latlng.lng]);
        }
        catch (error) {
            console.error('Error getting coordinates:', error);
            return null;
        }
    }
    getCurrentPolygonWKT() {
        const coordinates = this.getCurrentPolygonCoordinates();
        if (!coordinates) {
            return null;
        }
        try {
            const wktCoords = coordinates.map(coord => `${coord[1]} ${coord[0]}`).join(', ');
            const firstCoord = coordinates[0];
            const wkt = `POLYGON((${wktCoords}, ${firstCoord[1]} ${firstCoord[0]}))`;
            return wkt;
        }
        catch (error) {
            console.error('Error creating WKT:', error);
            return null;
        }
    }
    validatePolygon() {
        const polygon = this.getCurrentPolygonGeoJSON();
        const errors = [];
        if (!polygon) {
            return { valid: false, errors: ['No polygon defined'] };
        }
        try {
            const turf = window.turf;
            if (turf) {
                const kinks = turf.kinks(polygon);
                if (kinks.features.length > 0) {
                    errors.push('Polygon has self-intersections');
                }
                const area = turf.area(polygon);
                if (area < 10000) {
                    errors.push('Polygon area is too small (minimum 1 hectare)');
                }
                if (area > 1000000) {
                    errors.push('Polygon area is too large (maximum 100 hectares)');
                }
                const coords = polygon.geometry.coordinates[0];
                if (coords.length < 4) {
                    errors.push('Polygon must have at least 3 vertices');
                }
            }
            return { valid: errors.length === 0, errors };
        }
        catch (error) {
            console.error('Validation error:', error);
            return { valid: false, errors: ['Validation failed: ' + error] };
        }
    }
    onPolygonChange(callback) {
        this.polygonChangeCallback = callback;
    }
}
//# sourceMappingURL=drawing-tools.js.map