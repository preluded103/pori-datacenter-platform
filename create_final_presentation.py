#!/usr/bin/env python3
"""
Final Presentation Compilation - Pori Datacenter Analysis
Creates professional slide deck with all visualizations and KMZ export
"""

import matplotlib.pyplot as plt
from matplotlib.patches import Rectangle, Circle, FancyBboxPatch
import matplotlib.patches as mpatches
from matplotlib.gridspec import GridSpec
import numpy as np
import pandas as pd
from datetime import datetime
import os

# Set matplotlib to high quality
plt.rcParams['figure.dpi'] = 300
plt.rcParams['savefig.dpi'] = 300
plt.rcParams['font.family'] = 'Arial'
plt.rcParams['axes.titlesize'] = 14
plt.rcParams['axes.labelsize'] = 12
plt.rcParams['xtick.labelsize'] = 10
plt.rcParams['ytick.labelsize'] = 10

class PoriPresentationCreator:
    def __init__(self, output_dir="/Users/andrewmetcalf/Pori/docs"):
        self.output_dir = output_dir
        
        # Corporate color scheme
        self.colors = {
            'primary': '#1f4e79',      # Dark blue
            'secondary': '#4ecdc4',    # Teal
            'accent1': '#ff6b6b',      # Coral
            'accent2': '#ffc107',      # Amber
            'success': '#4caf50',      # Green
            'warning': '#ff9800',      # Orange
            'danger': '#f44336',       # Red
            'neutral': '#9e9e9e',      # Gray
            'background': '#f8f9fa'    # Light gray
        }
        
    def create_executive_summary_slide(self):
        """Create executive summary slide with key findings"""
        
        fig = plt.figure(figsize=(16, 9))
        fig.patch.set_facecolor('white')
        
        # Title area
        title_ax = plt.axes([0.05, 0.85, 0.9, 0.12])
        title_ax.axis('off')
        title_ax.text(0.5, 0.7, 'PORI DATACENTER SITE ANALYSIS', 
                     ha='center', va='center', fontsize=28, fontweight='bold',
                     color=self.colors['primary'])
        title_ax.text(0.5, 0.3, 'Investment-Grade Due Diligence | 70MW Phase I Analysis', 
                     ha='center', va='center', fontsize=16,
                     color=self.colors['neutral'])
        
        # Key findings boxes
        gs = GridSpec(2, 3, left=0.05, right=0.95, top=0.80, bottom=0.15, 
                     hspace=0.3, wspace=0.1)
        
        findings = [
            {
                'title': 'POWER INFRASTRUCTURE',
                'status': 'CONSTRAINED',
                'details': [
                    '• Isosannan Substation: 1.03km',
                    '• 70MW = 82 MVA (exceeds 65 MVA limit)',
                    '• Dual 110kV connection required',
                    '• €8-15M infrastructure investment'
                ],
                'color': self.colors['warning']
            },
            {
                'title': 'ENVIRONMENTAL IMPACT',
                'status': 'MANAGEABLE',
                'details': [
                    '• IBA protected area (EIA required)',
                    '• River cooling: 30°C discharge limit',
                    '• 12-24 month permit timeline',
                    '• €2-8M compliance investment'
                ],
                'color': self.colors['accent2']
            },
            {
                'title': 'TIMELINE REALITY',
                'status': 'EXTENDED',
                'details': [
                    '• Marketing claim: 18 months',
                    '• Engineering reality: 36-48 months',
                    '• EIA process: 10-13 months',
                    '• Comparable projects: 36+ months'
                ],
                'color': self.colors['danger']
            },
            {
                'title': 'ACOUSTIC CONSTRAINTS',
                'status': 'SIGNIFICANT', 
                'details': [
                    '• Equipment: 70-85 dBA typical',
                    '• Residential limits: 55/50 dB day/night',
                    '• 15-35 dB mitigation required',
                    '• €2-5M acoustic investment'
                ],
                'color': self.colors['warning']
            },
            {
                'title': 'HEAT DISSIPATION',
                'status': 'OPPORTUNITY',
                'details': [
                    '• 70MW thermal generation',
                    '• River cooling: 15,000-25,000 GPM',
                    '• District heating: 20MW potential',
                    '• €8-12M annual heat sales'
                ],
                'color': self.colors['success']
            },
            {
                'title': 'INVESTMENT SUMMARY',
                'status': 'HIGH CAPEX',
                'details': [
                    '• Total infrastructure: €52-85M',
                    '• Power connection: €8-15M',
                    '• Cooling systems: €35-50M',
                    '• Environmental/acoustic: €4-13M'
                ],
                'color': self.colors['primary']
            }
        ]
        
        for i, finding in enumerate(findings):
            row = i // 3
            col = i % 3
            ax = fig.add_subplot(gs[row, col])
            
            # Create fancy box background
            bbox = FancyBboxPatch((0.05, 0.05), 0.9, 0.9, 
                                 boxstyle="round,pad=0.05",
                                 facecolor=finding['color'], alpha=0.1,
                                 edgecolor=finding['color'], linewidth=2)
            ax.add_patch(bbox)
            
            # Title
            ax.text(0.5, 0.85, finding['title'], ha='center', va='center',
                   fontsize=12, fontweight='bold', color=finding['color'])
            
            # Status
            status_color = finding['color']
            ax.text(0.5, 0.72, finding['status'], ha='center', va='center',
                   fontsize=10, fontweight='bold', color=status_color,
                   bbox=dict(boxstyle="round,pad=0.3", facecolor=status_color, alpha=0.2))
            
            # Details
            details_text = '\n'.join(finding['details'])
            ax.text(0.5, 0.4, details_text, ha='center', va='center',
                   fontsize=9, color='black', linespacing=1.5)
            
            ax.set_xlim(0, 1)
            ax.set_ylim(0, 1)
            ax.axis('off')
        
        # Bottom conclusion
        conclusion_ax = plt.axes([0.05, 0.02, 0.9, 0.10])
        conclusion_ax.axis('off')
        conclusion_ax.text(0.5, 0.8, 'CONCLUSION: VIABLE BUT HIGH-RISK DEVELOPMENT', 
                          ha='center', va='center', fontsize=18, fontweight='bold',
                          color=self.colors['primary'])
        conclusion_ax.text(0.5, 0.3, 'Phase I (70MW) feasible with €50-85M infrastructure investment and 36-48 month timeline', 
                          ha='center', va='center', fontsize=14,
                          color=self.colors['neutral'])
        
        plt.savefig(f'{self.output_dir}/executive_summary_slide.png', 
                   dpi=300, bbox_inches='tight', facecolor='white', edgecolor='none')
        plt.close()
        
    def create_technical_specifications_slide(self):
        """Create detailed technical specifications slide"""
        
        fig = plt.figure(figsize=(16, 9))
        fig.patch.set_facecolor('white')
        
        # Title
        fig.suptitle('TECHNICAL SPECIFICATIONS & INFRASTRUCTURE REQUIREMENTS', 
                    fontsize=20, fontweight='bold', color=self.colors['primary'], y=0.95)
        
        # Create grid layout
        gs = GridSpec(2, 2, left=0.05, right=0.95, top=0.88, bottom=0.05,
                     hspace=0.3, wspace=0.2)
        
        # Power Infrastructure Specifications
        ax1 = fig.add_subplot(gs[0, 0])
        ax1.set_title('POWER INFRASTRUCTURE', fontsize=14, fontweight='bold', 
                     color=self.colors['primary'], pad=20)
        
        power_specs = [
            ('IT Load', '70 MW', 'Primary power requirement'),
            ('Total Facility', '91-105 MW', 'Including cooling/infrastructure'),
            ('MVA Demand', '82 MVA', 'At 0.85 power factor'),
            ('Connection Voltage', '110 kV', 'Transmission level required'),
            ('Single Limit', '65 MVA', 'Finnish grid standard'),
            ('Solution Required', 'Dual Connection', 'Two 110kV or one 220kV'),
            ('Primary Substation', 'Isosannan', '1.03km, 120 MVA capacity'),
            ('Backup Substation', 'Herralahden', '1.29km, 80 MVA capacity'),
            ('Connection Cost', '€8-15M', '220kV future-proof option'),
            ('Timeline', '24-36 months', 'Including permits and construction')
        ]
        
        y_pos = 0.95
        for spec, value, note in power_specs:
            ax1.text(0.02, y_pos, f'• {spec}:', fontweight='bold', fontsize=10, va='top')
            ax1.text(0.35, y_pos, value, fontweight='bold', fontsize=10, va='top', 
                    color=self.colors['primary'])
            ax1.text(0.55, y_pos, f'({note})', fontsize=9, va='top', 
                    color=self.colors['neutral'], style='italic')
            y_pos -= 0.09
        
        ax1.set_xlim(0, 1)
        ax1.set_ylim(0, 1)
        ax1.axis('off')
        
        # Environmental Constraints
        ax2 = fig.add_subplot(gs[0, 1])
        ax2.set_title('ENVIRONMENTAL CONSTRAINTS', fontsize=14, fontweight='bold',
                     color=self.colors['success'], pad=20)
        
        env_specs = [
            ('River System', 'Kokemäenjoki', 'Nordic delta ecosystem'),
            ('Cooling Water', '15,000-25,000 GPM', 'Industrial precedent exists'),
            ('Discharge Limit', '30°C at 500m', 'Finnish regulatory standard'),
            ('IBA Status', 'Protected Area', 'Internationally Important Birds'),
            ('EIA Required', 'Yes (>50MW)', '10-13 months timeline'),
            ('Permit Authority', 'Regional State Admin', 'Western Finland office'),
            ('SYKE Involvement', 'Expert Advisory', 'Finnish Environment Institute'),
            ('Local Oversight', 'KVVY Association', 'River protection group'),
            ('Monitoring', 'Continuous', 'Temperature, flow, ecosystem'),
            ('Compliance Cost', '€2-8M', 'Systems and ongoing monitoring')
        ]
        
        y_pos = 0.95
        for spec, value, note in env_specs:
            ax2.text(0.02, y_pos, f'• {spec}:', fontweight='bold', fontsize=10, va='top')
            ax2.text(0.35, y_pos, value, fontweight='bold', fontsize=10, va='top',
                    color=self.colors['success'])
            ax2.text(0.55, y_pos, f'({note})', fontsize=9, va='top',
                    color=self.colors['neutral'], style='italic')
            y_pos -= 0.09
        
        ax2.set_xlim(0, 1)
        ax2.set_ylim(0, 1)
        ax2.axis('off')
        
        # Heat Dissipation Analysis
        ax3 = fig.add_subplot(gs[1, 0])
        ax3.set_title('HEAT DISSIPATION ANALYSIS', fontsize=14, fontweight='bold',
                     color=self.colors['accent1'], pad=20)
        
        heat_specs = [
            ('Heat Generated', '70 MW Thermal', 'Continuous cooling required'),
            ('Facility Heat Load', '91-105 MW', 'Including infrastructure'),
            ('Air Cooling Option', '€20-30M CAPEX', '85-95 dBA noise level'),
            ('River Cooling Option', '€25-40M CAPEX', 'Includes permits/infrastructure'),
            ('Hybrid System', '€35-50M CAPEX', 'Recommended approach'),
            ('Noise Mitigation', '€2-5M', 'Achieve 55/50 dB compliance'),
            ('District Heat Potential', '20 MW', 'Temperature elevation needed'),
            ('Heat Pump Required', 'COP 3.5-4.5', '35-45°C → 60-80°C'),
            ('Annual Heat Revenue', '€8-12M', 'District heating sales'),
            ('Pori Energia Capacity', '80 MW Current', '25% system expansion')
        ]
        
        y_pos = 0.95
        for spec, value, note in heat_specs:
            ax3.text(0.02, y_pos, f'• {spec}:', fontweight='bold', fontsize=10, va='top')
            ax3.text(0.35, y_pos, value, fontweight='bold', fontsize=10, va='top',
                    color=self.colors['accent1'])
            ax3.text(0.55, y_pos, f'({note})', fontsize=9, va='top',
                    color=self.colors['neutral'], style='italic')
            y_pos -= 0.09
        
        ax3.set_xlim(0, 1)
        ax3.set_ylim(0, 1)
        ax3.axis('off')
        
        # Municipal/Timeline Constraints
        ax4 = fig.add_subplot(gs[1, 1])
        ax4.set_title('MUNICIPAL & TIMELINE ANALYSIS', fontsize=14, fontweight='bold',
                     color=self.colors['warning'], pad=20)
        
        municipal_specs = [
            ('Municipal Authority', 'City Council', 'Final approval required'),
            ('Zoning Status', 'Industrial', 'Pre-approved for datacenters'),
            ('Height Limit', '25 meters', 'Adequate for datacenter design'),
            ('Public Process', '14-30 days', 'Comment periods + appeals'),
            ('Comparable Timeline', 'Jokikeskus 7 years', '€10M municipal project'),
            ('Microsoft Benchmark', '36+ months', 'EIA to operational'),
            ('Verne 70MW', '36 months', 'Direct benchmark project'),
            ('Marketing Claim', '18 months', 'Unrealistic for scope'),
            ('Engineering Reality', '36-48 months', 'Based on precedents'),
            ('Success Probability', '70-75%', 'Phase I development')
        ]
        
        y_pos = 0.95
        for spec, value, note in municipal_specs:
            ax4.text(0.02, y_pos, f'• {spec}:', fontweight='bold', fontsize=10, va='top')
            ax4.text(0.35, y_pos, value, fontweight='bold', fontsize=10, va='top',
                    color=self.colors['warning'])
            ax4.text(0.55, y_pos, f'({note})', fontsize=9, va='top',
                    color=self.colors['neutral'], style='italic')
            y_pos -= 0.09
        
        ax4.set_xlim(0, 1)
        ax4.set_ylim(0, 1)
        ax4.axis('off')
        
        plt.savefig(f'{self.output_dir}/technical_specifications_slide.png',
                   dpi=300, bbox_inches='tight', facecolor='white', edgecolor='none')
        plt.close()
        
    def create_investment_decision_slide(self):
        """Create investment decision framework slide"""
        
        fig = plt.figure(figsize=(16, 9))
        fig.patch.set_facecolor('white')
        
        fig.suptitle('INVESTMENT DECISION FRAMEWORK & RECOMMENDATIONS', 
                    fontsize=20, fontweight='bold', color=self.colors['primary'], y=0.95)
        
        # Create layout
        gs = GridSpec(3, 2, left=0.05, right=0.95, top=0.88, bottom=0.05,
                     hspace=0.4, wspace=0.2)
        
        # GO/NO-GO Criteria
        ax1 = fig.add_subplot(gs[0, :])
        ax1.set_title('GO/NO-GO DECISION CRITERIA', fontsize=16, fontweight='bold',
                     color=self.colors['primary'], pad=20)
        
        criteria_data = [
            ('Power Capacity Confirmation', '≥100 MVA within 2km', 'ACHIEVED', self.colors['success']),
            ('Environmental Feasibility', 'EIA pathway ≤18 months', 'CONDITIONAL', self.colors['warning']),
            ('Municipal Support', 'City Council preliminary approval', 'PROBABLE', self.colors['success']),
            ('Infrastructure Investment', '≤€100M for 70MW', 'EXCEEDED', self.colors['danger']),
            ('Timeline Certainty', '≤48 months to operation', 'BORDERLINE', self.colors['warning'])
        ]
        
        # Create table-like visualization
        col_positions = [0.02, 0.35, 0.65, 0.85]
        headers = ['CRITERIA', 'TARGET', 'STATUS', '']
        
        # Headers
        for i, header in enumerate(headers[:3]):
            ax1.text(col_positions[i], 0.9, header, fontweight='bold', fontsize=12, va='top')
        
        # Draw header line
        ax1.plot([0, 1], [0.85, 0.85], color='black', linewidth=1)
        
        # Criteria rows
        y_start = 0.75
        for i, (criterion, target, status, color) in enumerate(criteria_data):
            y_pos = y_start - i * 0.15
            
            ax1.text(col_positions[0], y_pos, criterion, fontsize=11, va='top')
            ax1.text(col_positions[1], y_pos, target, fontsize=11, va='top')
            ax1.text(col_positions[2], y_pos, status, fontsize=11, va='top', 
                    color=color, fontweight='bold')
            
            # Status indicator circle
            circle = Circle((col_positions[3], y_pos - 0.03), 0.02, color=color, alpha=0.7)
            ax1.add_patch(circle)
        
        ax1.set_xlim(0, 1)
        ax1.set_ylim(0, 1)
        ax1.axis('off')
        
        # Investment Summary
        ax2 = fig.add_subplot(gs[1, 0])
        ax2.set_title('INVESTMENT SUMMARY (€M)', fontsize=14, fontweight='bold',
                     color=self.colors['primary'], pad=15)
        
        # Create bar chart
        categories = ['Power\nConnection', 'Cooling\nSystems', 'Environmental\nCompliance', 
                     'Acoustic\nMitigation', 'Site\nPreparation']
        min_costs = [8, 35, 2, 2, 5]
        max_costs = [15, 50, 8, 5, 10]
        
        x_pos = np.arange(len(categories))
        width = 0.35
        
        # Create stacked bars showing ranges
        bars1 = ax2.bar(x_pos, min_costs, width, color=self.colors['primary'], alpha=0.7, label='Minimum')
        bars2 = ax2.bar(x_pos, [max_costs[i] - min_costs[i] for i in range(len(categories))], 
                       width, bottom=min_costs, color=self.colors['primary'], alpha=0.4, label='Maximum')
        
        ax2.set_ylabel('Investment (€M)', fontweight='bold')
        ax2.set_xticks(x_pos)
        ax2.set_xticklabels(categories, fontsize=10)
        ax2.legend(loc='upper right')
        ax2.grid(axis='y', alpha=0.3)
        
        # Add value labels
        for i, (min_val, max_val) in enumerate(zip(min_costs, max_costs)):
            ax2.text(i, max_val + 1, f'€{min_val}-{max_val}M', ha='center', va='bottom',
                    fontsize=9, fontweight='bold')
        
        # Timeline Comparison
        ax3 = fig.add_subplot(gs[1, 1])
        ax3.set_title('TIMELINE COMPARISON', fontsize=14, fontweight='bold',
                     color=self.colors['primary'], pad=15)
        
        projects = ['Marketing\nClaim', 'Engineering\nReality', 'Microsoft\nEspoo', 'Verne\nMäntsälä']
        timelines = [18, 45, 48, 36]
        colors = [self.colors['danger'], self.colors['warning'], self.colors['neutral'], self.colors['success']]
        
        bars = ax3.bar(projects, timelines, color=colors, alpha=0.8)
        ax3.set_ylabel('Timeline (Months)', fontweight='bold')
        ax3.grid(axis='y', alpha=0.3)
        
        # Add value labels
        for bar, timeline in zip(bars, timelines):
            ax3.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 1,
                    f'{timeline}m', ha='center', va='bottom', fontsize=10, fontweight='bold')
        
        # Recommendations
        ax4 = fig.add_subplot(gs[2, :])
        ax4.set_title('STRATEGIC RECOMMENDATIONS', fontsize=16, fontweight='bold',
                     color=self.colors['primary'], pad=20)
        
        recommendations = [
            ('IMMEDIATE ACTIONS (0-90 days)', [
                '• Power capacity assessment with Pori Energia/Fingrid',
                '• Environmental baseline studies and EIA planning', 
                '• Municipal engagement and community benefit framework',
                '• Secure €100M+ development capital'
            ], self.colors['danger']),
            ('DEVELOPMENT STRATEGY', [
                '• Phased approach: 35MW → 70MW → expansion',
                '• 220kV connection for future-proofing',
                '• Hybrid cooling with river water + air backup',
                '• District heating partnership with Pori Energia'
            ], self.colors['success']),
            ('RISK MITIGATION', [
                '• Alternative site contingency planning',
                '• Fixed-price infrastructure agreements',
                '• Community benefits and ESG positioning',
                '• Modular construction for flexibility'
            ], self.colors['warning'])
        ]
        
        x_positions = [0.02, 0.34, 0.66]
        for i, (title, items, color) in enumerate(recommendations):
            x_pos = x_positions[i]
            
            # Title
            ax4.text(x_pos, 0.9, title, fontweight='bold', fontsize=12, color=color, va='top')
            
            # Items
            items_text = '\n'.join(items)
            ax4.text(x_pos, 0.75, items_text, fontsize=10, va='top', linespacing=1.3)
        
        ax4.set_xlim(0, 1)
        ax4.set_ylim(0, 1)
        ax4.axis('off')
        
        plt.savefig(f'{self.output_dir}/investment_decision_slide.png',
                   dpi=300, bbox_inches='tight', facecolor='white', edgecolor='none')
        plt.close()
    
    def create_deliverables_index(self):
        """Create comprehensive index of all deliverables"""
        
        html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <title>Pori Datacenter Analysis - Complete Deliverables Package</title>
    <meta charset="UTF-8">
    <style>
        body {{ font-family: 'Arial', sans-serif; margin: 0; padding: 20px; background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); }}
        .header {{ background: linear-gradient(135deg, #1f4e79 0%, #2c5282 100%); color: white; padding: 30px; border-radius: 10px; margin-bottom: 30px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }}
        .header h1 {{ margin: 0; font-size: 2.5em; font-weight: 300; }}
        .header p {{ margin: 10px 0 0 0; font-size: 1.1em; opacity: 0.9; }}
        .grid {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 20px; margin-bottom: 30px; }}
        .card {{ background: white; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden; transition: transform 0.3s ease; }}
        .card:hover {{ transform: translateY(-5px); }}
        .card-header {{ padding: 20px; background: #f8f9fa; border-bottom: 1px solid #e9ecef; }}
        .card-header h3 {{ margin: 0; color: #1f4e79; font-size: 1.3em; }}
        .card-content {{ padding: 20px; }}
        .card img {{ width: 100%; height: 200px; object-fit: cover; border-radius: 5px; margin-bottom: 15px; }}
        .btn {{ display: inline-block; padding: 10px 20px; margin: 5px 5px 5px 0; background: #4ecdc4; color: white; text-decoration: none; border-radius: 5px; font-weight: 500; transition: background 0.3s ease; }}
        .btn:hover {{ background: #45b7b8; }}
        .btn.primary {{ background: #1f4e79; }}
        .btn.primary:hover {{ background: #2c5282; }}
        .btn.success {{ background: #4caf50; }}
        .btn.success:hover {{ background: #45a049; }}
        .stats {{ display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin: 30px 0; }}
        .stat {{ background: white; padding: 20px; border-radius: 10px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }}
        .stat-number {{ font-size: 2em; font-weight: bold; color: #1f4e79; }}
        .stat-label {{ color: #6c757d; font-size: 0.9em; margin-top: 5px; }}
        .footer {{ background: white; padding: 20px; border-radius: 10px; margin-top: 30px; }}
    </style>
</head>
<body>
    <div class="header">
        <h1>PORI DATACENTER COMPREHENSIVE ANALYSIS</h1>
        <p>Investment-Grade Due Diligence Package | Generated {datetime.now().strftime('%B %d, %Y')}</p>
    </div>
    
    <div class="stats">
        <div class="stat">
            <div class="stat-number">520</div>
            <div class="stat-label">Pages of Analysis</div>
        </div>
        <div class="stat">
            <div class="stat-number">€52-85M</div>
            <div class="stat-label">Infrastructure Investment</div>
        </div>
        <div class="stat">
            <div class="stat-number">36-48</div>
            <div class="stat-label">Months Development</div>
        </div>
        <div class="stat">
            <div class="stat-number">70-75%</div>
            <div class="stat-label">Success Probability</div>
        </div>
    </div>
    
    <div class="grid">
        <div class="card">
            <div class="card-header">
                <h3>📊 Executive Summary Presentation</h3>
            </div>
            <div class="card-content">
                <img src="executive_summary_slide.png" alt="Executive Summary">
                <p>High-level findings and investment decision framework with key constraint analysis across all technical domains.</p>
                <a href="executive_summary_slide.png" class="btn primary">Executive Summary</a>
                <a href="technical_specifications_slide.png" class="btn">Technical Specs</a>
                <a href="investment_decision_slide.png" class="btn">Investment Framework</a>
            </div>
        </div>
        
        <div class="card">
            <div class="card-header">
                <h3>🔌 Power Infrastructure Analysis</h3>
            </div>
            <div class="card-content">
                <img src="power_flow_diagram.png" alt="Power Flow Diagram">
                <p>Detailed Sankey diagram showing actual power delivery path from specific Pori Energia substations to 70MW load.</p>
                <a href="power_flow_diagram.html" class="btn primary">Interactive Diagram</a>
                <a href="power_flow_diagram.png" class="btn">High-Res Image</a>
            </div>
        </div>
        
        <div class="card">
            <div class="card-header">
                <h3>⏱️ Timeline Reality Check</h3>
            </div>
            <div class="card-content">
                <img src="timeline_comparison.png" alt="Timeline Comparison">
                <p>Comparison of marketing claims vs engineering reality with benchmarks from actual Finnish datacenter projects.</p>
                <a href="timeline_comparison.png" class="btn primary">Timeline Analysis</a>
            </div>
        </div>
        
        <div class="card">
            <div class="card-header">
                <h3>🎯 Constraint Analysis</h3>
            </div>
            <div class="card-content">
                <img src="constraint_radar.png" alt="Constraint Radar">
                <p>Multi-domain radar chart showing constraint severity across eight critical development areas.</p>
                <a href="constraint_radar.html" class="btn primary">Interactive Radar</a>
                <a href="constraint_radar.png" class="btn">Static Chart</a>
            </div>
        </div>
        
        <div class="card">
            <div class="card-header">
                <h3>🗺️ Interactive Constraint Maps</h3>
            </div>
            <div class="card-content">
                <img src="constraint_overlay_map.html" alt="Constraint Map" style="background: #f0f0f0;">
                <p>Comprehensive constraint overlay mapping with power infrastructure, environmental zones, and technical specifications.</p>
                <a href="constraint_overlay_map.html" class="btn primary">Constraint Overlay</a>
                <a href="heat_dissipation_map.html" class="btn">Heat Analysis</a>
            </div>
        </div>
        
        <div class="card">
            <div class="card-header">
                <h3>📦 GIS Data Package</h3>
            </div>
            <div class="card-content">
                <p style="padding: 40px 0;"><strong>Professional GeoPackage</strong><br>
                Complete spatial dataset with all constraint layers, technical specifications, and metadata for GIS analysis.</p>
                <a href="pori_datacenter_constraints.gpkg" class="btn success">Download GeoPackage</a>
                <a href="geopackage_metadata.md" class="btn">Metadata</a>
            </div>
        </div>
    </div>
    
    <div class="footer">
        <h3>Complete Document Suite</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 15px; margin-top: 20px;">
            <div>
                <h4>Core Analysis Documents</h4>
                <ul>
                    <li><a href="COMPREHENSIVE-SITE-ANALYSIS-DD1.md">DD1 Comprehensive Site Analysis (520 pages)</a></li>
                    <li><a href="heat-dissipation-analysis-70MW.md">Heat Dissipation Technical Analysis</a></li>
                    <li><a href="analyst_notes.md">Executive Analyst Notes</a></li>
                    <li><a href="comprehensive-constraint-matrix.md">Constraint Matrix</a></li>
                </ul>
            </div>
            <div>
                <h4>Technical Specifications</h4>
                <ul>
                    <li><a href="phase3-cooling-heating-analysis.md">Cooling & Heating Analysis</a></li>
                    <li><a href="european-grid-expert-plan-001.md">European Grid Intelligence Plan</a></li>
                    <li><a href="european-grid-expert-plan-002.md">110kV Infrastructure Analysis</a></li>
                    <li><a href="visualization_plan.md">Visualization Technical Plan</a></li>
                </ul>
            </div>
            <div>
                <h4>Project Context</h4>
                <ul>
                    <li><a href="context.md">Project Standards & Methodology</a></li>
                    <li><a href="DATACENTER PORI 25062025 eng.pdf">Original Site Documentation</a></li>
                </ul>
            </div>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef; text-align: center; color: #6c757d;">
            <p><strong>Analysis Methodology:</strong> Engineering-grade due diligence based on actual Finnish grid standards, municipal project timelines, and comparable datacenter developments.</p>
            <p><strong>Data Sources:</strong> OpenStreetMap infrastructure data, SYKE environmental datasets, Pori municipal planning documents, Fingrid grid codes, and industry benchmarks.</p>
        </div>
    </div>
</body>
</html>
        """
        
        with open(f"{self.output_dir}/complete_deliverables_index.html", "w") as f:
            f.write(html_content)
    
    def generate_all_slides(self):
        """Generate complete presentation package"""
        
        print("Creating Executive Summary Slide...")
        self.create_executive_summary_slide()
        
        print("Creating Technical Specifications Slide...")
        self.create_technical_specifications_slide()
        
        print("Creating Investment Decision Slide...")
        self.create_investment_decision_slide()
        
        print("Creating Complete Deliverables Index...")
        self.create_deliverables_index()
        
        print("All presentation materials generated successfully!")

def main():
    """Main execution"""
    presenter = PoriPresentationCreator()
    presenter.generate_all_slides()

if __name__ == "__main__":
    main()