# PORI DATACENTER VISUALIZATION PACKAGE
## Technical Design Specification

### VISUALIZATION PHILOSOPHY (Tufte Principles)

**Data-Ink Maximization:**
- Every pixel serves analytical purpose
- Eliminate chartjunk and decorative elements
- Maximize information density per visual unit
- Use small multiples for comparative analysis

**High Data Density Graphics:**
- Multiple constraint layers in single views
- Sparklines for temporal data (power, costs, timelines)
- Integrated annotations with quantitative detail
- Color coding based on engineering significance

---

## VISUALIZATION STACK ARCHITECTURE

### PRIMARY LIBRARIES SELECTED:

#### 1. **Folium + LeafletJS** (Interactive Maps)
```python
import folium
from folium import plugins
```
- **Use Case**: Constraint overlay mapping with technical precision
- **Advantages**: Leaflet.js backbone, tile layer flexibility, plugin ecosystem
- **Features**: Heatmaps, choropleth, marker clustering, GeoJSON overlays

#### 2. **Plotly + Dash** (Technical Diagrams)
```python
import plotly.graph_objects as go
import plotly.express as px
from plotly.subplots import make_subplots
```
- **Use Case**: Sankey diagrams, 3D visualizations, dashboard integration
- **Features**: Power flow diagrams, heat dissipation analysis, timeline charts
- **Export**: SVG/PDF for presentation materials

#### 3. **D3.js + Observable** (Custom Infrastructure Diagrams)
```javascript
import {sankey, sankeyLinkHorizontal} from "d3-sankey"
```
- **Use Case**: Custom power delivery path visualization
- **Advantages**: Complete control over visual design, animation capability
- **Integration**: Export to SVG for slide integration

#### 4. **GeoPandas + Contextily** (Geospatial Processing)
```python
import geopandas as gpd
import contextily as cx
```
- **Use Case**: GeoPackage creation, coordinate transformation, spatial analysis
- **Features**: EPSG:3067 (TM35FIN) support, constraint buffer analysis

#### 5. **PyDeck** (3D Visualization)
```python
import pydeck as pdk
```
- **Use Case**: 3D building envelope visualization for KMZ export
- **Features**: Elevation models, infrastructure 3D rendering

---

## VISUALIZATION DELIVERABLES

### 1. POWER INFRASTRUCTURE FLOW DIAGRAM

#### **Sankey Diagram Specification:**
```
Data Flow Structure:
Regional Grid (3000 MW) →
  Fingrid 400kV (1500 MW) →
    Pori 110kV Network (400 MW) →
      Isosannan Substation (120 MVA) →
        Datacenter Load (82 MVA @ 70 MW) →
          IT Equipment (70 MW) →
            Waste Heat (70 MW) →
              [River Discharge: 50 MW]
              [District Heating: 20 MW]
```

#### **Technical Annotations:**
- Node sizing proportional to capacity (MVA/MW)
- Color coding: Available (green), Constrained (yellow), Exceeded (red)
- Distance labels on transmission links
- Efficiency percentages at transformation points

### 2. CONSTRAINT OVERLAY MAPPING

#### **Layer Stack Architecture:**
1. **Base Layer**: OpenStreetMap or Mapbox Streets
2. **Infrastructure Layer**: 
   - 110kV substations (exact coordinates)
   - Transmission lines with voltage labels
   - Kokemäenjoki River with flow indicators
3. **Constraint Layers**:
   - Power capacity heatmap (MVA availability)
   - Acoustic impact zones (dB contours)
   - Environmental sensitive areas (IBA boundaries)
   - Municipal zoning with restriction levels
4. **Technical Overlay**:
   - Site boundaries (Phase I/II polygons)
   - Connection routing options
   - Heat dissipation requirements
   - Infrastructure investment zones

#### **Interactive Features:**
- Layer toggle controls
- Hover information with quantitative data
- Distance measurement tools
- Coordinate display (EPSG:3067)

### 3. HEAT DISSIPATION ANALYSIS

#### **Multi-Panel Visualization:**

**Panel A: Heat Generation Breakdown**
```
70 MW IT Load →
  Cooling Systems (16-27 MW) →
    Power Infrastructure (5-8 MW) →
      Total Facility Heat (91-105 MW)
```

**Panel B: Cooling Options Comparison**
- Air Cooling: Equipment specs, noise levels, costs
- River Cooling: Flow requirements, temperature constraints
- Hybrid System: Seasonal optimization, efficiency curves

**Panel C: Seasonal Analysis**
- Monthly cooling hours available
- River temperature variations
- Efficiency optimization curves
- District heating integration potential

### 4. TIMELINE REALITY vs CLAIMS

#### **Gantt Chart with Benchmarks:**

**Marketing Claims vs Engineering Reality:**
```
Phase 1 (70MW):
  Claimed: 18 months
  Reality: 36-48 months
    ├─ EIA Process: 10-13 months
    ├─ Environmental Permits: 10 months
    ├─ Power Connection: 24-36 months
    └─ Construction: 18-24 months

Benchmarks:
  Microsoft Espoo: 36+ months
  Verne Mäntsälä: 36 months
  Google Hamina: 24-36 months (expansion)
```

