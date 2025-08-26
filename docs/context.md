# Pori Datacenter Site Due Diligence Analysis
## Konepajanranta, Pori, Finland

### Project Overview
Comprehensive due diligence analysis for a proposed AI datacenter development at Konepajanranta in Pori, Finland. This analysis will provide detailed assessment of site constraints, zoning compliance, infrastructure capacity, and development potential through advanced geospatial analysis and planning data integration.

### Site Details (Extracted from PDF + User Correction)
- **Location**: Konepajanranta, Pori, Finland
- **ACTUAL COORDINATES**: 61.495722, 21.810987 (Industrial location, NOT downtown center)
- **CRITICAL REASONING ERROR**: Initially assumed datacenter would be in downtown Pori center - this makes no sense for 70MW industrial facility. Datacenters require industrial zoning, power infrastructure access, and space - NOT downtown locations.
- **City**: Pori (90,000 inhabitants)
- **Distance from Helsinki**: 240km
- **Total Site Area**: 150,000 m²
  - Phase I: 60,000-70,000 m²
  - Phase II: 90,000 m²
- **Zoning**: Industrial, ready for datacenters
- **Maximum Building Height**: 25m
- **Power Infrastructure**: 
  - Adjacent to 110kV grid
  - 70MW available in 18 months
  - 100-150MW in 2-6 years
  - 200MW in 5 years
  - 400-500MW in 7-10 years
- **Cooling**: River water available (Kokemäenjoki)
- **District Heating**: Connection available for waste heat utilization
- **Fiber Connectivity**: All major connections available

## International Architecture Standards Compliance

### Drawing Standards (ISO 128 / ISO 7200)
All technical drawings and maps must comply with:
- **Title Block**: ISO 7200 compliant with project info, scale, date, revision
- **Line Weights**: ISO 128-20 standards
  - 0.13mm - Dimension lines, hatching
  - 0.25mm - Hidden details, grid lines
  - 0.35mm - Visible edges, text
  - 0.50mm - Section lines, borders
  - 0.70mm - Cut lines, ground lines
- **Scales**: Standard architectural scales (1:100, 1:200, 1:500, 1:1000, 1:2500)
- **North Arrow**: Always at consistent position (top-right)
- **Legend**: Bottom-right or separate sheet
- **Grid Reference**: Alphanumeric grid system (A-Z horizontal, 1-99 vertical)

### Site Analysis Standards (RIBA Plan of Work 2020 - Stage 1)
Following Royal Institute of British Architects standards for feasibility studies:

#### Stage 1: Preparation and Briefing
- **Strategic Definition**: Clear project objectives
- **Site Information**: Comprehensive baseline data
- **Project Outcomes**: Defined success metrics
- **Constraints Mapping**: Regulatory and physical limitations
- **Opportunities Identification**: Development potential

#### Required Drawings Set
1. **Location Plan** (1:2500 or 1:5000)
   - Regional context
   - Transport networks
   - Urban fabric
   - Key landmarks

2. **Site Plan** (1:500 or 1:1000)
   - Property boundaries
   - Existing structures
   - Topographical features
   - Vegetation
   - Access points

3. **Constraints Plan** (1:1000)
   - Setbacks and easements
   - Protected zones
   - Utility corridors
   - Environmental restrictions
   - Height limitations

4. **Infrastructure Plan** (1:1000)
   - Power lines and substations
   - Water and sewer
   - Telecommunications
   - Gas lines
   - District heating

5. **Opportunities Plan** (1:1000)
   - Developable areas
   - Expansion zones
   - Connection points
   - View corridors
   - Integration opportunities

### AIA Standards (American Institute of Architects)
Following AIA best practices for site analysis documentation:

#### Sheet Organization (AIA CAD Layer Guidelines)
```
G-Series: General
  G-001: Cover Sheet
  G-002: Site Analysis Summary
  G-003: Code Analysis

A-Series: Architectural  
  A-001: Site Plan - Existing
  A-002: Site Plan - Proposed
  A-101: Zoning Analysis
  A-102: Building Envelope Studies

C-Series: Civil
  C-101: Existing Conditions
  C-102: Grading Plan
  C-201: Utility Plan
  C-301: Stormwater Management

L-Series: Landscape
  L-101: Existing Vegetation
  L-102: Environmental Constraints
```

#### Layer Naming Convention (AIA Format)
```
Discipline-Major-Minor-Status
Examples:
  A-SITE-BNDY (Architecture-Site-Boundary)
  C-UTIL-POWR (Civil-Utility-Power)
  E-POWR-CABL-110KV (Electrical-Power-Cable-110kV)
  L-PLNT-TREE-EXIST (Landscape-Planting-Trees-Existing)
```

