/**
 * Comprehensive functional test for weihub.cloud
 * Tests: homepage rendering, register, logout, login, persistence,
 *        search, tool detail, category filter, theme toggle,
 *        share modal, responsive layout, console errors
 */
import { chromium } from 'playwright';
import fs from 'fs';

const TARGET = 'https://weihub.cloud/';
const SCREENSHOT_DIR = '/Users/weijiahao/Downloads/ai-tool-hub/dogfood-output/screenshots';

// Ensure screenshot directory exists
if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const results = [];
const timestamp = Date.now();
const testName = `测试用户${timestamp}`;
const testEmail = `test${timestamp}@test.com`;

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
        await context.clearCookies();
        await context.clearPermissions();
        await page.close();
        page = await context.newPage();
        page.on('console', msg => {
            if (msg.type() === 'error') consoleErrors.push(msg.text());
        });
        log('初始化', '清除SW缓存', true);
    } catch (e) {
        log('初始化', '清除SW缓存', false, e.message);
    }

    // ========== TEST 1: Homepage Load & Rendering ==========
    console.log('\n========== TEST 1: Homepage Load & Rendering ==========');
    try {
        await page.goto(TARGET, { waitUntil: 'load', timeout: 60000 });
        await sleep(3000);
        await page.waitForSelector('#userName', { timeout: 10000 });

        // Page title
        const title = await page.title();
        log('首页渲染', '页面标题包含AI或Hub', title.includes('AI') || title.includes('Hub'), `title="${title}"`);

        // Guest display
        const userNameText = await page.locator('#userName').textContent();
        log('首页渲染', '导航栏显示游客状态', userNameText === '游客', `userName="${userNameText}"`);

        // Tool cards count
        const toolCardCount = await page.locator('[data-tool-id]').count();
        log('首页渲染', '工具卡片数量>=80', toolCardCount >= 80, `${toolCardCount} cards`);

        // Category tabs
        const categoryTabCount = await page.locator('.category-tab, .filter-tab, [data-category]').count();
        log('首页渲染', '分类筛选标签渲染', categoryTabCount > 0, `${categoryTabCount} category tabs`);

        // Hot recommendations section
        const hotSectionExists = await page.locator('.hot-section, .hot-tools, .recommend-section, [class*="hot"], [class*="recommend"]').count();
        log('首页渲染', '热门推荐区域存在', hotSectionExists > 0, `${hotSectionExists} hot/recommend elements`);

        // Statistics panel
        const statsPanelExists = await page.locator('.stats, .statistics, [class*="stat"]').count();
        log('首页渲染', '统计面板显示工具数量', statsPanelExists > 0, `${statsPanelExists} stat elements`);

        // Navbar elements
        const logoExists = await page.locator('.navbar-brand').count();
        log('首页渲染', '导航栏Logo存在', logoExists > 0, `${logoExists} logo elements`);

        const searchExists = await page.locator('.hero-search-input').count();
        log('首页渲染', '搜索框存在', searchExists > 0);

        const userBtnExists = await page.locator('.navbar-user-btn').count();
        log('首页渲染', '用户按钮存在', userBtnExists > 0);

        const themeToggleExists = await page.locator('[data-action="toggle-theme"]').count();
        log('首页渲染', '主题切换按钮存在', themeToggleExists > 0);

        await page.screenshot({ path: `${SCREENSHOT_DIR}/01-homepage.png` });
    } catch (e) {
        log('首页渲染', '页面加载与渲染', false, e.message);
    }

    // ========== TEST 2: Register Flow ==========
    console.log('\n========== TEST 2: Register Flow ==========');
    try {
        // Open user dropdown
        await page.locator('.navbar-user-btn').click();
        await sleep(500);

        // Click login/register
        await page.locator('[data-action="show-auth-modal"]').click();
        await sleep(800);

        // Auth modal visible
        const authModalVisible = await page.locator('#authModal').isVisible();
        log('注册流程', '认证弹窗显示', authModalVisible);
        await page.screenshot({ path: `${SCREENSHOT_DIR}/02-auth-modal.png` });

        // Switch to register form
        await page.locator('[data-action="show-register"]').click();
        await sleep(500);

        const registerFormVisible = await page.locator('#registerName').isVisible();
        log('注册流程', '注册表单可见', registerFormVisible);

        // Fill register form
        await page.locator('#registerName').fill(testName);
        await page.locator('#registerEmail').fill(testEmail);
        await page.locator('#registerPassword').fill('Test123456');

        await page.screenshot({ path: `${SCREENSHOT_DIR}/03-register-filled.png` });

        // Submit register
        await page.locator('[data-action="do-register"]').click();
        await sleep(2000);

        // Verify username display
        const userNameAfterRegister = await page.locator('#userName').textContent();
        log('注册流程', '注册后导航栏显示用户名', userNameAfterRegister === testName, `userName="${userNameAfterRegister}" (expected "${testName}")`);

        // Verify localStorage
        const savedUser = await page.evaluate(() => {
            return JSON.parse(localStorage.getItem('ai-tool-hub-current-user') || 'null');
        });
        log('注册流程', 'localStorage保存用户数据', savedUser !== null && savedUser.name === testName, `savedUser=${JSON.stringify(savedUser)}`);

        await page.screenshot({ path: `${SCREENSHOT_DIR}/04-after-register.png` });
    } catch (e) {
        log('注册流程', '注册流程', false, e.message);
    }

    // ========== TEST 3: Logout Flow ==========
    console.log('\n========== TEST 3: Logout Flow ==========');
    try {
        await closeAllModals(page);

        // Open user menu
        await page.locator('.navbar-user-btn').click();
        await sleep(500);

        // Click logout
        const logoutItem = page.locator('[data-action="do-logout"]');
        const logoutVisible = await logoutItem.isVisible();
        log('退出流程', '退出按钮可见', logoutVisible);

        await logoutItem.click();
        await sleep(1000);

        const userNameAfterLogout = await page.locator('#userName').textContent();
        log('退出流程', '退出后导航栏显示游客', userNameAfterLogout === '游客', `userName="${userNameAfterLogout}"`);

        await page.screenshot({ path: `${SCREENSHOT_DIR}/05-after-logout.png` });
    } catch (e) {
        log('退出流程', '退出流程', false, e.message);
    }

    // ========== TEST 4: Login Flow ==========
    console.log('\n========== TEST 4: Login Flow ==========');
    try {
        await closeAllModals(page);
        await sleep(500);

        // Close any dropdown
        await page.locator('body').click({ position: { x: 720, y: 450 } });
        await sleep(300);

        // Open user menu and click login
        await page.locator('.navbar-user-btn').click({ force: true });
        await sleep(800);

        await page.locator('[data-action="show-auth-modal"]').click({ force: true });
        await sleep(800);

        // Fill login form
        await page.locator('#loginEmail').fill(testEmail);
        await page.locator('#loginPassword').fill('Test123456');

        await page.locator('[data-action="do-login"]').click();
        await sleep(1500);

        const userNameAfterLogin = await page.locator('#userName').textContent();
        log('登录流程', '登录后导航栏显示用户名', userNameAfterLogin === testName, `userName="${userNameAfterLogin}"`);

        await page.screenshot({ path: `${SCREENSHOT_DIR}/06-after-login.png` });
    } catch (e) {
        log('登录流程', '登录流程', false, e.message);
    }

    // ========== TEST 5: Page Reload Persistence ==========
    console.log('\n========== TEST 5: Page Reload Persistence ==========');
    try {
        await page.reload({ waitUntil: 'networkidle' });
        await sleep(2000);

        const userNameAfterReload = await page.locator('#userName').textContent();
        log('持久化', '刷新后导航栏保留用户名', userNameAfterReload === testName, `userName="${userNameAfterReload}"`);

        await page.screenshot({ path: `${SCREENSHOT_DIR}/07-after-reload.png` });
    } catch (e) {
        log('持久化', '刷新持久化', false, e.message);
    }

    // ========== TEST 6: Search ==========
    console.log('\n========== TEST 6: Search ==========');
    try {
        await closeAllModals(page);

        // Scroll to top
        await page.evaluate(() => window.scrollTo(0, 0));
        await sleep(500);

        const searchInput = page.locator('.hero-search-input');
        const searchInputExists = await searchInput.count() > 0;
        log('搜索功能', '搜索框存在', searchInputExists);

        if (searchInputExists) {
            await searchInput.click();
            await sleep(300);
            await searchInput.fill('ChatGPT');
            await sleep(1500);

            const suggestions = await page.locator('.search-suggestion-item').count();
            log('搜索功能', '搜索建议出现', suggestions > 0, `${suggestions} suggestions`);

            await page.screenshot({ path: `${SCREENSHOT_DIR}/08-search-suggestions.png` });

            // Click first suggestion
            if (suggestions > 0) {
                await page.locator('.search-suggestion-item').first().click();
                await sleep(1500);

                const toolDetailVisible = await page.locator('#toolDetailModal.active').count() > 0;
                log('搜索功能', '点击建议打开工具详情', toolDetailVisible);

                await page.screenshot({ path: `${SCREENSHOT_DIR}/09-search-result.png` });
                await closeAllModals(page);
            }
        }
    } catch (e) {
        log('搜索功能', '搜索功能', false, e.message);
    }

    // ========== TEST 7: Tool Card Click & Detail ==========
    console.log('\n========== TEST 7: Tool Card Click & Detail ==========');
    try {
        await closeAllModals(page);
        await page.evaluate(() => window.scrollTo(0, 400));
        await sleep(500);

        const toolCards = await page.locator('[data-tool-id]').count();
        log('工具详情', '工具卡片存在', toolCards > 0, `${toolCards} cards`);

        if (toolCards > 0) {
            await page.locator('[data-tool-id]').first().click();
            await sleep(1500);

            const toolDetailVisible = await page.locator('#toolDetailModal.active').count() > 0;
            log('工具详情', '点击卡片打开详情弹窗', toolDetailVisible);

            // Check detail modal has content
            if (toolDetailVisible) {
                const detailContent = await page.evaluate(() => {
                    const modal = document.getElementById('toolDetailModal');
                    if (!modal) return { hasName: false, hasDesc: false };
                    const nameEl = modal.querySelector('.detail-title, .tool-detail-name, .detail-name, h2, h3');
                    const descEl = modal.querySelector('.tool-detail-desc, .detail-desc, .description, [class*="desc"]');
                    return {
                        hasName: nameEl ? nameEl.textContent.trim().length > 0 : false,
                        hasDesc: descEl ? descEl.textContent.trim().length > 0 : false,
                        nameText: nameEl ? nameEl.textContent.trim().substring(0, 50) : '',
                        descText: descEl ? descEl.textContent.trim().substring(0, 50) : '',
                    };
                });
                log('工具详情', '详情弹窗包含工具名称', detailContent.hasName, `name="${detailContent.nameText}"`);
                log('工具详情', '详情弹窗包含工具描述', detailContent.hasDesc, `desc="${detailContent.descText}"`);
            }

            await page.screenshot({ path: `${SCREENSHOT_DIR}/10-tool-detail.png` });
            await closeAllModals(page);
        }
    } catch (e) {
        log('工具详情', '工具卡片与详情', false, e.message);
    }

    // ========== TEST 8: Category Filter ==========
    console.log('\n========== TEST 8: Category Filter ==========');
    try {
        await closeAllModals(page);
        await page.evaluate(() => window.scrollTo(0, 300));
        await sleep(500);

        // Get initial tool count (all categories)
        const initialCount = await page.locator('[data-tool-id]').count();

        // Find a non-"全部" category button
        const categoryButtons = await page.locator('.category-tab, .filter-tab, [data-category]').allTextContents();
        console.log('Available categories:', categoryButtons.join(', '));

        // Try to find a category that is not "全部"
        let clickedCategory = false;
        const categoryBtns = await page.locator('.category-tab, .filter-tab, [data-category]').all();

        for (const btn of categoryBtns) {
            const text = await btn.textContent();
            if (text && !text.includes('全部')) {
                await btn.click();
                await sleep(1000);
                clickedCategory = true;

                const filteredCount = await page.locator('#toolsGrid [data-tool-id]').count();
                log('分类筛选', `点击分类"${text.trim()}"后卡片减少`, filteredCount < initialCount, `before=${initialCount}, after=${filteredCount}`);

                await page.screenshot({ path: `${SCREENSHOT_DIR}/11-category-filter.png` });

                // Click "全部" to restore
                for (const restoreBtn of categoryBtns) {
                    const restoreText = await restoreBtn.textContent();
                    if (restoreText && restoreText.includes('全部')) {
                        await restoreBtn.click();
                        await sleep(1000);
                        break;
                    }
                }

                const restoredCount = await page.locator('[data-tool-id]').count();
                log('分类筛选', '点击全部后卡片数量恢复', restoredCount >= initialCount, `restored=${restoredCount}, original=${initialCount}`);
                break;
            }
        }

        if (!clickedCategory) {
            log('分类筛选', '分类筛选', false, '未找到非"全部"的分类按钮');
        }
    } catch (e) {
        log('分类筛选', '分类筛选', false, e.message);
    }

    // ========== TEST 9: Theme Toggle ==========
    console.log('\n========== TEST 9: Theme Toggle ==========');
    try {
        await closeAllModals(page);
        await page.evaluate(() => window.scrollTo(0, 0));
        await sleep(300);

        // Get initial theme
        const initialClass = await page.evaluate(() => document.documentElement.className);
        log('主题切换', '初始主题状态', true, `class="${initialClass}"`);

        // Toggle theme
        await page.locator('[data-action="toggle-theme"]').click();
        await sleep(800);

        const afterFirstClickClass = await page.evaluate(() => document.documentElement.className);
        const toggled = afterFirstClickClass !== initialClass;
        log('主题切换', '主题切换生效', toggled, `class="${afterFirstClickClass}"`);

        await page.screenshot({ path: `${SCREENSHOT_DIR}/12-theme-toggled.png` });

        // Toggle back
        await page.locator('[data-action="toggle-theme"]').click();
        await sleep(800);

        const afterSecondClickClass = await page.evaluate(() => document.documentElement.className);
        log('主题切换', '切换回原主题', afterSecondClickClass === initialClass, `class="${afterSecondClickClass}"`);
    } catch (e) {
        log('主题切换', '主题切换', false, e.message);
    }

    // ========== TEST 10: Share Modal ==========
    console.log('\n========== TEST 10: Share Modal ==========');
    try {
        await closeAllModals(page);
        await page.evaluate(() => window.scrollTo(0, 400));
        await sleep(300);

        // Open tool detail
        const toolCards = await page.locator('[data-tool-id]').count();
        if (toolCards > 0) {
            await page.locator('[data-tool-id]').first().click();
            await sleep(1500);

            // Click share button
            const shareBtnCount = await page.locator('[data-action="share-tool"]').count();
            log('分享弹窗', '分享按钮存在', shareBtnCount > 0);

            if (shareBtnCount > 0) {
                await page.locator('[data-action="share-tool"]').click();
                await sleep(800);

                const shareModalVisible = await page.locator('#shareModal.active').count() > 0;
                log('分享弹窗', '分享弹窗显示', shareModalVisible);

                await page.screenshot({ path: `${SCREENSHOT_DIR}/13-share-modal.png` });
            }

            await closeAllModals(page);
        } else {
            log('分享弹窗', '分享弹窗', false, '无工具卡片可点击');
        }
    } catch (e) {
        log('分享弹窗', '分享弹窗', false, e.message);
    }

    // ========== TEST 11: Responsive Layout - Mobile ==========
    console.log('\n========== TEST 11: Responsive Layout - Mobile ==========');
    try {
        const mobileContext = await browser.newContext({
            viewport: { width: 375, height: 667 }
        });
        const mobilePage = await mobileContext.newPage();

        const mobileErrors = [];
        mobilePage.on('console', msg => {
            if (msg.type() === 'error') mobileErrors.push(msg.text());
        });

        await mobilePage.goto(TARGET, { waitUntil: 'load', timeout: 60000 });
        await sleep(3000);

        // Check page renders without fatal errors
        const mobileTitle = await mobilePage.title();
        log('移动端布局', '移动端页面加载', mobileTitle.length > 0, `title="${mobileTitle}"`);

        // Check for mobile navigation
        const bottomNavExists = await mobilePage.locator('.bottom-nav, .mobile-nav, [class*="bottom-nav"], [class*="mobile-nav"]').count();
        log('移动端布局', '移动端底部导航存在', bottomNavExists > 0, `${bottomNavExists} bottom-nav elements`);

        // Check no JS fatal errors
        log('移动端布局', '移动端无致命JS错误', mobileErrors.length < 5, `${mobileErrors.length} errors`);

        await mobilePage.screenshot({ path: `${SCREENSHOT_DIR}/14-mobile-layout.png` });

        await mobileContext.close();
    } catch (e) {
        log('移动端布局', '移动端布局', false, e.message);
    }

    // ========== TEST 12: Responsive Layout - Tablet ==========
    console.log('\n========== TEST 12: Responsive Layout - Tablet ==========');
    try {
        const tabletContext = await browser.newContext({
            viewport: { width: 768, height: 1024 }
        });
        const tabletPage = await tabletContext.newPage();

        await tabletPage.goto(TARGET, { waitUntil: 'load', timeout: 60000 });
        await sleep(3000);

        const tabletTitle = await tabletPage.title();
        log('平板端布局', '平板端页面加载', tabletTitle.length > 0, `title="${tabletTitle}"`);

        const tabletToolCards = await tabletPage.locator('[data-tool-id]').count();
        log('平板端布局', '平板端工具卡片渲染', tabletToolCards > 0, `${tabletToolCards} cards`);

        await tabletPage.screenshot({ path: `${SCREENSHOT_DIR}/15-tablet-layout.png` });

        await tabletContext.close();
    } catch (e) {
        log('平板端布局', '平板端布局', false, e.message);
    }

    // ========== TEST 13: Console Errors ==========
    console.log('\n========== TEST 13: Console Errors ==========');
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
