#!/bin/bash
echo "🚀 AI Tool Hub - 推送代码到GitHub"
echo "=================================="

# 显示当前分支和提交状态
echo "📊 当前状态："
git status --short --branch

echo ""
echo "📤 尝试推送到GitHub仓库..."

# 尝试使用HTTPS推送
git push https://github.com/a895411690/ai-tool-hub.git main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ 推送成功！"
    echo ""
    echo "🔗 相关链接："
    echo "   • 仓库地址：https://github.com/a895411690/ai-tool-hub"
    echo "   • CI/CD状态：https://github.com/a895411690/ai-tool-hub/actions"
    echo "   • GitHub Pages：https://a895411690.github.io/ai-tool-hub/"
    echo ""
    echo "📋 推送内容："
    echo "   • 重构index.html，优化结构和样式"
    echo "   • JavaScript模块化架构"
    echo "   • 修复html2canvas依赖问题"
    echo "   • 修复searchHistory作用域问题"
    echo "   • 优化Service Worker路径"
    echo "   • 添加CI/CD自动化部署流程"
    echo ""
    echo "🚨 请前往GitHub仓库进行以下设置："
    echo "   1. Settings → Pages"
    echo "   2. 选择部署源：GitHub Actions"
    echo "   3. 保存设置"
else
    echo ""
    echo "❌ 推送失败，可能原因："
    echo "   • 网络连接问题"
    echo "   • GitHub服务不可用"
    echo "   • 认证失败"
    echo ""
    echo "🔄 备用方案："
    echo "   1. 检查网络连接"
    echo "   2. 稍后重试"
    echo "   3. 使用GitHub CLI或桌面客户端"
fi
