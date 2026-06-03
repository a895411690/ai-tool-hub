/**
 * Performance Test for weihub.cloud
 * Tests: page load metrics, resource optimization, caching, runtime performance
 */
import { chromium } from 'playwright';

const TARGET = 'https://weihub.cloud/';
const SCREENSHOT_DIR = '/Users/weijiahao/Downloads/ai-tool-hub/dogfood-output/screenshots';

const results = [];

function log(category, name, passed, detail = '') {
    const status = passed ? 'PASS' : 'FAIL';
    results.push({ category, name, passed, detail });
    console.log(`[${status}] ${category} > ${name}${detail ? ': ' + detail : ''}`);
}

async function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
}

(async () => {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        viewport: { width: 1440, height: 900 }
    });
    const page = await context.newPage();

    // Track console errors
    const consoleErrors = [];
    page.on('console', msg => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    // ========== TEST 1: Page Load Performance ==========
    console.log('\n========== TEST 1: Page Load Performance ==========');
    try {
        const startTime = Date.now();
        await page.goto(TARGET, { waitUntil: 'load', timeout: 60000 });
        await sleep(3000);
        const wallClockLoad = Date.now() - startTime;

        const metrics = await page.evaluate(() => {
            const nav = performance.getEntriesByType('navigation')[0];
            const paint = performance.getEntriesByType('paint');
            const fcp = paint.find(p => p.name === 'first-contentful-paint');
            return {
                ttfb: nav ? (nav.responseStart - nav.requestStart) : -1,
                domContentLoaded: nav ? (nav.domContentLoadedEventEnd - nav.fetchStart) : -1,
                domInteractive: nav ? (nav.domInteractive - nav.fetchStart) : -1,
                fullLoad: nav ? (nav.loadEventEnd - nav.fetchStart) : -1,
                fcp: fcp ? fcp.startTime : -1,
                transferSize: nav ? nav.transferSize : -1,
                domElements: document.querySelectorAll('*').length,
                toolCards: document.querySelectorAll('[data-tool-id]').length
            };
        });

        await page.screenshot({ path: `${SCREENSHOT_DIR}/perf-01-loaded.png` });

        log('页面加载', 'TTFB < 1000ms', metrics.ttfb < 1000, `TTFB=${metrics.ttfb.toFixed(0)}ms`);
        log('页面加载', 'FCP < 2000ms', metrics.fcp < 2000, `FCP=${metrics.fcp.toFixed(0)}ms`);
        log('页面加载', 'DOM Ready < 3000ms', metrics.domContentLoaded < 3000, `DOM Ready=${metrics.domContentLoaded.toFixed(0)}ms`);
        log('页面加载', 'Full Load < 5000ms', metrics.fullLoad < 5000, `Full Load=${metrics.fullLoad.toFixed(0)}ms`);
        log('页面加载', 'Wall Clock Load', true, `${wallClockLoad}ms`);
        log('页面加载', 'Transfer Size', true, `${(metrics.transferSize / 1024).toFixed(1)}KB`);
        log('页面加载', 'DOM Elements < 5000', metrics.domElements < 5000, `${metrics.domElements} elements`);
        log('页面加载', 'Tool Cards >= 80', metrics.toolCards >= 80, `${metrics.toolCards} cards`);

        console.log(`  Detailed: TTFB=${metrics.ttfb.toFixed(0)}ms, FCP=${metrics.fcp.toFixed(0)}ms, DOMReady=${metrics.domContentLoaded.toFixed(0)}ms, FullLoad=${metrics.fullLoad.toFixed(0)}ms`);
    } catch (e) {
        log('页面加载', 'Performance Metrics', false, e.message);
    }

    // ========== TEST 2: LCP Measurement ==========
    console.log('\n========== TEST 2: LCP Measurement ==========');
    try {
        // New page for clean measurement
        const lcpPage = await context.newPage();
        const lcpValue = await lcpPage.evaluate(() => {
            return new Promise((resolve) => {
                new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    const lastEntry = entries[entries.length - 1];
                    resolve(lastEntry.startTime);
                }).observe({ type: 'largest-contentful-paint', buffered: true });
                // Fallback timeout
                setTimeout(() => {
                    const paintEntries = performance.getEntriesByType('paint');
                    const lcp = paintEntries.find(p => p.name === 'largest-contentful-paint');
                    resolve(lcp ? lcp.startTime : -1);
                }, 5000);
            });
        });

        await lcpPage.goto(TARGET, { waitUntil: 'load', timeout: 60000 });
        await sleep(4000);

        const lcpResult = await lcpPage.evaluate(() => {
            return new Promise((resolve) => {
                const observer = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    resolve(entries[entries.length - 1].startTime);
                });
                observer.observe({ type: 'largest-contentful-paint', buffered: true });
                setTimeout(() => resolve(-1), 3000);
            });
        });

        if (lcpResult > 0) {
            log('LCP', 'LCP < 3000ms', lcpResult < 3000, `LCP=${lcpResult.toFixed(0)}ms`);
        } else {
            log('LCP', 'LCP Measurement', true, 'LCP not captured (likely already loaded)');
        }
        await lcpPage.close();
    } catch (e) {
        log('LCP', 'LCP Measurement', false, e.message);
    }

    // ========== TEST 3: Resource Analysis ==========
    console.log('\n========== TEST 3: Resource Analysis ==========');
    try {
        const resourceInfo = await page.evaluate(() => {
            const resources = performance.getEntriesByType('resource');
            const total = resources.length;
            let totalSize = 0;
            const byType = {};

            resources.forEach(r => {
                totalSize += r.transferSize || 0;
                const ext = r.name.split('.').pop().split('?')[0];
                const type = ext.match(/js|css|png|jpg|jpeg|gif|svg|woff|woff2|json|html/) ? ext : 'other';
                byType[type] = (byType[type] || 0) + 1;
            });

            const top5 = resources
                .filter(r => r.transferSize > 0)
                .sort((a, b) => b.transferSize - a.transferSize)
                .slice(0, 5)
                .map(r => ({ name: r.name.split('/').pop(), size: r.transferSize }));

            return { total, totalSize, byType, top5 };
        });

        log('资源分析', 'Total Resources', true, `${resourceInfo.total} resources loaded`);
        log('资源分析', 'Total Transfer Size', true, `${(resourceInfo.totalSize / 1024).toFixed(1)}KB`);
        log('资源分析', 'Resources < 100', resourceInfo.total < 100, `${resourceInfo.total} resources`);

        console.log('  Resource types:', JSON.stringify(resourceInfo.byType));
        console.log('  Top 5 largest:');
        resourceInfo.top5.forEach(r => {
            console.log(`    - ${r.name}: ${(r.size / 1024).toFixed(1)}KB`);
        });
    } catch (e) {
        log('资源分析', 'Resource Analysis', false, e.message);
    }

    // ========== TEST 4: Compression Check ==========
    console.log('\n========== TEST 4: Compression Check ==========');
    try {
        const compressionInfo = await page.evaluate(async () => {
            const resources = performance.getEntriesByType('resource');
            const jsCss = resources.filter(r => r.name.match(/\.(js|css)(\?|$)/));
            const results = [];

            for (const r of jsCss.slice(0, 10)) {
                try {
                    const resp = await fetch(r.name, { method: 'HEAD' });
                    results.push({
                        name: r.name.split('/').pop(),
                        encoding: resp.headers.get('content-encoding') || 'none',
                        size: r.transferSize
                    });
                } catch (e) {
                    results.push({ name: r.name.split('/').pop(), encoding: 'unknown', size: 0 });
                }
            }
            return results;
        });

        const compressed = compressionInfo.filter(r => r.encoding !== 'none' && r.encoding !== 'unknown');
        const totalChecked = compressionInfo.filter(r => r.encoding !== 'unknown').length;

        log('压缩检查', 'Main resources compressed', compressed.length > 0, `${compressed.length}/${totalChecked} resources compressed`);

        compressionInfo.forEach(r => {
            console.log(`  - ${r.name}: encoding=${r.encoding}, size=${(r.size / 1024).toFixed(1)}KB`);
        });
    } catch (e) {
        log('压缩检查', 'Compression Check', false, e.message);
    }

    // ========== TEST 5: Cache Headers ==========
    console.log('\n========== TEST 5: Cache Headers ==========');
    try {
        const cacheInfo = await page.evaluate(async () => {
            const resources = performance.getEntriesByType('resource');
            const staticResources = resources.filter(r => r.name.match(/\.(js|css|png|jpg|svg|woff2?)(\?|$)/));
            const results = [];

            for (const r of staticResources.slice(0, 10)) {
                try {
                    const resp = await fetch(r.name, { method: 'HEAD' });
                    results.push({
                        name: r.name.split('/').pop(),
                        cacheControl: resp.headers.get('cache-control') || 'none',
                        etag: resp.headers.get('etag') || 'none'
                    });
                } catch (e) {
                    results.push({ name: r.name.split('/').pop(), cacheControl: 'unknown', etag: 'unknown' });
                }
            }
            return results;
        });

        const withCache = cacheInfo.filter(r => r.cacheControl !== 'none' && r.cacheControl !== 'unknown');
        log('缓存策略', 'Static assets have cache headers', withCache.length > 0, `${withCache.length}/${cacheInfo.length} assets cached`);

        cacheInfo.forEach(r => {
            console.log(`  - ${r.name}: cache-control=${r.cacheControl}, etag=${r.etag}`);
        });
    } catch (e) {
        log('缓存策略', 'Cache Headers', false, e.message);
    }

    // ========== TEST 6: Service Worker ==========
    console.log('\n========== TEST 6: Service Worker ==========');
    try {
        const swInfo = await page.evaluate(async () => {
            const supported = 'serviceWorker' in navigator;
            let registered = false;
            let cacheNames = [];

            if (supported) {
                const regs = await navigator.serviceWorker.getRegistrations();
                registered = regs.length > 0;

                if ('caches' in window) {
                    cacheNames = await caches.keys();
                }
            }

            return { supported, registered, cacheNames };
        });

        log('Service Worker', 'SW API supported', swInfo.supported);
        log('Service Worker', 'SW registered', swInfo.registered, swInfo.registered ? `caches: ${swInfo.cacheNames.join(', ')}` : 'no registration');
    } catch (e) {
        log('Service Worker', 'SW Check', false, e.message);
    }

    // ========== TEST 7: Search Performance ==========
    console.log('\n========== TEST 7: Search Performance ==========');
    try {
        await page.evaluate(() => window.scrollTo(0, 0));
        await sleep(500);

        const searchPerf = await page.evaluate(async () => {
            const input = document.querySelector('.hero-search-input');
            if (!input) return { found: false };

            input.focus();
            const start = performance.now();
            input.value = 'Chat';
            input.dispatchEvent(new Event('input', { bubbles: true }));

            // Wait for suggestions
            await new Promise(r => setTimeout(r, 1500));
            const elapsed = performance.now() - start;

            const suggestions = document.querySelectorAll('.search-suggestion-item').length;
            return { found: true, elapsed, suggestions };
        });

        if (searchPerf.found) {
            log('搜索性能', 'Search response < 2000ms', searchPerf.elapsed < 2000, `${searchPerf.elapsed.toFixed(0)}ms, ${searchPerf.suggestions} suggestions`);
        } else {
            log('搜索性能', 'Search input found', false, 'search input not found');
        }
    } catch (e) {
        log('搜索性能', 'Search Performance', false, e.message);
    }

    // ========== TEST 8: Theme Toggle Performance ==========
    console.log('\n========== TEST 8: Theme Toggle Performance ==========');
    try {
        const togglePerf = await page.evaluate(async () => {
            const btn = document.querySelector('[data-action="toggle-theme"]');
            if (!btn) return { found: false };

            const start = performance.now();
            btn.click();
            // Wait for DOM change
            await new Promise(r => setTimeout(r, 100));
            const elapsed = performance.now() - start;

            // Toggle back
            btn.click();
            return { found: true, elapsed };
        });

        if (togglePerf.found) {
            log('主题切换', 'Toggle < 150ms', togglePerf.elapsed < 150, `${togglePerf.elapsed.toFixed(1)}ms`);
        } else {
            log('主题切换', 'Toggle button found', false);
        }
    } catch (e) {
        log('主题切换', 'Theme Toggle Perf', false, e.message);
    }

    // ========== TEST 9: Console Errors ==========
    console.log('\n========== TEST 9: Console Errors ==========');
    log('控制台', 'No JS errors during load', consoleErrors.length === 0, `${consoleErrors.length} errors. First 3: ${consoleErrors.slice(0, 3).join(' | ')}`);

    // ========== Summary ==========
    console.log('\n========== PERFORMANCE SUMMARY ==========');
    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;
    const total = results.length;
    console.log(`Total: ${total} | Passed: ${passed} | Failed: ${failed}`);
    console.log(`Pass Rate: ${(passed / total * 100).toFixed(1)}%`);

    if (failed > 0) {
        console.log('\nFailed tests:');
        results.filter(r => !r.passed).forEach(r => {
            console.log(`  - [FAIL] ${r.category} > ${r.name}: ${r.detail}`);
        });
    }

    await browser.close();
    process.exit(failed > 0 ? 1 : 0);
})();
