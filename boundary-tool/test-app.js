const { chromium } = require('playwright');
const path = require('path');

async function testBoundaryTool() {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();

    // Enable console log capture
    page.on('console', msg => {
        console.log(`[Browser Console] ${msg.type()}: ${msg.text()}`);
    });

    // Capture errors
    page.on('pageerror', error => {
        console.error(`[Page Error]`, error.message);
    });

    // Capture network failures
    page.on('requestfailed', request => {
        console.error(`[Request Failed] ${request.url()} - ${request.failure()?.errorText}`);
    });

    try {
        console.log('🚀 Starting Pori Boundary Tool Test...\n');
        
        // Navigate to the app
        console.log('📍 Navigating to http://localhost:8000');
        await page.goto('http://localhost:8000', { waitUntil: 'networkidle' });
        
        // Take initial screenshot
        await page.screenshot({ path: 'test-initial.png', fullPage: true });
        console.log('📸 Initial screenshot saved as test-initial.png\n');

        // Check if critical elements exist
        console.log('🔍 Checking critical elements...');
        
        const elements = {
            'Map container': '#map',
            'App container': '#app',
            'Draw polygon button': '#draw-polygon',
            'Draw rectangle button': '#draw-rectangle',
            'Edit button': '#edit-polygon',
            'Delete button': '#delete-polygon',
            'Status message': '#status-message',
            'Area display': '#area-display'
        };

        for (const [name, selector] of Object.entries(elements)) {
            const exists = await page.$(selector) !== null;
            const visible = await page.isVisible(selector).catch(() => false);
            console.log(`  ${exists ? '✅' : '❌'} ${name} exists: ${exists}, visible: ${visible}`);
        }

        // Check map initialization
        console.log('\n🗺️ Checking map initialization...');
        const mapInitialized = await page.evaluate(() => {
            const mapDiv = document.getElementById('map');
            if (!mapDiv) return { exists: false };
            
            return {
                exists: true,
                hasChildren: mapDiv.children.length > 0,
                childrenCount: mapDiv.children.length,
                hasLeafletContainer: !!mapDiv.querySelector('.leaflet-container'),
                dimensions: {
                    width: mapDiv.offsetWidth,
                    height: mapDiv.offsetHeight
                },
                classes: mapDiv.className
            };
        });
        console.log('  Map status:', JSON.stringify(mapInitialized, null, 2));

        // Check if Leaflet is loaded
        console.log('\n📦 Checking JavaScript libraries...');
        const libStatus = await page.evaluate(() => {
            return {
                leaflet: typeof window.L !== 'undefined',
                leafletVersion: window.L?.version,
                leafletDraw: typeof window.L?.Control?.Draw !== 'undefined',
                turf: typeof window.turf !== 'undefined'
            };
        });
        console.log('  Library status:', JSON.stringify(libStatus, null, 2));

        // Check for JavaScript errors in modules
        console.log('\n⚠️ Checking for module loading errors...');
        const moduleErrors = await page.evaluate(() => {
            const scripts = Array.from(document.querySelectorAll('script'));
            return scripts.map(script => ({
                src: script.src || 'inline',
                type: script.type,
                loaded: !script.src || script.complete
            }));
        });
        console.log('  Script loading status:', JSON.stringify(moduleErrors, null, 2));

        // Try clicking draw polygon button
        console.log('\n🖱️ Testing button functionality...');
        const drawButton = await page.$('#draw-polygon');
        if (drawButton) {
            console.log('  Clicking "Draw Polygon" button...');
            await drawButton.click();
            await page.waitForTimeout(1000);
            
            // Check status message
            const statusText = await page.textContent('#status-message');
            console.log(`  Status message after click: "${statusText}"`);
            
            // Take screenshot after click
            await page.screenshot({ path: 'test-after-click.png', fullPage: true });
            console.log('  📸 Screenshot saved as test-after-click.png');
        } else {
            console.log('  ❌ Draw button not found');
        }

        // Check CSS loading
        console.log('\n🎨 Checking CSS styles...');
        const cssStatus = await page.evaluate(() => {
            const app = document.getElementById('app');
            if (!app) return null;
            
            const styles = window.getComputedStyle(app);
            return {
                backgroundColor: styles.backgroundColor,
                color: styles.color,
                display: styles.display,
                height: styles.height
            };
        });
        console.log('  App styles:', JSON.stringify(cssStatus, null, 2));

        // Check network resources
        console.log('\n🌐 Checking loaded resources...');
        const resources = await page.evaluate(() => {
            return performance.getEntriesByType('resource').map(r => ({
                name: r.name.split('/').pop(),
                type: r.initiatorType,
                status: r.transferSize > 0 ? 'loaded' : 'failed/cached',
                duration: Math.round(r.duration) + 'ms'
            }));
        });
        console.log('  Resources:', JSON.stringify(resources.slice(0, 10), null, 2));

        // Final diagnostic
        console.log('\n📊 Final Diagnostics:');
        console.log('  - Map container exists:', mapInitialized.exists);
        console.log('  - Map has Leaflet:', mapInitialized.hasLeafletContainer);
        console.log('  - Leaflet loaded:', libStatus.leaflet);
        console.log('  - Leaflet.draw loaded:', libStatus.leafletDraw);
        console.log('  - Buttons exist:', await page.$('#draw-polygon') !== null);

    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        // Keep browser open for manual inspection
        console.log('\n🔍 Browser will stay open for 30 seconds for manual inspection...');
        await page.waitForTimeout(30000);
        await browser.close();
        console.log('✅ Test complete');
    }
}

// Start the test
testBoundaryTool();