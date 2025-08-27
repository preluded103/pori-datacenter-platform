#!/usr/bin/env python3
"""
ENTSO-E Transparency Platform Client for European Grid Intelligence
Pan-European transmission system data for datacenter site selection
"""

import requests
import pandas as pd
import json
import os
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
import xml.etree.ElementTree as ET
import logging

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class ENTSOEClient:
    """
    Client for accessing ENTSO-E Transparency Platform data
    Pan-European transmission system data for grid intelligence
    """
    
    def __init__(self, security_token: Optional[str] = None):
        """
        Initialize ENTSO-E client
        
        Args:
            security_token: ENTSO-E API security token
        """
        self.security_token = security_token or os.getenv('ENTSOE_SECURITY_TOKEN')
        self.base_url = "https://web-api.tp.entsoe.eu/api"
        
        if not self.security_token:
            logger.warning("No ENTSO-E security token provided - API access will not work")
        
        # EIC codes for target countries (Energy Identification Codes)
        self.country_codes = {
            'Finland': '10YFI-1--------U',
            'Sweden': '10YSE-1--------K', 
            'Norway': '10YNO-0--------C',
            'Denmark': '10YDK-1--------W',
            'Germany': '10Y1001A1001A83F',
            'Netherlands': '10YNL----------L',
            'Estonia': '10Y1001A1001A39I',  # Connected to Finland
        }
        
        # Bidding zone codes (may differ from country codes)
        self.bidding_zones = {
            'Finland': '10YFI-1--------U',
            'Sweden_1': '10Y1001A1001A44P',  # SE1
            'Sweden_2': '10Y1001A1001A45N',  # SE2  
            'Sweden_3': '10Y1001A1001A46L',  # SE3
            'Sweden_4': '10Y1001A1001A47J',  # SE4
            'Norway_1': '10YNO-1--------2',  # NO1
            'Norway_2': '10YNO-2--------T',  # NO2
            'Norway_3': '10YNO-3--------J',  # NO3
            'Norway_4': '10YNO-4--------9',  # NO4
            'Norway_5': '10Y1001A1001A48H', # NO5
            'Denmark_1': '10YDK-1--------W', # DK1
            'Denmark_2': '10YDK-2--------M', # DK2
            'Germany': '10Y1001A1001A82H',
            'Netherlands': '10YNL----------L',
        }
        
        # Document types for different data queries
        self.document_types = {
            'generation_forecast': 'A71',
            'load_forecast': 'A65', 
            'transmission_capacity': 'A61',
            'cross_border_flows': 'A11',
            'installed_capacity': 'A68',
            'unavailable_capacity': 'A77',
            'generation_by_fuel': 'A75',
            'actual_load': 'A65',
        }
        
        self.session = requests.Session()

    def _make_request(self, params: Dict[str, str]) -> Optional[str]:
        """
        Make request to ENTSO-E API with error handling
        
        Args:
            params: Query parameters for API request
            
        Returns:
            XML response text or None if error
        """
        if not self.security_token:
            logger.error("No security token available for ENTSO-E API")
            return None
        
        params['securityToken'] = self.security_token
        
        try:
            response = self.session.get(self.base_url, params=params, timeout=30)
            response.raise_for_status()
            
            # Check if response contains error
            if 'Reason' in response.text and 'code' in response.text:
                logger.error(f"ENTSO-E API error: {response.text}")
                return None
                
            return response.text
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Error making ENTSO-E request: {e}")
            return None

    def get_transmission_capacity(self, country_from: str, country_to: str, 
                                start_date: datetime, end_date: datetime) -> pd.DataFrame:
        """
        Get transmission capacity between two countries/bidding zones
        
        Args:
            country_from: Source country/bidding zone
            country_to: Target country/bidding zone  
            start_date: Start date for query
            end_date: End date for query
            
        Returns:
            DataFrame with transmission capacity data
        """
        from_code = self.country_codes.get(country_from, country_from)
        to_code = self.country_codes.get(country_to, country_to)
        
        params = {
            'documentType': self.document_types['transmission_capacity'],
            'in_Domain': from_code,
            'out_Domain': to_code,
            'periodStart': start_date.strftime('%Y%m%d%H%M'),
            'periodEnd': end_date.strftime('%Y%m%d%H%M')
        }
        
        response_xml = self._make_request(params)
        if not response_xml:
            return pd.DataFrame()
        
        try:
            # Parse XML response
            root = ET.fromstring(response_xml)
            
            capacity_data = []
            for time_series in root.findall('.//{*}TimeSeries'):
                # Extract metadata
                in_domain = time_series.find('.//{*}in_Domain.mRID')
                out_domain = time_series.find('.//{*}out_Domain.mRID')
                curve_type = time_series.find('.//{*}curveType')
                
                # Extract time period data
                for period in time_series.findall('.//{*}Period'):
                    start_time = period.find('.//{*}timeInterval/{*}start')
                    resolution = period.find('.//{*}resolution')
                    
                    for point in period.findall('.//{*}Point'):
                        position = point.find('.//{*}position')
                        quantity = point.find('.//{*}quantity')
                        
                        if all(x is not None for x in [start_time, position, quantity]):
                            capacity_data.append({
                                'from_domain': in_domain.text if in_domain is not None else from_code,
                                'to_domain': out_domain.text if out_domain is not None else to_code,
                                'curve_type': curve_type.text if curve_type is not None else 'Unknown',
                                'start_time': start_time.text,
                                'resolution': resolution.text if resolution is not None else 'PT60M',
                                'position': int(position.text),
                                'capacity_mw': float(quantity.text)
                            })
            
            df = pd.DataFrame(capacity_data)
            logger.info(f"Retrieved {len(df)} transmission capacity records for {country_from} -> {country_to}")
            return df
            
        except ET.ParseError as e:
            logger.error(f"Error parsing XML response: {e}")
            return pd.DataFrame()
        except Exception as e:
            logger.error(f"Error processing transmission capacity data: {e}")
            return pd.DataFrame()

    def get_cross_border_flows(self, country_from: str, country_to: str,
                             start_date: datetime, end_date: datetime) -> pd.DataFrame:
        """
        Get actual cross-border electricity flows
        
        Args:
            country_from: Source country
            country_to: Target country
            start_date: Start date
            end_date: End date
            
        Returns:
            DataFrame with actual flow data
        """
        from_code = self.country_codes.get(country_from, country_from)
        to_code = self.country_codes.get(country_to, country_to)
        
        params = {
            'documentType': self.document_types['cross_border_flows'],
            'in_Domain': from_code,
            'out_Domain': to_code,
            'periodStart': start_date.strftime('%Y%m%d%H%M'),
            'periodEnd': end_date.strftime('%Y%m%d%H%M')
        }
        
        response_xml = self._make_request(params)
        if not response_xml:
            return pd.DataFrame()
        
        try:
            root = ET.fromstring(response_xml)
            flow_data = []
            
            for time_series in root.findall('.//{*}TimeSeries'):
                for period in time_series.findall('.//{*}Period'):
                    start_time = period.find('.//{*}timeInterval/{*}start')
                    resolution = period.find('.//{*}resolution')
                    
                    for point in period.findall('.//{*}Point'):
                        position = point.find('.//{*}position')
                        quantity = point.find('.//{*}quantity')
                        
                        if all(x is not None for x in [start_time, position, quantity]):
                            flow_data.append({
                                'from_country': country_from,
                                'to_country': country_to,
                                'start_time': start_time.text,
                                'resolution': resolution.text if resolution is not None else 'PT60M',
                                'position': int(position.text),
                                'flow_mw': float(quantity.text)
                            })
            
            df = pd.DataFrame(flow_data)
            logger.info(f"Retrieved {len(df)} flow records for {country_from} -> {country_to}")
            return df
            
        except Exception as e:
            logger.error(f"Error processing cross-border flow data: {e}")
            return pd.DataFrame()

    def get_installed_capacity_by_fuel(self, country: str, year: int) -> pd.DataFrame:
        """
        Get installed generation capacity by fuel type
        Critical for understanding grid capacity constraints
        
        Args:
            country: Country name or code
            year: Year for capacity data
            
        Returns:
            DataFrame with capacity by fuel type
        """
        country_code = self.country_codes.get(country, country)
        
        # Use January 1st for the year
        start_date = datetime(year, 1, 1)
        end_date = datetime(year, 12, 31)
        
        params = {
            'documentType': self.document_types['installed_capacity'],
            'processType': 'A33',  # Installed capacity per production type
            'in_Domain': country_code,
            'periodStart': start_date.strftime('%Y%m%d%H%M'),
            'periodEnd': end_date.strftime('%Y%m%d%H%M')
        }
        
        response_xml = self._make_request(params)
        if not response_xml:
            return pd.DataFrame()
        
        try:
            root = ET.fromstring(response_xml)
            capacity_data = []
            
            for time_series in root.findall('.//{*}TimeSeries'):
                # Get fuel type
                production_type = time_series.find('.//{*}MktPSRType/{*}psrType')
                fuel_type = production_type.text if production_type is not None else 'Unknown'
                
                for period in time_series.findall('.//{*}Period'):
                    for point in period.findall('.//{*}Point'):
                        quantity = point.find('.//{*}quantity')
                        if quantity is not None:
                            capacity_data.append({
                                'country': country,
                                'fuel_type': fuel_type,
                                'capacity_mw': float(quantity.text),
                                'year': year
                            })
            
            df = pd.DataFrame(capacity_data)
            logger.info(f"Retrieved installed capacity data for {country} ({len(df)} records)")
            return df
            
        except Exception as e:
            logger.error(f"Error processing installed capacity data: {e}")
            return pd.DataFrame()

    def get_unavailable_capacity(self, country: str, start_date: datetime, end_date: datetime) -> pd.DataFrame:
        """
        Get unavailable transmission capacity (outages, maintenance)
        Critical for understanding grid constraints and queue impacts
        
        Args:
            country: Country name or code
            start_date: Start date
            end_date: End date
            
        Returns:
            DataFrame with unavailable capacity data
        """
        country_code = self.country_codes.get(country, country)
        
        params = {
            'documentType': self.document_types['unavailable_capacity'],
            'biddingZone_Domain': country_code,
            'periodStart': start_date.strftime('%Y%m%d%H%M'),
            'periodEnd': end_date.strftime('%Y%m%d%H%M')
        }
        
        response_xml = self._make_request(params)
        if not response_xml:
            return pd.DataFrame()
        
        try:
            root = ET.fromstring(response_xml)
            unavailable_data = []
            
            for unavailability in root.findall('.//{*}Unavailability_MarketDocument'):
                for time_series in unavailability.findall('.//{*}TimeSeries'):
                    # Extract asset information
                    asset_name = time_series.find('.//{*}registeredResource/{*}name')
                    asset_type = time_series.find('.//{*}registeredResource/{*}asset_type')
                    
                    for period in time_series.findall('.//{*}Period'):
                        start_time = period.find('.//{*}timeInterval/{*}start')
                        end_time = period.find('.//{*}timeInterval/{*}end')
                        
                        for point in period.findall('.//{*}Point'):
                            quantity = point.find('.//{*}quantity')
                            
                            if quantity is not None:
                                unavailable_data.append({
                                    'country': country,
                                    'asset_name': asset_name.text if asset_name is not None else 'Unknown',
                                    'asset_type': asset_type.text if asset_type is not None else 'Unknown',
                                    'start_time': start_time.text if start_time is not None else '',
                                    'end_time': end_time.text if end_time is not None else '',
                                    'unavailable_capacity_mw': float(quantity.text)
                                })
            
            df = pd.DataFrame(unavailable_data)
            logger.info(f"Retrieved {len(df)} unavailable capacity records for {country}")
            return df
            
        except Exception as e:
            logger.error(f"Error processing unavailable capacity data: {e}")
            return pd.DataFrame()

    def analyze_grid_constraints_for_datacenter(self, target_countries: List[str], 
                                              analysis_months: int = 12) -> Dict[str, Any]:
        """
        Comprehensive grid constraint analysis for datacenter site selection
        
        Args:
            target_countries: List of countries to analyze
            analysis_months: Number of months of historical data to analyze
            
        Returns:
            Dictionary with comprehensive grid analysis
        """
        end_date = datetime.now()
        start_date = end_date - timedelta(days=30 * analysis_months)
        
        analysis_results = {
            'analysis_period': {
                'start': start_date.isoformat(),
                'end': end_date.isoformat(),
                'months': analysis_months
            },
            'countries': {},
            'cross_border_analysis': {},
            'grid_constraints_summary': {}
        }
        
        logger.info(f"Starting grid constraint analysis for {len(target_countries)} countries")
        
        # Analyze each country
        for country in target_countries:
            logger.info(f"Analyzing grid constraints for {country}")
            
            country_analysis = {
                'installed_capacity': {},
                'unavailable_capacity': {},
                'cross_border_capacity': {},
                'constraint_score': 0  # Will calculate based on data
            }
            
            # Get installed capacity (latest year)
            current_year = datetime.now().year
            capacity_df = self.get_installed_capacity_by_fuel(country, current_year)
            if not capacity_df.empty:
                country_analysis['installed_capacity'] = {
                    'total_mw': capacity_df['capacity_mw'].sum(),
                    'by_fuel_type': capacity_df.groupby('fuel_type')['capacity_mw'].sum().to_dict()
                }
            
            # Get unavailable capacity (last 3 months)
            unavail_start = end_date - timedelta(days=90)
            unavail_df = self.get_unavailable_capacity(country, unavail_start, end_date)
            if not unavail_df.empty:
                country_analysis['unavailable_capacity'] = {
                    'avg_unavailable_mw': unavail_df['unavailable_capacity_mw'].mean(),
                    'max_unavailable_mw': unavail_df['unavailable_capacity_mw'].max(),
                    'outage_count': len(unavail_df)
                }
            
            analysis_results['countries'][country] = country_analysis
        
        # Cross-border analysis between target countries
        for i, country1 in enumerate(target_countries):
            for country2 in target_countries[i+1:]:
                logger.info(f"Analyzing cross-border capacity: {country1} <-> {country2}")
                
                # Get capacity in both directions
                cap_12 = self.get_transmission_capacity(country1, country2, start_date, end_date)
                cap_21 = self.get_transmission_capacity(country2, country1, start_date, end_date)
                
                cross_border_key = f"{country1}-{country2}"
                analysis_results['cross_border_analysis'][cross_border_key] = {
                    f'{country1}_to_{country2}': {
                        'avg_capacity_mw': cap_12['capacity_mw'].mean() if not cap_12.empty else 0,
                        'max_capacity_mw': cap_12['capacity_mw'].max() if not cap_12.empty else 0,
                        'records_count': len(cap_12)
                    },
                    f'{country2}_to_{country1}': {
                        'avg_capacity_mw': cap_21['capacity_mw'].mean() if not cap_21.empty else 0,
                        'max_capacity_mw': cap_21['capacity_mw'].max() if not cap_21.empty else 0,
                        'records_count': len(cap_21)
                    }
                }
        
        # Calculate constraint summary
        analysis_results['grid_constraints_summary'] = {
            'total_countries_analyzed': len(target_countries),
            'countries_with_capacity_data': len([c for c in analysis_results['countries'] 
                                               if analysis_results['countries'][c]['installed_capacity']]),
            'cross_border_connections_analyzed': len(analysis_results['cross_border_analysis']),
            'recommendations': [
                "Countries with higher unavailable capacity may have grid reliability issues",
                "Cross-border capacity limits could affect power import/export for datacenters",
                "Consider transmission constraints when evaluating datacenter sites",
                "Monitor seasonal variations in grid capacity and constraints"
            ]
        }
        
        return analysis_results

    def export_grid_intelligence(self, target_countries: List[str], 
                                output_dir: str = "data/entsoe_intelligence") -> Dict[str, str]:
        """
        Export comprehensive ENTSO-E grid intelligence data
        
        Args:
            target_countries: Countries to analyze
            output_dir: Output directory for data files
            
        Returns:
            Dictionary with exported file paths
        """
        os.makedirs(output_dir, exist_ok=True)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        exported_files = {}
        
        # Run comprehensive analysis
        logger.info("Running comprehensive grid constraint analysis...")
        analysis_results = self.analyze_grid_constraints_for_datacenter(target_countries)
        
        # Export analysis results
        analysis_file = f"{output_dir}/entsoe_grid_analysis_{timestamp}.json"
        with open(analysis_file, 'w') as f:
            json.dump(analysis_results, f, indent=2)
        exported_files['grid_analysis'] = analysis_file
        
        # Export country mapping
        mapping_file = f"{output_dir}/entsoe_country_codes_{timestamp}.json"
        with open(mapping_file, 'w') as f:
            json.dump({
                'country_codes': self.country_codes,
                'bidding_zones': self.bidding_zones,
                'document_types': self.document_types
            }, f, indent=2)
        exported_files['country_mapping'] = mapping_file
        
        logger.info(f"ENTSO-E grid intelligence exported to {len(exported_files)} files")
        return exported_files