### European Standards (EN/Eurocodes)

#### EN 1997 - Geotechnical Design
- Site investigation requirements
- Soil classification systems
- Foundation recommendations
- Groundwater assessment

#### EN 1990 - Basis of Structural Design
- Load considerations
- Safety factors
- Design life requirements
- Reliability classification

### Data Center Specific Standards

#### Uptime Institute Tier Standards
Document infrastructure capabilities according to Tier Classification:
- **Tier I**: Basic Capacity (99.671% availability)
- **Tier II**: Redundant Capacity (99.741% availability)
- **Tier III**: Concurrently Maintainable (99.982% availability)
- **Tier IV**: Fault Tolerant (99.995% availability)

#### TIA-942 Data Center Standards
Include analysis for:
- **Site Selection Criteria**
  - Natural disaster risk assessment
  - Proximity to hazards (100-year flood plain, etc.)
  - Electromagnetic interference zones
  - Vibration sources
  - Flight paths

- **Space Planning**
  - Computer room layout efficiency
  - Support space requirements
  - Loading dock specifications
  - Security zones
  - Future expansion capability

#### ASHRAE TC 9.9 Guidelines
Environmental analysis per ASHRAE standards:
- **Thermal Guidelines**
  - Recommended envelope: 18-27°C
  - Allowable envelope: 15-32°C
  - Humidity ranges: 20-80% RH

- **Free Cooling Potential**
  - Annual cooling hours analysis
  - Water/air economizer feasibility
  - PUE optimization opportunities

### Professional Presentation Standards

#### Map Composition (Cartographic Standards)
Following International Cartographic Association guidelines:

1. **Visual Hierarchy**
   - Primary information: Boldest
   - Secondary information: Medium weight
   - Context/background: Lightest
   - Use of color for emphasis

2. **Map Elements** (Required)
   - Title (descriptive and concise)
   - Scale bar and ratio
   - North arrow
   - Legend/key
   - Data sources
   - Projection information
   - Date of creation
   - Author/organization
   - Copyright notice

3. **Color Schemes** (ColorBrewer 2.0 compliant)
   - **Sequential**: Single hue progression for ordered data
   - **Diverging**: Two-hue progression for critical values
   - **Qualitative**: Distinct hues for categorical data
   - **Colorblind safe**: Accessible palettes
   - **Print-friendly**: CMYK optimized

#### Report Structure (International Engineering Standards)

##### Executive Summary Format
```
1.0 EXECUTIVE SUMMARY
  1.1 Project Overview
  1.2 Key Findings
  1.3 Critical Risks
  1.4 Recommendations
  1.5 Next Steps
```

##### Technical Sections
```
2.0 SITE ANALYSIS
  2.1 Location and Context
  2.2 Physical Characteristics
  2.3 Existing Infrastructure
  2.4 Environmental Conditions
  2.5 Regulatory Framework

3.0 INFRASTRUCTURE ASSESSMENT  
  3.1 Power Systems
    3.1.1 Grid Capacity
    3.1.2 Reliability Analysis
    3.1.3 Expansion Potential
  3.2 Cooling Systems
    3.2.1 Water Resources
    3.2.2 Air Cooling Potential
    3.2.3 Heat Recovery Options
  3.3 Telecommunications
    3.3.1 Fiber Connectivity
    3.3.2 Redundancy Options
    3.3.3 Latency Analysis

4.0 DEVELOPMENT CONSTRAINTS
  4.1 Zoning Restrictions
  4.2 Environmental Limitations
  4.3 Geotechnical Considerations
  4.4 Access and Logistics

5.0 RISK ASSESSMENT (ISO 31000)
  5.1 Risk Identification
  5.2 Risk Analysis
  5.3 Risk Evaluation
  5.4 Risk Treatment
  5.5 Mitigation Strategies
```

#### Drawing Title Block (ISO 7200 Compliant)
```
+----------------------------------+
| PROJECT TITLE                    |
| Pori Datacenter Site Analysis    |
+----------------------------------+
| Client: [Client Name]            |
| Project No: PDC-2024-001         |
| Location: Konepajanranta, Pori   |
+----------------------------------+
| Drawing Title:                   |
| [Specific Drawing Name]          |
| Scale: 1:1000                    |
| Date: 2024-01-XX                 |
| Drawn By: [Initials]             |
| Checked By: [Initials]           |
| Drawing No: A-101                |
| Revision: A                      |
+----------------------------------+
```

