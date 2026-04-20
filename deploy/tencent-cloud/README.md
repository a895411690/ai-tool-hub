# 🚀 腾讯云服务器部署指南

## 📋 目录

- [前置准备](#前置准备)
- [快速部署（一键脚本）](#快速部署一键脚本)
- [手动部署步骤](#手动部署步骤)
- [域名与SSL证书配置](#域名与ssl证书配置)
- [性能优化建议](#性能优化建议)
- [监控与维护](#监控与维护)
- [常见问题FAQ](#常见问题faq)

---

## 前置准备

### 1️⃣ 腾讯云服务器要求

| 配置项 | 最低要求 | 推荐配置 |
|--------|---------|---------|
| **操作系统** | Ubuntu 20.04+ / CentOS 8+ | Ubuntu 22.04 LTS |
| **CPU** | 1核 | 2核 |
| **内存** | 1GB | 2GB |
| **硬盘** | 40GB SSD | 50GB SSD |
| **带宽** | 1Mbps | 2-5Mbps |
| **费用** | ≈ ¥50/月 | ≈ ¥100/月 |

### 2️⃣ 域名准备

1. **购买域名**
   - 推荐平台：腾讯云、阿里云、Namesilo
   - 价格：.com ≈ ¥60/年，.cn ≈ ¥30/年

2. **DNS解析配置**
   ```
   记录类型: A
   主机记录: @ (或 www)
   记录值: [你的腾讯云服务器公网IP]
   TTL: 600
   
   # 同时添加www子域名
   记录类型: CNAME
   主机记录: www
   记录值: your-domain.com
   TTL: 600
   ```

3. **ICP备案**（中国大陆服务器必须）
   - 登录腾讯云控制台 → ICP备案
   - 准备材料：身份证、营业执照（企业）、网站信息
   - 审核时间：7-15个工作日
   - 备案号示例：`沪ICP备2026013388号`

---

## 快速部署（一键脚本）

### ⚡ 30秒完成部署！

#### 步骤1：上传脚本到服务器

```bash
# 在本地终端执行（Mac/Linux）
scp deploy/tencent-cloud/deploy.sh root@你的服务器IP:/root/

# Windows用户使用：
# 使用WinSCP或FileZilla上传deploy.sh到服务器的/root/目录
```

#### 步骤2：SSH登录并执行

```bash
# SSH登录服务器
ssh root@你的服务器IP

# 执行权限并运行
chmod +x deploy.sh
./deploy.sh

# 按提示输入域名，等待自动完成！
```

#### 步骤3：访问网站

```
http://your-domain.com
```

✅ 完成！你的AI Tool Hub已成功上线！

---

## 手动部署步骤

如果你更喜欢手动控制每个步骤：

### 步骤1：连接服务器

```bash
ssh root@你的服务器公网IP
```

### 步骤2：安装基础环境

```bash
# 更新系统
apt update && apt upgrade -y

# 安装Nginx
apt install -y nginx

# 安装Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# 安装Git
apt install -y git

# 验证安装
nginx -v    # nginx/1.18.0
node -v      # v20.x.x
npm -v       # 10.x.x
git --version
```

### 步骤3：克隆项目

```bash
cd /var/www/
git clone https://github.com/a895411690/ai-tool-hub.git
cd ai-tool-hub
```

### 步骤4：构建项目

```bash
# 安装依赖
npm install

# 生产构建
npm run build

# 验证dist目录生成
ls -la dist/
# 应该看到 index.html, assets/ 等文件
```

### 步骤5：配置Nginx

```bash
# 创建站点配置文件
cat > /etc/nginx/sites-available/ai-tool-hub << 'EOF'
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    root /var/www/ai-tool-hub/dist;
    index index.html;

    # Gzip压缩
    gzip on;
    gzip_vary on;
    gzip_types text/plain text/css application/json application/javascript;

    # SPA路由支持（重要！）
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|ico)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# 启用站点
ln -sf /etc/nginx/sites-available/ai-tool-hub /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# 测试配置
nginx -t

# 重启Nginx
systemctl restart nginx
systemctl enable nginx
```

### 步骤6：开放防火墙端口

```bash
# UFW防火墙
ufw allow 22/tcp   # SSH
ufw allow 80/tcp   # HTTP
ufw allow 443/tcp  # HTTPS
ufw enable

# 或使用iptables（CentOS）
iptables -A INPUT -p tcp --dport 80 -j ACCEPT
iptables -A INPUT -p tcp --dport 443 -j ACCEPT
service iptables save
```

### 步骤7：验证部署

```bash
# 本地测试
curl -I http://localhost

# 应该返回200 OK
# HTTP/1.1 200 OK
# Server: nginx
# ...
```

现在可以通过 `http://your-server-ip` 访问了！

---

## 域名与SSL证书配置

### 🔒 申请免费SSL证书（Let's Encrypt）

#### 方法1：Certbot自动申请（推荐）

```bash
# 安装Certbot
apt install -y certbot python3-certbot-nginx

# 自动申请并配置SSL
certbot --nginx -d your-domain.com -d www.your-domain.com

# 按提示输入邮箱，同意条款即可
```

#### 方法2：腾讯云免费SSL证书（国内推荐）

1. 登录[腾讯云SSL证书控制台](https://console.cloud.tencent.com/ssl)
2. 点击"申请免费证书"
3. 填写域名：`your-domain.com`
4. 选择验证方式：DNS验证（推荐）或文件验证
5. DNS验证：在域名DNS管理中添加TXT记录
6. 等待审核（通常10分钟内）
7. 下载证书（Nginx格式）

#### 安装腾讯云SSL证书

```bash
# 创建SSL目录
mkdir -p /etc/nginx/ssl

# 上传证书文件（从本地）
scp your-domain.com.pem root@server:/etc/nginx/ssl/
scp your-domain.com.key root@server:/etc/nginx/ssl/

# 更新Nginx配置启用HTTPS
cat > /etc/nginx/sites-available/ai-tool-hub << 'EOF'
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$server_name$request_uri;  # HTTP跳转HTTPS
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    ssl_certificate /etc/nginx/ssl/your-domain.com.pem;
    ssl_certificate_key /etc/nginx/ssl/your-domain.com.key;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    root /var/www/ai-tool-hub/dist;
    index index.html;

    # ... 其余配置同上 ...
}
EOF

# 重载Nginx
nginx -t && systemctl reload nginx
```

### ✅ 验证SSL

```bash
# 在线检测工具
# https://www.ssllabs.com/ssltest/analyze.html?d=your-domain.com

# 命令行测试
openssl s_client -connect your-domain.com:443 -servername your-domain.com </dev/null
```

---

## 性能优化建议

### ⚡ Nginx性能调优

编辑 `/etc/nginx/nginx.conf`：

```nginx
worker_processes auto;
worker_rlimit_nofile 65535;

events {
    worker_connections 2048;
    use epoll;
    multi_accept on;
}

http {
    # 开启缓存
    open_file_cache max=1000 inactive=20s;
    open_file_cache_valid 30s;
    open_file_cache_min_uses 2;
    
    # 连接优化
    keepalive_timeout 65;
    keepalive_requests 1000;
}
```

### 📦 启用Gzip压缩

已在默认配置中包含，确保以下参数：

```nginx
gzip on;
gzip_comp_level 6;
gzip_min_length 1000;
gzip_proxied any;
gzip_types
    text/plain
    text/css
    text/xml
    text/javascript
    application/json
    application/javascript
    application/rss+xml
    image/svg+xml;
```

### 🗄️ 浏览器缓存策略

```nginx
# 静态资源长期缓存（带hash的文件）
location ~* \.[0-9a-f]{20}\.(js|css|png|jpg|gif|svg)$ {
    expires max;
    add_header Cache-Control "public, immutable";
}

# HTML文件不缓存（每次检查更新）
location ~* \.html$ {
    expires -1;
    add_header Cache-Control "no-store, no-cache, must-revalidate";
}
```

---

## 监控与维护

### 📊 设置自动更新

```bash
# 创建自动更新脚本
cat > /var/www/ai-tool-hub/update.sh << 'EOF'
#!/bin/bash
cd /var/www/ai-tool-hub
git pull origin main
npm install
npm run build
systemctl reload nginx
echo "$(date): 更新完成" >> /var/log/ai-tool-hub-update.log
EOF

chmod +x /var/www/ai-tool-hub/update.sh

# 设置定时任务（每天凌晨3点自动更新）
crontab -e
# 添加以下行：
0 3 * * * /var/www/ai-tool-hub/update.sh >> /var/log/ai-tool-hub-cron.log 2>&1
```

### 🔍 日志监控

```bash
# 实时查看访问日志
tail -f /var/log/nginx/ai-tool-hub-access.log

# 查看404错误
grep " 404 " /var/log/nginx/ai-tool-hub-error.log

# 统计今日访问量
awk '{print $1}' /var/log/nginx/ai-tool-hub-access.log | sort | uniq -c | sort -nr | head -10
```

### 💾 数据库备份（如需要）

```bash
# 备份整个项目（含数据）
tar -czf /backup/ai-tool-hub-$(date +%Y%m%d).tar.gz /var/www/ai-tool-hub

# 定时备份（每周日凌晨2点）
0 2 * * 0 tar -czf /backup/ai-tool-hub-$(date +\%Y\%m\%d).tar.gz /var/www/ai-tool-hub
```

---

## 常见问题FAQ

### Q1: 网站显示502 Bad Gateway？

**原因**: Nginx无法连接后端（静态站不太可能）

**解决**:
```bash
# 检查Nginx状态
systemctl status nginx

# 查看错误日志
tail -f /var/log/nginx/error.log

# 重启Nginx
systemctl restart nginx
```

### Q2: 页面刷新后404？

**原因**: SPA路由未配置正确

**解决**: 确保Nginx配置中有：
```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

### Q3: SSL证书过期？

**解决**:
```bash
# Let's Encrypt自动续期
certbot renew --dry-run

# 添加定时任务
0 0 1 * * certbot renew --quiet && systemctl reload nginx
```

### Q4: 如何查看当前版本？

```bash
cd /var/www/ai-tool-hub
git log -1
cat package.json | grep version
```

### Q5: 如何回滚到上一版本？

```bash
cd /var/www/ai-tool-hub
git log --oneline -5  # 查看历史版本
git checkout HEAD~1     # 回滚到上一个版本
npm run build           # 重新构建
```

---

## 🎯 部署清单（Checklist）

- [ ] 购买腾讯云服务器（Ubuntu 22.04）
- [ ] 购买域名并解析到服务器IP
- [ ] 完成ICP备案（如需国内访问）
- [ ] 执行部署脚本或手动部署
- [ ] 配置SSL证书（HTTPS）
- [ ] 开放防火墙端口（80, 443）
- [ ] 设置自动更新定时任务
- [ ] 配置监控和日志
- [ ] 测试网站访问正常
- [ ] 提交搜索引擎收录（百度/Google）

---

## 📞 技术支持

如遇到问题，请通过以下方式获取帮助：

- **GitHub Issues**: [提交问题](https://github.com/a895411690/ai-tool-hub/issues)
- **Email**: a895411690@gmail.com
- **文档**: 查看本项目的README.md

---

**最后更新**: 2026-04-19  
**适用版本**: v4.2.0+  
**作者**: a895411690