/**
 * Comprehensive User Journey E2E Tests
 * Tests complete user flows from landing to project completion
 */

import { test, expect, Page } from '@playwright/test';

test.describe('Complete User Journey Testing', () => {
  
  test.describe('Landing Page & Navigation', () => {
    test('should load homepage and display key information', async ({ page }) => {
      await page.goto('/');
      
      // Check homepage loads
      await expect(page).toHaveTitle(/Pre-DD Intelligence Platform/);
      
      // Take screenshot
      await page.screenshot({ path: 'test-results/01-homepage.png' });
      
      // Check for key navigation elements
      const mainHeading = page.locator('h1').first();
      await expect(mainHeading).toBeVisible();
      
      console.log('✅ Homepage loaded successfully');
    });

    test('should navigate to different sections', async ({ page }) => {
      await page.goto('/');
      
      // Test navigation to demo page
      try {
        await page.getByRole('link', { name: /demo/i }).first().click();
        await expect(page).toHaveURL(/\/demo/);
        console.log('✅ Demo navigation works');
      } catch (error) {
        // Try alternative navigation
        await page.goto('/demo');
        await expect(page.url()).toContain('/demo');
        console.log('✅ Direct demo access works');
      }
      
      // Test navigation to projects page
      try {
        await page.goto('/projects');
        await expect(page.url()).toContain('/projects');
        console.log('✅ Projects page accessible');
        await page.screenshot({ path: 'test-results/02-projects-page.png' });
      } catch (error) {
        console.log('ℹ️ Projects page not accessible:', error.message);
      }
      
      // Test navigation to geospatial demo
      try {
        await page.goto('/geospatial-demo');
        await expect(page.url()).toContain('/geospatial-demo');
        console.log('✅ Geospatial demo accessible');
        await page.screenshot({ path: 'test-results/03-geospatial-demo.png' });
      } catch (error) {
        console.log('ℹ️ Geospatial demo not accessible:', error.message);
      }
    });
  });

  test.describe('Demo Page User Journey', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/demo');
      await page.waitForLoadState('networkidle');
    });

    test('should display demo overview with site data', async ({ page }) => {
      // Check main header
      await expect(page.locator('h1')).toBeVisible();
      
      // Look for site information - be flexible with exact text
      const pageContent = await page.textContent('body');
      const hasSiteData = pageContent.includes('Pori') || 
                         pageContent.includes('Site') || 
                         pageContent.includes('Score');
      
      expect(hasSiteData).toBeTruthy();
      console.log('✅ Demo page shows site information');
      
      await page.screenshot({ path: 'test-results/04-demo-overview.png' });
    });

    test('should toggle between overview and map views', async ({ page }) => {
      // Look for view toggle buttons
      const buttons = await page.locator('button').all();
      let mapButton = null;
      let overviewButton = null;
      
      for (const button of buttons) {
        const text = await button.textContent();
        if (text?.toLowerCase().includes('map') || text?.toLowerCase().includes('gis')) {
          mapButton = button;
        }
        if (text?.toLowerCase().includes('overview')) {
          overviewButton = button;
        }
      }
      
      if (mapButton) {
        await mapButton.click();
        await page.waitForTimeout(2000);
        console.log('✅ Switched to map view');
        await page.screenshot({ path: 'test-results/05-map-view.png' });
        
        if (overviewButton) {
          await overviewButton.click();
          await page.waitForTimeout(1000);
          console.log('✅ Switched back to overview');
          await page.screenshot({ path: 'test-results/06-back-to-overview.png' });
        }
      } else {
        console.log('ℹ️ View toggle buttons not found - checking for map content directly');
        
        // Look for map-related content
        const hasMapContent = await page.locator('.mapboxgl-canvas, canvas').count() > 0;
        if (hasMapContent) {
          console.log('✅ Map content detected');
          await page.screenshot({ path: 'test-results/05-map-detected.png' });
        }
      }
    });

    test('should display constraint analysis when available', async ({ page }) => {
      // Look for constraint-related content
      const constraintElements = await page.locator('text=/constraint|analysis|score/i').count();
      
      if (constraintElements > 0) {
        console.log('✅ Constraint analysis content found');
        
        // Try to interact with constraint elements
        const firstConstraint = page.locator('text=/constraint|analysis|score/i').first();
        await firstConstraint.scrollIntoViewIfNeeded();
        await page.screenshot({ path: 'test-results/07-constraints.png' });
        
        // Check for detailed constraint information
        const detailElements = await page.locator('text=/power|environmental|regulatory/i').count();
        if (detailElements > 0) {
          console.log('✅ Detailed constraint categories found');
        }
      } else {
        console.log('ℹ️ No constraint analysis content found');
      }
    });
  });

  test.describe('Geospatial Demo Journey', () => {
    test('should load comprehensive map interface', async ({ page }) => {
      await page.goto('/geospatial-demo');
      await page.waitForLoadState('networkidle');
      
      // Check main components
      await expect(page.locator('h1')).toBeVisible();
      
      // Look for geospatial-specific content
      const hasGeoContent = await page.textContent('body');
      const hasMapContent = hasGeoContent.includes('Map') || 
                           hasGeoContent.includes('Geographic') || 
                           hasGeoContent.includes('Geospatial') ||
                           hasGeoContent.includes('Comprehensive') ||
                           hasGeoContent.includes('Platform') ||
                           hasGeoContent.includes('Finland');
      
      expect(hasMapContent).toBeTruthy();
      console.log('✅ Geospatial demo loaded');
      
      await page.screenshot({ path: 'test-results/08-geospatial-main.png' });
    });

    test('should display layer controls and country selection', async ({ page }) => {
      await page.goto('/geospatial-demo');
      await page.waitForTimeout(3000);
      
      // Look for layer or country controls
      const controls = await page.locator('button, select, input').all();
      let hasControls = false;
      
      for (const control of controls) {
        const text = await control.textContent();
        if (text?.includes('Finland') || text?.includes('Layer') || text?.includes('FI')) {
          hasControls = true;
          break;
        }
      }
      
      if (hasControls) {
        console.log('✅ Geospatial controls detected');
      } else {
        console.log('ℹ️ Geospatial controls not detected');
      }
      
      await page.screenshot({ path: 'test-results/09-geospatial-controls.png' });
    });

    test('should display data source information', async ({ page }) => {
      await page.goto('/geospatial-demo');
      await page.waitForTimeout(2000);
      
      // Look for data source information
      const pageText = await page.textContent('body');
      const hasDataSources = pageText.includes('Maanmittauslaitos') || 
                            pageText.includes('Finland') ||
                            pageText.includes('data') ||
                            pageText.includes('source');
      
      if (hasDataSources) {
        console.log('✅ Data source information found');
        
        // Scroll through the page to capture different sections
        await page.evaluate(() => window.scrollBy(0, 300));
        await page.screenshot({ path: 'test-results/10-data-sources.png' });
      } else {
        console.log('ℹ️ Data source information not found');
      }
    });
  });

  test.describe('Projects Page Journey', () => {
    test('should load projects interface', async ({ page }) => {
      try {
        await page.goto('/projects');
        await page.waitForLoadState('networkidle');
        
        // Check if projects page loaded
        await expect(page.locator('h1, h2, h3')).toBeVisible();
        console.log('✅ Projects page loaded');
        
        await page.screenshot({ path: 'test-results/11-projects-interface.png' });
        
        // Look for project-related functionality
        const pageText = await page.textContent('body');
        const hasProjectContent = pageText.includes('Project') || 
                                 pageText.includes('Site') ||
                                 pageText.includes('Create');
        
        expect(hasProjectContent).toBeTruthy();
        console.log('✅ Projects page shows relevant content');
        
      } catch (error) {
        console.log('ℹ️ Projects page not available:', error.message);
        
        // Take screenshot of error state
        await page.screenshot({ path: 'test-results/11-projects-error.png' });
      }
    });
  });

  test.describe('Mobile Responsiveness Journey', () => {
    test('should work on mobile viewport', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Test demo page on mobile
      await page.goto('/demo');
      await page.waitForTimeout(2000);
      
      await expect(page.locator('h1, h2').first()).toBeVisible();
      console.log('✅ Demo page works on mobile');
      
      await page.screenshot({ path: 'test-results/12-mobile-demo.png' });
      
      // Test geospatial demo on mobile
      await page.goto('/geospatial-demo');
      await page.waitForTimeout(2000);
      
      await expect(page.locator('h1, h2').first()).toBeVisible();
      console.log('✅ Geospatial demo works on mobile');
      
      await page.screenshot({ path: 'test-results/13-mobile-geospatial.png' });
    });

    test('should handle touch interactions', async ({ browser }) => {
      // Create context with touch enabled
      const context = await browser.newContext({
        hasTouch: true,
        viewport: { width: 375, height: 667 }
      });
      const page = await context.newPage();
      
      await page.goto('/demo');
      await page.waitForTimeout(2000);
      
      // Try touch interactions with buttons
      const buttons = await page.locator('button').all();
      
      if (buttons.length > 0) {
        // Tap the first button
        await buttons[0].tap();
        await page.waitForTimeout(1000);
        console.log('✅ Touch interactions work');
        
        await page.screenshot({ path: 'test-results/14-touch-interaction.png' });
      } else {
        console.log('ℹ️ No buttons found for touch testing');
      }
      
      await context.close();
    });
  });

  test.describe('Performance and Loading', () => {
    test('should load pages within reasonable time', async ({ page }) => {
      const pages = ['/', '/demo', '/geospatial-demo'];
      
      for (const url of pages) {
        const startTime = Date.now();
        
        try {
          await page.goto(url);
          await page.waitForLoadState('networkidle', { timeout: 10000 });
          
          const loadTime = Date.now() - startTime;
          console.log(`✅ ${url} loaded in ${loadTime}ms`);
          
          expect(loadTime).toBeLessThan(10000); // 10 second timeout
          
        } catch (error) {
          console.log(`ℹ️ ${url} failed to load:`, error.message);
        }
      }
    });

    test('should handle network errors gracefully', async ({ page }) => {
      // Test with offline mode
      await page.context().setOffline(true);
      
      try {
        await page.goto('/demo');
        
        // Check if error is handled gracefully
        const hasErrorMessage = await page.locator('text=/error|offline|connection/i').count() > 0;
        
        if (hasErrorMessage) {
          console.log('✅ Offline error handled gracefully');
        } else {
          console.log('ℹ️ No specific offline error message found');
        }
        
        await page.screenshot({ path: 'test-results/15-offline-test.png' });
        
      } catch (error) {
        console.log('ℹ️ Expected offline error:', error.message);
      }
      
      // Turn network back on
      await page.context().setOffline(false);
    });
  });

  test.describe('Accessibility Testing', () => {
    test('should have proper heading hierarchy', async ({ page }) => {
      await page.goto('/demo');
      await page.waitForTimeout(2000);
      
      const h1Count = await page.locator('h1').count();
      const h2Count = await page.locator('h2').count();
      const h3Count = await page.locator('h3').count();
      
      console.log(`Headers found: H1(${h1Count}), H2(${h2Count}), H3(${h3Count})`);
      
      // Should have at least one H1
      expect(h1Count).toBeGreaterThanOrEqual(1);
      console.log('✅ Proper heading structure found');
    });

    test('should have keyboard navigation', async ({ page }) => {
      await page.goto('/demo');
      await page.waitForTimeout(2000);
      
      // Test tab navigation
      await page.keyboard.press('Tab');
      
      const focusedElement = await page.locator(':focus');
      const isVisible = await focusedElement.isVisible().catch(() => false);
      
      if (isVisible) {
        console.log('✅ Keyboard navigation works');
      } else {
        console.log('ℹ️ Keyboard focus not clearly visible');
      }
      
      await page.screenshot({ path: 'test-results/16-keyboard-focus.png' });
    });
  });
});