def main():
    """
    Main function to run ENTSO-E grid intelligence collection
    """
    logger.info("Starting ENTSO-E Grid Intelligence Collection")
    
    # Target countries for datacenter analysis
    target_countries = ['Finland', 'Sweden', 'Norway', 'Denmark', 'Germany', 'Netherlands']
    
    # Initialize client
    client = ENTSOEClient()
    
    if not client.security_token:
        print("ERROR: ENTSO-E Security Token required")
        print("Register at: https://transparency.entsoe.eu/")
        print("Set environment variable: export ENTSOE_SECURITY_TOKEN='your_token'")
        return
    
    # Export intelligence data
    exported = client.export_grid_intelligence(target_countries)
    
    print("\n" + "="*60)
    print("ENTSO-E GRID INTELLIGENCE COLLECTION COMPLETE")
    print("="*60)
    
    print(f"\nAnalyzed {len(target_countries)} countries:")
    for country in target_countries:
        print(f"  • {country}")
    
    print(f"\nExported {len(exported)} data files:")
    for data_type, file_path in exported.items():
        print(f"  • {data_type}: {file_path}")
    
    print("\nNext Steps:")
    print("1. Review grid constraint analysis results")
    print("2. Cross-reference with national TSO data (Fingrid, etc.)")
    print("3. Identify countries/regions with lowest grid constraints")
    print("4. Monitor transmission capacity trends over time")
    print("5. Integrate findings into datacenter site selection criteria")

if __name__ == "__main__":
    main()