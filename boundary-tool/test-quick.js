const { chromium } = require('playwright');

async function quickTest() {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();

    // Enable console logging
    page.on('console', msg => console.log(`[Console] ${msg.text()}`));
    page.on('pageerror', error => console.error(`[Error]`, error.message));

    console.log('🚀 Testing Pori Boundary Tool...\n');
    
    await page.goto('http://localhost:8000', { waitUntil: 'networkidle' });
    
    // Wait a bit for map initialization
    await page.waitForTimeout(2000);
    
    // Check if map is initialized
    const mapStatus = await page.evaluate(() => {
        const mapDiv = document.getElementById('map');
        const app = window.PoriBoundaryApp;
        return {
            mapExists: !!mapDiv,
            mapHasChildren: mapDiv?.children.length > 0,
            hasLeafletContainer: !!mapDiv?.querySelector('.leaflet-container'),
            appInitialized: !!app,
            leafletLoaded: typeof window.L !== 'undefined'
        };
    });
    
    console.log('Map Status:', mapStatus);
    
    // Try clicking draw polygon
    await page.click('#draw-polygon');
    await page.waitForTimeout(1000);
    
    const statusText = await page.textContent('#status-message');
    console.log('Status after clicking draw:', statusText);
    
    // Check for drawing toolbar
    const drawToolbar = await page.evaluate(() => {
        return !!document.querySelector('.leaflet-draw-toolbar');
    });
    console.log('Draw toolbar visible:', drawToolbar);
    
    // Take screenshot
    await page.screenshot({ path: 'test-result.png', fullPage: true });
    console.log('Screenshot saved as test-result.png');
    
    await page.waitForTimeout(5000);
    await browser.close();
}

quickTest();