#!/bin/bash

# ============================================================
# AI Tool Hub - 腾讯云服务器一键部署脚本
# 
# 使用方法:
#   1. 上传此脚本到腾讯云服务器: scp deploy.sh root@your-server-ip:/root/
#   2. SSH登录服务器并执行: chmod +x deploy.sh && ./deploy.sh
#   3. 按提示输入域名和配置信息
#
# 作者: a895411690
# 版本: v1.0 (2026-04-19)
# ============================================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}============================================================${NC}"
echo -e "${BLUE}  🚀 AI Tool Hub - 腾讯云服务器一键部署脚本${NC}"
echo -e "${BLUE}============================================================${NC}"
echo ""

# 检查是否为root用户
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}❌ 请使用root用户执行此脚本${NC}"
    echo "   使用方法: sudo ./deploy.sh"
    exit 1
fi

# 输入域名
echo -e "${YELLOW}请输入您的域名（例如: ai-tool-hub.com）:${NC}"
read DOMAIN_NAME

if [ -z "$DOMAIN_NAME" ]; then
    echo -e "${RED}❌ 域名不能为空${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ 域名设置: ${DOMAIN_NAME}${NC}"
echo ""

# 更新系统包
echo -e "${BLUE}[1/7] 📦 更新系统包...${NC}"
apt update && apt upgrade -y

# 安装必要软件
echo ""
echo -e "${BLUE}[2/7] 🔧 安装Nginx、Node.js、Git...${NC}"
apt install -y nginx git curl wget unzip software-properties-common apt-transport-https lsb-release ca-certificates

# 安装Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# 验证安装
echo ""
echo -e "${GREEN}✅ Nginx版本: $(nginx -v 2>&1)${NC}"
echo -e "${GREEN}✅ Node.js版本: $(node -v)${NC}"
echo -e "${GREEN}✅ npm版本: $(npm -v)${NC}"

# 创建网站目录
echo ""
echo -e "${BLUE}[3/7] 📁 创建网站目录...${NC}"
mkdir -p /var/www/ai-tool-hub
mkdir -p /etc/nginx/ssl
cd /var/www/ai-tool-hub

# 克隆项目（或从GitHub拉取）
echo ""
echo -e "${BLUE}[4/7] 📥 下载AI Tool Hub项目...${NC}"

if [ -d ".git" ]; then
    echo "   发现已有项目，正在更新..."
    git pull origin main
else
    echo "   正在克隆项目..."
    git clone https://github.com/a895411690/ai-tool-hub.git .
fi

# 安装依赖并构建
echo ""
echo -e "${BLUE}[5/7] 🔨 安装依赖并构建项目...${NC}"
npm install
npm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ 项目构建成功！${NC}"
else
    echo -e "${RED}❌ 构建失败，请检查错误信息${NC}"
    exit 1
fi

# 配置Nginx
echo ""
echo -e "${BLUE}[6/7] ⚙️ 配置Nginx...${NC}"

# 备份原有配置
cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup.$(date +%Y%m%d)

# 创建站点配置
cat > /etc/nginx/sites-available/ai-tool-hub << EOF
server {
    listen 80;
    server_name ${DOMAIN_NAME} www.${DOMAIN_NAME};
    
    # HTTP → HTTPS 重定向（SSL证书配置后启用）
    # return 301 https://\$server_name\$request_uri;

    # 网站根目录
    root /var/www/ai-tool-hub/dist;
    index index.html;

    # Gzip压缩
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript application/rss+xml application/atom+xml image/svg+xml;

    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # SPA路由支持（重要！）
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # 禁止访问隐藏文件
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }

    # 访问日志
    access_log /var/log/nginx/ai-tool-hub-access.log;
    error_log /var/log/nginx/ai-tool-hub-error.log;
}
EOF

# 启用站点
ln -sf /etc/nginx/sites-available/ai-tool-hub /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# 测试Nginx配置
nginx -t

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Nginx配置验证通过${NC}"
else
    echo -e "${RED}❌ Nginx配置有误，请检查${NC}"
    exit 1
fi

# 重启Nginx
systemctl restart nginx
systemctl enable nginx

# 配置防火墙
echo ""
echo -e "${BLUE}[7/7] 🔥 配置防火墙...${NC}"

# UFW防火墙规则
ufw allow 22/tcp comment 'SSH'
ufw allow 80/tcp comment 'HTTP'
ufw allow 443/tcp comment 'HTTPS'
ufw --force enable

echo -e "${GREEN}✅ 防火墙配置完成${NC}"

# 完成！
echo ""
echo -e "${GREEN}============================================================${NC}"
echo -e "${GREEN}  🎉 部署成功！${NC}"
echo -e "${GREEN}============================================================${NC}"
echo ""
echo -e "🌐 网站地址: http://${DOMAIN_NAME}"
echo -e "📂 项目目录: /var/www/ai-tool-hub"
echo -e "📋 日志位置: /var/log/nginx/ai-tool-hub-*.log"
echo ""
echo -e "${YELLOW}📌 后续操作建议:${NC}"
echo "   1. 配置DNS解析，将域名指向服务器IP"
echo "   2. 申请SSL证书（推荐Let's Encrypt免费证书）:"
echo "      apt install certbot python3-certbot-nginx"
echo "      certbot --nginx -d ${DOMAIN_NAME} -d www.${DOMAIN_NAME}"
echo "   3. 设置自动更新脚本（可选）:"
echo "      crontab -e"
echo "      添加: 0 3 * * * cd /var/www/ai-tool-hub && git pull && npm install && npm run build"
echo ""
echo -e "${BLUE}🔍 测试网站访问:${NC}"
curl -I http://localhost | head -5

echo ""
echo -e "${GREEN}✨ 感谢使用AI Tool Hub！如有问题请查看文档或提交Issue${NC}"