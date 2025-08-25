/**
 * Pori Datacenter Site Boundary Definition Tool
 * Main application entry point
 */

import { MapController } from './map-controller.js';
import { DrawingTools } from './drawing-tools.js';
import { FileHandler } from './file-handler.js';
import { LocationGuesser } from './location-guesser.js';

interface AppConfig {
    siteCenter: [number, number];
    targetArea: number; // m²
    phaseAreas: {
        phase1: { min: number; max: number };
        phase2: number;
    };
}

class PoriBoundaryApp {
    private mapController!: MapController;
    private drawingTools!: DrawingTools;
    private fileHandler!: FileHandler;
    private locationGuesser!: LocationGuesser;
    
    private config: AppConfig = {
        siteCenter: [61.4945, 21.810], // Educated guess from research
        targetArea: 150000, // 15 hectares
        phaseAreas: {
            phase1: { min: 60000, max: 70000 }, // 6-7 hectares
            phase2: 90000 // 9 hectares
        }
    };

    constructor() {
        this.initializeApp();
    }

    private async initializeApp() {
        try {
            // Initialize map first
            this.mapController = new MapController('map', this.config.siteCenter);
            
            // Wait for map to be ready
            await this.mapController.initialize();
            
            // Initialize other components
            this.locationGuesser = new LocationGuesser(this.config);
            this.drawingTools = new DrawingTools(this.mapController);
            this.fileHandler = new FileHandler(this.mapController, this.drawingTools);
            
            // Set up initial site guess
            this.setupInitialSite();
            
            // Bind UI events
            this.bindUIEvents();
            
            // Setup mouse coordinate tracking
            this.setupCoordinateTracking();
            
            // Update status
            this.updateStatus('Ready. Click "Draw Polygon" to define site boundary.');
            
            console.log('🏢 Pori Datacenter Boundary Tool initialized');
            
        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.updateStatus('Error: Failed to initialize application');
        }
    }

    private setupInitialSite() {
        // Create initial rectangular boundary guess
        const initialBoundary = this.locationGuesser.generateInitialBoundary();
        
        if (initialBoundary) {
            this.drawingTools.addPolygonFromCoordinates(initialBoundary, {
                color: '#3b82f6',
                fillColor: '#3b82f6',
                fillOpacity: 0.2,
                weight: 2,
                dashArray: '5,5'
            });
            
            // Update UI to show initial guess
            this.updateStatus('Initial site boundary loaded. Edit as needed.');
            this.updateCenterCoordinates(this.config.siteCenter);
        }
    }

    private bindUIEvents() {
        // Drawing tool buttons
        document.getElementById('draw-polygon')?.addEventListener('click', () => {
            this.drawingTools.enablePolygonDrawing();
        });

        document.getElementById('draw-rectangle')?.addEventListener('click', () => {
            this.drawingTools.enableRectangleDrawing();
        });

        document.getElementById('edit-polygon')?.addEventListener('click', () => {
            this.drawingTools.enableEditing();
        });

        document.getElementById('delete-polygon')?.addEventListener('click', () => {
            this.drawingTools.deletePolygon();
        });

        // Map control buttons
        document.getElementById('zoom-to-site')?.addEventListener('click', () => {
            this.mapController.zoomToSite();
        });

        document.getElementById('toggle-satellite')?.addEventListener('click', (e) => {
            const button = e.target as HTMLElement;
            this.mapController.toggleSatelliteLayer();
            button.style.opacity = button.style.opacity === '0.6' ? '1' : '0.6';
        });

        document.getElementById('toggle-grid')?.addEventListener('click', (e) => {
            const button = e.target as HTMLElement;
            this.mapController.toggleGridLayer();
            button.style.opacity = button.style.opacity === '0.6' ? '1' : '0.6';
        });

        // File handling
        document.getElementById('browse-files')?.addEventListener('click', () => {
            document.getElementById('file-input')?.click();
        });

        document.getElementById('file-input')?.addEventListener('change', (e) => {
            const input = e.target as HTMLInputElement;
            if (input.files && input.files[0]) {
                this.fileHandler.importFile(input.files[0]);
            }
        });

        document.getElementById('import-wkt')?.addEventListener('click', () => {
            const textarea = document.getElementById('wkt-input') as HTMLTextAreaElement;
            if (textarea.value.trim()) {
                this.fileHandler.importWKT(textarea.value);
            }
        });

        // Export buttons
        document.getElementById('export-geojson')?.addEventListener('click', () => {
            this.fileHandler.exportGeoJSON();
        });

        document.getElementById('export-kml')?.addEventListener('click', () => {
            this.fileHandler.exportKML();
        });

        document.getElementById('export-wkt')?.addEventListener('click', () => {
            this.fileHandler.exportWKT();
        });

        document.getElementById('export-coords')?.addEventListener('click', () => {
            this.fileHandler.exportCoordinates();
        });

        // Set up drag and drop
        this.setupDragDrop();

        // Listen for polygon changes
        this.drawingTools.onPolygonChange((polygon) => {
            this.updateAreaAnalysis(polygon);
        });
    }

