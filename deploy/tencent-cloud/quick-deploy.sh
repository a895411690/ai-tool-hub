#!/bin/bash

# ============================================================
# AI Tool Hub - 本地构建 + 腾讯云快速部署工具
# 
# 功能:
#   1. 本地构建项目
#   2. 一键上传到腾讯云服务器
#   3. 远程执行部署（可选）
#
# 使用方法:
#   chmod +x quick-deploy.sh
#   ./quick-deploy.sh [选项]
#
# 选项:
#   build       仅本地构建
#   upload      构建并上传到服务器
#   deploy      上传并在远程服务器部署
#   full        完整流程（build + upload + deploy）
# ============================================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# 配置变量（请修改为你的实际配置）
SERVER_USER="root"           # 服务器用户名
SERVER_IP="your-server-ip"    # 服务器公网IP
SERVER_PATH="/var/www/ai-tool-hub"  # 服务器项目路径
DOMAIN_NAME="your-domain.com" # 你的域名

# 显示帮助信息
show_help() {
    echo -e "${CYAN}AI Tool Hub 快速部署工具${NC}"
    echo ""
    echo "使用方法: ./quick-deploy.sh <命令>"
    echo ""
    echo "命令:"
    echo "  ${GREEN}build${NC}     仅本地构建项目"
    echo "  ${GREEN}upload${NC}    构建并上传dist目录到服务器"
    echo "  ${GREEN}deploy${NC}    上传并远程部署"
    echo "  ${GREEN}full${NC}      完整流程（推荐）"
    echo "  ${GREEN}status${NC}    查看服务器状态"
    echo "  ${GREEN}logs${NC}      查看访问日志"
    echo ""
    echo "示例:"
    echo "  ./quick-deploy.sh full"
    echo ""
}

# 构建项目
do_build() {
    echo -e "${BLUE}[1/3] 📦 开始本地构建...${NC}"
    
    if ! command -v npm &> /dev/null; then
        echo -e "${RED}❌ 未检测到Node.js，请先安装${NC}"
        exit 1
    fi
    
    # 清理旧的构建
    rm -rf dist/
    
    # 安装依赖（如果需要）
    if [ ! -d "node_modules" ]; then
        echo "   正在安装依赖..."
        npm install
    fi
    
    # 执行构建
    echo "   正在构建生产版本..."
    npm run build
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ 构建成功！生成 dist/ 目录${NC}"
        ls -lh dist/ | head -5
    else
        echo -e "${RED}❌ 构建失败${NC}"
        exit 1
    fi
}

# 上传到服务器
do_upload() {
    echo -e "${BLUE}[2/3] 📤 上传文件到服务器...${NC}"
    
    # 检查SSH连接
    if ! ssh -o ConnectTimeout=5 -o BatchMode=yes ${SERVER_USER}@${SERVER_IP} echo "连接成功" &> /dev/null; then
        echo -e "${RED}❌ 无法连接到服务器 ${SERVER_IP}${NC}"
        echo "   请检查："
        echo "   1. 服务器IP是否正确"
        echo "   2. SSH密钥是否已配置"
        echo "   3. 服务器是否开机且网络可达"
        exit 1
    fi
    
    echo "   目标: ${SERVER_USER}@${SERVER_IP}:${SERVER_PATH}/dist/"
    
    # 使用rsync增量同步（更快更稳定）
    if command -v rsync &> /dev/null; then
        rsync -avz --delete \
            --exclude 'node_modules' \
            --exclude '.git' \
            --exclude '*.log' \
            dist/ ${SERVER_USER}@${SERVER_IP}:${SERVER_PATH}/dist/
    else
        # 回退到scp
        scp -r dist/* ${SERVER_USER}@${SERVER_IP}:${SERVER_PATH}/dist/
    fi
    
    echo -e "${GREEN}✅ 上传完成！${NC}"
}

# 远程部署
do_deploy() {
    echo -e "${BLUE}[3/3] ⚙️ 远程部署中...${NC}"
    
    ssh ${SERVER_USER}@${SERVER_IP} << 'REMOTE_SCRIPT'
cd /var/www/ai-tool-hub

# 备份当前版本（可选）
if [ -d "dist.bak" ]; then
    rm -rf dist.bak
fi
cp -r dist dist.bak.$(date +%Y%m%d_%H%M%S)

echo "✅ 备份完成"

# 重载Nginx（如果已安装）
if command -v nginx &> /dev/null; then
    nginx -t && systemctl reload nginx
    echo "✅ Nginx重载成功"
else
    echo "⚠️ Nginx未安装，请手动配置Web服务器"
fi

echo "🎉 部署完成！"
REMOTE_SCRIPT
    
    echo -e "${GREEN}✅ 部署成功！${NC}"
    echo ""
    echo -e "${CYAN}🌐 访问地址:${NC}"
    echo "   http://${SERVER_IP}"
    if [ "$DOMAIN_NAME" != "your-domain.com" ]; then
        echo "   https://${DOMAIN_NAME}"
    fi
}

# 查看服务器状态
do_status() {
    echo -e "${CYAN}📊 服务器状态检查${NC}\n"
    
    ssh ${SERVER_USER}@${SERVER_IP} << 'EOF'
echo "=== 系统信息 ==="
uname -a
uptime
free -h | head -2
df -h / | tail -1

echo ""
echo "=== Nginx状态 ==="
systemctl is-active nginx || echo "Nginx未运行"

echo ""
echo "=== 项目目录 ==="
ls -lh /var/www/ai-tool-hub/dist/ | head -10

echo ""
echo "=== 最近更新时间 ==="
stat -c "%y" /var/www/ai-tool-hub/dist/index.html 2>/dev/null || echo "未知"
EOF
}

# 查看日志
do_logs() {
    echo -e "${CYAN}📋 实时访问日志 (Ctrl+C退出)${NC}\n"
    ssh ${SERVER_USER}@${SERVER_IP} 'tail -f /var/log/nginx/ai-tool-hub-access.log'
}

# 主程序
case "$1" in
    build)
        do_build
        ;;
    upload)
        do_build
        do_upload
        ;;
    deploy)
        do_upload
        do_deploy
        ;;
    full)
        echo -e "${BLUE}=====================================================${NC}"
        echo -e "${BLUE}  🚀 AI Tool Hub 完整部署流程${NC}"
        echo -e "${BLUE}=====================================================${NC}"
        echo ""
        
        do_build
        echo ""
        do_upload
        echo ""
        do_deploy
        
        echo ""
        echo -e "${GREEN}=====================================================${NC}"
        echo -e "${GREEN}  ✨ 全部完成！网站已上线运行${NC}"
        echo -e "${GREEN}=====================================================${NC}"
        ;;
    status)
        do_status
        ;;
    logs)
        do_logs
        ;;
    *)
        show_help
        ;;
esac