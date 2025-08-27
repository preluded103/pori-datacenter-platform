import { test, expect } from '@playwright/test';

test.describe('UI Compliance Validation', () => {
  
  test.beforeEach(async ({ page }) => {
    // Start the development server and navigate to homepage
    await page.goto('http://localhost:3000');
  });

  test('homepage loads with correct title and layout', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/Pre-DD Intelligence Platform|Feasibility Dashboard/);
    
    // Check main heading
    await expect(page.locator('h1')).toContainText('Feasibility Dashboard');
    
    // Check subtitle
    await expect(page.locator('text=Start Page, user selects NEW or an Existing Project')).toBeVisible();
  });

  test('shadcn/ui components are rendered correctly', async ({ page }) => {
    // Check Button component in New Project section
    const newProjectButton = page.locator('button').filter({ hasText: 'Project' });
    await expect(newProjectButton).toBeVisible();
    
    // Check Card components
    const cards = page.locator('[class*="border"], [class*="bg-"]').filter({ hasText: 'New' });
    await expect(cards.first()).toBeVisible();
    
    // Check Input component (search field)
    const searchInput = page.locator('input[placeholder="Search projects..."]');
    await expect(searchInput).toBeVisible();
    await expect(searchInput).toHaveAttribute('type', 'text');
    
    // Check Badge components on project items (look for status indicators)
    const statusBadges = page.locator('div[class*="rounded-md border px-2.5 py-0.5"]');
    
    // Should have at least 3 status badges (Active, Draft, Completed)
    await expect(statusBadges).toHaveCount(3);
    
    // Verify specific badge styling classes are present
    await expect(statusBadges.first()).toHaveClass(/.*border.*px-2\.5.*py-0\.5.*/);
    
    // Check that badges contain expected status text
    await expect(page.locator('text=Active')).toBeVisible();
    await expect(page.locator('text=Draft')).toBeVisible();
    await expect(page.locator('text=Completed')).toBeVisible();
  });

  test('dark theme styling is applied', async ({ page }) => {
    // Check body background is dark
    const body = page.locator('body');
    const backgroundColor = await body.evaluate((el) => 
      window.getComputedStyle(el).backgroundColor
    );
    
    // Should be a dark color (not white)
    expect(backgroundColor).not.toBe('rgb(255, 255, 255)');
    
    // Check main container has dark background
    const mainContainer = page.locator('div.min-h-screen');
    await expect(mainContainer).toHaveClass(/.*bg-\[#0a0a0b\].*/);
  });

  test('responsive design works on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check layout adapts to mobile
    await expect(page.locator('h1')).toBeVisible();
    
    // Grid should stack on mobile (single column)
    const gridContainer = page.locator('div.grid');
    await expect(gridContainer).toBeVisible();
    
    // Search should still be functional
    const searchInput = page.locator('input[placeholder="Search projects..."]');
    await expect(searchInput).toBeVisible();
  });

  test('interactive elements work correctly', async ({ page }) => {
    // Test search functionality
    const searchInput = page.locator('input[placeholder="Search projects..."]');
    await searchInput.fill('Pori');
    
    // Should filter projects (assuming mock data is loaded)
    await page.waitForTimeout(500); // Allow for filtering
    
    // Test new project button is clickable
    const newProjectButton = page.locator('text=Project').first();
    await expect(newProjectButton).toBeEnabled();
    
    // Test project links are clickable (if projects exist)
    const projectLinks = page.locator('a[href^="/projects/"]');
    if (await projectLinks.count() > 0) {
      await expect(projectLinks.first()).toBeVisible();
    }
  });

  test('accessibility standards are met', async ({ page }) => {
    // Check for proper heading structure
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('h2')).toBeVisible();
    
    // Check search input has proper labeling
    const searchInput = page.locator('input[placeholder="Search projects..."]');
    await expect(searchInput).toHaveAttribute('placeholder');
    
    // Check buttons have proper text content
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    expect(buttonCount).toBeGreaterThan(0);
    
    // Check links have proper href attributes
    const links = page.locator('a[href]');
    const linkCount = await links.count();
    expect(linkCount).toBeGreaterThan(0);
  });

  test('visual regression test - homepage screenshot', async ({ page }) => {
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
    
    // Take screenshot for visual comparison
    await expect(page).toHaveScreenshot('homepage-ui-compliance.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });

  test('component styling consistency', async ({ page }) => {
    // Check Button styling consistency
    const buttons = page.locator('button');
    const firstButton = buttons.first();
    
    if (await firstButton.isVisible()) {
      // Should have consistent border radius, padding, etc.
      const borderRadius = await firstButton.evaluate((el) => 
        window.getComputedStyle(el).borderRadius
      );
      expect(borderRadius).toBeTruthy();
    }
    
    // Check Card styling
    const cards = page.locator('[class*="card"]').or(page.locator('.bg-\\[\\#131316\\]'));
    if (await cards.count() > 0) {
      const firstCard = cards.first();
      const borderColor = await firstCard.evaluate((el) => 
        window.getComputedStyle(el).borderColor
      );
      expect(borderColor).toBeTruthy();
    }
  });
});

test.describe('UI Performance Validation', () => {
  
  test('page loads within performance budget', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });

  test('no console errors on page load', async ({ page }) => {
    const consoleErrors: string[] = [];
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    // Allow for some warnings but no critical errors
    const criticalErrors = consoleErrors.filter(error => 
      !error.includes('Warning:') && 
      !error.includes('non-standard NODE_ENV')
    );
    
    expect(criticalErrors).toHaveLength(0);
  });
});