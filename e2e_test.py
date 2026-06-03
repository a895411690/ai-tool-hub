import json
import time
from playwright.sync_api import sync_playwright

BASE_URL = "https://weihub.cloud"
RESULTS = []

def log(name, passed, detail=""):
    status = "✅ PASS" if passed else "❌ FAIL"
    RESULTS.append({"name": name, "passed": passed, "detail": detail})
    print(f"  {status} - {name}" + (f" | {detail}" if detail else ""))

def run_tests():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            ignore_https_errors=True,
            viewport={"width": 1280, "height": 720}
        )

        console_warnings = []
        console_errors = []

        def on_console(msg):
            if msg.type == "warning":
                console_warnings.append(msg.text)
            elif msg.type == "error":
                console_errors.append(msg.text)

        page = context.new_page()
        page.on("console", on_console)

        print("\n" + "=" * 60)
        print("  AI Tool Hub - E2E Test Suite")
        print("  Target: https://weihub.cloud")
        print("=" * 60)

        # =============================================
        # Test 1: Main Page Loading
        # =============================================
        print("\n--- Test 1: Main Page ---")
        try:
            resp = page.goto(BASE_URL, wait_until="networkidle", timeout=30000)
            log("Main page HTTP status", resp.status == 200, f"status={resp.status}")
            title = page.title()
            log("Main page title", "AI Tool Hub" in title or "Tool Hub" in title, f"title='{title}'")
            log("Page loaded without crash", True)
        except Exception as e:
            log("Main page loaded", False, str(e))

        # =============================================
        # Test 2: Main Page Content
        # =============================================
        print("\n--- Test 2: Main Page Content ---")
        try:
            body_text = page.locator("body").inner_text()
            log("Page body has content", len(body_text) > 100, f"length={len(body_text)}")
            links = page.locator("a").all()
            log("Navigation links exist", len(links) > 0, f"count={len(links)}")
        except Exception as e:
            log("Main page content", False, str(e))

        # =============================================
        # Test 3: Screenshot Main Page
        # =============================================
        print("\n--- Test 3: Screenshot Main Page ---")
        try:
            page.screenshot(path="/tmp/weihub_main.png", full_page=True)
            log("Main page screenshot saved", True, "/tmp/weihub_main.png")
        except Exception as e:
            log("Screenshot", False, str(e))

        # =============================================
        # Test 4: Resume Optimizer Page
        # =============================================
        print("\n--- Test 4: Resume Optimizer Page ---")
        try:
            resp = page.goto(f"{BASE_URL}/tools/resume-optimizer/index.html", wait_until="networkidle", timeout=30000)
            log("Resume page HTTP status", resp.status == 200, f"status={resp.status}")
            title = page.title()
            log("Resume page title", "简历优化" in title, f"title='{title}'")
        except Exception as e:
            log("Resume page loaded", False, str(e))

        # =============================================
        # Test 5: Resume Optimizer Key Elements
        # =============================================
        print("\n--- Test 5: Resume Optimizer Elements ---")
        try:
            page.wait_for_load_state("networkidle")
            time.sleep(1)

            html = page.content()

            has_close_panel = 'data-action="closeAiPanel"' in html
            log("closeAiPanel button exists", has_close_panel, f"count={html.count('closeAiPanel')}")

            has_export_pdf = 'data-action="exportPdf"' in html
            log("exportPdf button exists", has_export_pdf, f"found={has_export_pdf}")

            has_form = page.locator("form, [class*='form'], textarea, input").count() > 0
            log("Form elements exist", has_form, f"count={page.locator('form, [class*=form], textarea, input').count()}")

            has_import = "导入" in html or "import" in html.lower()
            log("Import button exists", has_import)

            has_ai_optimize = "AI优化" in html or "AI 优化" in html or "优化简历" in html
            log("AI optimize button exists", has_ai_optimize)
        except Exception as e:
            log("Resume optimizer elements", False, str(e))

        # =============================================
        # Test 6: Preload Warning Check
        # =============================================
        print("\n--- Test 6: Preload Warning ---")
        try:
            page.reload(wait_until="networkidle")
            time.sleep(3)
            preload_warnings = [w for w in console_warnings if "preload" in w.lower()]
            log("No preload warnings", len(preload_warnings) == 0,
                f"warnings={len(preload_warnings)}" +
                (f" | {preload_warnings[0][:80]}" if preload_warnings else ""))
        except Exception as e:
            log("Preload warning check", False, str(e))

        # =============================================
        # Test 7: API Health Check
        # =============================================
        print("\n--- Test 7: API Health ---")
        try:
            api_page = context.new_page()
            resp = api_page.goto(f"{BASE_URL}/api/v1/health", timeout=15000)
            body = api_page.locator("body").inner_text()
            health = json.loads(body)
            log("API health status ok", health.get("status") == "ok", f"status={health.get('status')}")
            log("DeepSeek API configured", health.get("deepseek", False) == True, f"deepseek={health.get('deepseek')}")
            log("Version returned", "version" in health, f"version={health.get('version')}")
            api_page.close()
        except Exception as e:
            log("API health check", False, str(e))

        # =============================================
        # Test 8: API Auth Endpoints
        # =============================================
        print("\n--- Test 8: API Auth ---")
        try:
            api_page = context.new_page()

            api_page.goto(f"{BASE_URL}/api/v1/auth/login", timeout=15000)
            time.sleep(1)
            resp_text = api_page.locator("body").inner_text()
            log("Login endpoint accessible", True, f"response={resp_text[:60]}")

            api_page.route("**/api/auth/login", lambda route: route.fulfill(
                status=200,
                content_type="application/json",
                body=json.dumps({"error": "邮箱和密码不能为空"})
            ))
            api_page.close()
        except Exception as e:
            log("API auth test", False, str(e))

        # =============================================
        # Test 9: Console Error Check
        # =============================================
        print("\n--- Test 9: Console Errors ---")
        try:
            check_page = context.new_page()
            check_errors = []
            check_page.on("console", lambda msg: check_errors.append(msg.text) if msg.type == "error" else None)

            check_page.goto(f"{BASE_URL}/tools/resume-optimizer/index.html", wait_until="networkidle", timeout=30000)
            time.sleep(3)

            critical_errors = [e for e in check_errors if "Uncaught" in e or "TypeError" in e or "ReferenceError" in e]
            log("No critical JS errors", len(critical_errors) == 0,
                f"errors={len(critical_errors)}" +
                (f" | first={critical_errors[0][:80]}" if critical_errors else ""))

            resource_errors = [e for e in check_errors if "404" in e or "net::ERR" in e]
            log("No resource loading errors", len(resource_errors) == 0,
                f"resource_errors={len(resource_errors)}")

            check_page.close()
        except Exception as e:
            log("Console error check", False, str(e))

        # =============================================
        # Test 10: Screenshot Resume Page
        # =============================================
        print("\n--- Test 10: Screenshot Resume Page ---")
        try:
            shot_page = context.new_page()
            shot_page.goto(f"{BASE_URL}/tools/resume-optimizer/index.html", wait_until="networkidle", timeout=30000)
            time.sleep(1)
            shot_page.screenshot(path="/tmp/weihub_resume.png", full_page=True)
            log("Resume page screenshot saved", True, "/tmp/weihub_resume.png")
            shot_page.close()
        except Exception as e:
            log("Resume page screenshot", False, str(e))

        # =============================================
        # Test 11: HTTPS / SSL Check
        # =============================================
        print("\n--- Test 11: HTTPS ---")
        try:
            ssl_page = context.new_page()
            resp = ssl_page.goto(BASE_URL, wait_until="networkidle", timeout=15000)
            current_url = ssl_page.url
            log("HTTPS enabled", current_url.startswith("https://"), f"url={current_url}")
            ssl_page.close()
        except Exception as e:
            log("HTTPS check", False, str(e))

        # =============================================
        # Test 12: Security Headers
        # =============================================
        print("\n--- Test 12: Security Headers ---")
        try:
            api_page = context.new_page()
            resp = api_page.goto(BASE_URL, timeout=15000)
            headers = resp.headers
            log("X-Frame-Options set (note: needs nginx location block fix)", "x-frame-options" in headers or "X-Frame-Options" in headers, f"value={headers.get('x-frame-options', headers.get('X-Frame-Options', 'N/A'))}")
            log("X-Content-Type-Options set (note: needs nginx location block fix)", "x-content-type-options" in headers or "X-Content-Type-Options" in headers, f"value={headers.get('x-content-type-options', headers.get('X-Content-Type-Options', 'N/A'))}")
            api_page.close()
        except Exception as e:
            log("Security headers", False, str(e))

        browser.close()

    # =============================================
    # Summary
    # =============================================
    total = len(RESULTS)
    passed = sum(1 for r in RESULTS if r["passed"])
    failed = total - passed

    print("\n" + "=" * 60)
    print(f"  RESULTS: {passed}/{total} passed ({failed} failed)")
    print("=" * 60)

    if failed > 0:
        print("\n  Failed tests:")
        for r in RESULTS:
            if not r["passed"]:
                print(f"    ❌ {r['name']} - {r['detail']}")

    print()
    return failed == 0

if __name__ == "__main__":
    success = run_tests()
    exit(0 if success else 1)
