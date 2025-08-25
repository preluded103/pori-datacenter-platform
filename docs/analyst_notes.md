# Analyst Notes - Konepajanranta Datacenter Site Analysis

## Critical Power Infrastructure Constraints

### Pori Energia Distribution Network Limits
- **Distribution Voltage**: 20kV 
- **Critical Threshold**: 65 MVA (≈60 MW) maximum for distribution-level connections
- **Above 65 MVA**: Requires Fingrid transmission-level connection
- **Transformer Limits**: >800kVA requires circuit breaker protection (not fuse-based)

### Power Delivery Path Reality
- **Immediate Feed**: Pori Energia 20kV distribution network
- **Transmission Connection**: Required for Phase 1 (70MW) and beyond
- **Fingrid Distance**: 14km to transmission infrastructure (context only)
- **Handoff Point**: Pori Energia distribution → Fingrid transmission at 65 MVA threshold

### Phased Development Constraints
- **Phase 1 (70MW)**: Exceeds distribution limit → transmission connection required
- **Phase 2-4 (100-500MW)**: All require transmission-level infrastructure
- **Timeline Impact**: Transmission connections have longer approval/construction timelines

### Technical Requirements for Large Loads
- **Protection**: Circuit breaker mandatory for >800kVA transformers
- **Reactive Power**: cos φ_ind = 0.995 target, compensation required for large loads
- **Remote Control**: May require remote-controlled disconnectors for 20kV equipment
- **Emergency Systems**: Emergency disconnection required for >1MW transmission-connected facilities

### Regulatory Framework
- **Distribution Level**: Pori Energia technical guidelines apply
- **Transmission Level**: Fingrid Grid Code requirements apply for >65 MVA
- **Approval Authority**: TUKES (Finnish Electrical Safety Authority) for large installations

## Municipal Zoning Constraints (from Kaavoituskatsaus 2021-2023)

### Approval Process Framework
- **Authority**: City Council (kaupunginvaltuusto) approves significant projects  
- **Process**: Participation plan (osallistumis- ja arviointisuunnitelma) required
- **Public Participation**: Mandatory public comment periods (14-30 days minimum)
- **Appeals**: Appeals possible to Turku Administrative Court, then Supreme Administrative Court

### Large Development Requirements
- **Environmental Impact**: Major developments require comprehensive impact assessment
- **Traffic Impact**: Transportation studies required for significant projects
- **Public Process**: Active public participation required for large industrial developments
- **Development Agreements**: Land use agreements (maankäyttösopimus) required with municipality

### Height Restrictions
- **Central Areas**: Maximum 8 stories (VIII) in downtown core areas
- **Heritage Areas**: Strict protection for RKY (nationally valuable) buildings
- **Flood Zones**: Building elevation requirements per ELY-center guidelines (varies by location)

### Industrial Zoning (Critical for Datacenter)
- **Honkaluoto Industrial Area**: Designated for large industrial/business use
- **Expansion Areas**: I2-I4 zones planned for businesses requiring significant space
- **Infrastructure**: Connected to highway 11 extension and industrial logistics

### Current Major Projects in Area
- **Konepajanranta Area**: Part of central development planning
- **Jokikeskus Project**: River center development affecting nearby areas
- **Lestikatu Development**: Commercial development in adjacent industrial area

## Phase 3: River Cooling & District Heating Constraints

### Kokemäenjoki River Cooling Assessment
- **River System**: 121 km river, largest Nordic delta system
- **Industrial Precedent**: Olkiluoto Nuclear (120-130 m³/s intake = >50% river flow)
- **Temperature Limits**: 30°C maximum discharge at 500m distance (7-day moving average)
- **Existing Users**: Norilsk Nickel Harjavalta (upstream), nuclear facility (downstream)

