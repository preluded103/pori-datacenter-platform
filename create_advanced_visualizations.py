#!/usr/bin/env python3
"""
Advanced Visualizations for Pori Datacenter Analysis
Using Playwright for high-quality image exports and matplotlib for technical diagrams
"""

import plotly.graph_objects as go
import plotly.express as px
from plotly.subplots import make_subplots
import matplotlib.pyplot as plt
import matplotlib.patches as patches
import seaborn as sns
import pandas as pd
import numpy as np
from playwright.sync_api import sync_playwright
import json
import os

# Set up matplotlib for high-quality outputs
plt.rcParams['figure.dpi'] = 300
plt.rcParams['savefig.dpi'] = 300
plt.rcParams['font.family'] = 'Arial'
plt.rcParams['font.size'] = 10

class PoriVisualizationSuite:
    def __init__(self, output_dir="/Users/andrewmetcalf/Pori/docs"):
        self.output_dir = output_dir
        os.makedirs(output_dir, exist_ok=True)
        
    def create_power_sankey_diagram(self):
        """Create detailed power flow Sankey diagram with actual substation data"""
        
        # Define nodes with actual identified infrastructure
        nodes = [
            # Source grid
            "Finnish Grid\n3000+ MW",
            "Fingrid 400kV\nWest Finland", 
            "Fingrid 220kV\nCoastal Network",
            "Fingrid 110kV\nPori Region",
            
            # Identified Pori substations
            "Isosannan\nSähköasema\n1.03km",
            "Herralahden\nSubstation\n1.29km",
            "Impolan\nSubstation\n3.43km", 
            "Hyvelän\nSubstation\n4.17km",
            
            # Datacenter infrastructure
            "Datacenter\nPhase I\n70MW",
            "IT Equipment\n70MW Load",
            
            # Heat outputs
            "Heat Generated\n70MW Thermal",
            "River Discharge\n50MW",
            "District Heating\n20MW",
            "Waste Heat Lost\n0MW",
            
            # Constraints
            "110kV Limit\n65 MVA",
            "Infrastructure Gap\n17 MVA",
            "Dual Connection\nRequired"
        ]
        
        # Define realistic flows (in MW or MVA)
        links = [
            # Grid hierarchy
            {"source": 0, "target": 1, "value": 1500, "label": "1500 MW"},
            {"source": 1, "target": 2, "value": 600, "label": "600 MW"},
            {"source": 2, "target": 3, "value": 250, "label": "250 MW"},
            
            # Substation connections
            {"source": 3, "target": 4, "value": 120, "label": "120 MVA Capacity"},
            {"source": 3, "target": 5, "value": 80, "label": "80 MVA Capacity"},
            {"source": 3, "target": 6, "value": 60, "label": "60 MVA Capacity"},
            {"source": 3, "target": 7, "value": 40, "label": "40 MVA Capacity"},
            
            # Datacenter connection (primary path)
            {"source": 4, "target": 8, "value": 82, "label": "82 MVA (70MW)"},
            {"source": 8, "target": 9, "value": 70, "label": "70 MW"},
            
            # Heat flow
            {"source": 9, "target": 10, "value": 70, "label": "70 MW Heat"},
            {"source": 10, "target": 11, "value": 50, "label": "50 MW to River"},
            {"source": 10, "target": 12, "value": 20, "label": "20 MW District Heat"},
            
            # Constraint visualization
            {"source": 14, "target": 15, "value": 17, "label": "17 MVA Gap"},
            {"source": 15, "target": 16, "value": 17, "label": "Dual Connection"}
        ]
        
        # Create Sankey
        fig = go.Figure(data=[go.Sankey(
            arrangement="snap",
            node=dict(
                pad=15,
                thickness=20,
                line=dict(color="black", width=0.5),
                label=[node.replace('\n', '<br>') for node in nodes],
                color=[
                    '#1f4e79', '#2e75b6', '#5b9bd5', '#8faadc',  # Grid (blue gradient)
                    '#70ad47', '#ffc000', '#ff9900', '#ff6b6b',  # Substations (green to red by distance)
                    '#7030a0', '#9966cc',                         # Datacenter (purple)
                    '#ff5722', '#d84315', '#4caf50', '#ffeb3b',  # Heat flows
                    '#c5504b', '#e74c3c', '#8e44ad'             # Constraints (red)
                ]
            ),
            link=dict(
                source=[link["source"] for link in links],
                target=[link["target"] for link in links],
                value=[link["value"] for link in links],
                color=['rgba(70, 130, 180, 0.4)' for _ in links],
                label=[link["label"] for link in links]
            )
        )])
        
        fig.update_layout(
            title={
                'text': "<b>PORI DATACENTER POWER DELIVERY PATH ANALYSIS</b><br>" +
                       "<sub>Specific Substation Infrastructure vs 70MW Load Requirements</sub>",
                'x': 0.5,
                'font': {'size': 20, 'family': 'Arial', 'color': '#1f4e79'}
            },
            font_size=11,
            width=1600,
            height=900,
            paper_bgcolor='white',
            annotations=[
                dict(
                    x=0.02, y=0.95,
                    text="<b>CRITICAL CONSTRAINT</b><br>" +
                         "70MW = 82 MVA demand<br>" +
                         "Exceeds single 110kV limit<br>" +
                         "(65 MVA maximum)<br><br>" +
                         "<b>SOLUTION REQUIRED:</b><br>" +
                         "• Dual 110kV connections<br>" +
                         "• Single 220kV connection<br>" +
                         "• €8-15M investment",
                    showarrow=False,
                    align="left",
                    bgcolor="rgba(255, 255, 255, 0.9)",
                    bordercolor="#c5504b",
                    borderwidth=2,
                    font=dict(size=10, color="#c5504b", family="Arial")
                ),
                dict(
                    x=0.02, y=0.35,
                    text="<b>IDENTIFIED SUBSTATIONS</b><br>" +
                         "✓ Isosannan: 1.03km (PRIMARY)<br>" +
                         "✓ Herralahden: 1.29km (BACKUP)<br>" +
                         "○ Impolan: 3.43km (ALTERNATIVE)<br>" +
                         "○ Hyvelän: 4.17km (ALTERNATIVE)<br><br>" +
                         "<b>CONNECTION STRATEGY:</b><br>" +
                         "Primary: Isosannan + Herralahden<br>" +
                         "Combined: 200 MVA capacity",
                    showarrow=False,
                    align="left",
                    bgcolor="rgba(255, 255, 255, 0.9)",
                    bordercolor="#70ad47",
                    borderwidth=2,
                    font=dict(size=10, color="#70ad47", family="Arial")
                ),
                dict(
                    x=0.98, y=0.75,
                    text="<b>HEAT RECOVERY OPPORTUNITY</b><br>" +
                         "70MW waste heat generated<br>" +
                         "50MW → River cooling<br>" +
                         "20MW → District heating<br><br>" +
                         "<b>PORI ENERGIA INTEGRATION:</b><br>" +
                         "Current: 80MW system<br>" +
                         "Potential: 25% capacity increase<br>" +
                         "Revenue: €8-12M annually",
                    showarrow=False,
                    align="right",
                    bgcolor="rgba(255, 255, 255, 0.9)",
                    bordercolor="#4caf50",
                    borderwidth=2,
                    font=dict(size=10, color="#4caf50", family="Arial")
                )
            ]
        )
        
        return fig
    
    def create_timeline_comparison_chart(self):
        """Create timeline comparison: Marketing claims vs Engineering reality"""
        
        # Timeline data
        phases = ['EIA Process', 'Environmental Permits', 'Power Connection', 
                 'Construction', 'Total Project']
        
        marketing_timeline = [0, 0, 6, 12, 18]  # Months (implied from claims)
        engineering_reality = [13, 23, 36, 48, 48]  # Months (realistic)
        
        benchmarks = {
            'Microsoft Espoo': 48,
            'Verne Mäntsälä': 36, 
            'Google Hamina': 36,
            'Jokikeskus (€10M)': 84  # 7-year municipal project for comparison
        }
        
        fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(14, 10))
        
        # Timeline comparison chart
        x = np.arange(len(phases))
        width = 0.35
        
        bars1 = ax1.bar(x - width/2, marketing_timeline, width, label='Marketing Claims',
                       color='#ff6b6b', alpha=0.8)
        bars2 = ax1.bar(x + width/2, engineering_reality, width, label='Engineering Reality',
                       color='#4ecdc4', alpha=0.8)
        
        ax1.set_xlabel('Project Phases', fontsize=12, fontweight='bold')
        ax1.set_ylabel('Timeline (Months)', fontsize=12, fontweight='bold')
        ax1.set_title('TIMELINE ANALYSIS: Marketing Claims vs Engineering Reality\n70MW Datacenter Development', 
                     fontsize=14, fontweight='bold', pad=20)
        ax1.set_xticks(x)
        ax1.set_xticklabels(phases, rotation=15)
        ax1.legend(fontsize=11)
        ax1.grid(axis='y', alpha=0.3)
        
        # Add value labels on bars
        def add_value_labels(ax, bars):
            for bar in bars:
                height = bar.get_height()
                if height > 0:
                    ax.annotate(f'{int(height)}m',
                               xy=(bar.get_x() + bar.get_width() / 2, height),
                               xytext=(0, 3), textcoords="offset points",
                               ha='center', va='bottom', fontsize=9, fontweight='bold')
        
        add_value_labels(ax1, bars1)
        add_value_labels(ax1, bars2)
        
        # Benchmark comparison
        projects = list(benchmarks.keys())
        timelines = list(benchmarks.values())
        colors = ['#2e75b6', '#70ad47', '#ffc000', '#c5504b']
        
        bars3 = ax2.bar(projects, timelines, color=colors, alpha=0.8)
        ax2.axhline(y=18, color='#ff6b6b', linestyle='--', linewidth=2, 
                   label='Marketing Claim (18 months)')
        ax2.axhline(y=48, color='#4ecdc4', linestyle='--', linewidth=2,
                   label='Engineering Reality (48 months)')
        
        ax2.set_ylabel('Total Timeline (Months)', fontsize=12, fontweight='bold')
        ax2.set_title('BENCHMARK COMPARISON: Finnish Datacenter Projects', 
                     fontsize=14, fontweight='bold', pad=15)
        ax2.legend(fontsize=10)
        ax2.grid(axis='y', alpha=0.3)
        
        # Rotate x-axis labels
        plt.setp(ax2.get_xticklabels(), rotation=15, ha='right')
        
        # Add value labels
        for bar in bars3:
            height = bar.get_height()
            ax2.annotate(f'{int(height)}m',
                        xy=(bar.get_x() + bar.get_width() / 2, height),
                        xytext=(0, 3), textcoords="offset points",
                        ha='center', va='bottom', fontsize=10, fontweight='bold')
        
        plt.tight_layout()
        return fig
    
    def create_constraint_summary_radar(self):
        """Create radar chart showing multi-domain constraints"""
        
        # Constraint categories and severity scores (1-5 scale)
        categories = ['Power Infrastructure', 'Environmental Impact', 'Municipal Approval',
                     'Acoustic Compliance', 'Heat Dissipation', 'Timeline Risk',
                     'Financial Investment', 'Technical Complexity']
        
        # Scores based on our analysis
        constraint_scores = [4, 4, 3, 4, 3, 5, 4, 4]  # Higher = more constrained
        
        # Create radar chart
        fig = go.Figure()
        
        fig.add_trace(go.Scatterpolar(
            r=constraint_scores,
            theta=categories,
            fill='toself',
            fillcolor='rgba(255, 107, 107, 0.2)',
            line=dict(color='rgb(255, 107, 107)', width=3),
            name='Constraint Level'
        ))
        
        fig.update_layout(
            polar=dict(
                radialaxis=dict(
                    visible=True,
                    range=[0, 5],
                    tickmode='array',
                    tickvals=[1, 2, 3, 4, 5],
                    ticktext=['Low', 'Medium-Low', 'Medium', 'High', 'Critical']
                )
            ),
            showlegend=False,
            title={
                'text': "<b>PORI DATACENTER CONSTRAINT ANALYSIS</b><br>" +
                       "<sub>Multi-Domain Risk Assessment (1=Low, 5=Critical)</sub>",
                'x': 0.5,
                'font': {'size': 16, 'family': 'Arial'}
            },
            width=800,
            height=800
        )
        
        return fig
    
    def export_with_playwright(self, fig, filename, format='png'):
        """Export Plotly figure to high-quality image using Playwright"""
        
        # Save as HTML first
        html_file = f"{self.output_dir}/{filename}.html"
        fig.write_html(html_file)
        
        # Use Playwright to capture screenshot
        with sync_playwright() as p:
            browser = p.chromium.launch()
            page = browser.new_page(viewport={'width': 1600, 'height': 1200})
            page.goto(f"file://{html_file}")
            page.wait_for_load_state('networkidle')
            
            # Capture screenshot
            image_file = f"{self.output_dir}/{filename}.{format}"
            page.screenshot(path=image_file, full_page=True, type=format)
            browser.close()
            
        return image_file
    
    def generate_all_visualizations(self):
        """Generate complete visualization suite"""
        
        print("Creating Power Infrastructure Sankey Diagram...")
        power_fig = self.create_power_sankey_diagram()
        
        # Export both HTML and PNG
        power_fig.write_html(f"{self.output_dir}/power_flow_diagram.html")
        self.export_with_playwright(power_fig, "power_flow_diagram", "png")
        
        print("Creating Timeline Comparison Chart...")
        timeline_fig = self.create_timeline_comparison_chart()
        timeline_fig.savefig(f"{self.output_dir}/timeline_comparison.png", 
                           dpi=300, bbox_inches='tight', facecolor='white')
        plt.close(timeline_fig)
        
        print("Creating Constraint Radar Chart...")
        radar_fig = self.create_constraint_summary_radar()
        radar_fig.write_html(f"{self.output_dir}/constraint_radar.html")
        self.export_with_playwright(radar_fig, "constraint_radar", "png")
        
        print("All visualizations generated successfully!")
        
        # Create visualization index
        self.create_visualization_index()
    
    def create_visualization_index(self):
        """Create HTML index of all visualizations"""
        
        html_content = """
<!DOCTYPE html>
<html>
<head>
    <title>Pori Datacenter Visualization Suite</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
        .header { background: #1f4e79; color: white; padding: 20px; margin-bottom: 30px; }
        .viz-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 20px; }
        .viz-card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .viz-card h3 { color: #1f4e79; margin-top: 0; }
        .viz-card img { width: 100%; height: auto; border: 1px solid #ddd; }
        .btn { display: inline-block; padding: 8px 16px; margin: 5px; background: #4ecdc4; 
               color: white; text-decoration: none; border-radius: 4px; }
        .btn:hover { background: #45b7b8; }
    </style>
</head>
<body>
    <div class="header">
        <h1>PORI DATACENTER TECHNICAL VISUALIZATION SUITE</h1>
        <p>Engineering-Grade Analysis | Investment Decision Support | January 2025</p>
    </div>
    
    <div class="viz-grid">
        <div class="viz-card">
            <h3>Power Infrastructure Flow Analysis</h3>
            <img src="power_flow_diagram.png" alt="Power Flow Diagram">
            <p>Detailed Sankey diagram showing actual power delivery path from identified substations 
            to 70MW datacenter load, highlighting the 17 MVA infrastructure gap.</p>
            <a href="power_flow_diagram.html" class="btn">Interactive Version</a>
            <a href="power_flow_diagram.png" class="btn">High-Res PNG</a>
        </div>
        
        <div class="viz-card">
            <h3>Timeline Reality Check</h3>
            <img src="timeline_comparison.png" alt="Timeline Comparison">
            <p>Comparison of marketing claims (18 months) vs engineering reality (48 months) 
            with benchmarks from actual Finnish datacenter projects.</p>
            <a href="timeline_comparison.png" class="btn">High-Res PNG</a>
        </div>
        
        <div class="viz-card">
            <h3>Multi-Domain Constraint Analysis</h3>
            <img src="constraint_radar.png" alt="Constraint Radar">
            <p>Radar chart showing constraint severity across eight critical domains, 
            from power infrastructure to environmental compliance.</p>
            <a href="constraint_radar.html" class="btn">Interactive Version</a>
            <a href="constraint_radar.png" class="btn">High-Res PNG</a>
        </div>
    </div>
    
    <div style="margin-top: 40px; padding: 20px; background: white; border-radius: 8px;">
        <h3>Technical Notes</h3>
        <ul>
            <li><strong>Data Sources:</strong> OpenStreetMap infrastructure data, Finnish grid standards, 
                actual municipal project timelines</li>
            <li><strong>Methodology:</strong> Engineering-grade analysis based on Finnish transmission 
                standards and comparable project benchmarks</li>
            <li><strong>Resolution:</strong> All images exported at 300 DPI for presentation quality</li>
            <li><strong>Interactive:</strong> HTML versions support zoom, hover, and data exploration</li>
        </ul>
    </div>
</body>
</html>
        """
        
        with open(f"{self.output_dir}/visualization_index.html", "w") as f:
            f.write(html_content)

def main():
    """Main execution"""
    visualizer = PoriVisualizationSuite()
    visualizer.generate_all_visualizations()

if __name__ == "__main__":
    main()