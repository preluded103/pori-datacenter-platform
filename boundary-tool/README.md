# Pori Datacenter Site Boundary Definition Tool

Interactive TypeScript/HTML5 application for defining and managing datacenter site boundaries in Pori, Finland.

## Features

- **Interactive Map**: Leaflet.js-based mapping with multiple base layers (OpenStreetMap, Satellite, Terrain)
- **Polygon Drawing**: Draw polygons and rectangles to define site boundaries
- **File Import/Export**: Support for multiple formats:
  - GeoJSON (.json, .geojson)
  - KML/KMZ (.kml, .kmz)
  - GPX (.gpx)  
  - CSV coordinates (.csv)
  - WKT (Well-Known Text) format
- **Real-time Analysis**: Area calculation, perimeter, vertex count
- **Phase Planning**: Visual indicators for Phase I and Phase II development requirements
- **Professional UI**: Dark tech theme optimized for technical work

## Site Specifications

- **Location**: Konepajanranta, Pori, Finland
- **Estimated Center**: 61.4945°N, 21.810°E
- **Target Area**: 150,000 m² (15 hectares)
- **Phase I**: 60,000-70,000 m² (6-7 hectares)
- **Phase II**: 90,000 m² (9 hectares)

## Quick Start

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Build TypeScript**:
   ```bash
   npm run build
   ```

3. **Start development server**:
   ```bash
   npm run serve
   ```

4. **Open in browser**:
   ```
   http://localhost:8000
   ```

## Usage

### Drawing Boundaries
1. Click **"Draw Polygon"** to start drawing
2. Click points on the map to create polygon vertices
3. Double-click to finish the polygon
4. Use **"Edit Shape"** to modify existing boundaries
5. Use **"Delete Shape"** to remove boundaries

### Importing Data
- **Drag & Drop**: Drag files directly onto the drop zone
- **Browse Files**: Click to select files from your computer
- **WKT Import**: Paste WKT text directly into the text area

### Exporting Data
- **GeoJSON**: Standard geospatial JSON format
- **KML**: Google Earth compatible format
- **WKT**: Well-Known Text for GIS applications
- **CSV**: Coordinate list for spreadsheet applications

### Map Controls
- **🎯 Zoom to Site**: Center map on the estimated datacenter location
- **🛰️ Toggle Satellite**: Switch between map and satellite imagery
- **# Toggle Grid**: Show/hide coordinate grid overlay

## Infrastructure Context

The tool includes reference data from previous analysis:

- **Power Infrastructure**: Nearby substations with capacity and distance
- **Kokemäenjoki River**: Cooling water source with flow specifications
- **Transportation**: Rail and port access for equipment delivery

## Development

### Project Structure
```
boundary-tool/
├── src/                    # TypeScript source files
│   ├── main.ts            # Application orchestrator
│   ├── map-controller.ts  # Leaflet map management
│   ├── drawing-tools.ts   # Polygon drawing functionality
│   ├── file-handler.ts    # Import/export handlers
│   └── location-guesser.ts # Site boundary estimation
├── styles/
│   └── app.css           # Dark tech theme styles
├── dist/                 # Compiled JavaScript
└── index.html           # Main application page
```

### Build Scripts
- `npm run build` - Compile TypeScript to JavaScript
- `npm run dev` - Watch mode for development
- `npm run serve` - Start local HTTP server
- `npm start` - Build and serve in one command

## Technical Requirements

- Modern web browser with ES2020 support
- Local HTTP server (included via Python)
- Internet connection for map tiles and CDN resources

## API Dependencies

- **Leaflet.js**: Interactive mapping library
- **Leaflet.draw**: Polygon drawing and editing
- **Turf.js**: Geospatial analysis and calculations

## Coordinate Systems

- **Display**: WGS84 (EPSG:4326) for Leaflet compatibility  
- **Reference**: ETRS89/TM35FIN (EPSG:3067) Finnish national grid
- **Input/Output**: Supports both coordinate systems

## Browser Compatibility

- Chrome/Edge: Full support
- Firefox: Full support  
- Safari: Full support
- Mobile browsers: Responsive design included

## License

MIT License - See package.json for details

---

🏢 **Datacenter Site Analysis Tool** - Built for precision site planning and boundary definition.