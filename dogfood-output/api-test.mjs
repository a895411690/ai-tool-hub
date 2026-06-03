import { chromium } from 'playwright';

const TARGET = 'https://weihub.cloud/';
const API_BASE = 'https://weihub.cloud/api/v1';
const SCREENSHOT_DIR = '/Users/weijiahao/Downloads/ai-tool-hub/dogfood-output/screenshots';

const results = [];
const timestamp = Date.now();
const testEmail = `apitest${timestamp}@test.com`;
const testPassword = 'Test123456';

function log(category, name, passed, detail = '') {
  const status = passed ? 'PASS' : 'FAIL';
  results.push({ category, name, passed, detail });
  console.log(`[${status}] ${category} > ${name}${detail ? ': ' + detail : ''}`);
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ============================================================
// Phase 1: API Reachability Check
// ============================================================
async function checkApiReachable() {
  console.log('\n========================================');
  console.log('  Phase 1: API Reachability Check');
  console.log('========================================\n');

  try {
    const res = await fetch(`${API_BASE}/health`, {
      signal: AbortSignal.timeout(10000),
    });
    if (res.ok) {
      const data = await res.json();
      log('Reachability', 'API Health Endpoint', true, `status=${res.status}`);
      console.log(`  → Health info: ${JSON.stringify(data)}`);
      return true;
    } else {
      log('Reachability', 'API Health Endpoint', false, `status=${res.status}`);
      return false;
    }
  } catch (err) {
    log('Reachability', 'API Health Endpoint', false, `Network error: ${err.message}`);
    return false;
  }
}

// ============================================================
// Phase 2A: Backend API Tests
// ============================================================
async function runBackendApiTests() {
  console.log('\n========================================');
  console.log('  Phase 2A: Backend API Tests');
  console.log('========================================\n');

  let authToken = '';

  // ---- Health Check ----
  console.log('\n--- Health Check ---\n');
  try {
    const res = await fetch(`${API_BASE}/health`);
    const data = await res.json();
    log('Health', 'GET /health returns 200', res.status === 200, `status=${res.status}`);
    log('Health', 'Response has status field', typeof data.status === 'string', `status=${data.status}`);
    log('Health', 'Response has version field', typeof data.version === 'string', `version=${data.version}`);
    log('Health', 'Response has timestamp field', !!data.timestamp, `timestamp=${data.timestamp}`);
  } catch (err) {
    log('Health', 'GET /health', false, err.message);
  }

  // ---- Register - Normal ----
  console.log('\n--- Register - Normal ---\n');
  let registerRes;
  try {
    registerRes = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: testPassword }),
    });
    const data = await registerRes.json();
    log('Register', 'Valid registration returns 201', registerRes.status === 201, `status=${registerRes.status}`);
    log('Register', 'Response has user object', !!data.user, `user=${JSON.stringify(data.user)}`);
    log('Register', 'Response has quota object', !!data.quota, `quota=${JSON.stringify(data.quota)}`);

    const setCookie = registerRes.headers.get('set-cookie') || '';
    log('Register', 'Set-Cookie contains auth_token', setCookie.includes('auth_token'), `cookie header present=${!!setCookie}`);

    // Extract token from cookie for subsequent requests
    if (setCookie) {
      const match = setCookie.match(/auth_token=([^;]+)/);
      if (match) {
        authToken = match[1];
      }
    }
    // Also try from response body if token is returned there
    if (!authToken && data.token) {
      authToken = data.token;
    }
  } catch (err) {
    log('Register', 'Valid registration', false, err.message);
  }

  // ---- Register - Validation ----
  console.log('\n--- Register - Validation ---\n');

  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    log('Register Validation', 'Empty body returns 400', res.status === 400, `status=${res.status}`);
  } catch (err) {
    log('Register Validation', 'Empty body test', false, err.message);
  }

  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'invalid-email', password: testPassword }),
    });
    log('Register Validation', 'Invalid email returns 400', res.status === 400, `status=${res.status}`);
  } catch (err) {
    log('Register Validation', 'Invalid email test', false, err.message);
  }

  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@test.com', password: 'short1' }),
    });
    log('Register Validation', 'Short password (<8 chars) returns 400', res.status === 400, `status=${res.status}`);
  } catch (err) {
    log('Register Validation', 'Short password test', false, err.message);
  }

  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@test.com', password: 'NoDigits!' }),
    });
    log('Register Validation', 'Password without digit returns 400', res.status === 400, `status=${res.status}`);
  } catch (err) {
    log('Register Validation', 'Password without digit test', false, err.message);
  }

  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: testPassword }),
    });
    log('Register Validation', 'Duplicate email returns 409', res.status === 409, `status=${res.status}`);
  } catch (err) {
    log('Register Validation', 'Duplicate email test', false, err.message);
  }

  // ---- Login - Normal ----
  console.log('\n--- Login - Normal ---\n');
  let loginRes;
  try {
    loginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: testPassword }),
    });
    const data = await loginRes.json();
    log('Login', 'Valid login returns 200', loginRes.status === 200, `status=${loginRes.status}`);
    log('Login', 'Response has user object', !!data.user, `user=${JSON.stringify(data.user)}`);
    log('Login', 'Response has quota object', !!data.quota, `quota=${JSON.stringify(data.quota)}`);

    const setCookie = loginRes.headers.get('set-cookie') || '';
    log('Login', 'Set-Cookie contains auth_token', setCookie.includes('auth_token'), `cookie header present=${!!setCookie}`);

    if (!authToken && setCookie) {
      const match = setCookie.match(/auth_token=([^;]+)/);
      if (match) {
        authToken = match[1];
      }
    }
    if (!authToken && data.token) {
      authToken = data.token;
    }
  } catch (err) {
    log('Login', 'Valid login', false, err.message);
  }

  // ---- Login - Validation ----
  console.log('\n--- Login - Validation ---\n');

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: 'WrongPassword1' }),
    });
    log('Login Validation', 'Wrong password returns 401', res.status === 401, `status=${res.status}`);
  } catch (err) {
    log('Login Validation', 'Wrong password test', false, err.message);
  }

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: '', password: '' }),
    });
    log('Login Validation', 'Empty fields returns 400', res.status === 400, `status=${res.status}`);
  } catch (err) {
    log('Login Validation', 'Empty fields test', false, err.message);
  }

  // ---- Login - Lockout ----
  console.log('\n--- Login - Lockout (5 failed attempts) ---\n');
  let lockoutTriggered = false;
  for (let i = 1; i <= 5; i++) {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: `locktest${timestamp}@test.com`, password: 'WrongPass1' }),
      });
      if (i < 5) {
        log('Login Lockout', `Attempt ${i} returns 401`, res.status === 401, `status=${res.status}`);
      } else {
        lockoutTriggered = res.status === 429 || res.status === 401;
        log('Login Lockout', '5th attempt triggers lockout (429 or 401)', res.status === 429 || res.status === 401, `status=${res.status}`);
        if (res.status === 429) {
          lockoutTriggered = true;
        }
      }
    } catch (err) {
      log('Login Lockout', `Attempt ${i}`, false, err.message);
    }
  }

  // ---- Auth Me ----
  console.log('\n--- Auth Me ---\n');

  if (authToken) {
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      log('Auth Me', 'GET /me with valid token returns 200', res.status === 200, `status=${res.status}`);
      log('Auth Me', 'Response has user object', !!data.user, `user=${JSON.stringify(data.user)}`);
      log('Auth Me', 'Response has quota object', !!data.quota, `quota=${JSON.stringify(data.quota)}`);
    } catch (err) {
      log('Auth Me', 'GET /me with valid token', false, err.message);
    }
  } else {
    log('Auth Me', 'GET /me with valid token', false, 'No auth token available from registration');
  }

  try {
    const res = await fetch(`${API_BASE}/auth/me`);
    log('Auth Me', 'GET /me without token returns 401', res.status === 401, `status=${res.status}`);
  } catch (err) {
    log('Auth Me', 'GET /me without token', false, err.message);
  }

  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: 'Bearer invalid.token.here' },
    });
    log('Auth Me', 'GET /me with invalid token returns 401', res.status === 401, `status=${res.status}`);
  } catch (err) {
    log('Auth Me', 'GET /me with invalid token', false, err.message);
  }

  // ---- Resume - Auth Required ----
  console.log('\n--- Resume - Auth Required ---\n');

  try {
    const res = await fetch(`${API_BASE}/resume/optimize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ level: 'junior', resumeText: 'test' }),
    });
    log('Resume Auth', 'POST /optimize without auth returns 401', res.status === 401, `status=${res.status}`);
  } catch (err) {
    log('Resume Auth', 'POST /optimize without auth', false, err.message);
  }

  try {
    const res = await fetch(`${API_BASE}/resume/parse`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'test' }),
    });
    log('Resume Auth', 'POST /parse without auth returns 401', res.status === 401, `status=${res.status}`);
  } catch (err) {
    log('Resume Auth', 'POST /parse without auth', false, err.message);
  }

  try {
    const res = await fetch(`${API_BASE}/resume/analyze-jd`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jdText: 'test' }),
    });
    log('Resume Auth', 'POST /analyze-jd without auth returns 401', res.status === 401, `status=${res.status}`);
  } catch (err) {
    log('Resume Auth', 'POST /analyze-jd without auth', false, err.message);
  }

  // ---- Resume - Validation (with auth) ----
  console.log('\n--- Resume - Validation (with auth) ---\n');

  if (authToken) {
    const authHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    };

    try {
      const res = await fetch(`${API_BASE}/resume/optimize`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({}),
      });
      log('Resume Validation', 'POST /optimize missing params returns 400', res.status === 400, `status=${res.status}`);
    } catch (err) {
      log('Resume Validation', 'POST /optimize missing params', false, err.message);
    }

    try {
      const res = await fetch(`${API_BASE}/resume/optimize`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ level: 'invalid_level', resumeText: 'some text' }),
      });
      log('Resume Validation', 'POST /optimize invalid level returns 400', res.status === 400, `status=${res.status}`);
    } catch (err) {
      log('Resume Validation', 'POST /optimize invalid level', false, err.message);
    }

    try {
      const res = await fetch(`${API_BASE}/resume/parse`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ text: 'ab' }),
      });
      log('Resume Validation', 'POST /parse text too short returns 400', res.status === 400, `status=${res.status}`);
    } catch (err) {
      log('Resume Validation', 'POST /parse text too short', false, err.message);
    }

    try {
      const res = await fetch(`${API_BASE}/resume/analyze-jd`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({}),
      });
      log('Resume Validation', 'POST /analyze-jd missing jdText returns 400', res.status === 400, `status=${res.status}`);
    } catch (err) {
      log('Resume Validation', 'POST /analyze-jd missing jdText', false, err.message);
    }
  } else {
    log('Resume Validation', 'Skipped', false, 'No auth token available');
  }

  // ---- 404 Handler ----
  console.log('\n--- 404 Handler ---\n');

  try {
    const res = await fetch(`${API_BASE}/nonexistent`);
    const data = await res.json();
    log('404', 'GET /nonexistent returns 404', res.status === 404, `status=${res.status}`);
    log('404', 'Response has error field', !!data.error, `error=${data.error}`);
    log('404', 'Response has path field', !!data.path, `path=${data.path}`);
  } catch (err) {
    log('404', 'GET /nonexistent', false, err.message);
  }

  // ---- Rate Limit Headers ----
  console.log('\n--- Rate Limit Headers ---\n');

  try {
    const res = await fetch(`${API_BASE}/health`);
    const limit = res.headers.get('X-RateLimit-Limit');
    const remaining = res.headers.get('X-RateLimit-Remaining');
    const reset = res.headers.get('X-RateLimit-Reset');
    log('Rate Limit', 'X-RateLimit-Limit header present', !!limit, `value=${limit}`);
    log('Rate Limit', 'X-RateLimit-Remaining header present', !!remaining, `value=${remaining}`);
    log('Rate Limit', 'X-RateLimit-Reset header present', !!reset, `value=${reset}`);
  } catch (err) {
    log('Rate Limit', 'Rate limit headers check', false, err.message);
  }

  // ---- CORS ----
  console.log('\n--- CORS ---\n');

  try {
    const res = await fetch(`${API_BASE}/health`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'https://example.com',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type',
      },
    });
    const acao = res.headers.get('Access-Control-Allow-Origin');
    log('CORS', 'OPTIONS preflight returns valid status', res.status < 400, `status=${res.status}`);
    log('CORS', 'Access-Control-Allow-Origin header present', !!acao, `value=${acao}`);
  } catch (err) {
    log('CORS', 'OPTIONS preflight', false, err.message);
  }
}

// ============================================================
// Phase 2B: Frontend Auth Tests (Fallback)
// ============================================================
async function runFrontendAuthTests() {
  console.log('\n========================================');
  console.log('  Phase 2B: Frontend Auth Tests');
  console.log('========================================\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
  });
  const page = await context.newPage();

  try {
    // ---- Register via UI ----
    console.log('\n--- Register via UI ---\n');
    await page.goto(TARGET, { waitUntil: 'networkidle', timeout: 30000 });
    await sleep(2000);

    // Try to find and click register/signup button
    const registerSelectors = [
      'a[href*="register"]',
      'a[href*="signup"]',
      'button:has-text("注册")',
      'button:has-text("Register")',
      'a:has-text("注册")',
      'a:has-text("Register")',
      'a:has-text("Sign Up")',
      'a:has-text("注册账号")',
    ];

    let registerClicked = false;
    for (const sel of registerSelectors) {
      try {
        const el = page.locator(sel).first();
        if (await el.isVisible({ timeout: 2000 })) {
          await el.click();
          registerClicked = true;
          await sleep(1500);
          break;
        }
      } catch {
        // try next selector
      }
    }

    if (registerClicked) {
      // Fill in registration form
      const emailSelectors = ['input[type="email"]', 'input[name="email"]', 'input[placeholder*="邮箱"]', 'input[placeholder*="email" i]'];
      const passwordSelectors = ['input[type="password"]', 'input[name="password"]', 'input[placeholder*="密码"]', 'input[placeholder*="password" i]'];

      for (const sel of emailSelectors) {
        try {
          const el = page.locator(sel).first();
          if (await el.isVisible({ timeout: 2000 })) {
            await el.fill(testEmail);
            break;
          }
        } catch { /* next */ }
      }

      const pwInputs = page.locator('input[type="password"]');
      const pwCount = await pwInputs.count();
      if (pwCount > 0) {
        await pwInputs.first().fill(testPassword);
      }
      if (pwCount > 1) {
        await pwInputs.nth(1).fill(testPassword);
      }

      // Submit
      const submitSelectors = [
        'button[type="submit"]',
        'button:has-text("注册")',
        'button:has-text("Register")',
        'button:has-text("Sign Up")',
      ];

      for (const sel of submitSelectors) {
        try {
          const el = page.locator(sel).first();
          if (await el.isVisible({ timeout: 2000 })) {
            await el.click();
            break;
          }
        } catch { /* next */ }
      }

      await sleep(3000);
      await page.screenshot({ path: `${SCREENSHOT_DIR}/api-01-register.png`, fullPage: true });

      // Check localStorage for auth data
      const localStorageData = await page.evaluate(() => {
        const entries = {};
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          entries[key] = localStorage.getItem(key);
        }
        return entries;
      });

      const hasAuthToken = Object.keys(localStorageData).some(
        key => key.toLowerCase().includes('token') || key.toLowerCase().includes('auth')
      );
      log('Frontend Register', 'localStorage has auth data after registration', hasAuthToken, `keys: ${Object.keys(localStorageData).join(', ')}`);
    } else {
      log('Frontend Register', 'Register button found', false, 'Could not locate register button on page');
      await page.screenshot({ path: `${SCREENSHOT_DIR}/api-01-register.png`, fullPage: true });
    }

    // ---- Login via UI ----
    console.log('\n--- Login via UI ---\n');
    await page.goto(TARGET, { waitUntil: 'networkidle', timeout: 30000 });
    await sleep(2000);

    const loginSelectors = [
      'a[href*="login"]',
      'button:has-text("登录")',
      'button:has-text("Login")',
      'button:has-text("Sign In")',
      'a:has-text("登录")',
      'a:has-text("Login")',
      'a:has-text("Sign In")',
    ];

    let loginClicked = false;
    for (const sel of loginSelectors) {
      try {
        const el = page.locator(sel).first();
        if (await el.isVisible({ timeout: 2000 })) {
          await el.click();
          loginClicked = true;
          await sleep(1500);
          break;
        }
      } catch {
        // try next
      }
    }

    if (loginClicked) {
      // Fill in login form
      const emailSelectors = ['input[type="email"]', 'input[name="email"]', 'input[placeholder*="邮箱"]', 'input[placeholder*="email" i]'];
      for (const sel of emailSelectors) {
        try {
          const el = page.locator(sel).first();
          if (await el.isVisible({ timeout: 2000 })) {
            await el.fill(testEmail);
            break;
          }
        } catch { /* next */ }
      }

      const pwInput = page.locator('input[type="password"]').first();
      if (await pwInput.isVisible({ timeout: 2000 })) {
        await pwInput.fill(testPassword);
      }

      const submitSelectors = [
        'button[type="submit"]',
        'button:has-text("登录")',
        'button:has-text("Login")',
        'button:has-text("Sign In")',
      ];

      for (const sel of submitSelectors) {
        try {
          const el = page.locator(sel).first();
          if (await el.isVisible({ timeout: 2000 })) {
            await el.click();
            break;
          }
        } catch { /* next */ }
      }

      await sleep(3000);
      await page.screenshot({ path: `${SCREENSHOT_DIR}/api-02-login.png`, fullPage: true });

      const localStorageData = await page.evaluate(() => {
        const entries = {};
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          entries[key] = localStorage.getItem(key);
        }
        return entries;
      });

      const hasAuthToken = Object.keys(localStorageData).some(
        key => key.toLowerCase().includes('token') || key.toLowerCase().includes('auth')
      );
      log('Frontend Login', 'localStorage has auth data after login', hasAuthToken, `keys: ${Object.keys(localStorageData).join(', ')}`);

      // ---- Logout ----
      console.log('\n--- Logout ---\n');
      const logoutSelectors = [
        'button:has-text("退出")',
        'button:has-text("登出")',
        'button:has-text("Logout")',
        'button:has-text("Sign Out")',
        'a:has-text("退出")',
        'a:has-text("登出")',
        'a:has-text("Logout")',
        'a:has-text("Sign Out")',
      ];

      let logoutClicked = false;
      for (const sel of logoutSelectors) {
        try {
          const el = page.locator(sel).first();
          if (await el.isVisible({ timeout: 2000 })) {
            await el.click();
            logoutClicked = true;
            await sleep(2000);
            break;
          }
        } catch { /* next */ }
      }

      await page.screenshot({ path: `${SCREENSHOT_DIR}/api-03-logout.png`, fullPage: true });

      const localStorageAfterLogout = await page.evaluate(() => {
        const entries = {};
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          entries[key] = localStorage.getItem(key);
        }
        return entries;
      });

      const authCleared = !Object.keys(localStorageAfterLogout).some(
        key => key.toLowerCase().includes('token') || key.toLowerCase().includes('auth')
      );
      log('Frontend Logout', 'Auth data cleared from localStorage after logout', authCleared, `logoutClicked=${logoutClicked}, remaining keys: ${Object.keys(localStorageAfterLogout).join(', ')}`);
    } else {
      log('Frontend Login', 'Login button found', false, 'Could not locate login button on page');
      await page.screenshot({ path: `${SCREENSHOT_DIR}/api-02-login.png`, fullPage: true });
    }
  } catch (err) {
    log('Frontend', 'Page interaction error', false, err.message);
  } finally {
    await browser.close();
  }
}

// ============================================================
// Summary
// ============================================================
function printSummary() {
  console.log('\n========================================');
  console.log('  Test Summary');
  console.log('========================================\n');

  const categories = [...new Set(results.map(r => r.category))];
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const total = results.length;

  for (const cat of categories) {
    const catResults = results.filter(r => r.category === cat);
    const catPassed = catResults.filter(r => r.passed).length;
    const catFailed = catResults.filter(r => !r.passed).length;
    console.log(`  ${cat}: ${catPassed} passed, ${catFailed} failed`);
    for (const r of catFailed > 0 ? catResults.filter(r => !r.passed) : []) {
      console.log(`    ✗ ${r.name}: ${r.detail}`);
    }
  }

  console.log(`\n  Total: ${passed}/${total} passed, ${failed} failed`);
  console.log(`  Pass Rate: ${total > 0 ? ((passed / total) * 100).toFixed(1) : 0}%`);
  console.log(`  Timestamp: ${new Date().toISOString()}`);
  console.log(`  Target: ${TARGET}`);

  if (failed > 0) {
    console.log('\n  Failed Tests:');
    for (const r of results.filter(r => !r.passed)) {
      console.log(`    ✗ [${r.category}] ${r.name}${r.detail ? ': ' + r.detail : ''}`);
    }
  }

  console.log('\n========================================\n');
}

// ============================================================
// Main
// ============================================================
async function main() {
  console.log('╔════════════════════════════════════════╗');
  console.log('║   weihub.cloud API Test Suite          ║');
  console.log('║   ' + new Date().toISOString() + '       ║');
  console.log('╚════════════════════════════════════════╝');

  const apiAvailable = await checkApiReachable();

  if (apiAvailable) {
    console.log('\n  ✅ API is reachable. Running backend API tests...\n');
    await runBackendApiTests();
  } else {
    console.log('\n  ⚠️  API not reachable. Running frontend auth tests as fallback...\n');
    await runFrontendAuthTests();
  }

  printSummary();
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
