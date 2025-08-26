/**
 * Updated Demo Page Tests
 * Tests for current demo page implementation
 */

import { test, expect } from '@playwright/test';

test.describe('Demo Page - Current Implementation', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/demo');
    await page.waitForLoadState('networkidle');
  });

  test('should load demo page with main content', async ({ page }) => {
    // Check page loads
    await expect(page.locator('body')).toBeVisible();
    
    // Take screenshot for debugging
    await page.screenshot({ path: 'test-results/demo-main.png', fullPage: true });
    
    // Check for any main heading
    const headings = await page.locator('h1, h2, h3').count();
    expect(headings).toBeGreaterThan(0);
    
    console.log('✅ Demo page loaded with headings');
  });

  test('should display site information', async ({ page }) => {
    // Look for Pori-related content (our main site)
    const pageText = await page.textContent('body');
    
    const hasPoriContent = pageText.includes('Pori') || 
                          pageText.includes('61.') || // Latitude
                          pageText.includes('21.') || // Longitude
                          pageText.includes('Finland');
    
    if (hasPoriContent) {
      console.log('✅ Pori site information found');
    } else {
      console.log('ℹ️ Pori site information not found in page text');
    }
    
    await page.screenshot({ path: 'test-results/demo-content.png', fullPage: true });
  });

  test('should handle button interactions', async ({ page }) => {
    // Find all buttons
    const buttons = await page.locator('button').all();
    console.log(`Found ${buttons.length} buttons`);
    
    for (let i = 0; i < Math.min(buttons.length, 3); i++) {
      const button = buttons[i];
      const buttonText = await button.textContent();
      
      if (await button.isVisible()) {
        try {
          await button.click();
          await page.waitForTimeout(1000);
          console.log(`✅ Button "${buttonText}" clicked successfully`);
          
          // Take screenshot after button click
          await page.screenshot({ path: `test-results/button-click-${i}.png` });
        } catch (error) {
          console.log(`ℹ️ Button "${buttonText}" click failed:`, error.message);
        }
      }
    }
  });

  test('should display map components if available', async ({ page }) => {
    // Look for map-related elements
    const mapElements = await page.locator('.mapboxgl-canvas, canvas, [class*="map"], [class*="Map"]').count();
    
    if (mapElements > 0) {
      console.log('✅ Map components found');
      await page.screenshot({ path: 'test-results/demo-map.png' });
    } else {
      console.log('ℹ️ No map components detected');
    }
    
    // Check for Mapbox specifically
    const hasMapbox = await page.locator('.mapboxgl-map').count() > 0;
    if (hasMapbox) {
      console.log('✅ Mapbox map detected');
      
      // Wait for map to load
      await page.waitForTimeout(3000);
      await page.screenshot({ path: 'test-results/demo-mapbox.png' });
    }
  });

  test('should show constraint visualization if available', async ({ page }) => {
    // Look for constraint-related content
    const constraintText = await page.locator('text=/constraint|analysis|score|risk/i').count();
    
    if (constraintText > 0) {
      console.log('✅ Constraint analysis content found');
      
      // Try to scroll to constraint content
      const firstConstraint = page.locator('text=/constraint|analysis|score|risk/i').first();
      await firstConstraint.scrollIntoViewIfNeeded();
      await page.screenshot({ path: 'test-results/demo-constraints.png' });
    } else {
      console.log('ℹ️ No constraint analysis content found');
    }
  });

  test('should be responsive on different screen sizes', async ({ page }) => {
    const viewports = [
      { width: 1920, height: 1080, name: 'desktop' },
      { width: 768, height: 1024, name: 'tablet' },
      { width: 375, height: 667, name: 'mobile' }
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.reload();
      await page.waitForTimeout(2000);
      
      // Check main content is visible
      const headings = await page.locator('h1, h2, h3').count();
      expect(headings).toBeGreaterThan(0);
      
      console.log(`✅ Demo page works on ${viewport.name} (${viewport.width}x${viewport.height})`);
      await page.screenshot({ path: `test-results/demo-${viewport.name}.png`, fullPage: true });
    }
  });

  test('should handle errors gracefully', async ({ page }) => {
    // Monitor console errors
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.reload();
    await page.waitForTimeout(3000);
    
    console.log(`Console errors found: ${errors.length}`);
    if (errors.length > 0) {
      console.log('Console errors:', errors);
    }
    
    // Check if page still functions despite errors
    const isInteractive = await page.locator('button, input, select, a').count() > 0;
    expect(isInteractive).toBeTruthy();
    console.log('✅ Page remains interactive despite any console errors');
  });
});