### Deliverable Specifications

#### 1. KMZ File (Google Earth Professional Standard)
- **Structure**:
  ```
  Pori_Datacenter_Analysis.kmz
  ├── doc.kml (main document)
  ├── files/
  │   ├── legend.png
  │   ├── north_arrow.png
  │   └── icons/
  └── overlays/
      ├── site_boundary.png
      ├── zoning_map.png
      └── infrastructure.png
  ```
- **Layer Organization**:
  - 01_Site_Boundary
  - 02_Zoning
  - 03_Infrastructure_Power
  - 04_Infrastructure_Water
  - 05_Infrastructure_Telecom
  - 06_Environmental_Constraints
  - 07_Development_Phases
  - 08_3D_Building_Envelope

#### 2. GeoPackage (OGC Standard)
- **CRS Requirements**:
  - Primary: ETRS89 / TM35FIN (EPSG:3067)
  - Secondary: WGS 84 (EPSG:4326)
- **Feature Classes**:
  ```sql
  -- Required tables per OGC standard
  gpkg_contents
  gpkg_spatial_ref_sys
  gpkg_geometry_columns
  
  -- Project feature classes
  site_boundary
  zoning_districts
  power_infrastructure
  water_infrastructure
  telecom_infrastructure
  environmental_constraints
  transportation_network
  cadastral_parcels
  ```
- **Attribute Standards**:
  - UUID for unique identification
  - ISO 8601 date format
  - SI units for measurements
  - Source attribution fields

#### 3. PDF Report (ISO 32000-2:2020)
- **Document Properties**:
  - PDF/A-2 compliant for archival
  - Embedded fonts (Arial, Times New Roman)
  - 300 DPI minimum for images
  - Vector graphics where possible
  - Searchable text (OCR if needed)
  - Bookmarks for navigation
  - Metadata embedded

- **Page Layout**:
  - A3 landscape for maps (420 x 297mm)
  - A4 portrait for text (210 x 297mm)
  - 25mm margins minimum
  - Page numbers (X of Y format)
  - Headers with section titles
  - Footers with project info

### Quality Control Against Standards

#### Drawing QC Checklist
- [ ] Title block complete (ISO 7200)
- [ ] Scale clearly indicated
- [ ] North arrow positioned correctly
- [ ] Legend comprehensive
- [ ] Line weights per ISO 128
- [ ] Dimensions in metric (SI)
- [ ] Grid references clear
- [ ] Revision cloud for changes
- [ ] Professional stamp/seal space

#### Map QC Checklist
- [ ] Projection documented
- [ ] Scale bar and ratio
- [ ] Color scheme accessible
- [ ] Labels legible at print size
- [ ] Sources cited
- [ ] Copyright notice
- [ ] Visual hierarchy clear
- [ ] White space balanced
- [ ] Border and neat line

#### Report QC Checklist
- [ ] Follows standard structure
- [ ] Executive summary <2 pages
- [ ] Table of contents accurate
- [ ] List of figures/tables
- [ ] Consistent formatting
- [ ] Professional language
- [ ] Citations complete
- [ ] Appendices organized
- [ ] Glossary if needed

### BIM/CAD Standards (If Applicable)

#### Level of Detail (LOD) Specifications
Per AIA G202-2013:
- **LOD 100**: Conceptual/Mass
- **LOD 200**: Approximate geometry
- **LOD 300**: Precise geometry
- **LOD 350**: Precise with connections
- **LOD 400**: Fabrication ready

For site analysis, target LOD 200-300.

#### File Naming Convention
```
ProjectCode_Discipline_Zone_Level_Type_Sequential_Revision
Example: PDC_A_SITE_00_PLN_001_A
```

### Sustainability Standards

#### LEED Documentation Requirements
Prepare analysis supporting:
- **Sustainable Sites (SS)**
  - Site selection credit
  - Development density
  - Alternative transportation
  - Stormwater design
  - Heat island effect

#### BREEAM Assessment Support
- **Land Use and Ecology**
  - Site selection
  - Ecological value
  - Ecological enhancement
  - Long term biodiversity

### Digital Delivery Standards

#### File Organization Structure
```
/Pori_Datacenter_Due_Diligence/
├── 00_Admin/
│   ├── Transmittals/
│   ├── Meeting_Notes/
│   └── Correspondence/
├── 01_Source_Data/
│   ├── Survey/
│   ├── Geotechnical/
│   ├── Environmental/
│   └── Utilities/
├── 02_Analysis/
│   ├── Calculations/
│   ├── Models/
│   └── Studies/
├── 03_Drawings/
│   ├── CAD/
│   ├── GIS/
│   └── PDF/
├── 04_Reports/
│   ├── Draft/
│   └── Final/
└── 05_Deliverables/
    ├── KMZ/
    ├── GeoPackage/
    └── PDF_Report/
```

