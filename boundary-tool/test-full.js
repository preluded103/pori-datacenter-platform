const { chromium } = require('playwright');

async function fullTest() {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();

    // Enable console logging
    page.on('console', msg => {
        if (msg.type() === 'error') {
            console.error(`[Console Error] ${msg.text()}`);
        } else {
            console.log(`[Console] ${msg.text()}`);
        }
    });
    
    page.on('pageerror', error => console.error(`[Page Error]`, error.message));

    console.log('🚀 Full Test of Pori Boundary Tool\n');
    console.log('========================================\n');
    
    // Navigate to the app
    console.log('1️⃣ Loading application...');
    await page.goto('http://localhost:8000', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000); // Give map time to fully initialize
    
    // Check initial state
    console.log('\n2️⃣ Checking initial state...');
    const initialState = await page.evaluate(() => {
        const mapDiv = document.getElementById('map');
        const leafletContainer = mapDiv?.querySelector('.leaflet-container');
        const initialPolygon = document.querySelector('.leaflet-interactive');
        
        return {
            mapInitialized: !!leafletContainer,
            mapDimensions: {
                width: mapDiv?.offsetWidth,
                height: mapDiv?.offsetHeight
            },
            tilesLoaded: !!document.querySelector('.leaflet-tile-loaded'),
            hasInitialPolygon: !!initialPolygon,
            controlsPresent: {
                zoom: !!document.querySelector('.leaflet-control-zoom'),
                layers: !!document.querySelector('.leaflet-control-layers'),
                draw: !!document.querySelector('.leaflet-draw')
            }
        };
    });
    console.log('Initial state:', JSON.stringify(initialState, null, 2));
    
    // Test drawing functionality
    console.log('\n3️⃣ Testing polygon drawing...');
    
    // Click draw polygon button
    await page.click('#draw-polygon');
    await page.waitForTimeout(500);
    
    // Check if draw mode is activated
    const drawModeActive = await page.evaluate(() => {
        return !!document.querySelector('.leaflet-draw-draw-polygon');
    });
    console.log('Draw mode activated:', drawModeActive);
    
    // If draw toolbar exists, click it directly
    if (drawModeActive) {
        await page.click('.leaflet-draw-draw-polygon');
        await page.waitForTimeout(500);
    }
    
    // Draw a polygon by clicking on the map
    console.log('Drawing polygon on map...');
    const mapBounds = await page.locator('#map').boundingBox();
    if (mapBounds) {
        // Click 4 points to create a square
        await page.mouse.click(mapBounds.x + 200, mapBounds.y + 200);
        await page.waitForTimeout(200);
        await page.mouse.click(mapBounds.x + 400, mapBounds.y + 200);
        await page.waitForTimeout(200);
        await page.mouse.click(mapBounds.x + 400, mapBounds.y + 400);
        await page.waitForTimeout(200);
        await page.mouse.click(mapBounds.x + 200, mapBounds.y + 400);
        await page.waitForTimeout(200);
        // Double click to finish
        await page.mouse.dblclick(mapBounds.x + 200, mapBounds.y + 200);
        await page.waitForTimeout(1000);
    }
    
    // Check area calculation
    console.log('\n4️⃣ Checking area calculations...');
    const areaInfo = await page.evaluate(() => {
        return {
            totalArea: document.getElementById('total-area')?.textContent,
            hectares: document.getElementById('area-hectares')?.textContent,
            perimeter: document.getElementById('perimeter')?.textContent,
            vertices: document.getElementById('vertex-count')?.textContent,
            statusMessage: document.getElementById('status-message')?.textContent
        };
    });
    console.log('Area information:', JSON.stringify(areaInfo, null, 2));
    
    // Test edit functionality
    console.log('\n5️⃣ Testing edit functionality...');
    await page.click('#edit-polygon');
    await page.waitForTimeout(500);
    
    const editModeStatus = await page.textContent('#status-message');
    console.log('Edit mode status:', editModeStatus);
    
    // Test delete functionality
    console.log('\n6️⃣ Testing delete functionality...');
    await page.click('#delete-polygon');
    await page.waitForTimeout(500);
    
    const deleteStatus = await page.textContent('#status-message');
    console.log('Delete status:', deleteStatus);
    
    // Test map controls
    console.log('\n7️⃣ Testing map controls...');
    
    // Zoom to site
    await page.click('#zoom-to-site');
    await page.waitForTimeout(1000);
    console.log('Zoomed to site');
    
    // Toggle satellite
    await page.click('#toggle-satellite');
    await page.waitForTimeout(1000);
    const hasSatellite = await page.evaluate(() => {
        return !!document.querySelector('img[src*="arcgisonline"]');
    });
    console.log('Satellite layer toggled:', hasSatellite);
    
    // Toggle grid
    await page.click('#toggle-grid');
    await page.waitForTimeout(500);
    console.log('Grid toggled');
    
    // Test WKT import
    console.log('\n8️⃣ Testing WKT import...');
    const wktTextarea = await page.locator('#wkt-input');
    await wktTextarea.fill('POLYGON((21.808 61.493, 21.812 61.493, 21.812 61.496, 21.808 61.496, 21.808 61.493))');
    await page.click('#import-wkt');
    await page.waitForTimeout(1000);
    
    const wktImportStatus = await page.textContent('#status-message');
    console.log('WKT import status:', wktImportStatus);
    
    // Final screenshot
    await page.screenshot({ path: 'test-final.png', fullPage: true });
    console.log('\n✅ Test complete! Screenshot saved as test-final.png');
    
    // Keep open for manual inspection
    console.log('\n👀 Browser will stay open for 10 seconds for inspection...');
    await page.waitForTimeout(10000);
    
    await browser.close();
}

fullTest().catch(console.error);