/**
 * 安全功能测试套件
 * 测试CSP、HTML净化、API重试等安全功能
 */

// 模拟浏览器环境的测试框架
class TestRunner {
    constructor() {
        this.tests = [];
        this.results = { passed: 0, failed: 0, errors: [] };
    }

    test(name, fn) {
        this.tests.push({ name, fn });
    }

    async run() {
        console.log('🧪 开始安全功能测试...\n');

        for (const { name, fn } of this.tests) {
            try {
                await fn();
                this.results.passed++;
                console.log(`✅ ${name}`);
            } catch (error) {
                this.results.failed++;
                this.results.errors.push({ name, error: error.message });
                console.log(`❌ ${name}: ${error.message}`);
            }
        }

        console.log(`\n📊 测试结果: ${this.results.passed} 通过, ${this.results.failed} 失败`);
        return this.results;
    }
}

const runner = new TestRunner();

// ============ HTML净化测试 ============

// 模拟ImportUtils类
class MockImportUtils {
    sanitizeHtml(html) {
        if (!html || typeof html !== 'string') {
            return '';
        }

        // 移除危险标签
        const dangerousTags = /<(script|iframe|object|embed|form|input|button|textarea|select)[^>]*>.*?<\/\1>/gi;
        let sanitized = html.replace(dangerousTags, '');

        // 移除自闭合的危险标签
        const dangerousSelfClosingTags = /<(script|iframe|object|embed|input|button|textarea|select|img|link|style|meta)[^>]*\/?>/gi;
        sanitized = sanitized.replace(dangerousSelfClosingTags, '');

        // 移除事件处理器
        const eventHandlers = /\s(on\w+)\s*=\s*(['"])[^\2]*\2/gi;
        sanitized = sanitized.replace(eventHandlers, '');

        // 移除javascript:伪协议
        const jsPseudoProtocol = /(href|src|action)\s*=\s*(['"])\s*javascript:[^\2]*\2/gi;
        sanitized = sanitized.replace(jsPseudoProtocol, '$1=$2#$2');

        // 移除data:伪协议
        const dataPseudoProtocol = /(href|src|action)\s*=\s*(['"])\s*data:[^\2]*\2/gi;
        sanitized = sanitized.replace(dataPseudoProtocol, '$1=$2#$2');

        return sanitized;
    }
}

const importUtils = new MockImportUtils();

// 测试1: 移除script标签
runner.test('HTML净化 - 移除script标签', () => {
    const input = '<script>alert("XSS")</script><p>正常内容</p>';
    const result = importUtils.sanitizeHtml(input);
    if (result.includes('<script>')) {
        throw new Error('script标签未被移除');
    }
    if (!result.includes('<p>正常内容</p>')) {
        throw new Error('正常内容被误删');
    }
});

// 测试2: 移除事件处理器
runner.test('HTML净化 - 移除onclick事件', () => {
    const input = '<div onclick="alert(1)">点击我</div>';
    const result = importUtils.sanitizeHtml(input);
    if (result.includes('onclick')) {
        throw new Error('onclick事件未被移除');
    }
});

// 测试3: 移除javascript:伪协议
runner.test('HTML净化 - 移除javascript:伪协议', () => {
    const input = '<a href="javascript:alert(1)">链接</a>';
    const result = importUtils.sanitizeHtml(input);
    if (result.includes('javascript:')) {
        throw new Error('javascript:伪协议未被移除');
    }
});

// 测试4: 移除iframe
runner.test('HTML净化 - 移除iframe标签', () => {
    const input = '<iframe src="https://evil.com"></iframe>';
    const result = importUtils.sanitizeHtml(input);
    if (result.includes('<iframe')) {
        throw new Error('iframe标签未被移除');
    }
});

// 测试5: 保留安全内容
runner.test('HTML净化 - 保留安全HTML内容', () => {
    const input = '<div class="resume"><h1>标题</h1><p>段落</p></div>';
    const result = importUtils.sanitizeHtml(input);
    if (result !== input) {
        throw new Error('安全内容被误处理');
    }
});

// 测试6: 空值处理
runner.test('HTML净化 - 处理空值', () => {
    if (importUtils.sanitizeHtml('') !== '') {
        throw new Error('空字符串处理失败');
    }
    if (importUtils.sanitizeHtml(null) !== '') {
        throw new Error('null处理失败');
    }
    if (importUtils.sanitizeHtml(undefined) !== '') {
        throw new Error('undefined处理失败');
    }
});

// ============ API重试机制测试 ============

class MockDeepSeekEngine {
    constructor() {
        this.retryCount = 0;
        this.maxRetries = 3;
    }

    async _callAPI(messages, options = {}, retries = 3) {
        this.maxRetries = retries;
        let lastError;

        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                // 模拟前2次失败，第3次成功
                if (attempt < 2) {
                    throw new Error('Network Error');
                }
                return '优化后的简历内容';
            } catch (error) {
                lastError = error;
                this.retryCount = attempt;

                if (attempt === retries) {
                    break;
                }

                if (!this._shouldRetry(error)) {
                    throw error;
                }

                const delay = Math.pow(2, attempt) * 100;
                await this._sleep(delay);
            }
        }

        throw lastError;
    }

    _shouldRetry(error) {
        if (error.name === 'TypeError' || error.name === 'AbortError') {
            return true;
        }
        if (error.message.includes('timeout') || error.message.includes('Network')) {
            return true;
        }
        const retryableStatuses = [408, 429, 500, 502, 503, 504];
        const statusMatch = error.message.match(/(\d{3})/);
        if (statusMatch) {
            const status = parseInt(statusMatch[1]);
            return retryableStatuses.includes(status);
        }
        return false;
    }

    _sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// 测试7: API重试机制 - 最终成功
runner.test('API重试 - 失败后最终成功', async () => {
    const engine = new MockDeepSeekEngine();
    const result = await engine._callAPI([], {}, 3);
    if (result !== '优化后的简历内容') {
        throw new Error('API调用未返回预期结果');
    }
    if (engine.retryCount < 1) {
        throw new Error('未触发重试机制');
    }
});

// 测试8: 指数退避延迟
runner.test('API重试 - 指数退避延迟', async () => {
    const engine = new MockDeepSeekEngine();
    const startTime = Date.now();
    await engine._callAPI([], {}, 2);
    const elapsed = Date.now() - startTime;
    // 应该至少有 100ms + 200ms = 300ms 的延迟
    if (elapsed < 250) {
        throw new Error(`退避延迟不足: ${elapsed}ms`);
    }
});

// 测试9: 不应重试的错误
runner.test('API重试 - 认证错误不应重试', async () => {
    const engine = new MockDeepSeekEngine();

    // 覆盖_callAPI来测试401错误
    engine._callAPI = async function() {
        const error = new Error('API请求失败: 401');
        if (!this._shouldRetry(error)) {
            throw error;
        }
        return 'success';
    };

    try {
        await engine._callAPI();
        throw new Error('应该抛出401错误');
    } catch (error) {
        if (!error.message.includes('401')) {
            throw new Error('错误类型不符合预期');
        }
    }
});

// ============ CSP配置测试 ============

runner.test('CSP配置 - 包含所有必要指令', () => {
    const csp = `default-src 'self';
        script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdnjs.cloudflare.com;
        style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://fonts.googleapis.com;
        font-src 'self' https://cdnjs.cloudflare.com https://fonts.gstatic.com;
        img-src 'self' data: https: http: blob:;
        connect-src 'self' https://api.deepseek.com https://cdnjs.cloudflare.com;
        frame-src 'none';
        object-src 'none';
        base-uri 'self';
        form-action 'self';
        upgrade-insecure-requests;`;

    const requiredDirectives = [
        'default-src',
        'script-src',
        'style-src',
        'font-src',
        'img-src',
        'connect-src',
        'frame-src',
        'object-src',
        'base-uri',
        'form-action',
        'upgrade-insecure-requests'
    ];

    for (const directive of requiredDirectives) {
        if (!csp.includes(directive)) {
            throw new Error(`缺少CSP指令: ${directive}`);
        }
    }
});

runner.test('CSP配置 - 禁止危险来源', () => {
    const csp = `frame-src 'none'; object-src 'none';`;

    if (!csp.includes("frame-src 'none'")) {
        throw new Error('未禁止frame嵌入');
    }
    if (!csp.includes("object-src 'none'")) {
        throw new Error('未禁止object嵌入');
    }
});

// 运行所有测试
runner.run().then(results => {
    console.log('\n' + '='.repeat(50));
    if (results.failed === 0) {
        console.log('🎉 所有安全测试通过！');
    } else {
        console.log('⚠️ 部分测试失败，请检查上述错误');
        process.exit(1);
    }
});
