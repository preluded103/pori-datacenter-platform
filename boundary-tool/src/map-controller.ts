/**
 * Map Controller - Handles Leaflet map initialization and management
 */

// Use global Leaflet from CDN
declare const L: any;

export class MapController {
    private map: L.Map | null = null;
    private siteCenter: [number, number];
    private baseLayers: { [key: string]: L.TileLayer } = {};
    private overlayLayers: { [key: string]: L.Layer } = {};
    private gridLayer: L.Layer | null = null;
    private drawnItems: L.FeatureGroup;

    constructor(private containerId: string, siteCenter: [number, number]) {
        this.siteCenter = siteCenter;
        this.drawnItems = new L.FeatureGroup();
    }

    async initialize(): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                // Initialize map
                this.map = L.map(this.containerId, {
                    center: this.siteCenter,
                    zoom: 16,
                    zoomControl: true,
                    attributionControl: true
                });

                // Set up base layers
                this.setupBaseLayers();
                
                // Set up overlay layers
                this.setupOverlayLayers();
                
                // Add drawn items layer
                this.map!.addLayer(this.drawnItems);
                
                // Set up events
                this.setupMapEvents();

                // Add reference markers
                this.addReferenceMarkers();

                console.log('🗺️ Map initialized');
                resolve();

            } catch (error) {
                console.error('Map initialization error:', error);
                reject(error);
            }
        });
    }

    private setupBaseLayers() {
        if (!this.map) return;

        // OpenStreetMap
        this.baseLayers['OpenStreetMap'] = L.tileLayer(
            'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            {
                maxZoom: 19,
                attribution: '© OpenStreetMap contributors'
            }
        );

        // Satellite (using ESRI)
        this.baseLayers['Satellite'] = L.tileLayer(
            'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            {
                maxZoom: 18,
                attribution: 'Tiles © Esri'
            }
        );

        // Terrain
        this.baseLayers['Terrain'] = L.tileLayer(
            'https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png',
            {
                maxZoom: 18,
                attribution: 'Map data: © OpenStreetMap, Style: © CyclOSM'
            }
        );

        // Add default layer (OpenStreetMap)
        this.baseLayers['OpenStreetMap'].addTo(this.map);

        // Layer control removed - using custom controls instead
    }

    private setupOverlayLayers() {
        if (!this.map) return;

        // Create grid layer (but don't add by default)
        this.createGridLayer();

        // Power infrastructure layer (from our previous analysis)
        this.createPowerInfrastructureLayer();
        
        // River layer
        this.createRiverLayer();
    }

    private createGridLayer() {
        if (!this.map) return;

        const gridLines: L.Polyline[] = [];
        const bounds = this.map.getBounds();
        const step = 0.001; // ~100m grid

        // Create latitude lines
        for (let lat = Math.floor(bounds.getSouth() / step) * step; lat <= bounds.getNorth(); lat += step) {
            const line = L.polyline([
                [lat, bounds.getWest()],
                [lat, bounds.getEast()]
            ], {
                color: '#666',
                weight: 1,
                opacity: 0.3
            });
            gridLines.push(line);
        }

        // Create longitude lines
        for (let lng = Math.floor(bounds.getWest() / step) * step; lng <= bounds.getEast(); lng += step) {
            const line = L.polyline([
                [bounds.getSouth(), lng],
                [bounds.getNorth(), lng]
            ], {
                color: '#666',
                weight: 1,
                opacity: 0.3
            });
            gridLines.push(line);
        }

        this.gridLayer = L.layerGroup(gridLines);
        this.overlayLayers['Coordinate Grid'] = this.gridLayer as any;
    }

    private createPowerInfrastructureLayer() {
        if (!this.map) return;

        // Substations from our previous analysis
        const substations = [
            { name: 'Isosannan Sähköasema', coords: [61.4886, 21.8052] as [number, number], capacity: '120 MVA', distance: '1.03 km' },
            { name: 'Herralahden Substation', coords: [61.4922, 21.8105] as [number, number], capacity: '80 MVA', distance: '1.29 km' },
            { name: 'Impolan Substation', coords: [61.4654, 21.8284] as [number, number], capacity: '60 MVA', distance: '3.43 km' },
            { name: 'Hyvelän Substation', coords: [61.4523, 21.8401] as [number, number], capacity: '40 MVA', distance: '4.17 km' }
        ];

        const powerMarkers = substations.map(sub => {
            const color = parseFloat(sub.distance) <= 1.5 ? 'green' : parseFloat(sub.distance) <= 3.0 ? 'orange' : 'red';
            
            return L.circleMarker(sub.coords, {
                radius: 8,
                fillColor: color,
                color: '#000',
                weight: 2,
                opacity: 1,
                fillOpacity: 0.8
            }).bindPopup(`
                <b>${sub.name}</b><br>
                Capacity: ${sub.capacity}<br>
                Distance: ${sub.distance}<br>
                Feasibility: ${parseFloat(sub.distance) <= 1.5 ? 'HIGH' : parseFloat(sub.distance) <= 3.0 ? 'MEDIUM' : 'LOW'}
            `);
        });

        this.overlayLayers['Power Infrastructure'] = L.layerGroup(powerMarkers);
    }

    private createRiverLayer() {
        if (!this.map) return;

        // Approximate Kokemäenjoki river path near the site
        const riverPath = [
            [61.492, 21.78], [61.489, 21.785], [61.486, 21.79], 
            [61.483, 21.795], [61.48, 21.8], [61.477, 21.805],
            [61.474, 21.81], [61.471, 21.815]
        ] as [number, number][];

        const riverLine = L.polyline(riverPath, {
            color: '#1976d2',
            weight: 8,
            opacity: 0.8
        }).bindPopup(`
            <b>Kokemäenjoki River</b><br>
            Cooling water source<br>
            Flow rate: ~300 m³/s<br>
            Temperature: 2-24°C seasonal
        `);

        this.overlayLayers['Kokemäenjoki River'] = L.layerGroup([riverLine]);
    }

    private addReferenceMarkers() {
        if (!this.map) return;

        // Site center marker
        const siteMarker = L.marker(this.siteCenter, {
            icon: L.divIcon({
                className: 'site-center-marker',
                html: '🎯',
                iconSize: [24, 24],
                iconAnchor: [12, 12]
            })
        }).bindPopup(`
            <b>Estimated Site Center</b><br>
            Konepajanranta, Pori<br>
            ${this.siteCenter[0].toFixed(6)}, ${this.siteCenter[1].toFixed(6)}
        `);

        siteMarker.addTo(this.map);
    }

    private setupMapEvents() {
        if (!this.map) return;

        // Mouse move for coordinate display
        this.map.on('mousemove', (e: L.LeafletMouseEvent) => {
            this.onMouseMoveCallback && this.onMouseMoveCallback(e.latlng);
        });

        // Zoom events
        this.map.on('zoomend', () => {
            // Update grid if visible
            if (this.map?.hasLayer(this.gridLayer!)) {
                this.updateGrid();
            }
        });

        // Move events
        this.map.on('moveend', () => {
            // Update grid if visible
            if (this.map?.hasLayer(this.gridLayer!)) {
                this.updateGrid();
            }
        });
    }

    private updateGrid() {
        if (!this.map || !this.gridLayer) return;

        // Remove old grid
        this.map.removeLayer(this.gridLayer);
        
        // Recreate grid with current bounds
        this.createGridLayer();
        
        // Add new grid if it was visible
        if (this.overlayLayers['Coordinate Grid']) {
            this.map.addLayer(this.gridLayer!);
        }
    }

    // Public methods
    getMap(): L.Map | null {
        return this.map;
    }

    getDrawnItems(): L.FeatureGroup {
        return this.drawnItems;
    }

    zoomToSite() {
        if (!this.map) return;
        this.map.setView(this.siteCenter, 16);
    }

    toggleSatelliteLayer() {
        if (!this.map) return;

        const osmLayer = this.baseLayers['OpenStreetMap'];
        const satelliteLayer = this.baseLayers['Satellite'];

        if (this.map.hasLayer(satelliteLayer)) {
            this.map.removeLayer(satelliteLayer);
            this.map.addLayer(osmLayer);
        } else {
            this.map.removeLayer(osmLayer);
            this.map.addLayer(satelliteLayer);
        }
    }

    toggleGridLayer() {
        if (!this.map || !this.gridLayer) return;

        if (this.map.hasLayer(this.gridLayer)) {
            this.map.removeLayer(this.gridLayer);
        } else {
            this.map.addLayer(this.gridLayer);
        }
    }

    addLayer(layer: L.Layer) {
        if (!this.map) return;
        layer.addTo(this.map);
    }

    removeLayer(layer: L.Layer) {
        if (!this.map) return;
        this.map.removeLayer(layer);
    }

    fitBounds(bounds: L.LatLngBounds, options?: L.FitBoundsOptions) {
        if (!this.map) return;
        this.map.fitBounds(bounds, options);
    }

    // Event callbacks
    private onMouseMoveCallback: ((coords: L.LatLng) => void) | null = null;

    onMouseMove(callback: (coords: L.LatLng) => void) {
        this.onMouseMoveCallback = callback;
    }
}

// Add custom CSS for markers
const style = document.createElement('style');
style.textContent = `
    .site-center-marker {
        background: transparent;
        border: none;
        font-size: 24px;
        text-align: center;
        line-height: 24px;
        text-shadow: 0 0 3px rgba(0,0,0,0.5);
    }
`;
document.head.appendChild(style);