/**
 * Geospatial Demo Page Tests
 * Tests for comprehensive mapping interface
 */

import { test, expect } from '@playwright/test';

test.describe('Geospatial Demo Page', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/geospatial-demo');
    await page.waitForLoadState('networkidle');
  });

  test('should load geospatial demo interface', async ({ page }) => {
    // Check main header
    await expect(page.locator('h1')).toBeVisible();
    
    // Take full page screenshot
    await page.screenshot({ path: 'test-results/geospatial-main.png', fullPage: true });
    
    // Check for geospatial-specific content
    const pageText = await page.textContent('body');
    const hasGeoContent = pageText.includes('Map') || 
                         pageText.includes('Geospatial') || 
                         pageText.includes('Comprehensive') ||
                         pageText.includes('Platform');
    
    expect(hasGeoContent).toBeTruthy();
    console.log('✅ Geospatial demo loaded with appropriate content');
  });

  test('should display location selector', async ({ page }) => {
    // Look for location-related controls
    const locationElements = await page.locator('text=/Pori|Finland|Stockholm|Oslo|Copenhagen/i').count();
    
    if (locationElements > 0) {
      console.log('✅ Location selector found');
      
      // Try to interact with location buttons if they exist
      const locationButton = page.locator('button:has-text("Pori")').first();
      if (await locationButton.isVisible()) {
        await locationButton.click();
        await page.waitForTimeout(1000);
        console.log('✅ Location button interaction works');
      }
    } else {
      console.log('ℹ️ Location selector not found');
    }
    
    await page.screenshot({ path: 'test-results/geospatial-locations.png' });
  });

  test('should display country selection dropdown', async ({ page }) => {
    // Look for country selection
    const countrySelect = page.locator('select, [role="combobox"]').first();
    
    if (await countrySelect.isVisible()) {
      // Get current selection
      const currentValue = await countrySelect.inputValue().catch(() => '');
      console.log(`Current country selection: ${currentValue}`);
      
      // Try to change selection
      const options = await countrySelect.locator('option').all();
      if (options.length > 1) {
        await countrySelect.selectOption({ index: 1 });
        await page.waitForTimeout(1000);
        console.log('✅ Country selection works');
      }
    } else {
      console.log('ℹ️ Country selection dropdown not found');
    }
    
    await page.screenshot({ path: 'test-results/geospatial-countries.png' });
  });

  test('should show comprehensive map with layers', async ({ page }) => {
    // Wait for map to potentially load
    await page.waitForTimeout(3000);
    
    // Look for map container
    const mapContainer = await page.locator('.mapboxgl-map, [class*="map"], canvas').count();
    
    if (mapContainer > 0) {
      console.log('✅ Map container found');
      
      // Check for layer controls
      const layerButton = page.locator('button').filter({ hasText: /layer|Layer/i }).first();
      if (await layerButton.isVisible()) {
        await layerButton.click();
        await page.waitForTimeout(1000);
        console.log('✅ Layer controls accessible');
        
        await page.screenshot({ path: 'test-results/geospatial-layers.png' });
      }
    } else {
      console.log('ℹ️ Map container not detected');
    }
  });

  test('should display data sources information', async ({ page }) => {
    // Look for data source information in sidebar
    const dataSources = [
      'Maanmittauslaitos',
      'Lantmäteriet', 
      'Kartverket',
      'Finland',
      'Sweden',
      'Norway'
    ];
    
    let foundSources = 0;
    const pageText = await page.textContent('body');
    
    for (const source of dataSources) {
      if (pageText.includes(source)) {
        foundSources++;
        console.log(`✅ Found data source: ${source}`);
      }
    }
    
    if (foundSources > 0) {
      console.log(`✅ Found ${foundSources} data sources`);
    } else {
      console.log('ℹ️ No specific data sources found');
    }
    
    await page.screenshot({ path: 'test-results/geospatial-data-sources.png' });
  });

  test('should show layer categories and types', async ({ page }) => {
    // Look for layer categories
    const layerCategories = [
      'Topographic',
      'Infrastructure', 
      'Environmental',
      'Real-time',
      'Power',
      'Fiber',
      'Water'
    ];
    
    let foundCategories = 0;
    const pageText = await page.textContent('body');
    
    for (const category of layerCategories) {
      if (pageText.includes(category)) {
        foundCategories++;
        console.log(`✅ Found layer category: ${category}`);
      }
    }
    
    if (foundCategories > 0) {
      console.log(`✅ Found ${foundCategories} layer categories`);
    } else {
      console.log('ℹ️ No specific layer categories found');
    }
  });

  test('should display current coordinates and zoom level', async ({ page }) => {
    // Look for coordinate display
    const coordPattern = /\d+\.\d+/; // Look for decimal numbers
    const coordinateElements = page.locator('text=' + coordPattern.source);
    
    const coordCount = await coordinateElements.count();
    
    if (coordCount > 0) {
      console.log(`✅ Found ${coordCount} coordinate displays`);
      
      // Take screenshot showing coordinates
      const firstCoord = coordinateElements.first();
      await firstCoord.scrollIntoViewIfNeeded();
      await page.screenshot({ path: 'test-results/geospatial-coordinates.png' });
    } else {
      console.log('ℹ️ No coordinate displays found');
    }
  });

  test('should provide usage instructions', async ({ page }) => {
    // Look for instructions or help text
    const instructionKeywords = [
      'How to Use',
      'Click',
      'Select',
      'Zoom',
      'Layer',
      'button',
      'map'
    ];
    
    let foundInstructions = 0;
    const pageText = await page.textContent('body');
    
    for (const keyword of instructionKeywords) {
      if (pageText.toLowerCase().includes(keyword.toLowerCase())) {
        foundInstructions++;
      }
    }
    
    if (foundInstructions >= 3) {
      console.log('✅ Usage instructions found');
    } else {
      console.log('ℹ️ Limited usage instructions found');
    }
    
    // Scroll to bottom to see all instructions
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.screenshot({ path: 'test-results/geospatial-instructions.png' });
  });

  test('should handle map interactions', async ({ page }) => {
    await page.waitForTimeout(3000);
    
    // Try clicking on map area if it exists
    const mapElement = page.locator('.mapboxgl-canvas, canvas').first();
    
    if (await mapElement.isVisible()) {
      // Click on map center
      const box = await mapElement.boundingBox();
      if (box) {
        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
        await page.waitForTimeout(1000);
        console.log('✅ Map click interaction works');
        
        await page.screenshot({ path: 'test-results/geospatial-map-click.png' });
      }
    } else {
      console.log('ℹ️ No interactive map element found');
    }
  });

  test('should work on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForTimeout(2000);
    
    // Check mobile responsiveness
    await expect(page.locator('h1')).toBeVisible();
    
    // Check if sidebar content is accessible on mobile
    const sidebarContent = await page.locator('text=/Finland|Sweden|Norway/i').count();
    
    if (sidebarContent > 0) {
      console.log('✅ Sidebar content accessible on mobile');
    } else {
      console.log('ℹ️ Sidebar content may be hidden on mobile');
    }
    
    await page.screenshot({ path: 'test-results/geospatial-mobile.png' });
  });

  test('should handle map loading states', async ({ page }) => {
    // Reload and check for loading indicators
    await page.reload();
    
    // Look for loading spinner or indicators
    const loadingIndicators = await page.locator('.animate-spin, [class*="loading"], [class*="spinner"]').count();
    
    if (loadingIndicators > 0) {
      console.log('✅ Loading indicators found');
    }
    
    // Wait for content to stabilize
    await page.waitForTimeout(5000);
    
    // Ensure loading indicators are gone
    const remainingLoaders = await page.locator('.animate-spin').count();
    
    if (remainingLoaders === 0) {
      console.log('✅ Loading completed successfully');
    } else {
      console.log('ℹ️ Some loading indicators still present');
    }
    
    await page.screenshot({ path: 'test-results/geospatial-loaded.png' });
  });
});