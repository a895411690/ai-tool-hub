#!/usr/bin/env node

/**
 * AI Tool Hub - 链接有效性验证器
 * 验证 tools.json 中所有工具链接是否有效
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// 配置
const CONFIG = {
    timeout: 8000,           // 请求超时时间（毫秒）
    maxConcurrent: 10,      // 最大并发数
    retryCount: 1,          // 重试次数
    outputFormat: 'table',  // 输出格式：table | json | summary
};

// 颜色输出
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    bold: '\x1b[1m'
};

// 统计数据
const stats = {
    total: 0,
    valid: 0,
    invalid: 0,
    error: 0,
    redirected: 0,
    startTime: Date.now(),
    results: []
};

/**
 * 加载tools.json
 */
function loadToolsData() {
    const possiblePaths = [
        path.join(__dirname, 'tools.json'),
        path.join(__dirname, 'src', 'tools.json'),
        path.join(__dirname, 'dist', 'tools.json')
    ];

    for (const filePath of possiblePaths) {
        if (fs.existsSync(filePath)) {
            console.log(`${colors.cyan}📂 找到工具数据文件:${colors.reset} ${filePath}`);
            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            return data.tools || [];
        }
    }

    console.error(`${colors.red}❌ 未找到 tools.json 文件${colors.reset}`);
    process.exit(1);
}

/**
 * 检查URL是否有效
 */
async function checkURL(url, toolName, toolId) {
    return new Promise((resolve) => {
        const urlObj = new URL(url);
        const protocol = urlObj.protocol === 'https:' ? https : http;
        
        const options = {
            hostname: urlObj.hostname,
            port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
            path: urlObj.pathname + urlObj.search,
            method: 'HEAD',  // 使用HEAD方法减少带宽消耗
            timeout: CONFIG.timeout,
            headers: {
                'User-Agent': 'AI-Tool-Hub-LinkChecker/1.0',
                'Accept': '*/*'
            }
        };

        const startTime = Date.now();
        
        const req = protocol.request(options, (res) => {
            const responseTime = Date.now() - startTime;
            const statusCode = res.statusCode;
            
            let result = {
                id: toolId,
                name: toolName,
                url: url,
                status: statusCode,
                statusText: res.statusMessage,
                responseTime: responseTime,
                valid: false,
                message: '',
                finalUrl: null
            };
            
            // 检查重定向
            if (statusCode >= 300 && statusCode < 400 && res.headers.location) {
                result.redirected = true;
                result.finalUrl = res.headers.location;
                stats.redirected++;
            }
            
            // 判断有效性
            if (statusCode >= 200 && statusCode < 400) {
                result.valid = true;
                stats.valid++;
            } else if (statusCode >= 400) {
                result.valid = false;
                stats.invalid++;
                result.message = `HTTP ${statusCode}: ${res.statusMessage}`;
            }
            
            stats.total++;
            stats.results.push(result);
            resolve(result);
        });

        req.on('error', (e) => {
            const responseTime = Date.now() - startTime;
            stats.error++;
            stats.total++;
            
            stats.results.push({
                id: toolId,
                name: toolName,
                url: url,
                status: 0,
                statusText: 'ERROR',
                responseTime: responseTime,
                valid: false,
                message: e.message,
                error: e.code
            });
            
            resolve({ valid: false, error: e.message });
        });

        req.on('timeout', () => {
            req.destroy();
            stats.error++;
            stats.total++;
            
            stats.results.push({
                id: toolId,
                name: toolName,
                url: url,
                status: 0,
                statusText: 'TIMEOUT',
                responseTime: CONFIG.timeout,
                valid: false,
                message: `请求超时 (${CONFIG.timeout}ms)`
            });
            
            resolve({ valid: false, message: 'TIMEOUT' });
        });

        req.setTimeout(CONFIG.timeout);
        req.end();
    });
}

/**
 * 并发控制执行器
 */
async function runWithConcurrency(items, fn, maxConcurrent) {
    const results = [];
    const executing = new Set();

    for (const item of items) {
        const p = Promise.resolve().then(() => fn(item));
        results.push(p);

        const e = p.then(() => executing.delete(e));
        executing.add(e);

        if (executing.size >= maxConcurrent) {
            await Promise.race(executing);
        }
    }

    return Promise.all(results);
}

/**
 * 格式化表格输出
 */
