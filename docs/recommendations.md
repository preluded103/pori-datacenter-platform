# Grid Intelligence Recommendation Engine Configuration

This configuration file controls the recommendation engine that evaluates grid connection opportunities and generates site suitability scores for datacenter development.

## Overview

The recommendation engine analyzes multiple factors to provide actionable insights for datacenter site selection. Each factor has configurable weights and thresholds that can be adjusted based on project requirements and regional priorities.

## Scoring Algorithm

The overall suitability score (0-100) is calculated using a weighted combination of multiple factors:

```
Overall Score = (Distance × W1) + (Capacity × W2) + (Cost × W3) + (Timeline × W4) + (Reliability × W5) + (TSO × W6) + (Risk × W7)
```

## Factor Weights Configuration

### Primary Factors (Total: 70%)

#### 1. Distance to Grid Connection (Weight: 20%)
**Current Weight:** `0.20`
- **Description:** Distance from site to nearest suitable connection point
- **Scoring Logic:** Inverse relationship - closer = higher score
- **Thresholds:**
  - Excellent (90-100): ≤ 2 km
  - Good (70-89): 2-5 km  
  - Fair (50-69): 5-10 km
  - Poor (0-49): > 10 km

**Adjustment Guidelines:**
- Increase weight (0.25-0.30) for projects with strict CAPEX constraints
- Decrease weight (0.10-0.15) for strategic sites where distance is acceptable

#### 2. Available Grid Capacity (Weight: 25%)
**Current Weight:** `0.25`
- **Description:** Available capacity at connection point relative to datacenter requirements
- **Scoring Logic:** Linear relationship - more capacity = higher score
- **Thresholds:**
  - Excellent (90-100): ≥ 200% of requirement (≥ 140 MW for 70 MW DC)
  - Good (70-89): 150-200% of requirement (105-140 MW)
  - Fair (50-69): 110-150% of requirement (77-105 MW)
  - Poor (0-49): < 110% of requirement (< 77 MW)

**Adjustment Guidelines:**
- Increase weight (0.30-0.35) for large-scale deployments (> 100 MW)
- Decrease weight (0.15-0.20) for phased development projects

#### 3. Connection Timeline (Weight: 15%)
**Current Weight:** `0.15`
- **Description:** Estimated time from application to energization
- **Scoring Logic:** Inverse relationship - faster = higher score
- **Thresholds:**
  - Excellent (90-100): ≤ 12 months
  - Good (70-89): 12-18 months
  - Fair (50-69): 18-24 months
  - Poor (0-49): > 24 months

**Adjustment Guidelines:**
- Increase weight (0.20-0.25) for urgent deployment requirements
- Decrease weight (0.08-0.12) for long-term strategic projects

#### 4. Connection Cost Estimate (Weight: 10%)
**Current Weight:** `0.10`
- **Description:** Estimated CAPEX for grid connection infrastructure
- **Scoring Logic:** Inverse relationship - lower cost = higher score
- **Thresholds:**
  - Excellent (90-100): ≤ €2M
  - Good (70-89): €2-4M
  - Fair (50-69): €4-8M
  - Poor (0-49): > €8M

**Adjustment Guidelines:**
- Increase weight (0.15-0.20) for cost-sensitive projects
- Decrease weight (0.05-0.08) when grid quality is prioritized over cost

### Secondary Factors (Total: 20%)

#### 5. TSO Reliability & Relationship (Weight: 8%)
**Current Weight:** `0.08`
- **Description:** TSO track record, stability, and cooperation level
- **Scoring Criteria:**
  - TSO financial stability (25% of factor)
  - Historical project success rate (25% of factor)
  - Regulatory environment (25% of factor)
  - Communication and transparency (25% of factor)

**TSO Scoring Matrix:**
- **Fingrid (Finland):** 95/100 - Excellent reliability, strong cooperation
- **Svenska Kraftnät (Sweden):** 90/100 - Very reliable, good processes
- **Energinet (Denmark):** 88/100 - Reliable, efficient permitting
- **Statnett (Norway):** 87/100 - Reliable, slower processes
- **50Hertz/Amprion/TenneT/TransnetBW (Germany):** 85/100 - Reliable but complex
- **TenneT NL (Netherlands):** 83/100 - Reliable, capacity constraints

#### 6. Grid Reliability & Redundancy (Weight: 7%)
**Current Weight:** `0.07`
- **Description:** Grid stability, redundancy, and outage history
- **Scoring Factors:**
  - Connection voltage level (40% of factor)
  - Redundant paths available (30% of factor)
  - Historical outage frequency (20% of factor)
  - Emergency response capability (10% of factor)

#### 7. Risk Assessment (Weight: 5%)
**Current Weight:** `0.05`
- **Description:** Technical, regulatory, and commercial risks
- **Risk Categories:**
  - Permitting risk (30% of factor)
  - Technical complexity risk (25% of factor)
  - Environmental/social risk (25% of factor)
  - Commercial risk (20% of factor)

### Bonus Factors (Total: 10% bonus potential)

#### Future Capacity Expansion (Bonus: up to 5%)
- **Description:** Potential for future capacity increases at the same connection point
- **Scoring:** Linear bonus based on expansion potential relative to initial capacity

