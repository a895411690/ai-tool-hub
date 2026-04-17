#!/usr/bin/env node
/**
 * AI 简历优化工具 - 部署脚本
 * 用途：部署到 GitHub Pages 或其他静态托管
 * 特点：零依赖，仅使用 Node.js 内置模块
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 配置
const config = {
    distDir: path.join(__dirname, '../dist'),
    repoDir: path.join(__dirname, '../'),
    githubRepo: 'https://github.com/a895411690/ai-tool-hub.git',
    deployBranch: 'gh-pages'
};

// 日志工具
const log = {
    info: (msg) => console.log(`\x1b[34mℹ️  ${msg}\x1b[0m`),
    success: (msg) => console.log(`\x1b[32m✅ ${msg}\x1b[0m`),
    warn: (msg) => console.log(`\x1b[33m⚠️  ${msg}\x1b[0m`),
    error: (msg) => console.log(`\x1b[31m❌ ${msg}\x1b[0m`)
};

// 部署步骤
class Deployer {
    constructor() {
        this.startTime = Date.now();
    }

    // 1. 检查 dist 目录
    checkDist() {
        log.info('检查 dist 目录...');
        
        if (!fs.existsSync(config.distDir)) {
            log.error('dist 目录不存在，请先运行构建脚本');
            process.exit(1);
        }
        
        const indexFile = path.join(config.distDir, 'index.html');
        if (!fs.existsSync(indexFile)) {
            log.error('dist/index.html 不存在，构建可能失败');
            process.exit(1);
        }
        
        log.success('dist 目录检查通过');
    }

    // 2. 检查 Git 状态
    checkGit() {
        log.info('检查 Git 状态...');
        
        try {
            const status = execSync('git status --porcelain', { encoding: 'utf-8' });
            if (status.trim()) {
                log.warn('有未提交的更改');
                log.info('建议先提交更改: git add . && git commit -m "..."');
            }
            
            const branch = execSync('git branch --show-current', { encoding: 'utf-8' }).trim();
            log.success(`当前分支: ${branch}`);
        } catch (error) {
            log.error('Git 检查失败: ' + error.message);
            process.exit(1);
        }
    }

    // 3. 部署到 GitHub Pages
    deployToGitHubPages() {
        log.info('部署到 GitHub Pages...');
        
        try {
            // 方法 1: 使用 git subtree（推荐）
            log.info('使用 git subtree 部署...');
            
            // 检查是否已经添加了 subtree
            try {
                execSync(`git subtree pull --prefix=tools/resume-optimizer/dist origin ${config.deployBranch}`, { stdio: 'pipe' });
            } catch (error) {
                // 如果失败，说明可能是首次部署
                log.info('首次部署，创建 gh-pages 分支...');
            }
            
            // 推送到 gh-pages 分支
            execSync(`git subtree push --prefix=tools/resume-optimizer/dist origin ${config.deployBranch}`, { stdio: 'inherit' });
            
            log.success('已推送到 gh-pages 分支');
            
        } catch (error) {
            log.warn('git subtree 失败，尝试其他方法...');
            log.info('请手动执行以下命令:');
            console.log('  cd tools/resume-optimizer');
            console.log('  git add dist/');
            console.log('  git commit -m "Deploy to GitHub Pages"');
            console.log('  git subtree push --prefix=dist origin gh-pages');
        }
    }

    // 4. 生成部署报告
    generateReport() {
        const endTime = Date.now();
        const duration = ((endTime - this.startTime) / 1000).toFixed(2);
        
        console.log('\n' + '='.repeat(50));
        log.success('部署完成！');
        console.log('='.repeat(50));
        console.log(`\n📊 部署统计:`);
        console.log(`   部署时间: ${duration}s`);
        console.log(`   目标分支: ${config.deployBranch}`);
        console.log(`\n🌐 访问地址:`);
        console.log(`   https://a895411690.github.io/ai-tool-hub/tools/resume-optimizer/`);
        console.log('\n💡 提示: GitHub Pages 可能需要几分钟才能更新');
        console.log('='.repeat(50) + '\n');
    }

    // 运行部署
    run() {
        console.log('\n🚀 开始部署 AI 简历优化工具...\n');
        
        this.checkDist();
        this.checkGit();
        this.deployToGitHubPages();
        this.generateReport();
    }
}

// 执行部署
const deployer = new Deployer();
deployer.run();
