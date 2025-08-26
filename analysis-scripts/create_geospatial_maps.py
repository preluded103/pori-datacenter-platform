#!/usr/bin/env python3
"""
Geospatial Constraint Overlay Maps - Pori Datacenter
Creates information-dense constraint mapping with multiple technical layers
"""

import folium
from folium import plugins
import geopandas as gpd
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.patches import Circle, Rectangle
import json
import requests
from shapely.geometry import Point, Polygon, LineString
from shapely.ops import unary_union
import warnings
warnings.filterwarnings('ignore')

class PoriConstraintMapping:
    def __init__(self, output_dir="/Users/andrewmetcalf/Pori/docs"):
        self.output_dir = output_dir
        
        # Site coordinates (ACTUAL location provided by user)
        # Industrial site, NOT downtown center as incorrectly assumed
        self.site_center = (61.495722, 21.810987)
        
        # Identified substation coordinates (from our analysis)
        self.substations = {
            'Isosannan Sähköasema': (61.4886, 21.8052, 120, 1.03),  # lat, lon, MVA, distance_km
            'Herralahden Substation': (61.4922, 21.8105, 80, 1.29),
            'Impolan Substation': (61.4654, 21.8284, 60, 3.43), 
            'Hyvelän Substation': (61.4523, 21.8401, 40, 4.17)
        }
        
        # Site boundaries (Phase I and II from PDF)
        self.site_phases = {
            'Phase I': {
                'area_m2': 65000,  # 6.5 hectares
                'power_mw': 70,
                'coordinates': [
                    (61.4845, 21.7965), (61.4857, 21.7965), 
                    (61.4857, 21.7979), (61.4845, 21.7979), (61.4845, 21.7965)
                ]
            },
            'Phase II': {
                'area_m2': 90000,  # 9 hectares  
                'power_mw': 100,
                'coordinates': [
                    (61.4845, 21.7979), (61.4857, 21.7979),
                    (61.4857, 21.7999), (61.4845, 21.7999), (61.4845, 21.7979)
                ]
            }
        }
        
    def create_base_map(self):
        """Create base map with optimal zoom and center"""
        
        # Create map centered on site
        m = folium.Map(
            location=self.site_center,
            zoom_start=13,
            tiles=None
        )
        
        # Add multiple base layers
        folium.TileLayer(
            tiles='OpenStreetMap',
            name='OpenStreetMap',
            attr='OpenStreetMap'
        ).add_to(m)
        
        folium.TileLayer(
            tiles='Stamen Terrain',
            name='Terrain',
            attr='Stamen'
        ).add_to(m)
        
        folium.TileLayer(
            tiles='CartoDB positron',
            name='Light Map',
            attr='CartoDB'
        ).add_to(m)
        
        return m
    
    def add_power_infrastructure_layer(self, m):
        """Add power infrastructure with capacity visualization"""
        
        # Power infrastructure feature group
        power_group = folium.FeatureGroup(name='Power Infrastructure', show=True)
        
        # Add substations with capacity-based sizing
        for name, (lat, lon, mva, dist_km) in self.substations.items():
            
            # Color based on capacity
            if mva >= 100:
                color = '#2e7d32'  # Green - high capacity
            elif mva >= 60:
                color = '#fbc02d'  # Yellow - medium capacity  
            else:
                color = '#f44336'  # Red - limited capacity
            
            # Size based on capacity
            radius = max(8, min(20, mva / 8))
            
            # Create marker
            folium.CircleMarker(
                location=[lat, lon],
                radius=radius,
                popup=folium.Popup(f"""
                <b>{name}</b><br>
                Capacity: {mva} MVA<br>
                Distance: {dist_km} km<br>
                Status: {'PRIMARY' if dist_km < 1.5 else 'BACKUP' if dist_km < 3 else 'ALTERNATIVE'}
                """, max_width=250),
                tooltip=f"{name} - {mva} MVA",
                color='black',
                weight=2,
                fillColor=color,
                fillOpacity=0.8
            ).add_to(power_group)
            
            # Add connection line to site
            folium.PolyLine(
                locations=[[lat, lon], self.site_center],
                color=color,
                weight=3,
                opacity=0.6,
                dash_array='5, 5'
            ).add_to(power_group)
            
            # Add distance label
            mid_lat = (lat + self.site_center[0]) / 2
            mid_lon = (lon + self.site_center[1]) / 2
            
            folium.Marker(
                location=[mid_lat, mid_lon],
                icon=folium.DivIcon(
                    html=f"""
                    <div style="background: white; border: 1px solid black; padding: 2px 4px; 
                         border-radius: 3px; font-size: 10px; font-weight: bold;">
                         {dist_km}km
                    </div>""",
                    icon_size=(50, 20),
                    icon_anchor=(25, 10)
                )
            ).add_to(power_group)
        
        power_group.add_to(m)
        return m
    
    def add_site_boundaries_layer(self, m):
        """Add site boundary visualization with technical specifications"""
        
        site_group = folium.FeatureGroup(name='Site Boundaries', show=True)
        
        colors = {'Phase I': '#7b1fa2', 'Phase II': '#512da8'}
        
        for phase_name, phase_data in self.site_phases.items():
            
            # Create polygon
            folium.Polygon(
                locations=phase_data['coordinates'],
                color=colors[phase_name],
                weight=3,
                fillColor=colors[phase_name],
                fillOpacity=0.3,
                popup=folium.Popup(f"""
                <b>{phase_name}</b><br>
                Area: {phase_data['area_m2']:,} m²<br>
                Power: {phase_data['power_mw']} MW<br>
                Power Density: {phase_data['power_mw']/(phase_data['area_m2']/10000):.1f} MW/hectare<br>
                Height Limit: 25m<br>
                Zoning: Industrial
                """, max_width=200),
                tooltip=f"{phase_name} - {phase_data['power_mw']} MW"
            ).add_to(site_group)
        
        # Add site center marker
        folium.Marker(
            location=self.site_center,
            popup="Datacenter Site Center<br>Konepajanranta, Pori",
            tooltip="Site Center",
            icon=folium.Icon(color='purple', icon='building', prefix='fa')
        ).add_to(site_group)
        
        site_group.add_to(m)
        return m
    
    def add_constraint_zones_layer(self, m):
        """Add constraint zones with technical specifications"""
        
        constraint_group = folium.FeatureGroup(name='Technical Constraints', show=False)
        
        # Acoustic impact zones (based on 70-85 dBA equipment)
        # 55 dB limit = need 15-30 dB reduction = 30-300m depending on barriers
        acoustic_zones = [
            (100, '#ff5722', '70+ dB (Non-compliant)', 'Residential noise limits exceeded'),
            (200, '#ff9800', '60-70 dB (Marginal)', 'Acoustic mitigation required'),
            (400, '#ffc107', '55-60 dB (Compliant)', 'Meets daytime limits'),
            (800, '#4caf50', '<55 dB (Compliant)', 'Meets all noise limits')
        ]
        
        for radius_m, color, label, description in acoustic_zones:
            # Convert meters to approximate degrees (rough conversion for Finland)
            radius_deg = radius_m / 111000 * 1.5  # Adjusted for latitude
            
            folium.Circle(
                location=self.site_center,
                radius=radius_m,
                color=color,
                weight=2,
                fillColor=color,
                fillOpacity=0.1,
                popup=f"<b>Acoustic Zone</b><br>{label}<br>{description}",
                tooltip=f"Acoustic: {label}"
            ).add_to(constraint_group)
        
        # Power capacity zones
        power_zones = [
            (1500, '#2e7d32', 'Optimal Power Access', '2+ substations within range'),
            (3000, '#fbc02d', 'Moderate Power Access', 'Limited substation options'),
            (5000, '#f44336', 'Poor Power Access', 'Significant infrastructure required')
        ]
        
        for radius_m, color, label, description in power_zones:
            folium.Circle(
                location=self.site_center,
                radius=radius_m,
                color=color,
                weight=1,
                fillColor=color,
                fillOpacity=0.05,
                popup=f"<b>Power Access Zone</b><br>{label}<br>{description}",
                tooltip=f"Power: {label}",
                dash_array='10, 10'
            ).add_to(constraint_group)
        
        constraint_group.add_to(m)
        return m
    
    def add_environmental_layer(self, m):
        """Add environmental constraints"""
        
        env_group = folium.FeatureGroup(name='Environmental Constraints', show=False)
        
        # Kokemäenjoki River (approximate path)
        river_coords = [
            (61.4920, 21.7800), (61.4890, 21.7850), (61.4860, 21.7900),
            (61.4830, 21.7950), (61.4800, 21.8000), (61.4770, 21.8050)
        ]
        
        folium.PolyLine(
            locations=river_coords,
            color='#1976d2',
            weight=8,
            opacity=0.8,
            popup="<b>Kokemäenjoki River</b><br>Cooling water source<br>IBA Protected Area",
            tooltip="Kokemäenjoki River"
        ).add_to(env_group)
        
        # River buffer zones (environmental protection)
        buffer_zones = [
            (200, '#e3f2fd', 'Direct Impact Zone', '30°C discharge limit'),
            (500, '#bbdefb', 'Mixing Zone Boundary', 'Temperature compliance monitoring'),
            (1000, '#90caf9', 'Environmental Assessment Zone', 'EIA required for impacts')
        ]
        
        # Create buffer polygons around river
        for distance, color, label, description in buffer_zones:
            # Simplified river buffer (would use proper GIS in production)
            buffer_coords = []
            for lat, lon in river_coords:
                # Create rough circular buffer around each river point
                for angle in range(0, 360, 30):
                    buf_lat = lat + (distance/111000) * np.cos(np.radians(angle))
                    buf_lon = lon + (distance/111000) * np.sin(np.radians(angle)) / np.cos(np.radians(lat))
                    buffer_coords.append([buf_lat, buf_lon])
            
            if buffer_coords:
                folium.Polygon(
                    locations=buffer_coords,
                    color='#1976d2',
                    weight=1,
                    fillColor=color,
                    fillOpacity=0.2,
                    popup=f"<b>River Buffer Zone</b><br>{label}<br>{description}",
                    tooltip=f"River Buffer: {distance}m"
                ).add_to(env_group)
        
        # Bird migration corridor (IBA area)
        iba_coords = [
            (61.5000, 21.7500), (61.5000, 21.8500),
            (61.4500, 21.8500), (61.4500, 21.7500)
        ]
        
        folium.Polygon(
            locations=iba_coords,
            color='#4caf50',
            weight=2,
            fillColor='#4caf50',
            fillOpacity=0.1,
            dash_array='15, 15',
            popup="<b>IBA Protected Area</b><br>Internationally Important Bird Area<br>EIA mandatory for >50MW projects",
            tooltip="IBA Protected Area"
        ).add_to(env_group)
        
        env_group.add_to(m)
        return m
    
    def add_infrastructure_cost_layer(self, m):
        """Add infrastructure investment visualization"""
        
        cost_group = folium.FeatureGroup(name='Infrastructure Costs', show=False)
        
        # Cost zones based on distance and complexity
        cost_zones = [
            (500, '#4caf50', '€2-5M', 'Minimal infrastructure'),
            (1500, '#ffc107', '€8-15M', 'Standard connection costs'),
            (3000, '#ff9800', '€15-25M', 'Moderate infrastructure investment'),
            (5000, '#f44336', '€25M+', 'Major infrastructure required')
        ]
        
        for radius_m, color, cost_range, description in cost_zones:
            folium.Circle(
                location=self.site_center,
                radius=radius_m,
                color=color,
                weight=2,
                fillColor=color,
                fillOpacity=0.15,
                popup=f"<b>Infrastructure Cost Zone</b><br>Estimated: {cost_range}<br>{description}",
                tooltip=f"Cost Zone: {cost_range}",
                dash_array='5, 10'
            ).add_to(cost_group)
        
        cost_group.add_to(m)
        return m
    
    def create_technical_legend(self, m):
        """Add comprehensive technical legend"""
        
        legend_html = '''
        <div style="position: fixed; 
                    top: 10px; right: 10px; width: 300px; height: auto; 
                    background-color: white; border:2px solid grey; z-index:9999; 
                    font-size:12px; padding: 10px">
        <h4 style="margin-top:0; color: #1f4e79;">PORI DATACENTER CONSTRAINTS</h4>
        
        <b>Power Infrastructure:</b><br>
        <i class="fa fa-circle" style="color:#2e7d32"></i> High Capacity (>100 MVA)<br>
        <i class="fa fa-circle" style="color:#fbc02d"></i> Medium Capacity (60-100 MVA)<br>
        <i class="fa fa-circle" style="color:#f44336"></i> Limited Capacity (<60 MVA)<br><br>
        
        <b>Acoustic Zones (dB):</b><br>
        <i class="fa fa-circle" style="color:#ff5722"></i> >70 dB (Non-compliant)<br>
        <i class="fa fa-circle" style="color:#ff9800"></i> 60-70 dB (Mitigation required)<br>
        <i class="fa fa-circle" style="color:#4caf50"></i> <55 dB (Compliant)<br><br>
        
        <b>Environmental:</b><br>
        <i class="fa fa-circle" style="color:#1976d2"></i> River cooling access<br>
        <i class="fa fa-circle" style="color:#4caf50"></i> IBA protected area<br><br>
        
        <b>Site Information:</b><br>
        Phase I: 70 MW, 6.5 hectares<br>
        Phase II: 100 MW, 9.0 hectares<br>
        Total: 170 MW, 15 hectares
        </div>
        '''
        
        m.get_root().html.add_child(folium.Element(legend_html))
        return m
    
    def create_constraint_overlay_map(self):
        """Create comprehensive constraint overlay map"""
        
        # Create base map
        m = self.create_base_map()
        
        # Add all layers
        m = self.add_site_boundaries_layer(m)
        m = self.add_power_infrastructure_layer(m)
        m = self.add_constraint_zones_layer(m)
        m = self.add_environmental_layer(m) 
        m = self.add_infrastructure_cost_layer(m)
        
        # Add technical legend
        m = self.create_technical_legend(m)
        
        # Add layer control
        folium.LayerControl(position='topleft', collapsed=False).add_to(m)
        
        # Add measurement tool
        plugins.MeasureControl(primary_length_unit='meters', secondary_length_unit='kilometers').add_to(m)
        
        # Add fullscreen button
        plugins.Fullscreen().add_to(m)
        
        return m
    
    def create_heat_dissipation_map(self):
        """Create specialized map for heat dissipation analysis"""
        
        m = folium.Map(location=self.site_center, zoom_start=15)
        
        # Heat dissipation zones
        heat_zones = [
            (50, '#d32f2f', '90-105 MW', 'Maximum heat generation zone'),
            (100, '#f57c00', '70-90 MW', 'High heat dissipation'),
            (200, '#fbc02d', '50-70 MW', 'Moderate heat impact'),
            (500, '#4caf50', '<50 MW', 'Minimal heat impact')
        ]
        
        for radius_m, color, heat_range, description in heat_zones:
            folium.Circle(
                location=self.site_center,
                radius=radius_m,
                color=color,
                weight=3,
                fillColor=color,
                fillOpacity=0.3,
                popup=f"<b>Heat Dissipation Zone</b><br>Rate: {heat_range}<br>{description}",
                tooltip=f"Heat: {heat_range}"
            ).add_to(m)
        
        # District heating connection potential
        district_heating_coords = [
            self.site_center,
            (61.4900, 21.8100),  # Approximate path to Pori Energia
            (61.4950, 21.8200)   # District heating network
        ]
        
        folium.PolyLine(
            locations=district_heating_coords,
            color='#ff5722',
            weight=5,
            opacity=0.8,
            popup="<b>District Heating Connection</b><br>Waste heat recovery potential<br>20 MW thermal capacity",
            tooltip="District Heating Pipeline"
        ).add_to(m)
        
        return m
    
    def generate_all_maps(self):
        """Generate complete mapping suite"""
        
        print("Creating Constraint Overlay Map...")
        constraint_map = self.create_constraint_overlay_map()
        constraint_map.save(f"{self.output_dir}/constraint_overlay_map.html")
        
        print("Creating Heat Dissipation Map...")
        heat_map = self.create_heat_dissipation_map()
        heat_map.save(f"{self.output_dir}/heat_dissipation_map.html")
        
        print("All geospatial maps generated successfully!")

def main():
    """Main execution"""
    mapper = PoriConstraintMapping()
    mapper.generate_all_maps()

if __name__ == "__main__":
    main()