### Environmental Permit Requirements
- **Authority**: Regional State Administrative Agency (Western Finland)
- **Expert Advisory**: SYKE (Finnish Environment Institute) 
- **Local Oversight**: KVVY River Protection Association
- **Timeline**: 12-24 months for major permits (Environmental + Water Act)
- **Monitoring**: Continuous temperature, flow, ecosystem compliance required

### District Heating Integration Analysis
- **Pori Energia Capacity**: 80 MWth biomass CHP (15 MWe electrical)
- **Coverage**: >50% city residents, 99.9% reliability, >90% CO2-free
- **Technical Challenge**: Datacenter waste heat (35-45°C) vs district heating requirement (60-80°C)
- **Solution Required**: Heat pump integration for temperature elevation
- **Scale Mismatch**: 70-500 MW datacenter vs 80 MW existing system

### District Cooling Opportunity
- **Existing Study**: 2012 feasibility study completed (6 km network, 9 MW capacity)
- **Expansion Potential**: Datacenter could anchor major system expansion
- **Integration Complexity**: Requires significant municipal infrastructure investment

## Phase 4: Fingrid Transmission Network Constraints

### Finnish Transmission System Architecture
- **Fingrid Oyj**: National TSO operating 400kV/220kV/110kV networks
- **SW Finland**: 400kV backbone 30km east, 220kV coastal corridor via Rauma-Turku
- **Connection Requirement**: >65 MVA requires transmission connection (Phase 1: 70MW = 110kV minimum)

### Connection Scenarios Analysis
- **Direct 110kV**: 24-36 months, €4-8M (14km dedicated line required)
- **220kV Future-Proof**: 36-48 months, €8-15M (supports 500MW ultimate)
- **Hybrid + Storage**: 18-24 months, €6-12M (peak shaving approach)

### Critical Constraints Identified
- **Distance Impact**: 14km from transmission infrastructure = significant CAPEX
- **Construction Timeline**: 18-60 months depending on grid reinforcement needs  
- **Capacity Competition**: Regional load growth affecting available transmission capacity
- **Seasonal Variations**: Winter peak demand reduces available grid capacity

### Technical Requirements (Fingrid Grid Code)
- **Dynamic Reactive Compensation**: Required for large loads
- **Power Quality Standards**: THD limits, voltage variation compliance
- **Frequency Response**: Mandatory capability for transmission-connected facilities
- **Connection Process**: 6-12 weeks preliminary study, 6-12 months connection agreement

### Grid Reinforcement Dependencies
- **Regional System**: Competition from Port of Pori expansion and industrial electrification
- **Upstream Constraints**: Potential need for system reinforcement beyond connection point
- **Timing Risk**: Major grid upgrades can extend timeline to 5-7 years

## Comprehensive Constraint Matrix

### Critical Path Analysis (Completed)
**Longest Lead Time**: Fingrid transmission connection (24-60+ months)
- Phase 1 (70MW): Exceeds 65 MVA distribution limit → transmission required
- Connection cost: €4-8M (110kV) to €15-30M+ (220kV with reinforcement) 
- Timeline risk: +24-48 months if grid reinforcement needed

### Power Delivery Reality
```
Datacenter → Pori Energia 20kV (65 MVA LIMIT) → Fingrid Transmission (14km)
RESULT: ALL PHASES require transmission-level connection
```

### Multi-Domain Constraints
- **Technical**: 14km transmission line, reactive compensation, grid code compliance
- **Environmental**: 12-24 month permits, 30°C discharge limits, river ecosystem
- **Municipal**: City Council approval, public participation, development agreements  
- **Financial**: €15-30M infrastructure investment for full development

### Risk Assessment
- **HIGH PROBABILITY**: Grid reinforcement requirements, competing regional load growth
- **MEDIUM PROBABILITY**: Environmental permit delays, seasonal flow restrictions
- **LOW PROBABILITY**: Municipal opposition (industrial zoning favorable)

**FEASIBILITY CONCLUSION**: Viable but requires 36-84 month development timeline and significant capital investment in transmission infrastructure.