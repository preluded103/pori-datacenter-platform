#!/usr/bin/env python3
"""
Test and iterate constraints visualization with Playwright
Generate high-quality screenshots and iterate on design
"""

import asyncio
from playwright.async_api import async_playwright
import os
import time

class ConstraintsVisualizationTester:
    def __init__(self, output_dir="/Users/andrewmetcalf/Pori/docs"):
        self.output_dir = output_dir
        self.map_path = f"{output_dir}/real_constraints_map.html"
        
    async def capture_map_screenshot(self, filename="constraints_map_test.png"):
        """Capture high-quality screenshot of the constraints map"""
        
        if not os.path.exists(self.map_path):
            print(f"❌ Map file not found: {self.map_path}")
            return None
            
        async with async_playwright() as p:
            # Launch browser
            browser = await p.chromium.launch(headless=True)
            page = await browser.new_page()
            
            # Set viewport for high-quality capture
            await page.set_viewport_size({"width": 1920, "height": 1080})
            
            # Load the map
            await page.goto(f"file://{os.path.abspath(self.map_path)}")
            
            # Wait for map to load completely
            print("Waiting for map to load...")
            await page.wait_for_timeout(5000)  # 5 seconds
            
            # Wait for Leaflet map to be ready
            await page.wait_for_selector('.leaflet-container', timeout=10000)
            
            # Additional wait for tiles to load
            await page.wait_for_timeout(3000)
            
            # Capture screenshot
            screenshot_path = f"{self.output_dir}/{filename}"
            await page.screenshot(path=screenshot_path, full_page=True)
            
            print(f"✅ Screenshot captured: {screenshot_path}")
            
            await browser.close()
            return screenshot_path
            
    async def test_map_interactions(self):
        """Test map interactions and layer visibility"""
        
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=False)  # Visible for testing
            page = await browser.new_page()
            
            await page.set_viewport_size({"width": 1920, "height": 1080})
            await page.goto(f"file://{os.path.abspath(self.map_path)}")
            
            # Wait for map to load
            await page.wait_for_selector('.leaflet-container', timeout=10000)
            await page.wait_for_timeout(3000)
            
            print("Map loaded. Testing interactions...")
            
            # Test layer control
            try:
                # Click on layer control to expand it
                layer_control = page.locator('.leaflet-control-layers')
                if await layer_control.count() > 0:
                    await layer_control.click()
                    print("✅ Layer control found and clicked")
                    
                    # Wait a moment and capture state
                    await page.wait_for_timeout(2000)
                    
                    # Capture screenshot with layers expanded
                    await page.screenshot(path=f"{self.output_dir}/map_layers_expanded.png")
                    print("✅ Screenshot with expanded layers captured")
                    
            except Exception as e:
                print(f"⚠️ Layer control test failed: {e}")
                
            # Test zoom and pan
            try:
                # Zoom in
                await page.keyboard.press('+')
                await page.wait_for_timeout(1000)
                await page.keyboard.press('+')
                await page.wait_for_timeout(1000)
                
                # Capture zoomed view
                await page.screenshot(path=f"{self.output_dir}/map_zoomed.png")
                print("✅ Zoomed view captured")
                
            except Exception as e:
                print(f"⚠️ Zoom test failed: {e}")
                
            # Keep browser open for manual inspection
            print("Browser will stay open for 10 seconds for manual inspection...")
            await page.wait_for_timeout(10000)
            
            await browser.close()
            
    async def analyze_map_quality(self):
        """Analyze map quality and suggest improvements"""
        
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            page = await browser.new_page()
            
            await page.set_viewport_size({"width": 1920, "height": 1080})
            await page.goto(f"file://{os.path.abspath(self.map_path)}")
            
            await page.wait_for_selector('.leaflet-container', timeout=10000)
            await page.wait_for_timeout(5000)
            
            # Check for map elements
            analysis = {
                'leaflet_container': await page.locator('.leaflet-container').count(),
                'layer_control': await page.locator('.leaflet-control-layers').count(),
                'markers': await page.locator('.leaflet-marker-icon').count(),
                'popups': await page.locator('.leaflet-popup').count(),
                'circles': await page.locator('path[stroke]').count(),
                'measure_control': await page.locator('.leaflet-control-measure').count(),
            }
            
            print("\n=== MAP QUALITY ANALYSIS ===")
            for element, count in analysis.items():
                status = "✅" if count > 0 else "❌"
                print(f"{status} {element}: {count}")
                
            # Check for errors in console
            page.on('console', lambda msg: print(f"Console: {msg.text}"))
            
            await browser.close()
            return analysis
            
    def generate_quality_report(self, analysis):
        """Generate quality improvement recommendations"""
        
        recommendations = []
        
        if analysis['markers'] == 0:
            recommendations.append("❌ No markers found - check site center and substation markers")
            
        if analysis['layer_control'] == 0:
            recommendations.append("❌ No layer control - users cannot toggle layers")
            
        if analysis['circles'] < 5:
            recommendations.append("⚠️ Few constraint zones - may need more detailed analysis")
            
        if analysis['measure_control'] == 0:
            recommendations.append("⚠️ No measurement tool - users cannot measure distances")
            
        if len(recommendations) == 0:
            recommendations.append("✅ Map quality looks good!")
            
        print("\n=== IMPROVEMENT RECOMMENDATIONS ===")
        for rec in recommendations:
            print(rec)
            
        return recommendations

async def main():
    """Main testing workflow"""
    tester = ConstraintsVisualizationTester()
    
    print("=== CONSTRAINTS MAP VISUALIZATION TESTING ===")
    
    # 1. Capture basic screenshot
    print("\n1. Capturing basic screenshot...")
    await tester.capture_map_screenshot("real_constraints_overview.png")
    
    # 2. Analyze map quality
    print("\n2. Analyzing map quality...")
    analysis = await tester.analyze_map_quality()
    
    # 3. Generate recommendations
    print("\n3. Generating improvement recommendations...")
    recommendations = tester.generate_quality_report(analysis)
    
    # 4. Test interactions (commented out for automated run)
    # print("\n4. Testing map interactions...")
    # await tester.test_map_interactions()
    
    print("\n=== TESTING COMPLETE ===")
    print(f"Screenshots saved to: {tester.output_dir}")

if __name__ == "__main__":
    asyncio.run(main())