#!/usr/bin/env python3
"""
TSO Document Harvester for Grid Queue Intelligence
Automated harvesting of transmission system operator planning documents
to extract connection queue and capacity allocation information
"""

import requests
import os
import json
import time
from datetime import datetime
from typing import Dict, List, Optional, Any
from urllib.parse import urljoin, urlparse
import re
from pathlib import Path
import logging
from bs4 import BeautifulSoup
import PyPDF2
import pdfplumber

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class TSODocumentHarvester:
    """
    Automated harvester for TSO planning documents across European countries
    Focus on extracting grid connection queue and capacity information
    """
    
    def __init__(self, output_dir: str = "data/tso_documents"):
        """
        Initialize document harvester
        
        Args:
            output_dir: Directory to store harvested documents
        """
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        # TSO websites and document patterns for each country
        self.tso_sources = {
            'Finland': {
                'name': 'Fingrid',
                'base_url': 'https://www.fingrid.fi',
                'document_urls': [
                    'https://www.fingrid.fi/en/grid/grid-development/',
                    'https://www.fingrid.fi/en/grid/grid-development/grid-development-plan/',
                    'https://www.fingrid.fi/en/grid/connecting-to-the-grid/',
                    'https://www.fingrid.fi/en/grid/grid-development/investment-plan/'
                ],
                'pdf_patterns': [
                    r'.*development.*plan.*\.pdf',
                    r'.*investment.*plan.*\.pdf', 
                    r'.*grid.*plan.*\.pdf',
                    r'.*connection.*guide.*\.pdf',
                    r'.*capacity.*analysis.*\.pdf'
                ],
                'queue_keywords': [
                    'connection queue', 'application', 'connection request',
                    'capacity allocation', 'transmission capacity', 'available capacity',
                    'grid development', 'investment plan', 'connection process'
                ]
            },
            'Sweden': {
                'name': 'Svenska kraftnät',
                'base_url': 'https://www.svk.se',
                'document_urls': [
                    'https://www.svk.se/en/stakeholders/grid-development/',
                    'https://www.svk.se/en/stakeholders/planning-of-the-electricity-system/',
                    'https://www.svk.se/en/stakeholders/technical-regulations/'
                ],
                'pdf_patterns': [
                    r'.*network.*development.*\.pdf',
                    r'.*grid.*development.*\.pdf',
                    r'.*planning.*report.*\.pdf',
                    r'.*capacity.*analysis.*\.pdf'
                ],
                'queue_keywords': [
                    'network development', 'connection', 'capacity planning',
                    'grid expansion', 'transmission planning'
                ]
            },
            'Norway': {
                'name': 'Statnett',
                'base_url': 'https://www.statnett.no',
                'document_urls': [
                    'https://www.statnett.no/en/for-stakeholders-in-the-power-industry/grid-development/',
                    'https://www.statnett.no/en/for-stakeholders-in-the-power-industry/system-operation-and-market-development/'
                ],
                'pdf_patterns': [
                    r'.*grid.*development.*\.pdf',
                    r'.*system.*development.*\.pdf',
                    r'.*network.*plan.*\.pdf'
                ],
                'queue_keywords': [
                    'grid development', 'connection process', 'capacity analysis',
                    'network development', 'transmission capacity'
                ]
            },
            'Denmark': {
                'name': 'Energinet',
                'base_url': 'https://energinet.dk',
                'document_urls': [
                    'https://energinet.dk/en/electricity/electricity-market/',
                    'https://energinet.dk/en/electricity/system-data/'
                ],
                'pdf_patterns': [
                    r'.*system.*plan.*\.pdf',
                    r'.*development.*plan.*\.pdf',
                    r'.*transmission.*plan.*\.pdf'
                ],
                'queue_keywords': [
                    'system development', 'connection', 'capacity planning',
                    'transmission development'
                ]
            },
            'Germany': {
                'name': 'German TSOs',
                'base_url': 'https://www.netzentwicklungsplan.de',
                'document_urls': [
                    'https://www.netzentwicklungsplan.de/en/',
                    'https://www.50hertz.com/en/Grid/Gridexpansion',
                    'https://www.amprion.net/Grid/Grid-Expansion/',
                    'https://www.tennet.eu/electricity-market/grid-development/'
                ],
                'pdf_patterns': [
                    r'.*netzentwicklungsplan.*\.pdf',
                    r'.*network.*development.*plan.*\.pdf',
                    r'.*grid.*development.*\.pdf',
                    r'.*NEP.*\.pdf'
                ],
                'queue_keywords': [
                    'network development plan', 'NEP', 'connection request',
                    'grid expansion', 'capacity allocation', 'transmission planning'
                ]
            },
            'Netherlands': {
                'name': 'TenneT Nederland',
                'base_url': 'https://www.tennet.eu',
                'document_urls': [
                    'https://www.tennet.eu/electricity-market/grid-development/',
                    'https://www.tennet.eu/our-grid/onshore-grid/onshore-projects/'
                ],
                'pdf_patterns': [
                    r'.*system.*development.*\.pdf',
                    r'.*grid.*development.*\.pdf',
                    r'.*investment.*plan.*\.pdf'
                ],
                'queue_keywords': [
                    'system development', 'grid development', 'connection process',
                    'capacity analysis', 'investment plan'
                ]
            }
        }
        
        # Session with reasonable headers
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive'
        })

    def discover_documents(self, country: str) -> List[Dict[str, str]]:
        """
        Discover PDF documents from TSO websites for a specific country
        
        Args:
            country: Country name (Finland, Sweden, etc.)
            
        Returns:
            List of discovered documents with metadata
        """
        if country not in self.tso_sources:
            logger.warning(f"No TSO sources configured for {country}")
            return []
        
        tso_info = self.tso_sources[country]
        discovered_docs = []
        
        logger.info(f"Discovering documents for {country} ({tso_info['name']})")
        
        for base_url in tso_info['document_urls']:
            try:
                logger.info(f"Scanning: {base_url}")
                
                response = self.session.get(base_url, timeout=30)
                response.raise_for_status()
                
                soup = BeautifulSoup(response.content, 'html.parser')
                
                # Find all links
                links = soup.find_all('a', href=True)
                
                for link in links:
                    href = link['href']
                    
                    # Convert relative URLs to absolute
                    full_url = urljoin(base_url, href)
                    
                    # Check if it's a PDF
                    if full_url.lower().endswith('.pdf'):
                        # Check if it matches our patterns
                        filename = os.path.basename(urlparse(full_url).path)
                        
                        for pattern in tso_info['pdf_patterns']:
                            if re.match(pattern, filename, re.IGNORECASE):
                                doc_info = {
                                    'country': country,
                                    'tso': tso_info['name'],
                                    'url': full_url,
                                    'filename': filename,
                                    'source_page': base_url,
                                    'link_text': link.get_text(strip=True)[:100],
                                    'discovered_at': datetime.now().isoformat()
                                }
                                
                                discovered_docs.append(doc_info)
                                logger.info(f"Found document: {filename}")
                                break
                
                # Rate limiting
                time.sleep(2)
                
            except requests.exceptions.RequestException as e:
                logger.error(f"Error scanning {base_url}: {e}")
                continue
            except Exception as e:
                logger.error(f"Unexpected error scanning {base_url}: {e}")
                continue
        
        logger.info(f"Discovered {len(discovered_docs)} documents for {country}")
        return discovered_docs

    def download_document(self, doc_info: Dict[str, str]) -> Optional[str]:
        """
        Download a document and save it locally
        
        Args:
            doc_info: Document information dictionary
            
        Returns:
            Local file path if successful, None otherwise
        """
        try:
            country_dir = self.output_dir / doc_info['country']
            country_dir.mkdir(exist_ok=True)
            
            # Create safe filename
            safe_filename = re.sub(r'[^\w\-_\.]', '_', doc_info['filename'])
            local_path = country_dir / safe_filename
            
            # Skip if already exists
            if local_path.exists():
                logger.info(f"Document already exists: {local_path}")
                return str(local_path)
            
            logger.info(f"Downloading: {doc_info['url']}")
            
            response = self.session.get(doc_info['url'], stream=True, timeout=60)
            response.raise_for_status()
            
            # Check if it's actually a PDF
            content_type = response.headers.get('content-type', '').lower()
            if 'pdf' not in content_type:
                # Check first few bytes for PDF signature
                first_bytes = response.content[:10]
                if not first_bytes.startswith(b'%PDF'):
                    logger.warning(f"URL does not return PDF content: {doc_info['url']}")
                    return None
            
            # Save file
            with open(local_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    if chunk:
                        f.write(chunk)
            
            logger.info(f"Downloaded to: {local_path}")
            return str(local_path)
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Error downloading {doc_info['url']}: {e}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error downloading {doc_info['url']}: {e}")
            return None

    def extract_text_from_pdf(self, pdf_path: str) -> Optional[str]:
        """
        Extract text from PDF document
        
        Args:
            pdf_path: Path to PDF file
            
        Returns:
            Extracted text or None if error
        """
        try:
            # Try pdfplumber first (better for tables and complex layouts)
            with pdfplumber.open(pdf_path) as pdf:
                text = ""
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
                
                if text.strip():
                    return text
            
            # Fallback to PyPDF2
            with open(pdf_path, 'rb') as file:
                reader = PyPDF2.PdfReader(file)
                text = ""
                
                for page in reader.pages:
                    try:
                        text += page.extract_text() + "\n"
                    except Exception as e:
                        logger.warning(f"Error extracting text from page: {e}")
                        continue
                
                return text if text.strip() else None
                
        except Exception as e:
            logger.error(f"Error extracting text from {pdf_path}: {e}")
            return None

    def analyze_queue_content(self, text: str, country: str) -> Dict[str, Any]:
        """
        Analyze document text for grid queue and capacity information
        
        Args:
            text: Extracted document text
            country: Country name
            
        Returns:
            Analysis results dictionary
        """
        if not text:
            return {'queue_indicators': 0, 'capacity_mentions': 0, 'findings': []}
        
        text_lower = text.lower()
        tso_info = self.tso_sources.get(country, {})
        keywords = tso_info.get('queue_keywords', [])
        
        findings = []
        queue_indicators = 0
        capacity_mentions = 0
        
        # Look for queue-related keywords
        for keyword in keywords:
            count = text_lower.count(keyword.lower())
            if count > 0:
                queue_indicators += count
                findings.append(f"Found '{keyword}': {count} mentions")
        
        # Look for specific capacity numbers (MW, GW)
        capacity_pattern = r'(\d+(?:\.\d+)?)\s*(mw|gw|megawatt|gigawatt)'
        capacity_matches = re.findall(capacity_pattern, text_lower)
        capacity_mentions = len(capacity_matches)
        
        if capacity_matches:
            capacities = [f"{match[0]} {match[1].upper()}" for match in capacity_matches[:10]]  # First 10
            findings.append(f"Capacity values mentioned: {', '.join(capacities)}")
        
        # Look for connection-related terms
        connection_terms = [
            'connection request', 'connection application', 'grid connection',
            'transmission connection', 'connection process', 'connection agreement',
            'connection queue', 'connection capacity', 'available capacity'
        ]
        
        connection_mentions = 0
        for term in connection_terms:
            count = text_lower.count(term)
            if count > 0:
                connection_mentions += count
                findings.append(f"Connection term '{term}': {count} mentions")
        
        # Look for time-related information (project timelines)
        timeline_pattern = r'(202[0-9]|20[3-9][0-9])\s*[-–]\s*(202[0-9]|20[3-9][0-9])'
        timeline_matches = re.findall(timeline_pattern, text)
        if timeline_matches:
            timelines = [f"{match[0]}-{match[1]}" for match in timeline_matches[:5]]
            findings.append(f"Project timelines: {', '.join(timelines)}")
        
        # Calculate relevance score
        relevance_score = min(100, (queue_indicators + capacity_mentions + connection_mentions) * 2)
        
        return {
            'queue_indicators': queue_indicators,
            'capacity_mentions': capacity_mentions,
            'connection_mentions': connection_mentions,
            'timeline_mentions': len(timeline_matches),
            'relevance_score': relevance_score,
            'findings': findings,
            'text_length': len(text),
            'analysis_timestamp': datetime.now().isoformat()
        }

    def harvest_country_documents(self, country: str) -> Dict[str, Any]:
        """
        Harvest and analyze all documents for a specific country
        
        Args:
            country: Country name
            
        Returns:
            Comprehensive analysis results
        """
        logger.info(f"Starting document harvest for {country}")
        
        # Discover documents
        discovered_docs = self.discover_documents(country)
        
        if not discovered_docs:
            logger.warning(f"No documents discovered for {country}")
            return {'country': country, 'documents_processed': 0, 'documents': []}
        
        harvest_results = {
            'country': country,
            'tso_name': self.tso_sources[country]['name'],
            'harvest_timestamp': datetime.now().isoformat(),
            'documents_discovered': len(discovered_docs),
            'documents_processed': 0,
            'documents_downloaded': 0,
            'documents_analyzed': 0,
            'total_relevance_score': 0,
            'documents': []
        }
        
        for doc_info in discovered_docs:
            try:
                # Download document
                local_path = self.download_document(doc_info)
                
                doc_result = {
                    'filename': doc_info['filename'],
                    'url': doc_info['url'],
                    'downloaded': local_path is not None,
                    'local_path': local_path,
                    'analysis': {}
                }
                
                if local_path:
                    harvest_results['documents_downloaded'] += 1
                    
                    # Extract text
                    text = self.extract_text_from_pdf(local_path)
                    
                    if text:
                        # Analyze content
                        analysis = self.analyze_queue_content(text, country)
                        doc_result['analysis'] = analysis
                        harvest_results['documents_analyzed'] += 1
                        harvest_results['total_relevance_score'] += analysis['relevance_score']
                        
                        logger.info(f"Analyzed {doc_info['filename']}: "
                                  f"Relevance score {analysis['relevance_score']}")
                
                harvest_results['documents'].append(doc_result)
                harvest_results['documents_processed'] += 1
                
                # Rate limiting
                time.sleep(3)
                
            except Exception as e:
                logger.error(f"Error processing document {doc_info['filename']}: {e}")
                continue
        
        # Calculate average relevance
        if harvest_results['documents_analyzed'] > 0:
            harvest_results['average_relevance_score'] = (
                harvest_results['total_relevance_score'] / harvest_results['documents_analyzed']
            )
        else:
            harvest_results['average_relevance_score'] = 0
        
        logger.info(f"Harvest complete for {country}: "
                   f"{harvest_results['documents_downloaded']} downloaded, "
                   f"{harvest_results['documents_analyzed']} analyzed")
        
        return harvest_results

    def harvest_all_countries(self) -> Dict[str, Any]:
        """
        Harvest documents for all configured countries
        
        Returns:
            Complete harvest results for all countries
        """
        logger.info("Starting comprehensive TSO document harvest")
        
        all_results = {
            'harvest_timestamp': datetime.now().isoformat(),
            'countries': {},
            'summary': {
                'countries_processed': 0,
                'total_documents_discovered': 0,
                'total_documents_downloaded': 0,
                'total_documents_analyzed': 0,
                'highest_relevance_country': '',
                'highest_relevance_score': 0
            }
        }
        
        for country in self.tso_sources.keys():
            logger.info(f"\n{'='*50}")
            logger.info(f"HARVESTING: {country}")
            logger.info(f"{'='*50}")
            
            try:
                country_results = self.harvest_country_documents(country)
                all_results['countries'][country] = country_results
                
                # Update summary
                summary = all_results['summary']
                summary['countries_processed'] += 1
                summary['total_documents_discovered'] += country_results['documents_discovered']
                summary['total_documents_downloaded'] += country_results['documents_downloaded']
                summary['total_documents_analyzed'] += country_results['documents_analyzed']
                
                # Track highest relevance
                avg_relevance = country_results.get('average_relevance_score', 0)
                if avg_relevance > summary['highest_relevance_score']:
                    summary['highest_relevance_score'] = avg_relevance
                    summary['highest_relevance_country'] = country
                
            except Exception as e:
                logger.error(f"Error harvesting {country}: {e}")
                continue
        
        return all_results

    def export_harvest_results(self, results: Dict[str, Any], 
                             output_file: str = None) -> str:
        """
        Export harvest results to JSON file
        
        Args:
            results: Harvest results dictionary
            output_file: Output file path (optional)
            
        Returns:
            Path to exported file
        """
        if not output_file:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            output_file = self.output_dir / f"tso_harvest_results_{timestamp}.json"
        
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(results, f, indent=2, ensure_ascii=False)
        
        logger.info(f"Harvest results exported to: {output_file}")
        return str(output_file)

def main():
    """
    Main function to run TSO document harvesting
    """
    print("="*60)
    print("TSO DOCUMENT HARVESTER FOR GRID QUEUE INTELLIGENCE")
    print("="*60)
    
    harvester = TSODocumentHarvester()
    
    # Run comprehensive harvest
    results = harvester.harvest_all_countries()
    
    # Export results
    export_path = harvester.export_harvest_results(results)
    
    # Print summary
    summary = results['summary']
    print(f"\nHARVEST COMPLETE!")
    print(f"Countries processed: {summary['countries_processed']}")
    print(f"Documents discovered: {summary['total_documents_discovered']}")
    print(f"Documents downloaded: {summary['total_documents_downloaded']}")
    print(f"Documents analyzed: {summary['total_documents_analyzed']}")
    print(f"Highest relevance country: {summary['highest_relevance_country']} "
          f"(score: {summary['highest_relevance_score']:.1f})")
    
    print(f"\nResults exported to: {export_path}")
    
    print("\nNEXT STEPS:")
    print("1. Review downloaded documents in data/tso_documents/")
    print("2. Manually review high-relevance documents for queue information")
    print("3. Extract specific connection queue data and capacity allocations")
    print("4. Contact TSOs directly for detailed queue information")
    print("5. Set up monitoring for new document publications")
    
    # Show top findings by country
    print("\nTOP FINDINGS BY COUNTRY:")
    for country, country_data in results['countries'].items():
        if country_data.get('documents_analyzed', 0) > 0:
            avg_score = country_data.get('average_relevance_score', 0)
            print(f"  {country}: {avg_score:.1f} avg relevance "
                  f"({country_data['documents_analyzed']} docs analyzed)")

if __name__ == "__main__":
    main()