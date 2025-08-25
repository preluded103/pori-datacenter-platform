#!/usr/bin/env python3
"""
Power Infrastructure Flow Diagram - Pori Datacenter
Creates Sankey diagram showing actual power delivery path with specific substations
"""

import plotly.graph_objects as go
import plotly.express as px
from plotly.subplots import make_subplots
import pandas as pd
import numpy as np

def create_power_sankey_diagram():
    """
    Create Sankey diagram showing power flow from regional grid to datacenter
    Based on actual Pori Energia substation data and Finnish grid standards
    """
    
    # Define nodes with actual identified infrastructure
    nodes = [
        # Source nodes
        "Regional Grid\n(3000+ MW)",
        "Fingrid 400kV\n(West Finland)",  
        "Fingrid 220kV\n(Coastal Corridor)",
        "Fingrid 110kV\n(Pori Network)",
        
        # Pori Energia substations (actual identified)
        "Isosannan Sähköasema\n(1.03 km)",
        "Herralahden Substation\n(1.29 km)", 
        "Impolan Substation\n(3.43 km)",
        "Hyvelän Substation\n(4.17 km)",
        
        # Datacenter systems
        "Datacenter Phase I\n(70 MW)",
        "IT Equipment\n(70 MW)",
        
        # Output flows
        "Heat Generated\n(70 MW)",
        "River Discharge\n(50 MW)",
        "District Heating\n(20 MW)",
        
        # Grid constraints
        "Single 110kV Limit\n(65 MVA)",
        "Dual Connection\n(Required)",
        "Infrastructure Gap\n(17 MVA)"
    ]
    
    # Define flows with engineering-accurate values
    source_indices = [
        0, 1, 2, 3,  # Regional -> Fingrid levels
        4, 5,        # Primary substations -> datacenter
        8,           # Datacenter -> IT equipment  
        9,           # IT equipment -> heat
        10,          # Heat distribution
        10,          # Heat distribution
        13,          # Single connection limit
        3,           # 110kV network -> constraint
        4,           # Isosannan -> dual requirement
    ]
    
    target_indices = [
        1, 2, 3, 4,  # Grid hierarchy
        8, 8,        # To datacenter
        9,           # To IT
        10,          # To heat
        11,          # To river
        12,          # To district heating
        14,          # To dual connection
        13,          # To limit constraint
        15,          # To infrastructure gap
    ]
    
    values = [
        1500,  # Regional -> 400kV
        400,   # 400kV -> 220kV  
        200,   # 220kV -> 110kV
        120,   # 110kV -> Isosannan (MVA capacity)
        82,    # Isosannan -> Datacenter (82 MVA for 70MW)
        0,     # Herralahden -> Datacenter (backup/future)
        70,    # Datacenter -> IT
        70,    # IT -> Heat  
        50,    # Heat -> River
        20,    # Heat -> District heating
        65,    # Single connection limit
        82,    # Network -> constraint showing
        17,    # Gap between 65 MVA limit and 82 MVA requirement
    ]
    
    # Color scheme based on constraint levels
    node_colors = [
        # Grid infrastructure (blue gradient)
        '#0d47a1', '#1565c0', '#1976d2', '#1e88e5',
        # Substations (green = available, yellow = constrained)
        '#2e7d32', '#fbc02d', '#f57c00', '#ef5350', 
        # Datacenter (purple)
        '#5e35b1', '#7b1fa2',
        # Outputs (orange/red)
        '#ff5722', '#d84315', '#2e7d32',
        # Constraints (red)
        '#c62828', '#ad1457', '#6a1b9a'
    ]
    
    # Create Sankey diagram
    fig = go.Figure(data=[go.Sankey(
        node = dict(
            pad = 15,
            thickness = 20,
            line = dict(color = "black", width = 0.5),
            label = nodes,
            color = node_colors,
            x = [0, 0.1, 0.2, 0.3, 0.5, 0.5, 0.5, 0.5, 0.7, 0.8, 0.9, 0.95, 0.95, 0.4, 0.6, 0.6],
            y = [0.5, 0.5, 0.5, 0.5, 0.2, 0.4, 0.6, 0.8, 0.5, 0.5, 0.3, 0.1, 0.5, 0.9, 0.7, 0.9]
        ),
        link = dict(
            source = source_indices,
            target = target_indices, 
            value = values,
            color = ['rgba(49, 130, 189, 0.4)'] * len(values)
        )
    )])
    
    # Update layout with technical styling
    fig.update_layout(
        title={
            'text': "PORI DATACENTER POWER DELIVERY PATH ANALYSIS<br>"
                   "<sub>70MW Load Requirement vs Available Infrastructure</sub>",
            'x': 0.5,
            'font': {'size': 18, 'family': 'Arial Black'}
        },
        font_size=10,
        width=1400,
        height=800,
        paper_bgcolor='white',
        plot_bgcolor='white',
        annotations=[
            dict(
                x=0.02, y=0.95,
                text="<b>CRITICAL FINDING:</b><br>70MW = 82 MVA demand<br>Exceeds single 110kV<br>connection limit (65 MVA)",
                showarrow=False,
                align="left",
                bgcolor="rgba(255, 255, 255, 0.8)",
                bordercolor="red",
                borderwidth=2,
                font=dict(size=9, color="red")
            ),
            dict(
                x=0.02, y=0.15,
                text="<b>IDENTIFIED SUBSTATIONS:</b><br>" +
                     "• Isosannan: 1.03 km (Primary)<br>" +
                     "• Herralahden: 1.29 km (Backup)<br>" +
                     "• Impolan: 3.43 km (Alternative)<br>" +
                     "• Hyvelän: 4.17 km (Alternative)",
                showarrow=False,
                align="left",
                bgcolor="rgba(255, 255, 255, 0.8)",
                bordercolor="green",
                borderwidth=2,
                font=dict(size=9, color="green")
            ),
            dict(
                x=0.98, y=0.95,
                text="<b>INFRASTRUCTURE GAP:</b><br>17 MVA shortfall requires:<br>" +
                     "• Dual 110kV connections, OR<br>" +
                     "• Single 220kV connection<br>" +
                     "• €8-15M additional investment",
                showarrow=False,
                align="right",
                bgcolor="rgba(255, 255, 255, 0.8)",
                bordercolor="orange",
                borderwidth=2,
                font=dict(size=9, color="orange")
            )
        ]
    )
    
    return fig