    private setupDragDrop() {
        const dropZone = document.getElementById('drop-zone');
        
        if (!dropZone) return;

        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('drag-over');
        });

        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('drag-over');
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
            
            const files = e.dataTransfer?.files;
            if (files && files[0]) {
                this.fileHandler.importFile(files[0]);
            }
        });
    }

    private setupCoordinateTracking() {
        this.mapController.onMouseMove((coords) => {
            const mouseCoords = document.getElementById('mouse-coords');
            if (mouseCoords) {
                mouseCoords.textContent = `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`;
            }
        });
    }

    private updateAreaAnalysis(polygon: any) {
        if (!polygon) {
            this.clearAreaAnalysis();
            return;
        }

        try {
            // Calculate area using Turf.js
            const area = (window as any).turf.area(polygon);
            const perimeter = (window as any).turf.length(polygon.geometry, { units: 'meters' });
            const coordinates = polygon.geometry.coordinates[0];
            const vertexCount = coordinates.length - 1; // Subtract 1 for closed polygon

            // Update UI
            this.updateElement('total-area', `${Math.round(area).toLocaleString()} m²`);
            this.updateElement('area-hectares', `${(area / 10000).toFixed(2)} ha`);
            this.updateElement('perimeter', `${Math.round(perimeter).toLocaleString()} m`);
            this.updateElement('vertex-count', vertexCount.toString());

            // Update area display in header
            this.updateElement('area-display', `Area: ${Math.round(area).toLocaleString()} m²`);

            // Update phase indicators
            this.updatePhaseIndicators(area);

            // Validate area
            this.validateArea(area);

        } catch (error) {
            console.error('Error calculating area:', error);
            this.clearAreaAnalysis();
        }
    }

    private updatePhaseIndicators(area: number) {
        const { phase1, phase2 } = this.config.phaseAreas;
        
        // Phase I percentage (based on minimum requirement)
        const phase1Percent = Math.min((area / phase1.min) * 100, 100);
        this.updateElement('phase1-percent', `${Math.round(phase1Percent)}%`);
        const phase1Fill = document.getElementById('phase1-fill');
        if (phase1Fill) {
            phase1Fill.style.width = `${phase1Percent}%`;
        }

        // Phase II percentage (based on combined requirement)
        const totalRequired = phase1.max + phase2;
        const phase2Percent = Math.min((area / totalRequired) * 100, 100);
        this.updateElement('phase2-percent', `${Math.round(phase2Percent)}%`);
        const phase2Fill = document.getElementById('phase2-fill');
        if (phase2Fill) {
            phase2Fill.style.width = `${phase2Percent}%`;
        }
    }

    private validateArea(area: number) {
        const { phase1, phase2 } = this.config.phaseAreas;
        
        if (area < phase1.min) {
            this.updateStatus(`⚠️ Area too small for Phase I (need ${(phase1.min / 10000).toFixed(1)} ha)`);
        } else if (area < (phase1.max + phase2)) {
            this.updateStatus(`✅ Suitable for Phase I. Need ${((phase1.max + phase2 - area) / 10000).toFixed(1)} ha more for Phase II`);
        } else {
            this.updateStatus(`✅ Excellent! Suitable for both Phase I and Phase II development`);
        }
    }

    private clearAreaAnalysis() {
        this.updateElement('total-area', '-- m²');
        this.updateElement('area-hectares', '-- ha');
        this.updateElement('perimeter', '-- m');
        this.updateElement('vertex-count', '--');
        this.updateElement('area-display', 'Area: -- m²');
        
        // Reset phase indicators
        this.updateElement('phase1-percent', '0%');
        this.updateElement('phase2-percent', '0%');
        
        const fills = ['phase1-fill', 'phase2-fill'];
        fills.forEach(id => {
            const fill = document.getElementById(id);
            if (fill) fill.style.width = '0';
        });
    }

    private updateCenterCoordinates(coords: [number, number]) {
        this.updateElement('center-coords', `${coords[0].toFixed(4)}, ${coords[1].toFixed(4)}`);
    }

    private updateStatus(message: string) {
        this.updateElement('status-message', message);
    }

    private updateElement(id: string, content: string) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = content;
        }
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PoriBoundaryApp();
});

// Export for debugging
(window as any).PoriBoundaryApp = PoriBoundaryApp;