### 5. FINANCIAL CASCADE ANALYSIS

#### **Waterfall Chart:**
```
Infrastructure Costs Cascade:
Base Site (€0) →
  Power Connection (+€8-15M) →
    Cooling Systems (+€35-50M) →
      Environmental Compliance (+€2-8M) →
        Acoustic Mitigation (+€2-5M) →
          Total Infrastructure (€52-85M)
```

---

## TECHNICAL IMPLEMENTATION

### COORDINATE SYSTEMS:
- **Primary**: ETRS89 / TM35FIN (EPSG:3067)
- **Secondary**: WGS 84 (EPSG:4326) for web compatibility
- **Transformation**: PyProj for accurate coordinate conversion

### DATA SOURCES INTEGRATION:
- **Power Infrastructure**: OpenStreetMap Overpass API
- **Environmental**: SYKE spatial datasets
- **Municipal**: Pori WFS services
- **Elevation**: Finnish National Land Survey DEM

### VISUAL DESIGN STANDARDS:

#### **Color Palette (ColorBrewer Sequential):**
```css
Power Infrastructure:
  Available: #2166ac (blue)
  Constrained: #fdd49e (yellow) 
  Exceeded: #d73027 (red)

Environmental:
  Low Impact: #1a9850 (green)
  Medium Impact: #fee08b (yellow)
  High Impact: #d73027 (red)

Temporal:
  Past: #9e9ac8 (purple)
  Present: #3182bd (blue)
  Future: #31a354 (green)
```

#### **Typography:**
- Headers: Helvetica Bold, 14-18pt
- Labels: Helvetica Regular, 10-12pt
- Annotations: Helvetica Light, 8-10pt
- Technical specs: Consolas Monospace, 9pt

#### **Line Weights (Per Tufte):**
- Data lines: 1.5-2pt
- Grid lines: 0.5pt, 20% opacity
- Boundaries: 1pt
- Annotations: 0.75pt

---

## OUTPUT SPECIFICATIONS

### 1. **PRESENTATION SLIDES (PDF/PowerPoint)**
- **Resolution**: 300 DPI minimum
- **Format**: A3 landscape for technical drawings
- **Vector Graphics**: SVG export from Plotly/D3.js
- **Embedded Fonts**: Arial, Helvetica, Times New Roman

### 2. **GEOPACKAGE (.gpkg)**
```sql
Feature Classes:
- site_boundaries (Phase I/II polygons)
- power_substations (110kV locations with capacity)
- transmission_lines (voltage, distance, operator)
- environmental_constraints (IBA, river buffers)
- acoustic_zones (dB contour lines)
- municipal_zoning (restrictions, setbacks)
- infrastructure_costs (spatial cost allocation)
```

### 3. **KMZ VISUALIZATION**
- **3D Building Envelopes**: 25m height limit visualization
- **Subsurface Infrastructure**: Power routing, cooling systems
- **Environmental Overlays**: River flow, bird migration corridors
- **Interactive Labels**: Technical specifications on click
- **Temporal Layers**: Construction phases with timelines

### 4. **INTERACTIVE DASHBOARD**
- **Framework**: Dash + Plotly
- **Features**: Real-time constraint analysis
- **Responsive**: Desktop/tablet optimization
- **Export**: PDF report generation
- **Data Update**: Live connection to municipal APIs

---

## INFORMATION DENSITY TARGETS

### **Slide Density Goals (per Tufte):**
- **Data Points per Slide**: 50-200 quantitative values
- **Visual Elements**: Maximum 8-12 meaningful objects
- **Text Density**: 150-300 words per slide
- **Whitespace**: 15-25% for visual breathing room

### **Map Information Density:**
- **Layers Visible**: 4-6 simultaneous overlays
- **Label Density**: Non-overlapping at 1:5000 scale
- **Symbol Variety**: 3-5 distinct categories per layer
- **Color Usage**: Maximum 7 distinct hues per visualization

---

## QUALITY ASSURANCE CHECKLIST

### **Technical Accuracy:**
- [ ] All coordinates validated against official sources
- [ ] Engineering calculations peer-reviewed
- [ ] Financial data cross-referenced with benchmarks
- [ ] Timeline estimates validated against comparable projects

### **Visual Design:**
- [ ] Data-ink ratio optimized (Tufte principle)
- [ ] Color accessibility (colorblind-safe palettes)
- [ ] Typography hierarchy consistent
- [ ] Visual hierarchy supports analytical flow

### **Delivery Standards:**
- [ ] All files export to required formats
- [ ] Metadata embedded per ISO 19115
- [ ] Version control implemented
- [ ] Cross-platform compatibility verified

This visualization package will deliver investment-grade technical intelligence through world-class information design, supporting critical decision-making for the Pori datacenter development.