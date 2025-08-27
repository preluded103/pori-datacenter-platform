#!/usr/bin/env python3
"""
Grid Document Analyzer for existing PDF documents
Extracts grid capacity, connection queue, and infrastructure data from collected PDFs
"""

import pdfplumber
import pandas as pd
import json
import re
from pathlib import Path
from typing import Dict, List, Optional, Any
import logging

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class GridDocumentAnalyzer:
    """
    Analyzes existing grid-related PDF documents to extract:
    - Grid capacity information
    - Connection requirements
    - Infrastructure constraints
    - Queue information
    """
    
    def __init__(self, docs_dir: str = "../docs"):
        """Initialize analyzer with docs directory"""
        self.docs_dir = Path(docs_dir)
        
        # Keywords for different types of grid information
        self.capacity_keywords = [
            'capacity', 'MW', 'GW', 'transmission capacity', 'grid capacity',
            'available capacity', 'thermal capacity', 'power transfer', 'transfer capacity'
        ]
        
        self.connection_keywords = [
            'connection', 'connecting', 'connection queue', 'application', 
            'connection process', 'grid connection', 'connection agreement',
            'connection terms', 'connection point'
        ]
        
        self.constraint_keywords = [
            'constraint', 'congestion', 'bottleneck', 'limitation',
            'thermal limit', 'voltage limit', 'stability limit'
        ]
        
        self.investment_keywords = [
            'investment', 'development', 'upgrade', 'reinforcement',
            'expansion', 'new line', 'substation', 'transformer'
        ]

    def analyze_fingrid_documents(self) -> Dict[str, Any]:
        """Analyze all Fingrid documents in the docs folder"""
        fingrid_files = list(self.docs_dir.glob("*ingrid*.pdf"))
        
        logger.info(f"Found {len(fingrid_files)} Fingrid documents to analyze")
        
        results = {
            'documents_analyzed': len(fingrid_files),
            'capacity_data': [],
            'connection_data': [],
            'constraint_data': [],
            'investment_data': [],
            'document_summaries': {}
        }
        
        for pdf_file in fingrid_files:
            logger.info(f"Analyzing: {pdf_file.name}")
            doc_analysis = self.analyze_pdf(pdf_file)
            
            # Store document summary
            results['document_summaries'][pdf_file.name] = doc_analysis
            
            # Extract specific data types
            results['capacity_data'].extend(doc_analysis.get('capacity_info', []))
            results['connection_data'].extend(doc_analysis.get('connection_info', []))
            results['constraint_data'].extend(doc_analysis.get('constraint_info', []))
            results['investment_data'].extend(doc_analysis.get('investment_info', []))
        
        return results

    def analyze_pdf(self, pdf_path: Path) -> Dict[str, Any]:
        """Analyze a single PDF document"""
        analysis = {
            'file_name': pdf_path.name,
            'pages_processed': 0,
            'capacity_info': [],
            'connection_info': [],
            'constraint_info': [],
            'investment_info': [],
            'key_sections': [],
            'numerical_data': []
        }
        
        try:
            with pdfplumber.open(pdf_path) as pdf:
                analysis['pages_processed'] = len(pdf.pages)
                
                for page_num, page in enumerate(pdf.pages):
                    try:
                        text = page.extract_text()
                        if not text:
                            continue
                            
                        # Look for capacity information
                        capacity_matches = self.extract_capacity_info(text, page_num)
                        analysis['capacity_info'].extend(capacity_matches)
                        
                        # Look for connection information
                        connection_matches = self.extract_connection_info(text, page_num)
                        analysis['connection_info'].extend(connection_matches)
                        
                        # Look for constraint information
                        constraint_matches = self.extract_constraint_info(text, page_num)
                        analysis['constraint_info'].extend(constraint_matches)
                        
                        # Look for investment/development information
                        investment_matches = self.extract_investment_info(text, page_num)
                        analysis['investment_info'].extend(investment_matches)
                        
                        # Extract numerical data (MW, GW, voltage levels, etc.)
                        numerical_matches = self.extract_numerical_data(text, page_num)
                        analysis['numerical_data'].extend(numerical_matches)
                        
                    except Exception as e:
                        logger.warning(f"Error processing page {page_num} of {pdf_path.name}: {e}")
                        continue
                        
        except Exception as e:
            logger.error(f"Error analyzing {pdf_path.name}: {e}")
            
        return analysis

    def extract_capacity_info(self, text: str, page_num: int) -> List[Dict[str, Any]]:
        """Extract grid capacity information from text"""
        matches = []
        
        # Look for sentences containing capacity keywords
        sentences = text.split('.')
        for sentence in sentences:
            sentence = sentence.strip()
            if any(keyword.lower() in sentence.lower() for keyword in self.capacity_keywords):
                # Extract numerical values (MW, GW)
                numbers = re.findall(r'(\d+(?:,\d{3})*(?:\.\d+)?)\s*(MW|GW|MVA)', sentence, re.IGNORECASE)
                if numbers:
                    matches.append({
                        'page': page_num,
                        'text': sentence,
                        'values': numbers,
                        'type': 'capacity'
                    })
        
        return matches

    def extract_connection_info(self, text: str, page_num: int) -> List[Dict[str, Any]]:
        """Extract grid connection information from text"""
        matches = []
        
        sentences = text.split('.')
        for sentence in sentences:
            sentence = sentence.strip()
            if any(keyword.lower() in sentence.lower() for keyword in self.connection_keywords):
                matches.append({
                    'page': page_num,
                    'text': sentence,
                    'type': 'connection'
                })
        
        return matches

    def extract_constraint_info(self, text: str, page_num: int) -> List[Dict[str, Any]]:
        """Extract grid constraint information from text"""
        matches = []
        
        sentences = text.split('.')
        for sentence in sentences:
            sentence = sentence.strip()
            if any(keyword.lower() in sentence.lower() for keyword in self.constraint_keywords):
                matches.append({
                    'page': page_num,
                    'text': sentence,
                    'type': 'constraint'
                })
        
        return matches

    def extract_investment_info(self, text: str, page_num: int) -> List[Dict[str, Any]]:
        """Extract investment/development information from text"""
        matches = []
        
        sentences = text.split('.')
        for sentence in sentences:
            sentence = sentence.strip()
            if any(keyword.lower() in sentence.lower() for keyword in self.investment_keywords):
                # Look for years and costs
                years = re.findall(r'20\d{2}', sentence)
                costs = re.findall(r'(\d+(?:,\d{3})*(?:\.\d+)?)\s*(million|billion|M€|B€)', sentence, re.IGNORECASE)
                
                matches.append({
                    'page': page_num,
                    'text': sentence,
                    'years': years,
                    'costs': costs,
                    'type': 'investment'
                })
        
        return matches

    def extract_numerical_data(self, text: str, page_num: int) -> List[Dict[str, Any]]:
        """Extract all numerical data with units"""
        matches = []
        
        # Pattern for numbers with electrical units
        patterns = [
            (r'(\d+(?:,\d{3})*(?:\.\d+)?)\s*(MW|GW|MVA|kV|MV|GV)', 'electrical'),
            (r'(\d+(?:,\d{3})*(?:\.\d+)?)\s*(km|meter|m)', 'distance'),
            (r'(\d+(?:,\d{3})*(?:\.\d+)?)\s*(€|million|billion)', 'cost'),
            (r'(20\d{2})', 'year')
        ]
        
        for pattern, data_type in patterns:
            found = re.findall(pattern, text, re.IGNORECASE)
            for match in found:
                if isinstance(match, tuple):
                    value, unit = match
                else:
                    value, unit = match, ''
                    
                matches.append({
                    'page': page_num,
                    'value': value,
                    'unit': unit,
                    'data_type': data_type
                })
        
        return matches

    def generate_grid_intelligence_report(self, analysis_results: Dict[str, Any]) -> str:
        """Generate a comprehensive grid intelligence report"""
        report = f"""
# Grid Intelligence Analysis Report
Generated: {pd.Timestamp.now().strftime('%Y-%m-%d %H:%M:%S')}

## Summary
- Documents Analyzed: {analysis_results['documents_analyzed']}
- Capacity Data Points: {len(analysis_results['capacity_data'])}
- Connection Data Points: {len(analysis_results['connection_data'])}
- Constraint Data Points: {len(analysis_results['constraint_data'])}
- Investment Data Points: {len(analysis_results['investment_data'])}

## Key Findings

### Grid Capacity Information
"""
        
        # Add capacity findings
        for item in analysis_results['capacity_data'][:10]:  # Top 10
            if 'values' in item and item['values']:
                values_str = ', '.join([f"{v[0]} {v[1]}" for v in item['values']])
                report += f"- **{values_str}**: {item['text'][:100]}...\n"
        
        report += "\n### Connection Requirements\n"
        for item in analysis_results['connection_data'][:10]:
            report += f"- {item['text'][:100]}...\n"
        
        report += "\n### Grid Constraints\n"
        for item in analysis_results['constraint_data'][:10]:
            report += f"- {item['text'][:100]}...\n"
        
        report += "\n### Investment Plans\n"
        for item in analysis_results['investment_data'][:10]:
            report += f"- {item['text'][:100]}...\n"
        
        return report

    def export_to_json(self, analysis_results: Dict[str, Any], output_path: str):
        """Export analysis results to JSON"""
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(analysis_results, f, indent=2, ensure_ascii=False, default=str)
        logger.info(f"Results exported to: {output_path}")

if __name__ == "__main__":
    analyzer = GridDocumentAnalyzer()
    results = analyzer.analyze_fingrid_documents()
    
    # Generate report
    report = analyzer.generate_grid_intelligence_report(results)
    
    # Save results
    analyzer.export_to_json(results, "data/grid_intelligence_analysis.json")
    
    with open("data/grid_intelligence_report.md", 'w') as f:
        f.write(report)
    
    print("Grid Intelligence Analysis Complete!")
    print(f"Analyzed {results['documents_analyzed']} documents")
    print(f"Found {len(results['capacity_data'])} capacity data points")
    print(f"Found {len(results['connection_data'])} connection data points")