#### Renewable Energy Integration (Bonus: up to 3%)
- **Description:** Proximity to renewable energy sources and grid flexibility
- **Scoring:** Bonus for sites within 10km of major renewable installations

#### Strategic Location Value (Bonus: up to 2%)
- **Description:** Long-term strategic value of the location
- **Scoring:** Bonus for locations in designated digital infrastructure zones

## Regional Adjustment Factors

### Nordic Countries (Finland, Sweden, Norway, Denmark)
- **Reliability Multiplier:** 1.05 (5% bonus for grid reliability)
- **Timeline Adjustment:** -10% (faster permitting processes)
- **Cost Adjustment:** +15% (higher construction costs)

### Central Europe (Germany, Netherlands)  
- **Capacity Constraint Factor:** 0.95 (5% penalty for grid congestion)
- **Timeline Adjustment:** +20% (complex regulatory environment)
- **Cost Adjustment:** +25% (higher equipment and labor costs)

## Minimum Qualifying Thresholds

Sites must meet these minimum criteria to receive recommendations:

### Absolute Requirements
- **Minimum Available Capacity:** 77 MW (110% of 70 MW requirement)
- **Maximum Distance:** 15 km to suitable connection point
- **Maximum Timeline:** 36 months
- **TSO Cooperation Level:** Must be willing to provide connection study

### Recommended Minimums
- **Capacity Buffer:** 105 MW (150% of requirement)
- **Distance:** ≤ 8 km
- **Timeline:** ≤ 24 months
- **Connection Voltage:** ≥ 110 kV

## Recommendation Categories

### Tier 1: Excellent (Score 80-100)
- **Action:** Proceed with detailed feasibility study
- **Characteristics:** Low risk, good economics, reasonable timeline
- **Typical Profile:** ≤ 5km, ≥ 140MW available, ≤ 18 months, ≤ €4M

### Tier 2: Good (Score 60-79)
- **Action:** Conditional proceed - negotiate improvements
- **Characteristics:** Moderate risk, acceptable economics
- **Typical Profile:** 5-8km, 105-140MW available, 18-24 months, €4-6M

### Tier 3: Fair (Score 40-59)
- **Action:** Detailed risk analysis required
- **Characteristics:** Higher risk, requires mitigation strategies
- **Typical Profile:** 8-12km, 80-105MW available, 24-30 months, €6-10M

### Tier 4: Poor (Score 0-39)
- **Action:** Not recommended without major improvements
- **Characteristics:** High risk, poor economics, long timeline

## Algorithm Tuning Guidelines

### For Aggressive Expansion Projects
```json
{
  "distance_weight": 0.15,
  "capacity_weight": 0.30,
  "timeline_weight": 0.20,
  "cost_weight": 0.05,
  "reliability_weight": 0.10,
  "tso_weight": 0.12,
  "risk_weight": 0.08
}
```

### For Conservative/Low-Risk Projects
```json
{
  "distance_weight": 0.25,
  "capacity_weight": 0.20,
  "timeline_weight": 0.10,
  "cost_weight": 0.15,
  "reliability_weight": 0.15,
  "tso_weight": 0.10,
  "risk_weight": 0.05
}
```

### For Cost-Optimized Projects
```json
{
  "distance_weight": 0.30,
  "capacity_weight": 0.20,
  "timeline_weight": 0.08,
  "cost_weight": 0.20,
  "reliability_weight": 0.10,
  "tso_weight": 0.07,
  "risk_weight": 0.05
}
```

### For Strategic Long-Term Projects
```json
{
  "distance_weight": 0.12,
  "capacity_weight": 0.35,
  "timeline_weight": 0.08,
  "cost_weight": 0.08,
  "reliability_weight": 0.20,
  "tso_weight": 0.12,
  "risk_weight": 0.05
}
```

## Implementation Notes

### Score Calculation Details
1. **Normalize each factor** to 0-100 scale based on thresholds
2. **Apply factor weights** to get weighted scores
3. **Sum weighted scores** for base score
4. **Apply regional adjustments** as multipliers
5. **Add bonus factors** (capped at 10 points)
6. **Final score capped** at 100

### Data Quality Considerations
- **Missing Data Penalty:** -10 points for each critical missing data point
- **Low Confidence Penalty:** -5 points for estimates with >30% uncertainty
- **Outdated Data Penalty:** -3 points for data >12 months old

### Sensitivity Analysis Recommendations
- **Run scenarios** with ±20% weight adjustments
- **Test impact** of threshold changes
- **Validate results** against known successful projects
- **Calibrate scores** to match expert judgment on reference sites

## Configuration Management

### Version Control
- Document all weight changes with rationale
- Maintain changelog with date, author, and business justification
- Test configuration changes on historical data before deployment

### Review Process
1. **Quarterly Review:** Assess scoring accuracy against actual project outcomes
2. **Annual Calibration:** Major review of weights and thresholds
3. **Project-Specific Tuning:** Custom weights for unique requirements

### Monitoring and Validation
- **Track prediction accuracy** vs. actual connection costs and timelines
- **Collect feedback** from business development and engineering teams
- **Benchmark against** industry standards and competitor analyses

---

**Last Updated:** August 27, 2025  
**Configuration Version:** 1.0  
**Next Review Date:** November 27, 2025  

**Change History:**
- v1.0 (Aug 2025): Initial configuration based on European datacenter projects
- [Future changes will be logged here]