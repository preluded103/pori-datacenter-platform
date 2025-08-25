# Datacenter Pre-DD Intelligence Platform
## Phase 0 Site Screening System

### Platform Overview
Professional-grade **initial due diligence** platform for rapid datacenter site screening across EU/UK/Norway. Designed to identify viable candidates for full technical due diligence investment.

**Value Proposition**: Screen 20 sites in 4-8 weeks to identify 3-5 candidates worthy of €150-500k full DD investment.

### Scope Definition

#### ✅ IN SCOPE (Phase 0 - Initial DD)
- High-level site constraints identification
- Desktop analysis of publicly available data
- Preliminary feasibility assessment
- Go/No-Go decision support
- Infrastructure proximity analysis (distance only)
- Regulatory requirement flagging (not detailed analysis)
- Order-of-magnitude cost indicators
- Risk flagging for further investigation

#### ❌ NOT IN SCOPE (Future Phase 1+)
- Detailed engineering calculations
- Professional engineer sign-off
- Site visits or field investigations
- Foundation design specifications
- Detailed permit timeline analysis
- Precise cost estimates
- Final investment-grade reports

### Technical Architecture

#### Core Platform Components
1. **Database**: Supabase + PostGIS for multi-tenant geospatial data
2. **Frontend**: Next.js 14 on Vercel with professional UI
3. **Mapping**: Enhanced boundary tool with Mapbox integration
4. **Data Services**: WFS/WMS hosting for constraint layers
5. **Reporting**: Automated scorecard generation with disclaimers

#### Modular Architecture
```
/platform/
├── core/                    # Generic platform code
│   ├── database/           # Supabase schemas
│   ├── api/                # Data source connectors
│   ├── analysis/           # Constraint analysis engine
│   └── reporting/          # Scorecard generation
├── modules/                 # Risk flagging modules
│   ├── proximity/          # Infrastructure distance
│   ├── seismic/           # Seismic zone flagging
│   ├── flood/             # Flood zone identification
│   ├── aviation/          # Airport proximity
│   ├── heritage/          # Protected sites
│   └── emi/               # Transmitter proximity
└── country-configs/         # Country-specific settings
    ├── finland/
    ├── norway/
    └── template/
```

### Deliverable Standards

#### Site Scorecard (1-2 pages per site)
```
SITE ASSESSMENT SCORECARD
├── Site Identification
│   ├── Location & Coordinates
│   ├── Size & Zoning Status
│   └── Ownership Structure
├── Infrastructure Proximity
│   ├── Power: Distance to substations
│   ├── Fiber: Distance to backbone
│   ├── Water: Distance to source
│   └── Transport: Access quality
├── Risk Matrix
│   ├── Environmental: [LOW/MED/HIGH]
│   ├── Regulatory: [LOW/MED/HIGH]
│   ├── Technical: [LOW/MED/HIGH]
│   └── Timeline: [LOW/MED/HIGH]
├── Cost Indicators
│   ├── Infrastructure: €X-Y million
│   ├── Timeline: X-Y years
│   └── Complexity: [LOW/MED/HIGH]
└── Recommendation
    ├── Decision: [PROCEED/CAUTION/AVOID]
    └── Next Steps: Specific DD priorities
```

#### Professional Disclaimers
```
PRELIMINARY ASSESSMENT NOTICE

This analysis represents initial desktop research based on publicly 
available data sources. It is intended for site screening purposes 
only and should not be relied upon for investment decisions or 
detailed planning activities.

Accuracy: ±20-30% for cost estimates and timeline projections
Data Date: [Date of analysis]
Valid For: 6 months from date of issue

Sites recommended as "PROCEED" require comprehensive Phase 1 
due diligence including field investigations and professional 
engineering review before any investment commitment.
```

### Data Acquisition Strategy

#### Proven Finnish Model (Reference Implementation)
- **Property Data**: Maanmittauslaitos API ✅
- **Environmental**: SYKE databases ✅  
- **Zoning**: Municipal WFS services ✅
- **Power Grid**: ENTSO-E + OSM fallback ⚠️

#### Generic Data Hierarchy
1. **Primary**: National mapping agencies
2. **Secondary**: Municipal/regional sources
3. **Tertiary**: OpenStreetMap + commercial
4. **Validation**: Multi-source cross-reference

### Risk Flagging Modules

#### Module Design Pattern
Each module follows the same structure:
- **Input**: Site coordinates + boundary
- **Process**: Proximity/zone analysis
- **Output**: Risk level + specific flags
- **NOT**: Detailed engineering analysis

#### Risk Modules
1. **Seismic**: Zone identification (not PGA calculations)
2. **Flood**: Flood zone mapping (not modeling)
3. **Geotechnical**: Soil type flags (not bearing capacity)
4. **Aviation**: Airport proximity (not obstruction analysis)
5. **Heritage**: Protected site distance (not impact studies)
6. **EMI**: Transmitter proximity (not interference modeling)

### Quality Assurance Framework

#### Data Validation
- Source attribution required
- Confidence levels (High/Medium/Low)
- Date stamps for all data
- Automated freshness checking

#### Platform Testing
- Unit tests for all modules
- Integration tests for workflows
- Performance benchmarks
- Multi-country validation

### Implementation Phases

#### Phase 1: Core Platform (Weeks 1-3)
- Database setup with Finland reference
- Basic UI with mapping tools
- Proximity analysis engine
- Scorecard template system

#### Phase 2: Risk Modules (Weeks 4-6)
- Implement 6 risk flagging modules
- Country configuration system
- Data source integration
- Validation workflows

#### Phase 3: Production Ready (Weeks 7-8)
- Multi-site comparison tools
- Professional report generation
- Quality assurance testing
- Platform packaging

### Success Metrics

#### Performance Targets
- Analysis time: 3-5 days per site
- Accuracy: ±20-30% acceptable
- Coverage: 95% data availability
- Output: 2-3 pages per site

#### Business Metrics
- Price point: €15-25k per site
- Batch efficiency: 10-20 sites per month
- ROI: Save €2-5M in unnecessary full DD
- Quality: >90% proceed/avoid accuracy

### Current Status
**Reference Implementation**: Pori, Finland datacenter analysis demonstrates Phase 1+ capability
**Next Step**: Extract and streamline methodology for Phase 0 rapid screening platform