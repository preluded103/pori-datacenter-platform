#!/usr/bin/env python3
"""
Fingrid API Client for Grid Queue Intelligence
Automated data collection from Finnish TSO for datacenter site selection
"""

import requests
import pandas as pd
import json
import os
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
import time
import logging

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class FingridAPIClient:
    """
    Client for accessing Fingrid (Finnish TSO) data for grid queue intelligence
    """
    
    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize Fingrid API client
        
        Args:
            api_key: Fingrid API key (will try environment variable if not provided)
        """
        self.api_key = api_key or os.getenv('FINGRID_API_KEY')
        self.base_url = "https://api.fingrid.fi/v1"
        self.data_url = "https://data.fingrid.fi/api/datasets"
        
        if not self.api_key:
            logger.warning("No Fingrid API key provided - some endpoints may not work")
        
        # API endpoint mapping for different data types
        self.endpoints = {
            'production': '/data/production',
            'consumption': '/data/consumption', 
            'transmission': '/data/transmission',
            'balance': '/data/balance',
            'reserves': '/data/reserves',
            'cross_border': '/data/cross-border-transmission',
            'grid_losses': '/data/grid-losses',
            'wind_power': '/data/wind-power-generation'
        }
        
        # Session for connection pooling
        self.session = requests.Session()
        if self.api_key:
            self.session.headers.update({
                'x-api-key': self.api_key,
                'Accept': 'application/json'
            })

    def get_transmission_capacity_data(self, start_time: datetime, end_time: datetime) -> pd.DataFrame:
        """
        Get transmission capacity data - critical for understanding grid limitations
        
        Args:
            start_time: Start datetime for data query
            end_time: End datetime for data query
            
        Returns:
            DataFrame with transmission capacity data
        """
        try:
            # Dataset ID for transmission capacity (needs to be verified from Fingrid docs)
            dataset_id = "192"  # This needs verification - placeholder
            
            params = {
                'start_time': start_time.isoformat(),
                'end_time': end_time.isoformat(),
                'format': 'json'
            }
            
            url = f"{self.base_url}/variable/{dataset_id}/events/json"
            
            response = self.session.get(url, params=params)
            response.raise_for_status()
            
            data = response.json()
            df = pd.DataFrame(data)
            
            logger.info(f"Retrieved {len(df)} transmission capacity records")
            return df
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Error retrieving transmission capacity data: {e}")
            return pd.DataFrame()

    def get_cross_border_capacity(self, start_time: datetime, end_time: datetime) -> pd.DataFrame:
        """
        Get cross-border transmission capacity data
        Critical for understanding grid interconnection limits
        
        Args:
            start_time: Start datetime
            end_time: End datetime
            
        Returns:
            DataFrame with cross-border capacity data
        """
        try:
            # Cross-border capacity variables (need verification from Fingrid API docs)
            variables = [
                "87",   # Finland-Sweden capacity
                "89",   # Finland-Norway capacity  
                "90",   # Finland-Estonia capacity
                "91"    # Finland-Russia capacity (if available)
            ]
            
            all_data = []
            
            for var_id in variables:
                params = {
                    'start_time': start_time.isoformat(),
                    'end_time': end_time.isoformat(),
                    'format': 'json'
                }
                
                url = f"{self.base_url}/variable/{var_id}/events/json"
                
                response = self.session.get(url, params=params)
                if response.status_code == 200:
                    data = response.json()
                    for item in data:
                        item['variable_id'] = var_id
                    all_data.extend(data)
                else:
                    logger.warning(f"Could not retrieve data for variable {var_id}: {response.status_code}")
            
            df = pd.DataFrame(all_data)
            logger.info(f"Retrieved {len(df)} cross-border capacity records")
            return df
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Error retrieving cross-border capacity data: {e}")
            return pd.DataFrame()

    def get_available_datasets(self) -> List[Dict[str, Any]]:
        """
        Get list of all available datasets from Fingrid
        Critical for discovering grid infrastructure data
        
        Returns:
            List of available datasets with metadata
        """
        try:
            response = self.session.get(f"{self.data_url}")
            response.raise_for_status()
            
            datasets = response.json()
            
            # Filter for transmission/grid related datasets
            grid_keywords = [
                'transmission', 'grid', 'substation', 'capacity', 
                'connection', 'network', 'infrastructure', 'planning'
            ]
            
            grid_datasets = []
            for dataset in datasets:
                name = dataset.get('name', '').lower()
                description = dataset.get('description', '').lower()
                
                if any(keyword in name or keyword in description for keyword in grid_keywords):
                    grid_datasets.append(dataset)
            
            logger.info(f"Found {len(grid_datasets)} grid-related datasets out of {len(datasets)} total")
            return grid_datasets
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Error retrieving datasets: {e}")
            return []

    def search_queue_information(self, keywords: List[str]) -> Dict[str, Any]:
        """
        Search for connection queue or capacity allocation information
        
        Args:
            keywords: List of search terms related to connections/queues
            
        Returns:
            Dictionary with search results
        """
        datasets = self.get_available_datasets()
        
        queue_info = {
            'datasets_found': [],
            'potential_queue_data': [],
            'capacity_data': [],
            'planning_documents': []
        }
        
        for dataset in datasets:
            name = dataset.get('name', '').lower()
            description = dataset.get('description', '').lower()
            
            # Check for queue-related terms
            queue_terms = ['queue', 'application', 'connection', 'request', 'permit']
            capacity_terms = ['capacity', 'available', 'reserved', 'allocated']
            planning_terms = ['plan', 'development', 'investment', 'expansion']
            
            if any(term in name or term in description for term in queue_terms):
                queue_info['potential_queue_data'].append(dataset)
            elif any(term in name or term in description for term in capacity_terms):
                queue_info['capacity_data'].append(dataset)
            elif any(term in name or term in description for term in planning_terms):
                queue_info['planning_documents'].append(dataset)
                
            if any(keyword.lower() in name or keyword.lower() in description for keyword in keywords):
                queue_info['datasets_found'].append(dataset)
        
        return queue_info

    def get_grid_development_plan_data(self) -> Dict[str, Any]:
        """
        Attempt to access Fingrid's grid development plan information
        This is critical for understanding future capacity allocations
        
        Returns:
            Dictionary with development plan information
        """
        try:
            # This will need to be updated with actual Fingrid endpoints
            # May need to access their planning documents directly
            
            # Check if they have API endpoints for planning data
            planning_endpoints = [
                '/planning/development-plan',
                '/planning/investment-plan',
                '/planning/capacity-forecast',
                '/data/network-development'
            ]
            
            plan_data = {
                'api_endpoints': [],
                'document_links': [],
                'capacity_forecasts': []
            }
            
            for endpoint in planning_endpoints:
                try:
                    url = f"{self.base_url}{endpoint}"
                    response = self.session.get(url)
                    
                    if response.status_code == 200:
                        plan_data['api_endpoints'].append({
                            'endpoint': endpoint,
                            'status': 'available',
                            'data': response.json()
                        })
                        logger.info(f"Found planning endpoint: {endpoint}")
                    
                except requests.exceptions.RequestException:
                    continue
            
            # If no API endpoints, may need to scrape planning documents
            if not plan_data['api_endpoints']:
                logger.warning("No planning API endpoints found - may need document harvesting approach")
            
            return plan_data
            
        except Exception as e:
            logger.error(f"Error accessing grid development plan: {e}")
            return {}

    def export_grid_intelligence_data(self, output_dir: str = "data/grid_intelligence") -> Dict[str, str]:
        """
        Export all collected grid intelligence data for analysis
        
        Args:
            output_dir: Directory to save exported data
            
        Returns:
            Dictionary with file paths of exported data
        """
        os.makedirs(output_dir, exist_ok=True)
        
        exported_files = {}
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # Get datasets information
        try:
            datasets = self.get_available_datasets()
            datasets_file = f"{output_dir}/fingrid_datasets_{timestamp}.json"
            with open(datasets_file, 'w') as f:
                json.dump(datasets, f, indent=2)
            exported_files['datasets'] = datasets_file
            logger.info(f"Exported datasets to {datasets_file}")
        except Exception as e:
            logger.error(f"Error exporting datasets: {e}")
        
        # Search for queue information
        try:
            queue_info = self.search_queue_information(['datacenter', 'industrial', 'connection', 'capacity'])
            queue_file = f"{output_dir}/fingrid_queue_search_{timestamp}.json"
            with open(queue_file, 'w') as f:
                json.dump(queue_info, f, indent=2)
            exported_files['queue_search'] = queue_file
            logger.info(f"Exported queue search to {queue_file}")
        except Exception as e:
            logger.error(f"Error exporting queue search: {e}")
        
        # Get recent transmission data (last 30 days)
        try:
            end_time = datetime.now()
            start_time = end_time - timedelta(days=30)
            
            transmission_df = self.get_transmission_capacity_data(start_time, end_time)
            if not transmission_df.empty:
                transmission_file = f"{output_dir}/fingrid_transmission_{timestamp}.csv"
                transmission_df.to_csv(transmission_file, index=False)
                exported_files['transmission_data'] = transmission_file
                logger.info(f"Exported transmission data to {transmission_file}")
        except Exception as e:
            logger.error(f"Error exporting transmission data: {e}")
        
        # Get cross-border capacity data
        try:
            cross_border_df = self.get_cross_border_capacity(start_time, end_time)
            if not cross_border_df.empty:
                cross_border_file = f"{output_dir}/fingrid_cross_border_{timestamp}.csv"
                cross_border_df.to_csv(cross_border_file, index=False)
                exported_files['cross_border_data'] = cross_border_file
                logger.info(f"Exported cross-border data to {cross_border_file}")
        except Exception as e:
            logger.error(f"Error exporting cross-border data: {e}")
        
        # Create summary report
        try:
            summary = {
                'export_timestamp': timestamp,
                'exported_files': exported_files,
                'total_datasets': len(datasets) if 'datasets' in locals() else 0,
                'queue_search_results': len(queue_info.get('datasets_found', [])) if 'queue_info' in locals() else 0,
                'api_endpoints_tested': len(self.endpoints),
                'notes': [
                    "Fingrid API key required for full functionality",
                    "Grid development plan data may require document harvesting",
                    "Connection queue data not directly available via API",
                    "Consider contacting Fingrid directly for capacity allocation data"
                ]
            }
            
            summary_file = f"{output_dir}/fingrid_intelligence_summary_{timestamp}.json"
            with open(summary_file, 'w') as f:
                json.dump(summary, f, indent=2)
            exported_files['summary'] = summary_file
            logger.info(f"Exported summary to {summary_file}")
            
        except Exception as e:
            logger.error(f"Error creating summary: {e}")
        
        return exported_files

def main():
    """
    Main function to run Fingrid grid intelligence collection
    """
    logger.info("Starting Fingrid Grid Intelligence Collection")
    
    # Initialize client (will use environment variable for API key if available)
    client = FingridAPIClient()
    
    # Export all available data
    exported = client.export_grid_intelligence_data()
    
    logger.info("Grid intelligence collection complete:")
    for data_type, file_path in exported.items():
        logger.info(f"  {data_type}: {file_path}")
    
    # Print next steps
    print("\n" + "="*50)
    print("FINGRID GRID INTELLIGENCE COLLECTION COMPLETE")
    print("="*50)
    print("\nNext Steps:")
    print("1. Review exported datasets for grid infrastructure information")
    print("2. Contact Fingrid directly for connection queue data") 
    print("3. Harvest grid development plan documents for capacity forecasts")
    print("4. Cross-reference with ENTSO-E data for validation")
    print("5. Set up automated monitoring for capacity changes")
    
    if not client.api_key:
        print("\nRECOMMENDATION:")
        print("Register for Fingrid API key at: https://data.fingrid.fi/")
        print("Set environment variable: export FINGRID_API_KEY='your_key_here'")

if __name__ == "__main__":
    main()