#!/usr/bin/env python3
"""
Fix Site Location Coordinates
Correct the heat dissipation map and other visualizations with accurate site location
"""

import folium
import geopandas as gpd
import pandas as pd
from shapely.geometry import Point, Polygon
import numpy as np

class SiteLocationCorrector:
    def __init__(self, output_dir="/Users/andrewmetcalf/Pori/docs"):
        self.output_dir = output_dir
        
        # Original coordinates (may be incorrect)
        self.original_coords = (61.4851, 21.7972)
        
        # Let me check the PDF again for exact location
        # From the PDF images, Konepajanranta appears to be more central in Pori
        # Looking at the satellite image in the PDF showing the datacenter location
        
        # ACTUAL coordinates provided by user
        # Industrial site location, NOT downtown center
        self.corrected_coords = (61.495722, 21.810987)  # Actual site location
        
        print(f"Original coordinates: {self.original_coords}")
        print(f"Corrected coordinates: {self.corrected_coords}")
        
    def create_corrected_heat_dissipation_map(self):
        """Create corrected heat dissipation map with proper site location"""
        
        # Use corrected coordinates
        site_center = self.corrected_coords
        
        m = folium.Map(location=site_center, zoom_start=16, tiles='OpenStreetMap')
        
        # Add site center marker with clear visibility
        folium.Marker(
            location=site_center,
            popup=f"<b>DATACENTER SITE CENTER</b><br>Konepajanranta, Pori<br>Coordinates: {site_center[0]:.5f}, {site_center[1]:.5f}",
            tooltip="Datacenter Site Center",
            icon=folium.Icon(color='red', icon='building', prefix='fa')
        ).add_to(m)
        
        # Heat dissipation zones (corrected)
        heat_zones = [
            (50, '#d32f2f', '95-105 MW', 'Maximum heat generation zone', 0.4),
            (100, '#f57c00', '80-95 MW', 'High heat dissipation', 0.3),
            (200, '#fbc02d', '60-80 MW', 'Moderate heat impact', 0.2),
            (500, '#4caf50', '<60 MW', 'Minimal heat impact', 0.1)
        ]
        
        for radius_m, color, heat_range, description, opacity in heat_zones:
            folium.Circle(
                location=site_center,
                radius=radius_m,
                color=color,
                weight=3,
                fillColor=color,
                fillOpacity=opacity,
                popup=f"<b>Heat Dissipation Zone</b><br>Rate: {heat_range}<br>{description}<br>Radius: {radius_m}m",
                tooltip=f"Heat Zone: {heat_range}"
            ).add_to(m)
        
        # Add distance rings for reference
        reference_distances = [100, 500, 1000]  # meters
        for distance in reference_distances:
            folium.Circle(
                location=site_center,
                radius=distance,
                color='gray',
                weight=1,
                fillOpacity=0,
                dash_array='5,5',
                popup=f"{distance}m from site center"
            ).add_to(m)
        
        # Kokemäenjoki River (approximate location relative to corrected site)
        river_coords = [
            (site_center[0] + 0.003, site_center[1] - 0.005),  # Adjust relative to corrected site
            (site_center[0] + 0.001, site_center[1] - 0.002),
            (site_center[0] - 0.001, site_center[1] + 0.001),
            (site_center[0] - 0.003, site_center[1] + 0.004)
        ]
        
        folium.PolyLine(
            locations=river_coords,
            color='#1976d2',
            weight=6,
            opacity=0.8,
            popup="<b>Kokemäenjoki River</b><br>Cooling water source",
            tooltip="Kokemäenjoki River"
        ).add_to(m)
        
        # District heating connection potential (corrected path)
        district_heating_coords = [
            site_center,
            (site_center[0] + 0.005, site_center[1] + 0.008),  # Approximate path to Pori Energia
            (site_center[0] + 0.010, site_center[1] + 0.015)   # District heating network
        ]
        
        folium.PolyLine(
            locations=district_heating_coords,
            color='#ff5722',
            weight=4,
            opacity=0.8,
            dash_array='10,5',
            popup="<b>District Heating Connection</b><br>Waste heat recovery: 20 MW<br>Pipeline to Pori Energia network",
            tooltip="District Heating Pipeline"
        ).add_to(m)
        
        # Add legend
        legend_html = '''
        <div style="position: fixed; 
                    top: 10px; right: 10px; width: 250px; height: auto; 
                    background-color: white; border:2px solid grey; z-index:9999; 
                    font-size:11px; padding: 10px">
        <h4 style="margin-top:0; color: #d32f2f;">HEAT DISSIPATION ANALYSIS</h4>
        <b>Heat Generation Zones:</b><br>
        <i class="fa fa-circle" style="color:#d32f2f"></i> 95-105 MW (0-50m)<br>
        <i class="fa fa-circle" style="color:#f57c00"></i> 80-95 MW (50-100m)<br>
        <i class="fa fa-circle" style="color:#fbc02d"></i> 60-80 MW (100-200m)<br>
        <i class="fa fa-circle" style="color:#4caf50"></i> <60 MW (200m+)<br><br>
        
        <b>Infrastructure:</b><br>
        <i class="fa fa-building" style="color:red"></i> Datacenter Site<br>
        <i class="fa fa-tint" style="color:#1976d2"></i> River cooling source<br>
        <i class="fa fa-fire" style="color:#ff5722"></i> District heating connection<br><br>
        
        <b>Site Details:</b><br>
        Phase I: 70 MW thermal<br>
        Cooling: 91-105 MW total<br>
        Location: CORRECTED coordinates
        </div>
        '''
        
        m.get_root().html.add_child(folium.Element(legend_html))
        
        # Add measurement tool
        from folium import plugins
        plugins.MeasureControl(primary_length_unit='meters').add_to(m)
        
        return m
    
    def create_site_location_verification_map(self):
        """Create verification map showing both original and corrected locations"""
        
        m = folium.Map(location=self.original_coords, zoom_start=15)
        
        # Original location (for comparison)
        folium.Marker(
            location=self.original_coords,
            popup="<b>ORIGINAL COORDINATES</b><br>May be inaccurate<br>61.4851, 21.7972",
            tooltip="Original Location",
            icon=folium.Icon(color='blue', icon='question', prefix='fa')
        ).add_to(m)
        
        # Corrected location
        folium.Marker(
            location=self.corrected_coords,
            popup="<b>CORRECTED SITE LOCATION</b><br>Konepajanranta Datacenter<br>61.4841, 21.7962",
            tooltip="Corrected Location",
            icon=folium.Icon(color='red', icon='building', prefix='fa')
        ).add_to(m)
        
        # Connection line between the two
        folium.PolyLine(
            locations=[self.original_coords, self.corrected_coords],
            color='orange',
            weight=3,
            dash_array='10,5',
            popup=f"Location correction: ~{int(self.calculate_distance())}m difference"
        ).add_to(m)
        
        # Add both Phase I and Phase II boundaries at corrected location
        phase1_coords = [
            (self.corrected_coords[0] - 0.0005, self.corrected_coords[1] - 0.0008),
            (self.corrected_coords[0] + 0.0005, self.corrected_coords[1] - 0.0008),
            (self.corrected_coords[0] + 0.0005, self.corrected_coords[1] + 0.0002),
            (self.corrected_coords[0] - 0.0005, self.corrected_coords[1] + 0.0002)
        ]
        
        folium.Polygon(
            locations=phase1_coords,
            color='purple',
            weight=2,
            fillColor='purple',
            fillOpacity=0.2,
            popup="<b>Phase I</b><br>60,000-70,000 m²<br>70 MW capacity"
        ).add_to(m)
        
        phase2_coords = [
            (self.corrected_coords[0] - 0.0005, self.corrected_coords[1] + 0.0002),
            (self.corrected_coords[0] + 0.0005, self.corrected_coords[1] + 0.0002),
            (self.corrected_coords[0] + 0.0005, self.corrected_coords[1] + 0.0012),
            (self.corrected_coords[0] - 0.0005, self.corrected_coords[1] + 0.0012)
        ]
        
        folium.Polygon(
            locations=phase2_coords,
            color='indigo',
            weight=2,
            fillColor='indigo',
            fillOpacity=0.2,
            popup="<b>Phase II</b><br>90,000 m²<br>100 MW capacity"
        ).add_to(m)
        
        return m
    
    def calculate_distance(self):
        """Calculate distance between original and corrected coordinates"""
        from math import radians, cos, sin, asin, sqrt
        
        # Haversine formula
        lat1, lon1 = radians(self.original_coords[0]), radians(self.original_coords[1])
        lat2, lon2 = radians(self.corrected_coords[0]), radians(self.corrected_coords[1])
        
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
        c = 2 * asin(sqrt(a))
        r = 6371000  # Earth radius in meters
        
        return r * c
    
    def generate_corrected_maps(self):
        """Generate all corrected maps"""
        
        print("Creating corrected heat dissipation map...")
        heat_map = self.create_corrected_heat_dissipation_map()
        heat_map.save(f"{self.output_dir}/heat_dissipation_map_corrected.html")
        
        print("Creating site location verification map...")
        verification_map = self.create_site_location_verification_map()
        verification_map.save(f"{self.output_dir}/site_location_verification.html")
        
        distance = self.calculate_distance()
        print(f"Location correction applied: {distance:.0f}m difference")
        print("Corrected maps saved!")
        
        return self.corrected_coords

def main():
    """Main execution"""
    corrector = SiteLocationCorrector()
    corrected_coords = corrector.generate_corrected_maps()
    
    print(f"\nSite location corrected to: {corrected_coords}")
    print("Files generated:")
    print("- heat_dissipation_map_corrected.html")
    print("- site_location_verification.html")

if __name__ == "__main__":
    main()