def create_heat_dissipation_diagram():
    """
    Create heat dissipation flow diagram for 70MW facility
    """
    
    # Heat flow data
    heat_nodes = [
        "IT Equipment\n(70 MW)",
        "Power Infrastructure\n(6 MW)", 
        "Cooling Systems\n(21 MW)",
        "Facility Lighting\n(2 MW)",
        "Total Heat Load\n(99 MW)",
        "Air Cooling\n(60 MW)",
        "River Cooling\n(39 MW)", 
        "Atmosphere\n(60 MW)",
        "Kokemäenjoki\n(39 MW)",
        "Waste Heat Recovery\n(25 MW)",
        "District Heating\n(25 MW)"
    ]
    
    heat_fig = go.Figure(data=[go.Sankey(
        node = dict(
            pad = 15,
            thickness = 20,
            line = dict(color = "black", width = 0.5),
            label = heat_nodes,
            color = ['#ff5722'] * len(heat_nodes)
        ),
        link = dict(
            source = [0, 1, 2, 3, 4, 4, 5, 6, 6, 8],
            target = [4, 4, 4, 4, 5, 6, 7, 8, 9, 10],
            value = [70, 6, 21, 2, 60, 39, 60, 14, 25, 25]
        )
    )])
    
    heat_fig.update_layout(
        title="HEAT DISSIPATION ANALYSIS - 70MW DATACENTER",
        font_size=10,
        width=1200,
        height=600
    )
    
    return heat_fig

def create_infrastructure_cost_breakdown():
    """
    Create waterfall chart showing infrastructure costs
    """
    
    categories = [
        'Base Site', 'Power Connection', 'Cooling Systems', 
        'Environmental Compliance', 'Acoustic Mitigation', 
        'Site Preparation', 'Total Infrastructure'
    ]
    
    costs = [0, 12, 42, 5, 3, 7, 69]  # Million EUR
    
    fig = go.Figure(go.Waterfall(
        name = "Infrastructure Costs", 
        orientation = "v",
        measure = ["absolute", "relative", "relative", "relative", "relative", "relative", "total"],
        x = categories,
        textposition = "outside",
        text = [f"€{cost}M" for cost in costs],
        y = costs,
        connector = {"line":{"color":"rgb(63, 63, 63)"}},
    ))
    
    fig.update_layout(
        title = "INFRASTRUCTURE INVESTMENT CASCADE - 70MW PHASE I",
        showlegend = False,
        width=1000,
        height=600,
        yaxis_title="Cost (Million EUR)"
    )
    
    return fig

def main():
    """Generate all power infrastructure diagrams"""
    
    print("Creating Power Infrastructure Flow Diagram...")
    power_fig = create_power_sankey_diagram()
    power_fig.write_html("/Users/andrewmetcalf/Pori/docs/power_flow_diagram.html")
    power_fig.write_image("/Users/andrewmetcalf/Pori/docs/power_flow_diagram.png", 
                         width=1400, height=800, scale=2)
    
    print("Creating Heat Dissipation Diagram...")  
    heat_fig = create_heat_dissipation_diagram()
    heat_fig.write_html("/Users/andrewmetcalf/Pori/docs/heat_dissipation_diagram.html")
    heat_fig.write_image("/Users/andrewmetcalf/Pori/docs/heat_dissipation_diagram.png",
                        width=1200, height=600, scale=2)
    
    print("Creating Cost Breakdown Chart...")
    cost_fig = create_infrastructure_cost_breakdown()  
    cost_fig.write_html("/Users/andrewmetcalf/Pori/docs/cost_breakdown_chart.html")
    cost_fig.write_image("/Users/andrewmetcalf/Pori/docs/cost_breakdown_chart.png",
                        width=1000, height=600, scale=2)
    
    print("All diagrams generated successfully!")

if __name__ == "__main__":
    main()