function formatTableOutput() {
    console.log('\n' + '='.repeat(100));
    console.log(`${colors.bold}${colors.cyan}🔗 AI Tool Hub - 工具链接验证报告${colors.reset}`);
    console.log(`生成时间: ${new Date().toLocaleString('zh-CN')}`);
    console.log('='.repeat(100));

    // 表头
    console.log('\n┌' + '─'.repeat(12) + '┬' + '─'.repeat(30) + '┬' + '─'.repeat(45) + '┬' + '─'.repeat(8) + '┐');
    console.log('│ ' + 'ID'.padEnd(10) + ' │ ' + '工具名称'.padEnd(28) + ' │ ' + '状态'.padEnd(43) + ' │ ' + '耗时'.padEnd(6) + ' │');
    console.log('├' + '─'.repeat(12) + '┼' + '─'.repeat(30) + '┼' + '─'.repeat(45) + '┼' + '─'.repeat(8) + '┤');

    // 数据行
    stats.results.forEach(r => {
        const id = String(r.id).padEnd(10);
        const name = r.name.substring(0, 26).padEnd(28);
        
        let statusStr = '';
        if (r.valid === true) {
            statusStr = `${colors.green}✅ 有效${colors.reset} (${r.status})`.padEnd(43);
        } else if (r.redirected) {
            statusStr = `${colors.yellow}↪ 重定向 → ${r.finalUrl?.substring(0, 30)}${colors.reset}`.padEnd(43);
        } else if (r.status >= 400) {
            statusStr = `${colors.red}❌ ${r.message || `HTTP ${r.status}`}${colors.reset}`.padEnd(43);
        } else {
            statusStr = `${colors.red}⚠️ ${r.message || '错误'}${colors.reset}`.padEnd(43);
        }

        const time = `${r.responseTime}ms`.padEnd(6);

        console.log(`│ ${id} │ ${name} │ ${statusStr} │ ${time} │`);
    });

    console.log('└' + '─'.repeat(12) + '┴' + '─'.repeat(30) + '┴' + '─'.repeat(45) + '┴' + '─'.repeat(8) + '┘');

    // 汇总统计
    printSummary();
}

/**
 * 打印汇总信息
 */
function printSummary() {
    const totalTime = ((Date.now() - stats.startTime) / 1000).toFixed(1);
    const validRate = stats.total > 0 ? ((stats.valid / stats.total) * 100).toFixed(1) : 0;

    console.log('\n' + '═'.repeat(100));
    console.log(`${colors.bold}📊 验证统计汇总${colors.reset}`);
    console.log('═'.repeat(100));
    
    console.log(`\n   ${colors.cyan}总工具数:${colors.reset}     ${stats.total}`);
    console.log(`   ${colors.green}✅ 有效链接:${colors.reset}     ${stats.valid} (${validRate}%)`);
    console.log(`   ${colors.red}❌ 无效链接:${colors.reset}     ${stats.invalid}`);
    console.log(`   ${colors.yellow}⚠️ 错误/超时:${colors.reset}   ${stats.error}`);
    console.log(`   ${colors.blue}🔄 重定向:${colors.reset}      ${stats.redirected}`);
    console.log(`\n   ⏱️ 总耗时:         ${totalTime}s`);
    console.log('   '.repeat(100));

    // 问题链接列表
    const invalidLinks = stats.results.filter(r => !r.valid);
    if (invalidLinks.length > 0) {
        console.log(`\n${colors.red}⚠️ 需要关注的问题链接 (${invalidLinks.length}):${colors.reset}\n`);
        
        invalidLinks.forEach(link => {
            console.log(`   ❌ [${link.id}] ${link.name}`);
            console.log(`      URL: ${link.url}`);
            console.log(`      原因: ${link.message || link.error || `HTTP ${link.status}`}`);
            console.log('');
        });
    }

    // 导出JSON报告
    exportJSONReport();
}

/**
 * 导出JSON报告
 */
function exportJSONReport() {
    const reportData = {
        timestamp: new Date().toISOString(),
        summary: {
            total: stats.total,
            valid: stats.valid,
            invalid: stats.invalid,
            error: stats.error,
            redirected: stats.redirected,
            validRate: stats.total > 0 ? parseFloat(((stats.valid / stats.total) * 100).toFixed(2)) : 0,
            totalTime: ((Date.now() - stats.startTime) / 1000).toFixed(2)
        },
        details: stats.results.map(r => ({
            id: r.id,
            name: r.name,
            url: r.url,
            valid: r.valid,
            status: r.status,
            message: r.message || r.error,
            responseTime: r.responseTime,
            redirected: r.redirected,
            finalUrl: r.finalUrl
        }))
    };

    const reportPath = path.join(__dirname, 'link-validation-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2), 'utf8');
    
    console.log(`\n${colors.cyan}📄 详细报告已导出至:${colors.reset} ${reportPath}`);
}

/**
 * 主函数
 */
async function main() {
    console.log('\n' + '█'.repeat(60));
    console.log(`${colors.bold}${colors.blue}🔍 AI Tool Hub - 工具链接批量验证器${colors.reset}`);
    console.log('█'.repeat(60));
    console.log(`\n⏱️ 超时设置: ${CONFIG.timeout/1000}秒`);
    console.log(`⚡ 最大并发: ${CONFIG.maxConcurrent}`);
    console.log('');

    // 加载数据
    const tools = loadToolsData();
    console.log(`\n📦 共加载 ${tools.length} 个工具，开始验证...\n`);

    // 创建进度指示器
    let completed = 0;
    const showProgress = setInterval(() => {
        process.stdout.write(`\r${colors.cyan}⏳ 进度: ${completed}/${tools.length} (${Math.round(completed/tools.length*100)}%)${colors.reset}`);
    }, 500);

    // 执行验证
    try {
        await runWithConcurrency(tools, async (tool) => {
            completed++;
            return checkURL(tool.url, tool.name, tool.id);
        }, CONFIG.maxConcurrent);
    } catch (e) {
        console.error(`${colors.red}\n❌ 验证过程中发生错误:${colors.reset}`, e);
    }

    clearInterval(showProgress);
    process.stdout.write('\r' + ' '.repeat(60) + '\r');

    // 输出结果
    formatTableOutput();

    // 返回退出码
    process.exit(stats.invalid > 0 ? 1 : 0);
}

// 启动
main();