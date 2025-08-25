export class MapController {
    constructor(containerId, siteCenter) {
        this.containerId = containerId;
        this.map = null;
        this.baseLayers = {};
        this.overlayLayers = {};
        this.gridLayer = null;
        this.onMouseMoveCallback = null;
        this.siteCenter = siteCenter;
        this.drawnItems = new L.FeatureGroup();
    }
    async initialize() {
        return new Promise((resolve, reject) => {
            try {
                this.map = L.map(this.containerId, {
                    center: this.siteCenter,
                    zoom: 16,
                    zoomControl: true,
                    attributionControl: true
                });
                this.setupBaseLayers();
                this.setupOverlayLayers();
                this.map.addLayer(this.drawnItems);
                this.setupMapEvents();
                this.addReferenceMarkers();
                console.log('🗺️ Map initialized');
                resolve();
            }
            catch (error) {
                console.error('Map initialization error:', error);
                reject(error);
            }
        });
    }
    setupBaseLayers() {
        if (!this.map)
            return;
        this.baseLayers['OpenStreetMap'] = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap contributors'
        });
        this.baseLayers['Satellite'] = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            maxZoom: 18,
            attribution: 'Tiles © Esri'
        });
        this.baseLayers['Terrain'] = L.tileLayer('https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png', {
            maxZoom: 18,
            attribution: 'Map data: © OpenStreetMap, Style: © CyclOSM'
        });
        this.baseLayers['OpenStreetMap'].addTo(this.map);
    }
    setupOverlayLayers() {
        if (!this.map)
            return;
        this.createGridLayer();
        this.createPowerInfrastructureLayer();
        this.createRiverLayer();
    }
    createGridLayer() {
        if (!this.map)
            return;
        const gridLines = [];
        const bounds = this.map.getBounds();
        const step = 0.001;
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
        this.overlayLayers['Coordinate Grid'] = this.gridLayer;
    }
    createPowerInfrastructureLayer() {
        if (!this.map)
            return;
        const substations = [
            { name: 'Isosannan Sähköasema', coords: [61.4886, 21.8052], capacity: '120 MVA', distance: '1.03 km' },
            { name: 'Herralahden Substation', coords: [61.4922, 21.8105], capacity: '80 MVA', distance: '1.29 km' },
            { name: 'Impolan Substation', coords: [61.4654, 21.8284], capacity: '60 MVA', distance: '3.43 km' },
            { name: 'Hyvelän Substation', coords: [61.4523, 21.8401], capacity: '40 MVA', distance: '4.17 km' }
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
    createRiverLayer() {
        if (!this.map)
            return;
        const riverPath = [
            [61.492, 21.78], [61.489, 21.785], [61.486, 21.79],
            [61.483, 21.795], [61.48, 21.8], [61.477, 21.805],
            [61.474, 21.81], [61.471, 21.815]
        ];
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
    addReferenceMarkers() {
        if (!this.map)
            return;
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
    setupMapEvents() {
        if (!this.map)
            return;
        this.map.on('mousemove', (e) => {
            this.onMouseMoveCallback && this.onMouseMoveCallback(e.latlng);
        });
        this.map.on('zoomend', () => {
            if (this.map?.hasLayer(this.gridLayer)) {
                this.updateGrid();
            }
        });
        this.map.on('moveend', () => {
            if (this.map?.hasLayer(this.gridLayer)) {
                this.updateGrid();
            }
        });
    }
    updateGrid() {
        if (!this.map || !this.gridLayer)
            return;
        this.map.removeLayer(this.gridLayer);
        this.createGridLayer();
        if (this.overlayLayers['Coordinate Grid']) {
            this.map.addLayer(this.gridLayer);
        }
    }
    getMap() {
        return this.map;
    }
    getDrawnItems() {
        return this.drawnItems;
    }
    zoomToSite() {
        if (!this.map)
            return;
        this.map.setView(this.siteCenter, 16);
    }
    toggleSatelliteLayer() {
        if (!this.map)
            return;
        const osmLayer = this.baseLayers['OpenStreetMap'];
        const satelliteLayer = this.baseLayers['Satellite'];
        if (this.map.hasLayer(satelliteLayer)) {
            this.map.removeLayer(satelliteLayer);
            this.map.addLayer(osmLayer);
        }
        else {
            this.map.removeLayer(osmLayer);
            this.map.addLayer(satelliteLayer);
        }
    }
    toggleGridLayer() {
        if (!this.map || !this.gridLayer)
            return;
        if (this.map.hasLayer(this.gridLayer)) {
            this.map.removeLayer(this.gridLayer);
        }
        else {
            this.map.addLayer(this.gridLayer);
        }
    }
    addLayer(layer) {
        if (!this.map)
            return;
        layer.addTo(this.map);
    }
    removeLayer(layer) {
        if (!this.map)
            return;
        this.map.removeLayer(layer);
    }
    fitBounds(bounds, options) {
        if (!this.map)
            return;
        this.map.fitBounds(bounds, options);
    }
    onMouseMove(callback) {
        this.onMouseMoveCallback = callback;
    }
}
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
//# sourceMappingURL=map-controller.js.map