/**
 * Regression test for weihub.cloud
 * Tests: login/register, username display, theme toggle, search, share modal, tool detail
 */
import { chromium } from 'playwright';

const TARGET = 'https://weihub.cloud/';
const SCREENSHOT_DIR = '/Users/weijiahao/Downloads/ai-tool-hub/dogfood-output/screenshots';

const results = [];
let timestamp = Date.now();
let testName = `测试用户${timestamp}`;
let testEmail = `test${timestamp}@test.com`;

function log(category, name, passed, detail = '') {
    const status = passed ? 'PASS' : 'FAIL';
    results.push({ category, name, passed, detail });
    console.log(`[${status}] ${category} > ${name}${detail ? ': ' + detail : ''}`);
}

async function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
}

async function closeAllModals(page) {
    await page.evaluate(() => {
        document.querySelectorAll('.modal-overlay.active').forEach(m => m.classList.remove('active'));
    });
    await sleep(500);
}

(async () => {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        viewport: { width: 1440, height: 900 }
    });
    let page = await context.newPage();

    const consoleErrors = [];
    page.on('console', msg => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    // ========== TEST 0: Clear SW Cache ==========
    console.log('\n========== TEST 0: Clear SW Cache ==========');
    try {
        // First load to unregister SW and clear caches
        await page.goto(TARGET, { waitUntil: 'load', timeout: 60000 });
        await sleep(2000);
        await page.evaluate(async () => {
            if ('serviceWorker' in navigator) {
                const regs = await navigator.serviceWorker.getRegistrations();
                for (const reg of regs) await reg.unregister();
            }
            if ('caches' in window) {
                const names = await caches.keys();
                for (const name of names) await caches.delete(name);
            }
        });
        // Clear browser cookies and storage to ensure fresh state
        await context.clearCookies();
        await context.clearPermissions();
        // Close this page and create a fresh one to avoid cached resources
        await page.close();
        page = await context.newPage();
        // Re-bind console error listener to new page
        page.on('console', msg => {
            if (msg.type() === 'error') consoleErrors.push(msg.text());
        });
        log('初始化', '清除SW缓存', true);
    } catch (e) {
        log('初始化', '清除SW缓存', false, e.message);
    }

    // ========== TEST 1: Homepage Load ==========
    console.log('\n========== TEST 1: Homepage Load ==========');
    try {
        await page.goto(TARGET, { waitUntil: 'load', timeout: 60000 });
        await sleep(3000);
        // Wait for JS to initialize
        await page.waitForSelector('#userName', { timeout: 10000 });

        // Check which JS version is loaded
        const jsVersion = await page.evaluate(() => {
            const scripts = document.querySelectorAll('script[src]');
            return Array.from(scripts).map(s => s.src).join(', ');
        });
        console.log('JS files loaded:', jsVersion);
        await page.screenshot({ path: `${SCREENSHOT_DIR}/01-homepage.png` });

        const title = await page.title();
        log('首页', '页面标题加载', title.includes('AI') || title.includes('Hub'), `title="${title}"`);

        const userNameText = await page.locator('#userName').textContent();
        log('首页', '导航栏显示游客状态', userNameText === '游客', `userName="${userNameText}"`);

        const menuUserNameText = await page.locator('#menuUserName').textContent();
        log('首页', '下拉菜单显示游客', menuUserNameText === '游客', `menuUserName="${menuUserNameText}"`);

        const menuUserEmailText = await page.locator('#menuUserEmail').textContent();
        log('首页', '下拉菜单显示未登录', menuUserEmailText === '未登录', `menuUserEmail="${menuUserEmailText}"`);
    } catch (e) {
        log('首页', '页面加载', false, e.message);
    }

    // ========== TEST 2: Register ==========
    console.log('\n========== TEST 2: Register ==========');
    try {
        // Click user menu button to open dropdown
        await page.locator('.navbar-user-btn').click();
        await sleep(500);

        // Click "登录/注册" menu item
        await page.locator('[data-action="show-auth-modal"]').click();
        await sleep(800);

        // Check auth modal appeared
        const authModalVisible = await page.locator('#authModal').isVisible();
        log('注册', '认证弹窗显示', authModalVisible);
        await page.screenshot({ path: `${SCREENSHOT_DIR}/02-auth-modal-login.png` });

        // Switch to register form via the link
        await page.locator('[data-action="show-register"]').click();
        await sleep(500);

        // Verify register form is visible
        const registerFormVisible = await page.locator('#registerName').isVisible();
        log('注册', '注册表单可见', registerFormVisible);

        await page.screenshot({ path: `${SCREENSHOT_DIR}/03-auth-modal-register.png` });

        // Fill register form
        await page.locator('#registerName').fill(testName);
        await page.locator('#registerEmail').fill(testEmail);
        await page.locator('#registerPassword').fill('Test123456');

        await page.screenshot({ path: `${SCREENSHOT_DIR}/04-register-form-filled.png` });

        // Click register button
        await page.locator('[data-action="do-register"]').click();
        await sleep(2000);

        // Debug: check if the function exists and call it manually
        const debugInfo = await page.evaluate(() => {
            const user = JSON.parse(localStorage.getItem('ai-tool-hub-current-user') || 'null');
            const userNameEl = document.getElementById('userName');
            const menuUserNameEl = document.getElementById('menuUserName');
            const menuUserEmailEl = document.getElementById('menuUserEmail');
            // Check what the auth button says
            const authBtn = document.querySelector('[data-action="show-auth-modal"]');
            const logoutBtn = document.querySelector('[data-action="do-logout"]');
            return {
                localStorage: user,
                userNameText: userNameEl ? userNameEl.textContent : 'NOT_FOUND',
                menuUserNameText: menuUserNameEl ? menuUserNameEl.textContent : 'NOT_FOUND',
                menuUserEmailText: menuUserEmailEl ? menuUserEmailEl.textContent : 'NOT_FOUND',
                menuUserEmailExists: !!menuUserEmailEl,
                authBtnText: authBtn ? authBtn.textContent.trim() : 'NOT_FOUND',
                logoutBtnDisplay: logoutBtn ? logoutBtn.style.display : 'NOT_FOUND',
            };
        });
        console.log('DEBUG after register:', JSON.stringify(debugInfo));

        await page.screenshot({ path: `${SCREENSHOT_DIR}/05-after-register.png` });

        // Check username updated after register
        const userNameTextAfter = await page.locator('#userName').textContent();
        log('注册', '注册后导航栏显示用户名', userNameTextAfter === testName, `userName="${userNameTextAfter}" (expected "${testName}")`);

        const menuUserNameTextAfter = await page.locator('#menuUserName').textContent();
        log('注册', '注册后下拉菜单显示用户名', menuUserNameTextAfter === testName, `menuUserName="${menuUserNameTextAfter}"`);

        const menuUserEmailTextAfter = await page.locator('#menuUserEmail').textContent();
        log('注册', '注册后下拉菜单显示邮箱', menuUserEmailTextAfter === testEmail, `menuUserEmail="${menuUserEmailTextAfter}"`);

        // Verify localStorage
        const savedUser = await page.evaluate(() => {
            return JSON.parse(localStorage.getItem('ai-tool-hub-current-user') || 'null');
        });
        log('注册', 'localStorage保存用户数据', savedUser !== null && savedUser.name === testName, `savedUser=${JSON.stringify(savedUser)}`);

    } catch (e) {
        log('注册', '注册流程', false, e.message);
    }

    // ========== TEST 3: Logout ==========
    console.log('\n========== TEST 3: Logout ==========');
    try {
        await closeAllModals(page);

        // Open user menu
        await page.locator('.navbar-user-btn').click();
        await sleep(500);

        // Click logout
        const logoutItem = page.locator('[data-action="do-logout"]');
        const logoutVisible = await logoutItem.isVisible();
        log('退出', '退出按钮可见', logoutVisible);

        await logoutItem.click();
        await sleep(1000);

        await page.screenshot({ path: `${SCREENSHOT_DIR}/06-after-logout.png` });

        const userNameTextAfterLogout = await page.locator('#userName').textContent();
        log('退出', '退出后导航栏显示游客', userNameTextAfterLogout === '游客', `userName="${userNameTextAfterLogout}"`);

        const menuUserNameAfterLogout = await page.locator('#menuUserName').textContent();
        log('退出', '退出后下拉菜单显示游客', menuUserNameAfterLogout === '游客', `menuUserName="${menuUserNameAfterLogout}"`);

        const menuUserEmailAfterLogout = await page.locator('#menuUserEmail').textContent();
        log('退出', '退出后下拉菜单显示未登录', menuUserEmailAfterLogout === '未登录', `menuUserEmail="${menuUserEmailAfterLogout}"`);

    } catch (e) {
        log('退出', '退出流程', false, e.message);
    }

    // ========== TEST 4: Login ==========
    console.log('\n========== TEST 4: Login ==========');
    try {
        await closeAllModals(page);
        await sleep(500);

        // Close any open dropdown by clicking elsewhere first
        await page.locator('body').click({ position: { x: 720, y: 450 } });
        await sleep(300);

        // Open user menu and click login
        await page.locator('.navbar-user-btn').click({ force: true });
        await sleep(800);

        // Click login/register menu item
        await page.locator('[data-action="show-auth-modal"]').click({ force: true });
        await sleep(800);

        // Should be on login tab by default
        await page.locator('#loginEmail').fill(testEmail);
        await page.locator('#loginPassword').fill('Test123456');

        await page.screenshot({ path: `${SCREENSHOT_DIR}/07-login-form-filled.png` });

        await page.locator('[data-action="do-login"]').click();
        await sleep(1500);

        await page.screenshot({ path: `${SCREENSHOT_DIR}/08-after-login.png` });

        const userNameTextAfterLogin = await page.locator('#userName').textContent();
        log('登录', '登录后导航栏显示用户名', userNameTextAfterLogin === testName, `userName="${userNameTextAfterLogin}"`);

        const menuUserNameAfterLogin = await page.locator('#menuUserName').textContent();
        log('登录', '登录后下拉菜单显示用户名', menuUserNameAfterLogin === testName, `menuUserName="${menuUserNameAfterLogin}"`);

        const menuUserEmailAfterLogin = await page.locator('#menuUserEmail').textContent();
        log('登录', '登录后下拉菜单显示邮箱', menuUserEmailAfterLogin === testEmail, `menuUserEmail="${menuUserEmailAfterLogin}"`);

    } catch (e) {
        log('登录', '登录流程', false, e.message);
    }

    // ========== TEST 5: Page Reload Persistence ==========
    console.log('\n========== TEST 5: Page Reload Persistence ==========');
    try {
        await page.reload({ waitUntil: 'networkidle' });
        await sleep(2000);

        const userNameAfterReload = await page.locator('#userName').textContent();
        log('持久化', '刷新后导航栏保留用户名', userNameAfterReload === testName, `userName="${userNameAfterReload}"`);

        const menuUserNameAfterReload = await page.locator('#menuUserName').textContent();
        log('持久化', '刷新后下拉菜单保留用户名', menuUserNameAfterReload === testName, `menuUserName="${menuUserNameAfterReload}"`);

        await page.screenshot({ path: `${SCREENSHOT_DIR}/09-after-reload.png` });

    } catch (e) {
        log('持久化', '刷新持久化', false, e.message);
    }

    // ========== TEST 6: Theme Toggle ==========
    console.log('\n========== TEST 6: Theme Toggle ==========');
    try {
        await closeAllModals(page);
        await sleep(300);

        // Get initial theme
        const initialClass = await page.evaluate(() => document.documentElement.className);
        log('主题', '初始主题状态', true, `class="${initialClass}"`);

        // Toggle theme
        await page.locator('[data-action="toggle-theme"]').click();
        await sleep(800);

        const afterFirstClickClass = await page.evaluate(() => document.documentElement.className);
        const toggledToLight = afterFirstClickClass.includes('light') && !afterFirstClickClass.includes('dark');
        const toggledToDark = afterFirstClickClass.includes('dark') && !afterFirstClickClass.includes('light');
        log('主题', '主题切换生效', toggledToLight || toggledToDark, `class="${afterFirstClickClass}"`);

        await page.screenshot({ path: `${SCREENSHOT_DIR}/10-theme-toggled.png` });

        // Toggle back
        await page.locator('[data-action="toggle-theme"]').click();
        await sleep(800);

        const afterSecondClickClass = await page.evaluate(() => document.documentElement.className);
        log('主题', '切换回原主题', afterSecondClickClass === initialClass, `class="${afterSecondClickClass}"`);

        await page.screenshot({ path: `${SCREENSHOT_DIR}/11-theme-restored.png` });

    } catch (e) {
        log('主题', '主题切换', false, e.message);
    }

    // ========== TEST 7: Search ==========
    console.log('\n========== TEST 7: Search ==========');
    try {
        await closeAllModals(page);

        // Scroll to search area
        await page.evaluate(() => window.scrollTo(0, 0));
        await sleep(500);

        const searchInput = page.locator('.hero-search-input');
        const searchInputExists = await searchInput.count() > 0;
        log('搜索', '搜索框存在', searchInputExists);

        if (searchInputExists) {
            await searchInput.click();
            await sleep(300);
            await searchInput.fill('ChatGPT');
            await sleep(1500);

            await page.screenshot({ path: `${SCREENSHOT_DIR}/12-search-suggestions.png` });

            // Check suggestions appeared
            const suggestions = await page.locator('.search-suggestion-item').count();
            log('搜索', '搜索建议出现', suggestions > 0, `${suggestions} suggestions`);

            // Click first suggestion
            if (suggestions > 0) {
                await page.locator('.search-suggestion-item').first().click();
                await sleep(1500);

                // Check tool detail modal appeared
                const toolDetailVisible = await page.locator('#toolDetailModal.active').count() > 0;
                log('搜索', '点击建议打开工具详情', toolDetailVisible);

                await page.screenshot({ path: `${SCREENSHOT_DIR}/13-tool-detail-from-search.png` });

                // Close tool detail
                await closeAllModals(page);
            }
        }
    } catch (e) {
        log('搜索', '搜索功能', false, e.message);
    }

    // ========== TEST 8: Tool Card Click ==========
    console.log('\n========== TEST 8: Tool Card Click ==========');
    try {
        await closeAllModals(page);
        await page.evaluate(() => window.scrollTo(0, 400));
        await sleep(500);

        const toolCards = await page.locator('[data-tool-id]').count();
        log('工具卡片', '工具卡片存在', toolCards > 0, `${toolCards} cards`);

        if (toolCards > 0) {
            await page.locator('[data-tool-id]').first().click();
            await sleep(1500);

            const toolDetailVisible = await page.locator('#toolDetailModal.active').count() > 0;
            log('工具卡片', '点击卡片打开详情', toolDetailVisible);

            await page.screenshot({ path: `${SCREENSHOT_DIR}/14-tool-detail-from-card.png` });
            await closeAllModals(page);
        }
    } catch (e) {
        log('工具卡片', '工具卡片点击', false, e.message);
    }

    // ========== TEST 9: Share Modal ==========
    console.log('\n========== TEST 9: Share Modal ==========');
    try {
        await closeAllModals(page);
        await page.evaluate(() => window.scrollTo(0, 400));
        await sleep(300);

        // Open tool detail first
        const toolCards = await page.locator('[data-tool-id]').count();
        if (toolCards > 0) {
            await page.locator('[data-tool-id]').first().click();
            await sleep(1500);

            // Find share button in tool detail
            const shareBtnCount = await page.locator('[data-action="share-tool"]').count();
            log('分享', '分享按钮存在', shareBtnCount > 0);

            if (shareBtnCount > 0) {
                await page.locator('[data-action="share-tool"]').click();
                await sleep(800);

                const shareModalVisible = await page.locator('#shareModal.active').count() > 0;
                log('分享', '分享弹窗显示', shareModalVisible);

                await page.screenshot({ path: `${SCREENSHOT_DIR}/15-share-modal.png` });

                // Test close button
                const closeShareBtnCount = await page.locator('#shareModal .modal-close-btn').count();
                if (closeShareBtnCount > 0) {
                    await page.locator('#shareModal .modal-close-btn').click();
                    await sleep(500);
                    const shareModalClosed = await page.locator('#shareModal.active').count() === 0;
                    log('分享', '关闭按钮有效', shareModalClosed);
                } else {
                    log('分享', '关闭按钮存在', false, 'close button not found');
                }
            }
        }
    } catch (e) {
        log('分享', '分享弹窗', false, e.message);
    }

    // ========== TEST 10: Console Errors Final Check ==========
    console.log('\n========== TEST 10: Console Errors ==========');
    log('控制台', '无JS错误', consoleErrors.length === 0, `${consoleErrors.length} errors total. First 5: ${consoleErrors.slice(0, 5).join(' | ')}`);

    // ========== Summary ==========
    console.log('\n========== SUMMARY ==========');
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

    // Cleanup: remove test user
    try {
        await closeAllModals(page);
        await page.evaluate((email) => {
            const users = JSON.parse(localStorage.getItem('ai-tool-hub-users') || '[]');
            const filtered = users.filter(u => u.email !== email);
            localStorage.setItem('ai-tool-hub-users', JSON.stringify(filtered));
            localStorage.removeItem('ai-tool-hub-current-user');
        }, testEmail);
    } catch (e) { }

    await browser.close();
    process.exit(failed > 0 ? 1 : 0);
})();