### Metadata Standards (ISO 19115)
All geospatial data must include:
- **Identification**: Title, abstract, purpose
- **Constraints**: Legal, security, usage
- **Data Quality**: Accuracy, completeness
- **Maintenance**: Frequency, contact
- **Spatial Representation**: Type, reference system
- **Distribution**: Format, transfer options
- **Metadata Reference**: Standard, version

### Accessibility Standards (WCAG 2.1)
Ensure digital deliverables meet:
- **Perceivable**: Color contrast ratios
- **Operable**: Keyboard navigation
- **Understandable**: Clear language
- **Robust**: Multiple format options

### Version Control Standards
- **Major Versions**: X.0 (Significant changes)
- **Minor Versions**: X.Y (Small updates)
- **Revision Letters**: For drawings (A, B, C...)
- **Date Stamps**: YYYY-MM-DD format
- **Change Log**: Maintained for all versions

### Professional Certification Requirements
Space for professional stamps/seals:
- Registered Architect (RA)
- Professional Engineer (PE)
- Professional Land Surveyor (PLS)
- LEED AP credentials
- Local Finnish certifications

## Planning Artifacts

**European Grid Intelligence Expert Plan**: /docs/european-grid-expert-plan-001.md - Comprehensive Fingrid transmission network analysis for 70-500MW datacenter connection requirements

**European Grid Intelligence Expert Plan - Pori 110kV**: /docs/european-grid-expert-plan-002.md - Specific investigation framework for verifying 110kV infrastructure claims at Konepajanranta site

**Vercel Frontend Deployment Plan**: /docs/vercel-frontend-deployment-plan-001.md - Comprehensive frontend architecture plan for professional datacenter due diligence platform with Next.js 14, Mapbox integration, multi-project management, and enterprise compliance features

**European Demographic Data Planning Strategy**: /docs/european-demographic-planner-plan-25012025.md - Comprehensive data acquisition strategy for expanding datacenter due diligence platform across 12 European countries, leveraging successful Pori methodology with country-specific API integration, fallback strategies, and GDPR compliance framework

**Vercel Deployment Specialist Plan**: /docs/vercel-deployment-plan-comprehensive.md - Enterprise-grade deployment plan for Next.js 14 datacenter intelligence platform with optimized Mapbox integration, European region deployment, comprehensive performance monitoring, security hardening, and scalable CI/CD pipeline configuration

## DATA SOURCE DISCOVERY DOCUMENTATION
*Critical for replicability - documenting what works, what doesn't, and alternative approaches*

### Data Discovery Process Log

#### Phase 1: Initial Source Identification (2025-01-22)

**Target Data Sources:**
1. Maanmittauslaitos (National Land Survey of Finland)
2. Pori City Planning Department
3. SYKE (Finnish Environment Institute) 
4. Fingrid (Finnish TSO)

#### Maanmittauslaitos (National Land Survey) - VERIFIED ACCESSIBLE

**Access Method**: Direct WebFetch (successful)
**Status**: ✅ CONFIRMED ACCESSIBLE

**Available Services (VERIFIED):**
1. **API Key System**: 
   - Registration required at My Account service
   - Free API key available
   - HTTP Basic Authentication or URL parameter method

2. **Service Types Available**:
   - Geocoding Service
   - Map Image Service (Vector Tiles)
   - Map Image Service (WMTS)
   - Real Estate Information Query Service ⭐ (KEY FOR PROPERTY BOUNDARIES)
   - Topographic Database Query Service ⭐ (KEY FOR SITE LOCATION)
   - Nomenclature (Place Names) Service
   - Orthophoto and Elevation Model Query Service ⭐ (KEY FOR SITE ANALYSIS)
   - Geospatial File Service

**Coordinate Systems**: ETRS89 / TM35FIN (EPSG:3067)

**Next Steps**: 
- Register for API key
- Test Real Estate Information Query for Konepajanranta properties
- Test Topographic Database Query for site boundaries

#### Pori City Planning Department - VERIFIED ACCESSIBLE

**Access Method**: Direct WebFetch (successful)
**Status**: ✅ CONFIRMED ACCESSIBLE

