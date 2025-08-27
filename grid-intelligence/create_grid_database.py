#!/usr/bin/env python3
"""
Grid Intelligence Database Creator
Creates structured database from analyzed document data for ArcGIS Online integration
"""

import json
import pandas as pd
import sqlite3
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Any
import logging

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class GridIntelligenceDatabase:
    """
    Creates and manages structured grid intelligence database
    """
    
    def __init__(self, data_file: str = "data/grid_intelligence_analysis.json"):
        """Initialize database creator"""
        self.data_file = Path(data_file)
        self.db_path = Path("data/grid_intelligence.db")
        
        # Load the analyzed document data
        with open(self.data_file, 'r', encoding='utf-8') as f:
            self.analysis_data = json.load(f)

    def create_database(self):
        """Create SQLite database with structured grid intelligence data"""
        logger.info("Creating grid intelligence database...")
        
        # Connect to SQLite database
        conn = sqlite3.connect(self.db_path)
        
        try:
            # Create tables
            self.create_tables(conn)
            
            # Insert data
            self.insert_capacity_data(conn)
            self.insert_connection_data(conn)
            self.insert_constraint_data(conn)
            self.insert_investment_data(conn)
            self.insert_document_metadata(conn)
            
            # Create summary views
            self.create_views(conn)
            
            conn.commit()
            logger.info(f"Database created successfully: {self.db_path}")
            
        finally:
            conn.close()

    def create_tables(self, conn: sqlite3.Connection):
        """Create database tables"""
        
        # Grid capacity table
        conn.execute("""
        CREATE TABLE IF NOT EXISTS grid_capacity (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            document_source TEXT NOT NULL,
            page_number INTEGER,
            capacity_mw REAL,
            capacity_unit TEXT,
            description TEXT,
            project_name TEXT,
            location TEXT,
            status TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """)
        
        # Grid connections table
        conn.execute("""
        CREATE TABLE IF NOT EXISTS grid_connections (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            document_source TEXT NOT NULL,
            page_number INTEGER,
            connection_type TEXT,
            description TEXT,
            requirements TEXT,
            process_info TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """)
        
        # Grid constraints table
        conn.execute("""
        CREATE TABLE IF NOT EXISTS grid_constraints (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            document_source TEXT NOT NULL,
            page_number INTEGER,
            constraint_type TEXT,
            description TEXT,
            location TEXT,
            impact TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """)
        
        # Investment projects table
        conn.execute("""
        CREATE TABLE IF NOT EXISTS investment_projects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            document_source TEXT NOT NULL,
            page_number INTEGER,
            project_name TEXT,
            description TEXT,
            investment_amount REAL,
            currency TEXT,
            timeline TEXT,
            status TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """)
        
        # Document metadata table
        conn.execute("""
        CREATE TABLE IF NOT EXISTS document_metadata (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            filename TEXT UNIQUE NOT NULL,
            pages_processed INTEGER,
            capacity_points INTEGER,
            connection_points INTEGER,
            constraint_points INTEGER,
            investment_points INTEGER,
            analysis_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """)

    def insert_capacity_data(self, conn: sqlite3.Connection):
        """Insert grid capacity data"""
        logger.info("Inserting grid capacity data...")
        
        for item in self.analysis_data['capacity_data']:
            # Extract capacity values if available
            capacity_mw = None
            capacity_unit = None
            
            if 'values' in item and item['values']:
                for value, unit in item['values']:
                    # Convert to MW for standardization
                    if unit.upper() == 'GW':
                        capacity_mw = float(value.replace(',', '')) * 1000
                        capacity_unit = 'MW'
                    elif unit.upper() == 'MW':
                        capacity_mw = float(value.replace(',', ''))
                        capacity_unit = 'MW'
                    elif unit.upper() == 'MVA':
                        capacity_mw = float(value.replace(',', '')) * 0.95  # Approximate MW from MVA
                        capacity_unit = 'MW'
                    break  # Use first value
            
            # Extract project/location info from text
            text = item['text']
            project_name = self.extract_project_name(text)
            location = self.extract_location(text)
            
            conn.execute("""
            INSERT INTO grid_capacity 
            (document_source, page_number, capacity_mw, capacity_unit, description, project_name, location)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                item.get('document_source', 'Unknown'),
                item.get('page', 0),
                capacity_mw,
                capacity_unit,
                text[:500],  # Truncate long descriptions
                project_name,
                location
            ))

    def insert_connection_data(self, conn: sqlite3.Connection):
        """Insert grid connection data"""
        logger.info("Inserting grid connection data...")
        
        for item in self.analysis_data['connection_data']:
            text = item['text']
            connection_type = self.classify_connection_type(text)
            
            conn.execute("""
            INSERT INTO grid_connections 
            (document_source, page_number, connection_type, description)
            VALUES (?, ?, ?, ?)
            """, (
                item.get('document_source', 'Unknown'),
                item.get('page', 0),
                connection_type,
                text[:500]
            ))

    def insert_constraint_data(self, conn: sqlite3.Connection):
        """Insert grid constraint data"""
        logger.info("Inserting grid constraint data...")
        
        for item in self.analysis_data['constraint_data']:
            text = item['text']
            constraint_type = self.classify_constraint_type(text)
            
            conn.execute("""
            INSERT INTO grid_constraints 
            (document_source, page_number, constraint_type, description)
            VALUES (?, ?, ?, ?)
            """, (
                item.get('document_source', 'Unknown'),
                item.get('page', 0),
                constraint_type,
                text[:500]
            ))

    def insert_investment_data(self, conn: sqlite3.Connection):
        """Insert investment project data"""
        logger.info("Inserting investment project data...")
        
        for item in self.analysis_data['investment_data']:
            text = item['text']
            
            # Extract investment amount
            investment_amount = None
            currency = None
            
            if 'costs' in item and item['costs']:
                for amount, curr in item['costs']:
                    investment_amount = float(amount.replace(',', ''))
                    currency = curr
                    break
            
            # Extract timeline
            timeline = None
            if 'years' in item and item['years']:
                timeline = '-'.join(item['years'])
            
            conn.execute("""
            INSERT INTO investment_projects 
            (document_source, page_number, description, investment_amount, currency, timeline)
            VALUES (?, ?, ?, ?, ?, ?)
            """, (
                item.get('document_source', 'Unknown'),
                item.get('page', 0),
                text[:500],
                investment_amount,
                currency,
                timeline
            ))

    def insert_document_metadata(self, conn: sqlite3.Connection):
        """Insert document analysis metadata"""
        logger.info("Inserting document metadata...")
        
        for filename, doc_data in self.analysis_data['document_summaries'].items():
            conn.execute("""
            INSERT OR REPLACE INTO document_metadata 
            (filename, pages_processed, capacity_points, connection_points, constraint_points, investment_points)
            VALUES (?, ?, ?, ?, ?, ?)
            """, (
                filename,
                doc_data.get('pages_processed', 0),
                len(doc_data.get('capacity_info', [])),
                len(doc_data.get('connection_info', [])),
                len(doc_data.get('constraint_info', [])),
                len(doc_data.get('investment_info', []))
            ))

    def create_views(self, conn: sqlite3.Connection):
        """Create database views for common queries"""
        logger.info("Creating database views...")
        
        # High capacity projects view
        conn.execute("""
        CREATE VIEW IF NOT EXISTS high_capacity_projects AS
        SELECT 
            project_name,
            location,
            SUM(capacity_mw) as total_capacity_mw,
            COUNT(*) as data_points,
            GROUP_CONCAT(DISTINCT document_source) as sources
        FROM grid_capacity 
        WHERE capacity_mw > 100
        GROUP BY project_name, location
        ORDER BY total_capacity_mw DESC
        """)
        
        # Connection requirements summary
        conn.execute("""
        CREATE VIEW IF NOT EXISTS connection_summary AS
        SELECT 
            connection_type,
            COUNT(*) as requirement_count,
            GROUP_CONCAT(DISTINCT document_source) as sources
        FROM grid_connections
        GROUP BY connection_type
        ORDER BY requirement_count DESC
        """)
        
        # Investment timeline view
        conn.execute("""
        CREATE VIEW IF NOT EXISTS investment_timeline AS
        SELECT 
            timeline,
            COUNT(*) as project_count,
            SUM(investment_amount) as total_investment,
            currency
        FROM investment_projects
        WHERE timeline IS NOT NULL
        GROUP BY timeline, currency
        ORDER BY timeline
        """)

    def extract_project_name(self, text: str) -> str:
        """Extract project name from text"""
        # Look for common project indicators
        project_indicators = ['line', 'connection', 'link', 'project', 'development']
        
        for indicator in project_indicators:
            if indicator.lower() in text.lower():
                # Extract surrounding context
                words = text.split()
                for i, word in enumerate(words):
                    if indicator.lower() in word.lower():
                        # Take 2 words before and after
                        start = max(0, i-2)
                        end = min(len(words), i+3)
                        return ' '.join(words[start:end])
        
        return None

    def extract_location(self, text: str) -> str:
        """Extract location from text"""
        # Common Finnish/Nordic locations mentioned in grid documents
        locations = [
            'Finland', 'Sweden', 'Norway', 'Denmark', 'Estonia',
            'Pori', 'Helsinki', 'Tampere', 'Oulu', 'Turku',
            'Northern Finland', 'Southern Finland', 'Western Finland'
        ]
        
        for location in locations:
            if location.lower() in text.lower():
                return location
                
        return None

    def classify_connection_type(self, text: str) -> str:
        """Classify connection type from text"""
        if 'cross-border' in text.lower() or 'international' in text.lower():
            return 'International Connection'
        elif 'transmission' in text.lower():
            return 'Transmission Connection'
        elif 'regional' in text.lower():
            return 'Regional Connection'
        elif 'distribution' in text.lower():
            return 'Distribution Connection'
        else:
            return 'General Connection'

    def classify_constraint_type(self, text: str) -> str:
        """Classify constraint type from text"""
        if 'thermal' in text.lower():
            return 'Thermal Constraint'
        elif 'voltage' in text.lower():
            return 'Voltage Constraint'
        elif 'congestion' in text.lower():
            return 'Congestion'
        elif 'bottleneck' in text.lower():
            return 'Bottleneck'
        else:
            return 'General Constraint'

    def export_for_arcgis(self):
        """Export data in ArcGIS-compatible formats"""
        logger.info("Exporting data for ArcGIS Online...")
        
        conn = sqlite3.connect(self.db_path)
        
        try:
            # Export capacity data as CSV
            capacity_df = pd.read_sql_query("""
            SELECT * FROM grid_capacity 
            WHERE capacity_mw IS NOT NULL 
            ORDER BY capacity_mw DESC
            """, conn)
            capacity_df.to_csv("data/grid_capacity_arcgis.csv", index=False)
            
            # Export connection summary
            connection_df = pd.read_sql_query("SELECT * FROM connection_summary", conn)
            connection_df.to_csv("data/grid_connections_arcgis.csv", index=False)
            
            # Export investment timeline
            investment_df = pd.read_sql_query("SELECT * FROM investment_timeline", conn)
            investment_df.to_csv("data/grid_investments_arcgis.csv", index=False)
            
            logger.info("ArcGIS export files created in data/ directory")
            
        finally:
            conn.close()

    def generate_dashboard_config(self):
        """Generate ArcGIS Dashboard configuration"""
        logger.info("Generating ArcGIS Dashboard configuration...")
        
        dashboard_config = {
            "title": "European Grid Queue Intelligence Dashboard",
            "description": "Real-time analysis of European TSO grid connection queues and capacity constraints",
            "data_sources": [
                {
                    "name": "Grid Capacity Data",
                    "file": "grid_capacity_arcgis.csv",
                    "type": "Table",
                    "key_fields": ["capacity_mw", "project_name", "location"]
                },
                {
                    "name": "Connection Requirements",
                    "file": "grid_connections_arcgis.csv", 
                    "type": "Table",
                    "key_fields": ["connection_type", "requirement_count"]
                },
                {
                    "name": "Investment Timeline",
                    "file": "grid_investments_arcgis.csv",
                    "type": "Table",
                    "key_fields": ["timeline", "project_count", "total_investment"]
                }
            ],
            "widgets": [
                {
                    "type": "indicator",
                    "title": "Total Grid Capacity Analyzed",
                    "field": "capacity_mw",
                    "aggregation": "sum"
                },
                {
                    "type": "bar_chart",
                    "title": "Connection Types Distribution",
                    "data": "grid_connections_arcgis.csv",
                    "x_field": "connection_type",
                    "y_field": "requirement_count"
                },
                {
                    "type": "timeline",
                    "title": "Investment Timeline",
                    "data": "grid_investments_arcgis.csv",
                    "date_field": "timeline",
                    "value_field": "total_investment"
                }
            ]
        }
        
        with open("data/arcgis_dashboard_config.json", 'w') as f:
            json.dump(dashboard_config, f, indent=2)
        
        logger.info("Dashboard configuration saved to data/arcgis_dashboard_config.json")

if __name__ == "__main__":
    db_creator = GridIntelligenceDatabase()
    
    # Create database
    db_creator.create_database()
    
    # Export for ArcGIS
    db_creator.export_for_arcgis()
    
    # Generate dashboard config
    db_creator.generate_dashboard_config()
    
    print("Grid Intelligence Database created successfully!")
    print("Ready for ArcGIS Online integration")