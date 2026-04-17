/**
 * 构建配置文件
 * AI 简历优化工具 - Build Configuration
 */

module.exports = {
    // 项目信息
    project: {
        name: 'AI 简历优化工具',
        version: '1.0.0',
        description: 'AI驱动的简历优化工具，支持实时预览和一键导出',
        author: 'AI Tool Hub',
        license: 'MIT'
    },

    // 构建配置
    build: {
        // 源代码目录
        srcDir: './',
        
        // 输出目录
        distDir: './dist',
        
        // 需要处理的文件
        files: {
            html: ['index.html'],
            js: [
                'src/app.js',
                'src/lib/store.js',
                'src/lib/pdfGenerator.js',
                'src/lib/templates.js',
                'src/lib/shareUtils.js',
                'src/lib/aiOptimizer.js',
                'src/lib/importUtils.js',
                'src/components/resumeForm.js',
                'src/components/resumePreview.js',
                'src/components/importResume.js'
            ],
            css: ['src/styles/main.css']
        },
        
        // 需要复制的资源文件
        assets: [
            'manifest.json',
            'robots.txt',
            'sitemap.xml'
        ],
        
        // 压缩选项
        minify: {
            js: {
                removeComments: true,
                removeWhitespace: true,
                preserveFunctionNames: false
            },
            css: {
                removeComments: true,
                removeWhitespace: true
            },
            html: {
                removeComments: true,
                removeWhitespace: true,
                removeOptionalTags: false
            }
        }
    },

    // 部署配置
    deploy: {
        // GitHub Pages 配置
        github: {
            repo: 'https://github.com/a895411690/ai-tool-hub.git',
            branch: 'gh-pages',
            path: '/tools/resume-optimizer/'
        },
        
        // 部署前的检查
        preflight: {
            checkGitStatus: true,
            checkDistExists: true,
            runTests: false // 可选：部署前运行测试
        }
    },

    // 开发服务器配置（可选）
    dev: {
        port: 3000,
        open: true,
        watch: true
    },

    // 性能优化配置
    optimization: {
        // 代码分割（暂未实现）
        codeSplitting: false,
        
        // 图片优化（暂未实现）
        imageOptimization: false,
        
        // Gzip 压缩（需要服务器支持）
        gzip: false,
        
        // 缓存策略
        cache: {
            maxAge: 31536000, // 1年
            immutable: true
        }
    },

    // 环境变量
    env: {
        development: {
            NODE_ENV: 'development',
            API_URL: 'https://qianfan.baidubce.com/v2/chat/completions'
        },
        production: {
            NODE_ENV: 'production',
            API_URL: 'https://qianfan.baidubce.com/v2/chat/completions'
        }
    }
};