**Available Services (VERIFIED):**
1. **WFS Vector Data**:
   - Endpoint: `https://kartta.pori.fi/TeklaOGCWeb/WFS.ashx`
   - Data: Buildings, properties, zoning plans (asemakaava), addresses
   - License: CC BY-NC 4.0
   - No authentication required ⭐

2. **WMS Raster Maps**:
   - Endpoint: `https://kartta.pori.fi/TeklaOGCWeb/WMS.ashx`
   - Provides visual map layers

3. **WMTS Services (15 General Plans)**:
   - Coordinate System: EUREF FIN TM35FIN
   - URL Pattern: `https://tiles-eu1.arcgis.com/KYPpFflt8Fefjn3p/arcgis/rest/services/[PlanName]_tiilitetty_TM35/MapServer/WMTS/1.0.0/WMTSCapabilities.xml`

4. **Esri ArcGIS Hub**:
   - Portal: `https://pori.hub.arcgis.com/search?collection=Dataset`
   - Direct dataset downloads possible

**Contact**: kaavoitus@pori.fi for specific Konepajanranta information

**Critical Finding**: WFS service includes zoning plans and property data - EXACTLY what we need!

#### SYKE (Finnish Environment Institute) - VERIFIED ACCESSIBLE

**Access Method**: Direct WebFetch (successful)
**Status**: ✅ CONFIRMED ACCESSIBLE

**Available Services (VERIFIED):**
1. **Environmental Data APIs**:
   - Hydrology API (water resources, Kokemäenjoki river data)
   - Water Quality API
   - Lakes API (includes coordinates, depth, volume)

2. **Downloadable Spatial Datasets (Direct ZIP Downloads)**:
   - **Flood Hazard Areas**: `https://wwwd3.ymparisto.fi/d3/gis_data/spesific/[dataset].zip`
   - **Catchment Areas**: Multiple return periods (1/2a to 1/1000a)
   - **Water Bodies (WFD)**: Latest 2022 data
   - **Natura 2000 Areas**: Protected areas
   - **Nature Protected Areas**: Government and private areas

**Coordinate System**: ETRS-TM35FIN (EPSG:3067)
**Formats**: Shapefile, TIFF
**License**: Creative Commons Attribution 4.0 International

**Critical Finding**: Direct ZIP downloads available - no API complexity needed for basic datasets!

#### Fingrid (Finnish TSO) - ACCESSIBLE BUT LIMITED

**Access Method**: Direct WebFetch (successful from Finnish IP)
**Status**: ⚠️ PARTIALLY ACCESSIBLE

**Available Services (VERIFIED):**
1. **Open Data Portal**: https://data.fingrid.fi/en
2. **Developer Portal**: https://developer-data.fingrid.fi/apis
3. **Dataset Categories**: Production, consumption, wind power, aFRR

**Limitations Found**:
- No specific transmission network infrastructure datasets listed in main portal
- Substation locations not clearly available in open data
- Focus on market/operational data rather than infrastructure maps

**Alternative Approaches to Try**:
1. Check if OpenStreetMap has Finnish transmission infrastructure ⭐ (TESTING NOW)
2. Look for Pori Energia data (local utility company)
3. Search for 110kV, 220kV, 400kV networks in OSM 
4. Use european-grid-finder agent for OSM-based approach
5. Contact Fingrid directly for infrastructure data
6. Check if EU ENTSO-E has Finnish grid data

### Data Access Strategy Matrix

| Data Source | Status | Method | Key Data Available | Next Action |
|-------------|--------|--------|-------------------|-------------|
| Maanmittauslaitos | ✅ Verified | API + Key | Property boundaries, topography, orthophotos | Register for API key |
| Pori Planning | ✅ Verified | WFS/WMS | Zoning plans, buildings, properties | Test WFS endpoint |
| SYKE | ✅ Verified | Direct Download + API | Flood maps, environmental constraints | Download flood data |
| Fingrid | ⚠️ Limited | API | Market data only | Try alternative sources |

### Critical Success: 3/4 Sources Verified Accessible!

**CONFIRMED AVAILABLE DATA for Konepajanranta Analysis:**
1. ✅ Property boundaries and land registry (Maanmittauslaitos)
2. ✅ Zoning plans and building information (Pori WFS)
3. ✅ Flood risk maps and environmental constraints (SYKE)
4. ⚠️ Power infrastructure (need alternative approach)

### Next Phase: Test Data Access
Now that we've confirmed data availability, proceed to test actual data retrieval.

This comprehensive framework ensures all deliverables meet international professional standards while maintaining the specific requirements for the Pori datacenter site analysis.