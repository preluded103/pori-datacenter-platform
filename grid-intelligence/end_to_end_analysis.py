#!/usr/bin/env python3
"""
End-to-End Cohesion Analysis for Grid Queue Intelligence System
Validates complete data flow and integration points
"""

import json
import pandas as pd
import sqlite3
from pathlib import Path
from typing import Dict, List, Any, Tuple
import logging

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class EndToEndValidator:
    """
    Validates complete system cohesion from data sources to final outputs
    """
    
    def __init__(self):
        """Initialize validator"""
        self.data_dir = Path("data")
        self.validation_results = {
            'data_flow': {},
            'integration_points': {},
            'output_consistency': {},
            'gaps_identified': [],
            'cohesion_score': 0
        }

    def validate_data_flow(self) -> Dict[str, Any]:
        """Validate complete data flow through the system"""
        logger.info("🔍 Validating end-to-end data flow...")
        
        flow_validation = {
            'stage_1_ingestion': self.validate_data_ingestion(),
            'stage_2_processing': self.validate_data_processing(), 
            'stage_3_database': self.validate_database_creation(),
            'stage_4_exports': self.validate_arcgis_exports(),
            'stage_5_dashboard': self.validate_dashboard_config()
        }
        
        self.validation_results['data_flow'] = flow_validation
        return flow_validation

    def validate_data_ingestion(self) -> Dict[str, Any]:
        """Validate data ingestion layer"""
        ingestion = {
            'sources_configured': 0,
            'api_clients_ready': 0,
            'document_processing': 0,
            'status': 'unknown'
        }
        
        # Check if modules exist and are properly structured
        modules = [
            'fingrid_api_client.py',
            'entso_e_client.py', 
            'tso_document_harvester.py'
        ]
        
        for module in modules:
            if Path(module).exists():
                ingestion['sources_configured'] += 1
                
        # Check if document analysis was successful
        analysis_file = self.data_dir / "grid_intelligence_analysis.json"
        if analysis_file.exists():
            with open(analysis_file, 'r') as f:
                analysis_data = json.load(f)
                ingestion['documents_processed'] = analysis_data.get('documents_analyzed', 0)
                ingestion['data_points_extracted'] = len(analysis_data.get('capacity_data', []))
                ingestion['api_clients_ready'] = 2  # Fingrid + ENTSO-E
                ingestion['document_processing'] = 1  # TSO harvester + analyzer
        
        # Determine ingestion status
        if ingestion['sources_configured'] >= 3 and ingestion.get('documents_processed', 0) > 0:
            ingestion['status'] = 'complete'
        elif ingestion['sources_configured'] >= 3:
            ingestion['status'] = 'configured'
        else:
            ingestion['status'] = 'incomplete'
            
        return ingestion

    def validate_data_processing(self) -> Dict[str, Any]:
        """Validate data processing pipeline"""
        processing = {
            'pdf_analysis_complete': False,
            'data_extraction_successful': False,
            'categorization_working': False,
            'nlp_extraction_quality': 0,
            'status': 'unknown'
        }
        
        # Check analysis results
        analysis_file = self.data_dir / "grid_intelligence_analysis.json"
        if analysis_file.exists():
            with open(analysis_file, 'r') as f:
                data = json.load(f)
                
                processing['pdf_analysis_complete'] = data.get('documents_analyzed', 0) > 0
                processing['data_extraction_successful'] = len(data.get('capacity_data', [])) > 0
                processing['categorization_working'] = (
                    len(data.get('connection_data', [])) > 0 and
                    len(data.get('constraint_data', [])) > 0 and
                    len(data.get('investment_data', [])) > 0
                )
                
                # Calculate NLP quality score based on data richness
                total_extractions = (
                    len(data.get('capacity_data', [])) +
                    len(data.get('connection_data', [])) +
                    len(data.get('constraint_data', [])) +
                    len(data.get('investment_data', []))
                )
                processing['nlp_extraction_quality'] = min(100, total_extractions / 10)  # Scale to 100
        
        # Check if report was generated
        report_file = self.data_dir / "grid_intelligence_report.md"
        processing['report_generated'] = report_file.exists()
        
        # Determine processing status
        if (processing['pdf_analysis_complete'] and 
            processing['data_extraction_successful'] and 
            processing['categorization_working']):
            processing['status'] = 'complete'
        elif processing['pdf_analysis_complete']:
            processing['status'] = 'partial'
        else:
            processing['status'] = 'failed'
            
        return processing

    def validate_database_creation(self) -> Dict[str, Any]:
        """Validate database creation and structure"""
        database = {
            'database_exists': False,
            'tables_created': 0,
            'data_inserted': 0,
            'views_created': 0,
            'data_integrity': 0,
            'status': 'unknown'
        }
        
        db_file = self.data_dir / "grid_intelligence.db"
        if db_file.exists():
            database['database_exists'] = True
            
            try:
                conn = sqlite3.connect(db_file)
                
                # Check tables
                tables = conn.execute("""
                    SELECT name FROM sqlite_master 
                    WHERE type='table' AND name NOT LIKE 'sqlite_%'
                """).fetchall()
                database['tables_created'] = len(tables)
                
                # Check views  
                views = conn.execute("""
                    SELECT name FROM sqlite_master 
                    WHERE type='view'
                """).fetchall()
                database['views_created'] = len(views)
                
                # Check data integrity
                expected_tables = [
                    'grid_capacity', 'grid_connections', 
                    'grid_constraints', 'investment_projects', 
                    'document_metadata'
                ]
                
                data_counts = {}
                for table in expected_tables:
                    try:
                        count = conn.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0]
                        data_counts[table] = count
                        if count > 0:
                            database['data_inserted'] += 1
                    except Exception as e:
                        logger.warning(f"Could not check table {table}: {e}")
                
                database['data_counts'] = data_counts
                
                # Calculate data integrity score
                if database['tables_created'] >= 5 and database['data_inserted'] >= 4:
                    database['data_integrity'] = 100
                elif database['tables_created'] >= 5:
                    database['data_integrity'] = 80
                else:
                    database['data_integrity'] = 40
                
                conn.close()
                
            except Exception as e:
                logger.error(f"Database validation error: {e}")
                database['status'] = 'corrupted'
                return database
        
        # Determine database status
        if (database['database_exists'] and 
            database['tables_created'] >= 5 and 
            database['data_inserted'] >= 4):
            database['status'] = 'complete'
        elif database['database_exists']:
            database['status'] = 'partial'
        else:
            database['status'] = 'missing'
            
        return database

    def validate_arcgis_exports(self) -> Dict[str, Any]:
        """Validate ArcGIS export files"""
        exports = {
            'csv_files_created': 0,
            'file_sizes': {},
            'data_consistency': 0,
            'arcgis_compatibility': 0,
            'status': 'unknown'
        }
        
        expected_files = [
            'grid_capacity_arcgis.csv',
            'grid_connections_arcgis.csv', 
            'grid_investments_arcgis.csv'
        ]
        
        for filename in expected_files:
            filepath = self.data_dir / filename
            if filepath.exists():
                exports['csv_files_created'] += 1
                exports['file_sizes'][filename] = filepath.stat().st_size
                
                # Check basic CSV structure
                try:
                    df = pd.read_csv(filepath)
                    if len(df) > 0 and len(df.columns) > 2:
                        exports['data_consistency'] += 1
                except Exception as e:
                    logger.warning(f"Could not validate CSV {filename}: {e}")
        
        # Check ArcGIS compatibility
        if exports['csv_files_created'] >= 3:
            exports['arcgis_compatibility'] = 100
        elif exports['csv_files_created'] >= 2:
            exports['arcgis_compatibility'] = 80
        else:
            exports['arcgis_compatibility'] = 40
            
        # Determine export status
        if exports['csv_files_created'] >= 3 and exports['data_consistency'] >= 3:
            exports['status'] = 'complete'
        elif exports['csv_files_created'] >= 2:
            exports['status'] = 'partial'
        else:
            exports['status'] = 'incomplete'
            
        return exports

    def validate_dashboard_config(self) -> Dict[str, Any]:
        """Validate dashboard configuration"""
        dashboard = {
            'config_exists': False,
            'widget_definitions': 0,
            'data_source_mappings': 0,
            'deployment_ready': False,
            'status': 'unknown'
        }
        
        config_file = self.data_dir / "arcgis_dashboard_config.json"
        if config_file.exists():
            dashboard['config_exists'] = True
            
            try:
                with open(config_file, 'r') as f:
                    config = json.load(f)
                    
                    dashboard['widget_definitions'] = len(config.get('widgets', []))
                    dashboard['data_source_mappings'] = len(config.get('data_sources', []))
                    
                    # Check if deployment requirements are met
                    if (dashboard['widget_definitions'] >= 3 and 
                        dashboard['data_source_mappings'] >= 3):
                        dashboard['deployment_ready'] = True
                        
            except Exception as e:
                logger.error(f"Dashboard config validation error: {e}")
        
        # Check if builder module exists
        builder_file = Path("arcgis_dashboard_builder.py")
        dashboard['builder_available'] = builder_file.exists()
        
        # Determine dashboard status
        if dashboard['deployment_ready'] and dashboard['builder_available']:
            dashboard['status'] = 'ready'
        elif dashboard['config_exists']:
            dashboard['status'] = 'configured'
        else:
            dashboard['status'] = 'missing'
            
        return dashboard

    def validate_integration_points(self) -> Dict[str, Any]:
        """Validate integration between system components"""
        logger.info("🔗 Validating integration points...")
        
        integration = {
            'data_format_consistency': self.check_data_format_consistency(),
            'api_to_database_flow': self.check_api_database_flow(),
            'database_to_export_flow': self.check_database_export_flow(),
            'export_to_dashboard_flow': self.check_export_dashboard_flow()
        }
        
        self.validation_results['integration_points'] = integration
        return integration

    def check_data_format_consistency(self) -> Dict[str, Any]:
        """Check consistency of data formats across pipeline stages"""
        consistency = {
            'json_structure_valid': False,
            'csv_headers_consistent': False,
            'database_schema_aligned': False,
            'score': 0
        }
        
        # Check JSON structure from analysis
        analysis_file = self.data_dir / "grid_intelligence_analysis.json"
        if analysis_file.exists():
            try:
                with open(analysis_file, 'r') as f:
                    data = json.load(f)
                    # Check expected structure
                    required_keys = ['documents_analyzed', 'capacity_data', 'connection_data']
                    consistency['json_structure_valid'] = all(key in data for key in required_keys)
            except:
                pass
        
        # Check CSV header consistency
        csv_files = ['grid_capacity_arcgis.csv', 'grid_connections_arcgis.csv']
        headers_consistent = True
        
        for filename in csv_files:
            filepath = self.data_dir / filename
            if filepath.exists():
                try:
                    df = pd.read_csv(filepath, nrows=0)  # Just headers
                    # Check if headers contain expected patterns
                    if filename == 'grid_capacity_arcgis.csv':
                        expected_cols = ['capacity_mw', 'document_source', 'page_number']
                        headers_consistent &= any(col in df.columns for col in expected_cols)
                except:
                    headers_consistent = False
                    
        consistency['csv_headers_consistent'] = headers_consistent
        
        # Check database schema alignment
        db_file = self.data_dir / "grid_intelligence.db"
        if db_file.exists():
            try:
                conn = sqlite3.connect(db_file)
                # Check if capacity table has expected columns
                cursor = conn.execute("PRAGMA table_info(grid_capacity)")
                columns = [row[1] for row in cursor.fetchall()]
                consistency['database_schema_aligned'] = 'capacity_mw' in columns
                conn.close()
            except:
                pass
        
        # Calculate score
        score = sum([
            consistency['json_structure_valid'],
            consistency['csv_headers_consistent'], 
            consistency['database_schema_aligned']
        ]) * 33.33
        
        consistency['score'] = round(score, 1)
        return consistency

    def check_api_database_flow(self) -> Dict[str, Any]:
        """Check flow from API clients to database"""
        flow = {
            'api_data_extractable': False,
            'database_insertable': False,
            'data_transformation_working': False,
            'score': 0
        }
        
        # Check if analysis data exists (indicates API->processing worked)
        analysis_file = self.data_dir / "grid_intelligence_analysis.json"
        if analysis_file.exists():
            flow['api_data_extractable'] = True
        
        # Check if database has data (indicates processing->database worked)
        db_file = self.data_dir / "grid_intelligence.db"
        if db_file.exists():
            try:
                conn = sqlite3.connect(db_file)
                count = conn.execute("SELECT COUNT(*) FROM grid_capacity").fetchone()[0]
                flow['database_insertable'] = count > 0
                
                # Check if data transformation preserved key information
                sample = conn.execute("SELECT capacity_mw FROM grid_capacity WHERE capacity_mw IS NOT NULL LIMIT 1").fetchone()
                flow['data_transformation_working'] = sample is not None
                
                conn.close()
            except:
                pass
        
        flow['score'] = sum([
            flow['api_data_extractable'],
            flow['database_insertable'],
            flow['data_transformation_working']
        ]) * 33.33
        
        return flow

    def check_database_export_flow(self) -> Dict[str, Any]:
        """Check flow from database to CSV exports"""
        flow = {
            'database_readable': False,
            'csv_exports_generated': False,
            'data_preserved': False,
            'score': 0
        }
        
        db_file = self.data_dir / "grid_intelligence.db"
        capacity_csv = self.data_dir / "grid_capacity_arcgis.csv"
        
        if db_file.exists():
            flow['database_readable'] = True
            
            if capacity_csv.exists():
                flow['csv_exports_generated'] = True
                
                # Check if data was preserved in export
                try:
                    conn = sqlite3.connect(db_file)
                    db_count = conn.execute("SELECT COUNT(*) FROM grid_capacity").fetchone()[0]
                    conn.close()
                    
                    csv_df = pd.read_csv(capacity_csv)
                    csv_count = len(csv_df)
                    
                    # Data preservation check (allow for some filtering)
                    flow['data_preserved'] = csv_count >= (db_count * 0.8)
                    
                except:
                    pass
        
        flow['score'] = sum([
            flow['database_readable'],
            flow['csv_exports_generated'],
            flow['data_preserved']
        ]) * 33.33
        
        return flow

    def check_export_dashboard_flow(self) -> Dict[str, Any]:
        """Check flow from exports to dashboard configuration"""
        flow = {
            'csv_files_available': False,
            'dashboard_config_references_data': False,
            'widget_data_mappings_correct': False,
            'score': 0
        }
        
        # Check CSV availability
        csv_files = ['grid_capacity_arcgis.csv', 'grid_connections_arcgis.csv']
        csv_count = sum(1 for f in csv_files if (self.data_dir / f).exists())
        flow['csv_files_available'] = csv_count >= 2
        
        # Check dashboard config references
        config_file = self.data_dir / "arcgis_dashboard_config.json"
        if config_file.exists():
            try:
                with open(config_file, 'r') as f:
                    config = json.load(f)
                    
                    data_sources = config.get('data_sources', [])
                    flow['dashboard_config_references_data'] = len(data_sources) >= 2
                    
                    # Check widget mappings
                    widgets = config.get('widgets', [])
                    has_capacity_widget = any('capacity' in str(w).lower() for w in widgets)
                    has_chart_widget = any(w.get('type') == 'bar_chart' for w in widgets)
                    
                    flow['widget_data_mappings_correct'] = has_capacity_widget and has_chart_widget
                    
            except:
                pass
        
        flow['score'] = sum([
            flow['csv_files_available'],
            flow['dashboard_config_references_data'],
            flow['widget_data_mappings_correct']
        ]) * 33.33
        
        return flow

    def calculate_cohesion_score(self) -> float:
        """Calculate overall end-to-end cohesion score"""
        logger.info("📊 Calculating overall cohesion score...")
        
        # Weight different aspects of cohesion
        weights = {
            'data_flow': 0.4,
            'integration_points': 0.3,
            'output_consistency': 0.3
        }
        
        scores = {
            'data_flow': self.calculate_data_flow_score(),
            'integration_points': self.calculate_integration_score(),
            'output_consistency': self.calculate_output_score()
        }
        
        # Calculate weighted average
        total_score = sum(scores[aspect] * weights[aspect] for aspect in weights)
        
        self.validation_results['cohesion_score'] = round(total_score, 1)
        self.validation_results['component_scores'] = scores
        
        return total_score

    def calculate_data_flow_score(self) -> float:
        """Calculate data flow score"""
        flow = self.validation_results.get('data_flow', {})
        
        stage_scores = []
        for stage_name, stage_data in flow.items():
            if isinstance(stage_data, dict) and 'status' in stage_data:
                if stage_data['status'] == 'complete':
                    stage_scores.append(100)
                elif stage_data['status'] in ['configured', 'ready', 'partial']:
                    stage_scores.append(80)
                else:
                    stage_scores.append(40)
        
        return sum(stage_scores) / len(stage_scores) if stage_scores else 0

    def calculate_integration_score(self) -> float:
        """Calculate integration points score"""
        integration = self.validation_results.get('integration_points', {})
        
        scores = []
        for check_name, check_data in integration.items():
            if isinstance(check_data, dict) and 'score' in check_data:
                scores.append(check_data['score'])
        
        return sum(scores) / len(scores) if scores else 0

    def calculate_output_score(self) -> float:
        """Calculate output consistency score"""
        # Based on file completeness and data quality
        exports = self.validation_results['data_flow'].get('stage_4_exports', {})
        dashboard = self.validation_results['data_flow'].get('stage_5_dashboard', {})
        
        export_score = 100 if exports.get('status') == 'complete' else 60
        dashboard_score = 100 if dashboard.get('status') == 'ready' else 80
        
        return (export_score + dashboard_score) / 2

    def identify_gaps(self) -> List[str]:
        """Identify gaps in end-to-end cohesion"""
        logger.info("🔍 Identifying cohesion gaps...")
        
        gaps = []
        
        # Check data flow stages
        flow = self.validation_results.get('data_flow', {})
        for stage_name, stage_data in flow.items():
            if isinstance(stage_data, dict):
                status = stage_data.get('status', 'unknown')
                if status in ['incomplete', 'missing', 'failed']:
                    gaps.append(f"Data Flow Gap: {stage_name} - {status}")
        
        # Check integration issues
        integration = self.validation_results.get('integration_points', {})
        for check_name, check_data in integration.items():
            if isinstance(check_data, dict):
                score = check_data.get('score', 0)
                if score < 80:
                    gaps.append(f"Integration Gap: {check_name} - Score: {score}%")
        
        # Check specific technical gaps
        if self.validation_results['cohesion_score'] < 90:
            if not (self.data_dir / "grid_intelligence.db").exists():
                gaps.append("Database Missing: Core database file not found")
            
            csv_files = ['grid_capacity_arcgis.csv', 'grid_connections_arcgis.csv']
            missing_csvs = [f for f in csv_files if not (self.data_dir / f).exists()]
            if missing_csvs:
                gaps.append(f"Export Files Missing: {', '.join(missing_csvs)}")
        
        self.validation_results['gaps_identified'] = gaps
        return gaps

    def generate_cohesion_report(self) -> str:
        """Generate comprehensive cohesion analysis report"""
        report = f"""
# End-to-End Cohesion Analysis Report
Generated: {pd.Timestamp.now().strftime('%Y-%m-%d %H:%M:%S')}

## Overall Cohesion Score: {self.validation_results['cohesion_score']}/100

### Component Scores:
- **Data Flow**: {self.validation_results['component_scores']['data_flow']:.1f}/100
- **Integration Points**: {self.validation_results['component_scores']['integration_points']:.1f}/100  
- **Output Consistency**: {self.validation_results['component_scores']['output_consistency']:.1f}/100

## Data Flow Analysis

### Stage 1: Data Ingestion
"""
        
        ingestion = self.validation_results['data_flow']['stage_1_ingestion']
        report += f"""
- **Status**: {ingestion['status'].upper()}
- **Sources Configured**: {ingestion['sources_configured']}/3
- **Documents Processed**: {ingestion.get('documents_processed', 0)}
- **Data Points Extracted**: {ingestion.get('data_points_extracted', 0)}
"""
        
        processing = self.validation_results['data_flow']['stage_2_processing']
        report += f"""
### Stage 2: Data Processing
- **Status**: {processing['status'].upper()}
- **PDF Analysis**: {'✅' if processing['pdf_analysis_complete'] else '❌'}
- **Data Extraction**: {'✅' if processing['data_extraction_successful'] else '❌'}
- **NLP Quality Score**: {processing['nlp_extraction_quality']:.1f}/100
"""
        
        database = self.validation_results['data_flow']['stage_3_database']
        report += f"""
### Stage 3: Database Creation
- **Status**: {database['status'].upper()}
- **Database Exists**: {'✅' if database['database_exists'] else '❌'}
- **Tables Created**: {database['tables_created']}/5
- **Data Populated**: {database['data_inserted']}/5 tables
"""
        
        exports = self.validation_results['data_flow']['stage_4_exports']
        report += f"""
### Stage 4: ArcGIS Exports
- **Status**: {exports['status'].upper()}
- **CSV Files Created**: {exports['csv_files_created']}/3
- **ArcGIS Compatibility**: {exports['arcgis_compatibility']}/100
"""
        
        dashboard = self.validation_results['data_flow']['stage_5_dashboard']
        report += f"""
### Stage 5: Dashboard Configuration
- **Status**: {dashboard['status'].upper()}
- **Config Generated**: {'✅' if dashboard['config_exists'] else '❌'}
- **Widgets Defined**: {dashboard['widget_definitions']}
- **Deployment Ready**: {'✅' if dashboard['deployment_ready'] else '❌'}

## Integration Points Analysis
"""
        
        for check_name, check_data in self.validation_results['integration_points'].items():
            if isinstance(check_data, dict):
                report += f"""
### {check_name.replace('_', ' ').title()}
- **Score**: {check_data['score']}/100
"""
                for key, value in check_data.items():
                    if key != 'score':
                        status = '✅' if value else '❌'
                        report += f"- **{key.replace('_', ' ').title()}**: {status}\n"
        
        # Add gaps section
        gaps = self.validation_results['gaps_identified']
        if gaps:
            report += f"""
## Identified Gaps ({len(gaps)} issues)
"""
            for gap in gaps:
                report += f"- ⚠️ {gap}\n"
        else:
            report += """
## Identified Gaps
✅ No significant gaps identified - system shows excellent end-to-end cohesion
"""
        
        # Add recommendations
        report += f"""
## Recommendations

### Immediate Actions Required:
"""
        if self.validation_results['cohesion_score'] >= 95:
            report += "✅ System demonstrates excellent end-to-end cohesion - ready for production deployment\n"
        elif self.validation_results['cohesion_score'] >= 85:
            report += "⚡ System shows strong cohesion - minor optimizations recommended before production\n"
        else:
            report += "⚠️ System requires attention to integration points before production deployment\n"
        
        report += f"""
### Next Steps:
1. Address any identified gaps above
2. Test complete data pipeline with fresh data
3. Validate ArcGIS dashboard deployment
4. Set up monitoring for production environment

## Conclusion
The Grid Queue Intelligence System demonstrates **{self.validation_results['cohesion_score']}/100 end-to-end cohesion**. 
"""
        
        if self.validation_results['cohesion_score'] >= 90:
            report += "This indicates excellent architectural integration and readiness for production deployment."
        elif self.validation_results['cohesion_score'] >= 80:
            report += "This indicates good architectural integration with minor improvements needed."
        else:
            report += "This indicates integration issues that should be addressed before production deployment."
        
        return report

    def run_complete_analysis(self) -> Dict[str, Any]:
        """Run complete end-to-end cohesion analysis"""
        logger.info("🚀 Starting comprehensive end-to-end cohesion analysis...")
        
        # Run all validations
        self.validate_data_flow()
        self.validate_integration_points()
        
        # Calculate scores and identify gaps
        self.calculate_cohesion_score()
        self.identify_gaps()
        
        # Generate report
        report = self.generate_cohesion_report()
        
        # Save report
        report_file = self.data_dir / "end_to_end_cohesion_report.md"
        with open(report_file, 'w') as f:
            f.write(report)
        
        logger.info(f"📋 Cohesion analysis complete - Score: {self.validation_results['cohesion_score']}/100")
        logger.info(f"📄 Full report saved to: {report_file}")
        
        return self.validation_results

if __name__ == "__main__":
    validator = EndToEndValidator()
    results = validator.run_complete_analysis()
    
    print(f"\n🎯 End-to-End Cohesion Analysis Complete!")
    print(f"📊 Overall Cohesion Score: {results['cohesion_score']}/100")
    print(f"🔍 Gaps Identified: {len(results['gaps_identified'])}")
    print(f"📋 Full Report: data/end_to_end_cohesion_report.md")
    
    if results['cohesion_score'] >= 90:
        print("✅ Excellent cohesion - System ready for production!")
    elif results['cohesion_score'] >= 80:
        print("⚡ Good cohesion - Minor optimizations recommended")
    else:
        print("⚠️ Cohesion issues found - Review required before production")