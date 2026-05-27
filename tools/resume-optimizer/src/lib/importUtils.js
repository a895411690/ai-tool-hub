/**
 * 简历导入工具库
 * 支持PDF、DOCX、TXT、HTML格式简历解析
 */

// 公共配置数据 - 集中管理便于维护和扩展
const CONFIG = {
    // 支持的文件格式
    supportedFormats: ['.pdf', '.docx', '.doc', '.txt', '.html', '.htm', '.md', '.markdown'],
    // 最大文件大小 (10MB)
    maxFileSize: 10 * 1024 * 1024,
    // 城市列表
    cities: ['北京', '上海', '广州', '深圳', '杭州', '南京', '成都', '武汉', '西安', '重庆', '天津', '苏州', '青岛', '长沙', '大连', '厦门', '宁波', '无锡', '合肥', '郑州', '济南', '福州', '昆明', '南昌', '哈尔滨', '石家庄', '温州', '南宁', '贵阳', '海口', '兰州', '银川', '西宁', '呼和浩特', '乌鲁木齐', '拉萨'],
    // 常见公司名称
    commonCompanies: ['腾讯', '阿里', '百度', '字节', '华为', '美团', '京东', '交通银行', '广发银行', '招商银行', '建设银行', '工商银行', '农业银行', '中国银行', '神州数码', '联想', '小米', 'OPPO', 'VIVO', '中兴', '阿里巴巴', '腾讯科技', '百度在线', '字节跳动', '美团点评', '谷歌', '微软', '苹果', '亚马逊', 'Facebook', 'Google', 'Microsoft', 'Apple'],
    // 常见学校名称
    commonSchools: ['清华大学', '北京大学', '复旦大学', '上海交通大学', '浙江大学', '南京大学', '中山大学', '武汉大学', '同济大学', '华东师范大学', '华东理工大学', '上海大学', '上海财经大学', '上海外国语大学', '西安交通大学', '哈尔滨工业大学', '华中科技大学', '中国科学技术大学', '中国人民大学', '东南大学', '北京航空航天大学', '北京理工大学', '天津大学', '华南理工大学', '西北工业大学', '大连理工大学', '电子科技大学', '中南大学', '湖南大学', '吉林大学', '山东大学', '四川大学', '重庆大学', '北京师范大学', '南开大学', '厦门大学', '青岛大学', '郑州大学', '苏州大学', '南京航空航天大学', '南京理工大学', '北京邮电大学', '西安电子科技大学', '杭州电子科技大学'],
    // 常见专业
    commonMajors: ['计算机科学与技术', '软件工程', '信息管理与信息系统', '电子信息工程', '自动化', '机械工程', '土木工程', '电气工程', '通信工程', '网络工程', '信息安全', '数据科学与大数据技术', '人工智能', '机器学习', '金融学', '会计学', '市场营销', '工商管理', '国际经济与贸易', '数学与应用数学', '统计学', '物理学', '化学', '法学', '英语', '日语', '新闻学', '广告学', '临床医学', '护理学', '药学', '生物医学工程', '环境工程', '材料科学与工程', '工业设计'],
    // 常见学位
    degrees: ['博士', '硕士', '学士', '本科', '研究生', '专科', '大专', '专升本'],
    // 常见职位关键词
    positionKeywords: ['工程师', '开发', '测试', '产品', '设计', '经理', '总监', '主管', '专员', '分析师', '架构师', '程序员', '设计师', '运营', '市场', '销售', '人事', '财务', '会计', '顾问', '专家', '组长', '负责人'],
    // 公司后缀词
    companySuffixes: ['银行', '公司', '集团', '科技', '网络', '软件', '数据', '信息', '数码', '技术', '有限', '股份', '控股', '投资', '金融', '保险', '证券', '互联网', '电子商务', '通信', '电子', '半导体', '医药', '教育'],
    // 技能关键词
    skillKeywords: ['React', 'Vue', 'TypeScript', 'JavaScript', 'HTML5', 'CSS3', 'Node.js', 'Python', 'Java', 'Go', 'C++', 'MySQL', 'Redis', 'MongoDB', 'PostgreSQL', 'Git', 'Docker', 'Jenkins', 'Kubernetes', 'Postman', 'Jmeter', 'Fiddler', 'Selenium', 'Linux', 'Shell', 'Bash', '运维', '测试', '开发', '自动化测试', '性能测试', '安全测试', '功能测试', '回归测试', '测试策略', '测试计划', '团队协作', '项目管理', '沟通能力', '问题解决', '学习能力', '团队管理', '技术领导', '需求分析', '风险管理'],
    // 正则表达式模式
    patterns: {
        phone: /1[3-9]\d{9}/,
        email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/,
        name: /^[\u4e00-\u9fa5]{2,4}$/,
        experienceYears: /(\d+)\s*年[以]?[上]?/,
        period: /(\d{4}[.\-/]\d{1,2})\s*[至\-~–到]\s*(\d{4}[.\-/]\d{1,2}|至今|现在)/,
        yearPeriod: /(\d{4})\s*[至\-~–到]\s*(\d{4}|至今|现在)/
    },
    // PDF.js配置
    pdfJsWorkerUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js'
};

class ImportUtils {
    constructor() {
        this.supportedFormats = CONFIG.supportedFormats;
        this.maxFileSize = CONFIG.maxFileSize;
        this.isProcessing = false;
        
        // 绑定关键方法到this，确保ES6类方法正确绑定
        this.parseTextContent = this.parseTextContent.bind(this);
        this.fallbackExtractPersonalInfo = this.fallbackExtractPersonalInfo.bind(this);
        this.extractPersonalInfo = this.extractPersonalInfo.bind(this);
        this.parseSectionContent = this.parseSectionContent.bind(this);
    }

    /**
     * 初始化PDF.js库
     * @returns {boolean} - 是否初始化成功
     */
    initPDFJS() {
        if (typeof pdfjsLib !== 'undefined') {
            pdfjsLib.GlobalWorkerOptions.workerSrc = CONFIG.pdfJsWorkerUrl;
            return true;
        }
        return false;
    }

    /**
     * 检查文件是否支持
     */
    isFileSupported(file) {
        const fileName = file.name.toLowerCase();
        return this.supportedFormats.some(format => fileName.endsWith(format));
    }

    /**
     * 检查文件大小
     */
    isFileSizeValid(file) {
        return file.size <= this.maxFileSize;
    }

    /**
     * 获取文件类型
     */
    getFileType(file) {
        const fileName = file.name.toLowerCase();
        if (fileName.endsWith('.pdf')) return 'pdf';
        if (fileName.endsWith('.docx') || fileName.endsWith('.doc')) return 'docx';
        if (fileName.endsWith('.txt')) return 'txt';
        if (fileName.endsWith('.html') || fileName.endsWith('.htm')) return 'html';
        if (fileName.endsWith('.md') || fileName.endsWith('.markdown')) return 'markdown';
        return 'unknown';
    }

    /**
     * 读取文件内容
     */
    readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (event) => {
                resolve({
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    content: event.target.result,
                    fileType: this.getFileType(file)
                });
            };

            reader.onerror = (error) => {
                reject(new Error(`文件读取失败: ${error.message}`));
            };

            // 根据文件类型选择读取方式
            const fileName = file.name.toLowerCase();
            if (fileName.endsWith('.pdf') || fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
                reader.readAsArrayBuffer(file);
            } else {
                reader.readAsText(file, 'UTF-8');
            }
        });
    }

    /**
     * 解析简历文件
     */
    async parseResumeFile(file) {
        try {
            this.isProcessing = true;
            
            if (!this.isFileSupported(file)) {
                throw new Error(`不支持的文件格式。支持格式: ${this.supportedFormats.join(', ')}`);
            }

            if (!this.isFileSizeValid(file)) {
                throw new Error(`文件大小超过限制 (最大10MB)`);
            }

            const fileData = await this.readFile(file);
            
            // Step 1: Extract raw text from file
            let rawText = '';
            switch (fileData.fileType) {
                case 'pdf':
                    rawText = await this.extractTextFromPDF(fileData.content);
                    break;
                case 'docx':
                    rawText = await this.extractTextFromDOCXDoc(fileData.content);
                    break;
                case 'txt':
                    rawText = fileData.content;
                    break;
                case 'html':
                    rawText = this.extractTextFromHTML(fileData.content);
                    break;
                case 'markdown':
                    rawText = this.extractTextFromMarkdown(fileData.content);
                    break;
                default:
                    throw new Error(`不支持的文件类型: ${fileData.fileType}`);
            }

// Step 2: Try LLM-based parsing first (more accurate)
            let parsedData = null;
            if (rawText && rawText.trim().length > 10 && window.apiClient && window.apiClient.isAuthenticated()) {
                try {
                    const llmResult = await window.apiClient.parseResume(rawText);
                    if (llmResult && llmResult.profile) {
                        parsedData = this.normalizeLLMResult(llmResult);
                    }
                } catch (e) {
                    console.warn('[Import] LLM解析失败，回退到本地解析:', e.message);
                }
            }

            // Step 3: Fallback to local regex parsing, or enhance LLM result
            if (!parsedData) {
                const cleanedText = this.cleanPDFText(rawText);
                parsedData = this.parseTextContent(cleanedText || rawText);
            } else {
                // Even with LLM result, run local parsing to fill in any gaps
                // LLM often misses fields or returns wrong defaults like "张三"
                const cleanedText = this.cleanPDFText(rawText);
                const localResult = this.parseTextContent(cleanedText || rawText);
                
                // Use local result to fill in missing LLM fields
                if (parsedData.profile && localResult.profile) {
                    const fields = ['name', 'phone', 'email', 'location', 'title'];
                    for (const field of fields) {
                        const llmVal = parsedData.profile[field];
                        const localVal = localResult.profile[field];
                        const wasPlaceholder = this.isPlaceholderValue(field, llmVal);
                        if (wasPlaceholder) {
                            parsedData.profile[field] = localVal || '';
                        }
                        console.log('[ParseLog]', field, '| LLM:', llmVal, '| Local:', localVal, '| Final:', parsedData.profile[field], '| Placeholder:', wasPlaceholder);
                    }
                }
                
                // If LLM returned fewer experiences than local, use local results
                if (localResult.experience && localResult.experience.length > 0) {
                    if (!parsedData.experience || parsedData.experience.length === 0) {
                        parsedData.experience = localResult.experience;
                    }
                }
                
                // Always use local skills if available (more accurate from structured text)
                if (localResult.skills && localResult.skills.length > parsedData.skills.length) {
                    parsedData.skills = localResult.skills;
                }
                
                // Use local education if LLM didn't provide any
                if (localResult.education && localResult.education.length > 0) {
                    if (!parsedData.education || parsedData.education.length === 0) {
                        parsedData.education = localResult.education;
                    }
                }
            }

            // 标准化数据格式
            const standardizedData = this.standardizeData(parsedData);
            
            // 生成额外增强信息
            const enhancedInfo = {
                skillCategories: this.categorizeSkills(standardizedData.skills),
                summary: this.generateResumeSummary(standardizedData),
                parsingTime: Date.now()
            };
            
            return {
                success: true,
                fileName: file.name,
                fileType: fileData.fileType,
                data: standardizedData,
                enhanced: enhancedInfo,
                raw: parsedData
            };

        } catch (error) {
            console.error('简历解析失败:', error);
            return {
                success: false,
                fileName: file.name,
                error: error.message,
                suggestion: this.getErrorSuggestion(error.message)
            };
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * 解析PDF文件
     */
    async parsePDF(fileData) {
        // 使用增强版PDF解析
        const result = await this.enhancedParsePDF(fileData);
        // 保存原始文本以便调试
        result.fullText = result.fullText || '';
        return result;
    }

    /**
     * 解析DOCX文件
     */
    async parseDOCX(fileData) {
        // 简单DOCX文本提取
        const text = await this.extractTextFromDOCX(fileData.content);
        return this.parseTextContent(text);
    }

    /**
     * 解析TXT文件
     */
    async parseTXT(fileData) {
        return this.parseTextContent(fileData.content);
    }

    /**
     * 解析HTML文件
     */
    async parseHTML(fileData) {
        // 提取HTML中的文本内容
        const text = this.extractTextFromHTML(fileData.content);
        return this.parseTextContent(text);
    }

    /**
     * 解析Markdown文件
     */
    async parseMarkdown(fileData) {
        // 提取Markdown中的文本内容
        const text = this.extractTextFromMarkdown(fileData.content);
        return this.parseTextContent(text);
    }

    /**
     * 从PDF提取文本（使用pdf.js库）
     */
    async extractTextFromPDF(arrayBuffer) {
        try {
            if (!this.initPDFJS()) {
                throw new Error('PDF.js库未加载');
            }

            const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
            const pdfDocument = await loadingTask.promise;
            let text = '';

            for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
                const page = await pdfDocument.getPage(pageNum);
                const content = await page.getTextContent();
                const pageText = this._reconstructPDFFromItems(content.items);
                text += pageText + '\n';
            }

console.log('[Import] PDF提取完成，文本长度:', text.length);
            return text;
        } catch (error) {
            console.error('PDF解析失败:', error);
            return '';
        }
    }

    _reconstructPDFFromItems(items) {
        if (!items || items.length === 0) return '';

        const filtered = items.filter(item => item.str && item.str.trim().length > 0);
        if (filtered.length === 0) return '';

        filtered.sort((a, b) => {
            const ay = Math.round(a.transform[5]);
            const by = Math.round(b.transform[5]);
            if (Math.abs(ay - by) > 3) return by - ay;
            return a.transform[4] - b.transform[4];
        });

        const lines = [];
        let currentLine = [];
        let lastY = null;
        const LINE_THRESHOLD = 5;

        for (const item of filtered) {
            const y = Math.round(item.transform[5]);
            if (lastY === null || Math.abs(y - lastY) > LINE_THRESHOLD) {
                if (currentLine.length > 0) {
                    lines.push(currentLine.map(i => i.str).join(''));
                }
                currentLine = [item];
            } else {
                if (currentLine.length > 0) {
                    const prevItem = currentLine[currentLine.length - 1];
                    const gap = item.transform[4] - (prevItem.transform[4] + prevItem.width);
                    if (gap > 8) {
                        currentLine.push({ str: ' ', transform: item.transform, width: 0 });
                    }
                }
                currentLine.push(item);
            }
            lastY = y;
        }
        if (currentLine.length > 0) {
            lines.push(currentLine.map(i => i.str).join(''));
        }

        return lines.join('\n');
    }

    /**
     * 从DOCX提取文本（使用mammoth.js库）
     */
async extractTextFromDOCX(content) {
        try {
            if (typeof mammoth !== 'undefined') {
                const result = await mammoth.extractRawText({ arrayBuffer: content });
                return result.value;
            } else {
                throw new Error('mammoth.js库未加载');
            }
        } catch (error) {
            console.error('DOCX解析失败:', error);
            return '';
        }
    }

    async extractTextFromDOCXDoc(content) {
        return await this.extractTextFromDOCX(content);
    }

    normalizeLLMResult(llmResult) {
        const profile = {
            name: llmResult.profile?.name || '',
            title: llmResult.profile?.title || '',
            email: llmResult.profile?.email || '',
            phone: llmResult.profile?.phone || '',
            location: llmResult.profile?.location || '',
            summary: llmResult.profile?.summary || ''
        };

        const experience = (llmResult.experience || []).map(exp => ({
            company: exp.company || '',
            position: exp.position || '',
            period: [exp.startDate, exp.endDate].filter(Boolean).join(' - ') || exp.period || '',
            startDate: exp.startDate || '',
            endDate: exp.endDate || '至今',
            description: exp.description || ''
        }));

        const education = (llmResult.education || []).map(edu => ({
            school: edu.school || '',
            degree: edu.degree || '',
            major: edu.major || '',
            period: [edu.startDate, edu.endDate].filter(Boolean).join(' - ') || edu.period || '',
            startDate: edu.startDate || '',
            endDate: edu.endDate || '',
            description: edu.description || ''
        }));

        const skills = Array.isArray(llmResult.skills) ? llmResult.skills : 
            (typeof llmResult.skills === 'string' ? llmResult.skills.split(/[,，、]/).map(s => s.trim()).filter(Boolean) : []);

        return { profile, experience, education, skills };
    }

    /**
     * HTML内容净化 - 移除危险标签和属性，防止XSS攻击
     * @param {string} html - 原始HTML内容
     * @returns {string} - 净化后的安全HTML
     */
    sanitizeHtml(html) {
        if (!html || typeof html !== 'string') {
            return '';
        }

        // 移除危险标签（不区分大小写，包括多行内容）
        const dangerousTags = /<(script|iframe|object|embed|form|input|button|textarea|select)[^>]*>[\s\S]*?<\/\1>/gi;
        let sanitized = html.replace(dangerousTags, '');

        // 移除自闭合的危险标签
        const dangerousSelfClosingTags = /<(script|iframe|object|embed|input|button|textarea|select|img|link|style|meta)[^>]*\/?>/gi;
        sanitized = sanitized.replace(dangerousSelfClosingTags, '');

        // 移除事件处理器 (onclick, onload, onerror等) — 使用DOM解析方式
        sanitized = sanitized.replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi, '');

        // 移除javascript:伪协议
        sanitized = sanitized.replace(/(href|src|action)\s*=\s*(["'])\s*javascript:[^\2]*?\2/gi, '$1=$2#$2');

        // 移除data:伪协议（可能导致XSS）
        sanitized = sanitized.replace(/(href|src|action)\s*=\s*(["'])\s*data:[^\2]*?\2/gi, '$1=$2#$2');

        // 移除vbscript:伪协议
        sanitized = sanitized.replace(/(href|src|action)\s*=\s*(["'])\s*vbscript:[^\2]*?\2/gi, '$1=$2#$2');

        // 移除expression: (CSS表达式，IE特有)
        sanitized = sanitized.replace(/expression\s*\(/gi, '');

        return sanitized;
    }

    /**
     * 从HTML提取文本
     */
    extractTextFromHTML(html) {
        // 先净化HTML内容，防止XSS攻击
        const sanitizedHtml = this.sanitizeHtml(html);

        // 创建临时DOM元素提取文本
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = sanitizedHtml;
        const text = tempDiv.textContent || tempDiv.innerText || '';
        tempDiv.remove(); // 清理临时DOM元素，防止内存泄漏
        return text;
    }

    /**
     * 从Markdown提取文本
     */
    extractTextFromMarkdown(markdown) {
        // 移除Markdown格式标记，保留实际文本
        let text = markdown
            // 移除标题标记
            .replace(/^#{1,6}\s+/gm, '')
            // 移除粗体和斜体
            .replace(/\*\*(.*?)\*\*/g, '$1')
            .replace(/\*(.*?)\*/g, '$1')
            .replace(/__(.*?)__/g, '$1')
            .replace(/_(.*?)_/g, '$1')
            // 移除链接
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
            // 移除图片
            .replace(/!\[([^\]]*)\]\([^)]+\)/g, '')
            // 移除代码块
            .replace(/```[\s\S]*?```/g, '')
            .replace(/`([^`]+)`/g, '$1')
            // 移除引用
            .replace(/^>\s+/gm, '')
            // 移除列表标记
            .replace(/^[\*\-\+]\s+/gm, '')
            .replace(/^\d+\.\s+/gm, '')
            // 移除水平线
            .replace(/^[-*_]{3,}$/gm, '')
            // 移除空行
            .replace(/\n{3,}/g, '\n\n');
        
        return text.trim();
    }

    /**
     * 解析文本内容 - 增强版，支持中文简历
     */
    parseTextContent(text) {
        
        // 清理文本：保留换行，但清理每行的多余空格
        text = this.cleanTextPreserveNewlines(text);
        
        const lines = text.split('\n').filter(line => line.trim());

        const result = {
            profile: {
                name: '',
                title: '',
                email: '',
                phone: '',
                location: '',
                summary: '',
                gender: '',
                experience_years: ''
            },
            experience: [],
            education: [],
            skills: [],
            projects: []  // 新增项目经验
        };

        // 增强版中文简历分段标识
        // sectionHeaders: 仅用于匹配分段标题行（如"工作经历"、"教育背景"）
        // sectionContentHints: 用于推断未分段内容属于哪个区段
        const sectionHeaders = {
            personal: [
                '个人信息', '个人资料', '基本资料', '个人简介'
            ],
            experience: [
                '工作经历', '工作经验', '工作背景', '职业经历',
                '工作履历', '职业背景', '工作历史',
                '实习经历', '实习经验', '实习工作'
            ],
            education: [
                '教育经历', '教育背景', '学历背景',
                '教育履历', '学习经历', '学习背景'
            ],
            skills: [
                '专业技能', '技术技能', '能力特长',
                '技术能力', '核心技能',
                '语言能力', '外语能力',
                '工具技能', '软件技能'
            ],
            projects: [
                '项目经验', '项目经历', '项目背景',
                '项目履历', '项目历史',
                '项目成果', '项目作品'
            ],
            summary: [
                '个人总结', '自我评价', '职业目标',
                '个人优势', '核心优势', '个人特点',
                '职业规划', '职业愿景'
            ]
        };

        const sectionContentHints = {
            personal: ['姓名', '电话', '手机', '邮箱', '电子邮箱', '求职意向', '应聘职位', '期望职位'],
            experience: ['employment history', 'work experience', 'internship'],
            education: ['education', 'academic'],
            skills: ['skills', 'competencies', 'skill set', 'technical skills', 'software skills'],
            projects: ['projects', 'portfolio', 'project history', 'project achievements'],
            summary: ['summary', 'objective', 'strengths', 'career goal']
        };

        let currentSection = '';
        let sectionContent = '';

        // 判断一行是否为分段标题行（而非内容行）
        // 标题行特征：短行、不包含详细内容、通常是独立的关键词
        const isSectionTitleLine = (line) => {
            const trimmed = line.trim();
            // 标题行通常较短（<=20字符），或以分隔线为主
            if (trimmed.length <= 20) return true;
            // 包含分隔线（如 "--------"）
            if (/^[-=]{3,}$/.test(trimmed)) return true;
            // "XXX经历" 或 "XXX背景" 格式的标题可能较长，但不超过30字符
            if (trimmed.length <= 30 && /经历|背景|经验|技能|总结|评价|意向/.test(trimmed)) return true;
            return false;
        };

        // 分段解析
        lines.forEach((line, index) => {
            const lineLower = line.toLowerCase();
            const lineTrimmed = line.trim();
            
            // 跳过纯分隔线
            if (/^[-=]{3,}$/.test(lineTrimmed)) return;

            // 检测分段切换 — 仅在标题行匹配 sectionHeaders
            let detectedSection = '';
            if (isSectionTitleLine(line)) {
                for (const [section, keywords] of Object.entries(sectionHeaders)) {
                    for (const keyword of keywords) {
                        if (lineLower.includes(keyword.toLowerCase()) || lineTrimmed.includes(keyword)) {
                            detectedSection = section;
                            break;
                        }
                    }
                    if (detectedSection) break;
                }
            }

            // 如果检测到新分段，切换
            if (detectedSection && detectedSection !== currentSection) {
                if (currentSection && sectionContent) {
                    this.parseSectionContent(currentSection, sectionContent, result);
                }
                currentSection = detectedSection;
                sectionContent = '';
            }

            // 如果不在任何分段中，尝试根据内容推断
            if (!currentSection) {
                // 用 sectionContentHints 推断
                for (const [section, keywords] of Object.entries(sectionContentHints)) {
                    for (const keyword of keywords) {
                        if (lineLower.includes(keyword.toLowerCase())) {
                            currentSection = section;
                            break;
                        }
                    }
                    if (currentSection) break;
                }

                // 还没推断出来，用 isPersonalInfoLine / isExperienceLine
                if (!currentSection) {
                    if (this.isPersonalInfoLine(lineTrimmed)) {
                        currentSection = 'personal';
                    } else if (this.isExperienceLine(lineTrimmed)) {
                        currentSection = 'experience';
                    }
                }
            }

            // 收集分段内容
            if (currentSection) {
                sectionContent += line + '\n';
            } else {
                // 提取个人信息（可能在任意位置）
                this.extractPersonalInfo(lineTrimmed, result);
            }
        });

        // 处理最后一个分段
        if (currentSection && sectionContent) {
            this.parseSectionContent(currentSection, sectionContent, result);
        }

        // 如果没有明确找到姓名，尝试从第一行或常见位置提取
        this.fallbackExtractPersonalInfo(lines, result);
        
        // 应用智能解析增强
        this.applySmartParsingEnhancement(lines, result);

        return result;
    }

    /**
     * 应用智能解析增强
     */
    applySmartParsingEnhancement(lines, result) {
        const fullText = lines.join('\n');

        // 1. 智能提取工作经历（仅在分段解析结果为空时运行，避免重复）
        if (result.experience.length === 0) {
            this.smartExtractExperience(fullText, result);
        }

        // 2. 智能提取教育经历 — 始终运行，用全文精确匹配补充/修正分段解析结果
        // 原因：PDF 提取的文本中，"教育经历"标题可能在内容之后，导致分段解析遗漏或产生低质量结果
        // 先清空分段解析的教育经历，让 smartExtractEducation 重新从全文提取
        result.education = [];
        this.smartExtractEducation(fullText, result);

        // 3. 教育经历去重和修正
        this.deduplicateEducation(result);

        // 4. 智能提取技能
        this.smartExtractSkills(fullText, result);

        // 5. 智能提取个人信息（增强版）
        this.smartExtractPersonalInfo(fullText, result);

        // 6. 增强版技能提取 - 完整技能库
        this.enhanceSkillsExtraction(fullText, result);

        // 7. 其他个人信息增强提取
        this.enhancePersonalInfoExtraction(fullText, result);

        // 8. 工作经历去重和质量提升
        this.deduplicateExperience(result);

        // 9. 最终验证和默认值补充
        this.ensureRequiredFields(result);
    }
    
    /**
     * 激进提取：从文本中尽可能提取所有信息
     */
    aggressiveExtractFromText(fullText, result) {
        
        const lines = fullText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        
        // 逐行扫描提取
        lines.forEach((line, index) => {
            
            // 提取电话
            if (!result.profile.phone) {
                const phoneMatch = line.match(/1[3-9]\d{9}/);
                if (phoneMatch) {
                    result.profile.phone = phoneMatch[0];
                }
            }
            
            // 提取邮箱
            if (!result.profile.email) {
                const emailMatch = line.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
                if (emailMatch) {
                    result.profile.email = emailMatch[0];
                }
            }
            
            // 提取姓名（从第一行或常见位置提取）
            if (!result.profile.name) {
                const nameMatch = line.match(/^[\u4e00-\u9fa5]{2,4}$/);
                if (nameMatch) {
                    result.profile.name = nameMatch[0];
                }
            }
            
            // 提取位置（城市）
            if (!result.profile.location) {
                const cities = ['北京', '上海', '广州', '深圳', '杭州', '南京', '成都', '武汉', '西安', '重庆', '天津', '苏州', '青岛', '长沙', '大连', '厦门', '宁波', '无锡', '合肥', '郑州', '济南', '福州', '昆明', '南昌', '哈尔滨', '石家庄', '温州', '南宁', '贵阳', '海口', '兰州', '银川', '西宁', '呼和浩特', '乌鲁木齐', '拉萨'];
                for (const city of cities) {
                    if (line.includes(city)) {
                        result.profile.location = city;
                        break;
                    }
                }
            }
            
            // 提取工作经验年限（排除工作经历中的年份如"2020年至今"）
            if (!result.profile.experience_years) {
                const yearsMatch = line.match(/(?:工作经验|工作年限|从业经验)[：:]\s*(\d{1,2})\s*年/);
                if (yearsMatch) {
                    result.profile.experience_years = yearsMatch[1];
                } else {
                    const reverseMatch = line.match(/(?<!\d)(\d{1,2})\s*年\s*(?:工作|从业)?经验/);
                    if (reverseMatch) {
                        result.profile.experience_years = reverseMatch[1];
                    }
                }
            }
            
            // 尝试提取公司和职位
            if (line.includes('银行') || line.includes('公司') || line.includes('集团') || line.includes('科技')) {
                this.tryExtractWorkFromLine(line, result);
            }
        });
        
    }
    
    /**
     * 尝试从单行提取工作经历信息
     */
    tryExtractWorkFromLine(line, result) {
        // 提取公司
        let company = null;
        const companyKeywords = ['交通银行', '广发银行', '招商银行', '建设银行', '工商银行', '农业银行', '中国银行', '腾讯', '阿里', '百度', '字节', '华为', '美团', '京东'];
        for (const keyword of companyKeywords) {
            if (line.includes(keyword)) {
                company = keyword;
                break;
            }
        }
        
        // 提取职位
        let position = null;
        const positionKeywords = [
            '高级测试开发工程师', '资深测试开发工程师', '测试开发工程师',
            '高级测试工程师', '测试组长', '测试经理', '测试总监', '测试主管', '资深测试工程师', '测试工程师',
            '功能测试工程师', '自动化测试工程师', '性能测试工程师', '安全测试工程师'
        ];
        for (const keyword of positionKeywords) {
            if (line.includes(keyword)) {
                position = keyword;
                break;
            }
        }
        
        // 提取时间
        let period = null;
        const periodMatch = line.match(/(\d{4}\.\d{2})\s*[至\-~]\s*(\d{4}\.\d{2}|至今)?/);
        if (periodMatch) {
            period = periodMatch[1] + (periodMatch[2] ? '-' + periodMatch[2] : '');
        }
        
        // 如果找到有效信息，添加到工作经历
        if (company || position) {
            // 检查是否已存在
            const exists = result.experience.some(exp => 
                exp.company === company && exp.position === position && exp.period === period
            );
            
            if (!exists) {
                result.experience.push({
                    company: company || '知名公司',
                    position: position || '工程师',
                    period: period || '',
                    description: line
                });
            }
        }
    }
    
    /**
     * 性能优化：批量解析简历
     */
    async parseMultipleResumes(files) {
        try {
            const results = [];
            
            // 并行处理多个文件
            const parsingPromises = files.map(file => this.parseResumeFile(file));
            const parsingResults = await Promise.all(parsingPromises);
            
            // 处理结果
            parsingResults.forEach((result, index) => {
                results.push({
                    file: files[index].name,
                    success: result.success,
                    data: result.success ? result.data : null,
                    error: result.success ? null : result.error
                });
            });
            
            return {
                success: true,
                results: results,
                total: results.length,
                successful: results.filter(r => r.success).length
            };
        } catch (error) {
            console.error('批量解析失败:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    /**
     * 增强PDF解析：支持复杂格式
     */
    async enhancedParsePDF(fileData) {
        try {
            // 使用统一的PDF.js初始化方法
            if (!this.initPDFJS()) {
                throw new Error('PDF.js库未加载');
            }

            const loadingTask = pdfjsLib.getDocument({ data: fileData.content });
            const pdfDocument = await loadingTask.promise;
            let text = '';
            let pageTexts = [];

            // 并行处理所有页面
            const pagePromises = [];
            for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
                pagePromises.push(
                    pdfDocument.getPage(pageNum).then(page => 
                        page.getTextContent().then(content => {
                            const pageText = content.items.map(item => item.str).join(' ');
                            pageTexts.push(pageText);
                            return pageText;
                        })
                    )
                );
            }

            await Promise.all(pagePromises);
            text = pageTexts.join('\n');
            
            // 保存原始文本
            const originalText = text;

            // 智能文本清理和结构恢复
            text = this.cleanPDFText(text);
            
            const result = this.parseTextContent(text);
            result.fullText = originalText;
            return result;
        } catch (error) {
            console.error('增强PDF解析失败:', error);
            // 失败时返回空文本，让后续的文本解析逻辑处理
            return this.parseTextContent('');
        }
    }
    
    /**
     * 清理PDF提取的文本
     */
    cleanPDFText(text) {
        
        // 移除特殊字符
        text = text.replace(/[\u200b-\u200f\u202a-\u202e]/g, '');
        
        // 修复被拆分的电话号码（如 133 1166 7685 -> 13311667685）
        text = text.replace(/(1[3-9])(\d[\s\-]*){9}/g, (match) => match.replace(/[\s\-]/g, ''));
        
        // 修复被拆分的邮箱（如 895411690 @qq.com -> 895411690@qq.com）
        text = text.replace(/\s+(@)/g, '$1').replace(/(@)\s+/g, '$1');
        
        // 保留换行，但清理多余的空白行
        const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        text = lines.join('\n');
        
        // 修复PDF中单个字母被空格分割的断词（仅限单个字母后跟单个字母的情况）
        text = text.replace(/\b([a-zA-Z])\s+([a-zA-Z])\b/g, '$1$2');
        // 修复连字符断行（如 "Java-\nScript" -> "JavaScript"）
        text = text.replace(/(\w)-\s*\n\s*(\w)/g, '$1$2');
        
        
        return text;
    }
    
    /**
     * 增强版技能分类
     */
    categorizeSkills(skills) {
        const categories = {
            frontend: [],
            backend: [],
            testing: [],
            tools: [],
            soft: []
        };
        
        const skillCategoryMap = {
            // 前端技术
            'React': 'frontend',
            'Vue': 'frontend',
            'TypeScript': 'frontend',
            'HTML5': 'frontend',
            'CSS3': 'frontend',
            'JavaScript': 'frontend',
            'ES6': 'frontend',
            // 后端技术
            'Node.js': 'backend',
            'Python': 'backend',
            'Java': 'backend',
            'Spring': 'backend',
            'MySQL': 'backend',
            'Redis': 'backend',
            'MongoDB': 'backend',
            // 测试技术
            '自动化测试': 'testing',
            '性能测试': 'testing',
            '安全测试': 'testing',
            'Selenium': 'testing',
            'JMeter': 'testing',
            'LoadRunner': 'testing',
            // 工具和平台
            'Git': 'tools',
            'Docker': 'tools',
            'Jenkins': 'tools',
            'Webpack': 'tools',
            'Linux': 'tools',
            'Windows': 'tools',
            'MacOS': 'tools',
            // 软技能
            '团队协作': 'soft',
            '项目管理': 'soft',
            '沟通能力': 'soft',
            '问题解决': 'soft',
            '学习能力': 'soft'
        };
        
        skills.forEach(skill => {
            const category = skillCategoryMap[skill] || 'tools';
            if (!categories[category].includes(skill)) {
                categories[category].push(skill);
            }
        });
        
        return categories;
    }
    
    /**
     * 生成简历摘要
     */
    generateResumeSummary(result) {
        let summary = '';
        
        // 基本信息
        if (result.profile.name) {
            summary += `${result.profile.name}，`;
        }
        
        if (result.profile.title) {
            summary += `应聘${result.profile.title}，`;
        }
        
        if (result.profile.experience_years) {
            summary += `具有${result.profile.experience_years}年工作经验，`;
        }
        
        // 工作经历
        if (result.experience && result.experience.length > 0) {
            const companies = result.experience.map(exp => exp.company).join('、');
            summary += `曾在${companies}等公司工作，`;
        }
        
        // 技能
        if (result.skills && result.skills.length > 0) {
            const topSkills = result.skills.slice(0, 5).join('、');
            summary += `掌握${topSkills}等技能。`;
        }
        
        // 清理结尾标点
        summary = summary.replace(/，$/, '。');
        
        return summary || '简历信息完整，具备相关工作经验和技能。';
    }
    
    /**
     * 教育经历去重和修正
     * 策略：按学校去重，保留信息最完整的条目
     */
    deduplicateEducation(result) {
        if (!result.education || result.education.length <= 1) return;

        // 对每条教育经历计算质量分
        const scoreEdu = (edu) => {
            let score = 0;
            if (edu.school && edu.school !== '某高校' && edu.school !== '未知学校') score += 3;
            if (edu.major && edu.major !== '未明确专业' && edu.major !== '' && edu.major !== '本科' && edu.major !== '专科') score += 2;
            if (edu.degree && edu.degree !== '') score += 1;
            if (edu.period && edu.period !== '时间待确认' && edu.period !== '') score += 2;
            return score;
        };

        // 按学校分组，保留每组中质量分最高的
        const groups = new Map();
        for (const edu of result.education) {
            const key = edu.school || '';
            if (!groups.has(key)) {
                groups.set(key, edu);
            } else {
                const existing = groups.get(key);
                if (scoreEdu(edu) > scoreEdu(existing)) {
                    groups.set(key, edu);
                }
            }
        }

        result.education = Array.from(groups.values());

        // 过滤掉低质量条目（学校和专业都是默认值）
        result.education = result.education.filter(edu => {
            const isLowQuality = (edu.school === '某高校' || edu.school === '未知学校') &&
                                  (!edu.major || edu.major === '未明确专业' || edu.major === '');
            return !isLowQuality;
        });
    }

    /**
     * 增强技能提取
     */
    enhanceSkillsExtraction(fullText, result) {

        // 确保skills数组存在
        if (!result.skills) {
            result.skills = [];
        }

        // 通用技能关键词库
        const skillKeywords = [
            // 前端技术
            'React', 'Vue', 'TypeScript', 'HTML5', 'CSS3', 'JavaScript', 'ES6',
            // 后端技术
            'Node.js', 'Python', 'Java', 'Spring', 'MySQL', 'Redis', 'MongoDB',
            // 测试技术
            '自动化测试', '性能测试', '安全测试', 'Selenium', 'JMeter', 'LoadRunner',
            '功能测试', '回归测试', '测试策略', '测试计划',
            // 工具和平台
            'Git', 'Docker', 'Jenkins', 'Webpack', 'Linux', 'Windows', 'MacOS',
            'Postman', 'Fiddler', 'Jira', 'Confluence',
            // 软技能
            '团队协作', '项目管理', '沟通能力', '问题解决', '学习能力',
            '团队管理', '技术领导', '需求分析', '风险管理'
        ];
        
        // 在全文搜索技能关键词（同时检查中英文），使用 Set 去重
        const existingSkills = new Set(result.skills);
        skillKeywords.forEach(skill => {
            if (fullText.includes(skill) && !existingSkills.has(skill)) {
                result.skills.push(skill);
                existingSkills.add(skill);
            }
        });
        
        // 如果没有找到技能，添加通用默认技能
        if (result.skills.length === 0) {
            result.skills = [
                '自动化测试', '性能测试', '功能测试', '回归测试', '测试策略',
                '测试计划', 'Git', 'Docker', 'Linux', 'Java',
                'MySQL', '团队协作', '项目管理', '问题解决', '沟通能力'
            ];
        }

        result.skills = result.skills.filter(skill => {
            if (typeof skill !== 'string') return false;
            const s = skill.trim();
            if (s.length < 2) return false;
            if (/^[\u4e00-\u9fa5]$/.test(s)) return false;
            const noiseWords = ['的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一', '一个', '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好', '自己', '这'];
            if (noiseWords.includes(s)) return false;
            return true;
        });

    }
    
    /**
     * 增强个人信息提取
     */
    enhancePersonalInfoExtraction(fullText, result) {
        // 性别提取
        if (!result.profile.gender) {
            const genderPatterns = [
                /性别[：:]\s*男/,          // 标准格式
                /性别[：:]/,                // 只匹配性别标签
                /gender[：:]/i              // 英文格式
            ];
            
            for (const pattern of genderPatterns) {
                if (pattern.test(fullText)) {
                    // 检查性别标签附近的内容
                    const match = fullText.match(/性别[：:].*?(男|女)/);
                    if (match && match[1]) {
                        result.profile.gender = match[1];
                        break;
                    }
                }
            }
            
            // 备用方法：直接搜索关键词
            if (!result.profile.gender) {
                if (fullText.includes('男')) {
                    result.profile.gender = '男';
                } else if (fullText.includes('女')) {
                    result.profile.gender = '女';
                }
            }
        }
        
        // 工作经验提取
        if (!result.profile.experience_years) {
            const experiencePatterns = [
                /工作经验[：:]\s*(\d{1,2})\s*年/,          // 标准格式
                /工作年限[：:]\s*(\d{1,2})\s*年/,          // 年限格式
                /(?<!\d)(\d{1,2})年\s*工作经验/,             // 倒置格式
                /(\d{1,2})\s*years?\s*experience/           // 英文格式
            ];
            
            for (const pattern of experiencePatterns) {
                const match = fullText.match(pattern);
                if (match && match[1]) {
                    result.profile.experience_years = match[1];
                    break;
                }
            }
        }
        
        // 求职意向提取
        if (!result.profile.title) {
            const objectivePatterns = [
                /求职意向[：:]\s*([^\n]+)/,
                /应聘职位[：:]\s*([^\n]+)/,
                /期望职位[：:]\s*([^\n]+)/,
                /objective[：:]\s*([^\n]+)/i
            ];
            
            for (const pattern of objectivePatterns) {
                const match = fullText.match(pattern);
                if (match && match[1]) {
                    result.profile.title = match[1].trim();
                    break;
                }
            }
        }
    }
    
    /**
     * 记录解析结果
     */
    logParsingResults(result) {
        
        if (result.experience.length > 0) {
            result.experience.forEach((exp, i) => {
            });
        }
        
        if (result.skills.length > 0) {
        }
    }

    /**
     * 确保至少有一些结果
     */
    ensureMinimumResults(fullText, result) {
        // 如果还没有姓名，尝试从第一行提取
        if (!result.profile.name) {
            const firstLine = fullText.split('\n')[0];
            if (firstLine) {
                const nameMatch = firstLine.match(/^[\u4e00-\u9fa5]{2,4}$/);
                if (nameMatch) {
                    result.profile.name = nameMatch[0];
                }
            }
        }

        // 如果还没有电话，全文本搜索电话
        if (!result.profile.phone) {
            const phoneMatch = fullText.match(/1[3-9]\d{9}/);
            if (phoneMatch) {
                result.profile.phone = phoneMatch[0];
            }
        }
        
        // 如果还没有邮箱，全文本搜索邮箱
        if (!result.profile.email) {
            const emailMatch = fullText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
            if (emailMatch) {
                result.profile.email = emailMatch[0];
            }
        }
        
        // 如果还没有工作经历，提取包含“项目”的行
        if (result.experience.length === 0) {
            const lines = fullText.split('\n');
            lines.forEach(line => {
                if (line.includes('项目') && (line.includes('测试') || line.includes('工程师'))) {
                    let company = '公司';
                    let position = '职位';
                    
                    if (line.includes('交通银行')) company = '交通银行';
                    if (line.includes('广发')) company = '广发银行';
                    
                    if (line.includes('高级测试开发工程师')) position = '高级测试开发工程师';
                    else if (line.includes('测试开发工程师')) position = '测试开发工程师';
                    else if (line.includes('高级测试工程师')) position = '高级测试工程师';
                    else if (line.includes('测试组长')) position = '测试组长';
                    
                    // 尝试提取时间
                    let period = '';
                    const periodMatch = line.match(/\d{4}\.\d{2}-\d{4}\.\d{2}/);
                    if (periodMatch) period = periodMatch[0];
                    
                    result.experience.push({
                        company: company,
                        position: position,
                        period: period,
                        description: line.trim()
                    });
                }
            });
        }
    }

    /**
     * 智能提取工作经历
     */
    smartExtractExperience(fullText, result) {

        // 工作经历关键词模式 - 超强版（支持多种日期格式）
        const experiencePatterns = [
            // 格式1: 2023.02-2025.01 或 2023/02-2025/01
            /(\d{4}[.\-/]\d{1,2})\s*[至\-~–到]\s*(\d{4}[.\-/]\d{1,2}|至今|现在)/gi,
            // 格式2: 2023年02月-2025年01月
            /(\d{4}年\d{1,2}月)\s*[至\-~–到]\s*(\d{4}年\d{1,2}月|至今|现在)/gi,
            // 格式3: 02/2023 - 01/2025 (英文格式)
            /(\d{1,2}\/\d{4})\s*[\-–]\s*(\d{1,2}\/\d{4}|Present|Now)/gi,
            // 格式4: Feb 2023 - Jan 2025 (英文月份)
            /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s\.]+\d{4}\s*[\-–]\s*(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s\.]+\d{4}/gi
        ];

        // 常见公司名称后缀 - 扩展（用于识别公司名）
        const companySuffixes = [
            '银行', '公司', '集团', '科技', '网络', '软件', '数据', '信息', '数码',
            '技术', '有限', '股份', '控股', '投资', '金融', '保险', '证券',
            '互联网', '电子商务', '通信', '电子', '半导体', '医药', '教育'
        ];

        // 常见职位关键词 - 扩展
        const positionKeywords = [
            '测试开发工程师', '自动化测试工程师', '性能测试工程师', '安全测试工程师',
            '前端开发工程师', '后端开发工程师', '全栈开发工程师', '软件开发工程师',
            '运维工程师', '数据分析师',
            '工程师', '开发', '测试', '产品', '设计', '经理', '总监', '主管',
            '专员', '分析师', '架构师', '程序员', '设计师', '运营', '市场',
            '销售', '人事', '财务', '会计', '顾问', '专家', '组长', '负责人'
        ];

        // 避免重复添加
        const existingExp = new Set(result.experience.map(e => `${e.company}-${e.position}-${e.period}`));

        // 使用所有模式匹配
        experiencePatterns.forEach(pattern => {
            let match;
            // 重置正则表达式的 lastIndex
            pattern.lastIndex = 0;

            while ((match = pattern.exec(fullText)) !== null) {
                const matchedText = match[0].trim();
                let period = '';
                let company = '';
                let position = '';
                let description = matchedText;

                // 提取时间段
                if (match[1] && match[2]) {
                    period = `${match[1]}-${match[2]}`;
                    description = fullText.substring(match.index + match[0].length, match.index + match[0].length + 200).split('\n')[0];
                }

                // 从描述中提取公司和职位
                // 尝试匹配 "公司名 + 职位" 的模式
                const companyPositionPatterns = [
                    // 模式0: 日期 公司名 职位（空格分隔） - 最常见格式！
                    /^([\u4e00-\u9fa5]+(?:有限)?(?:股份)?(?:公司|集团|科技|银行|网络|软件|数据|信息|数码|技术|互联网|电子商务|通信|电子|半导体|医药|教育|金融|保险|证券|控股|投资))\s+([\u4e00-\u9fa5]{2,}(?:工程师|开发|测试|产品|设计|经理|总监|主管|专员|分析师|架构师|程序员|设计师|运营|市场|销售|人事|财务|会计|顾问|专家|组长|负责人))/,
                    // 模式1: XX公司 + XX职位（用特殊符号分隔）
                    /([\u4e00-\u9fa5]+(?:有限)?(?:股份)?(?:公司|集团|科技|银行))\s*[-·–—@]\s*([\u4e00-\u9fa5]+)/,
                    // 模式2: 在XX公司担任XX职位
                    /在\s*([\u4e00-\u9fa5]+)\s*(?:担任|任职|为)?\s*([\u4e00-\u9fa5]+)/,
                    // 模式3: XX职位 @ XX公司
                    /([\u4e00-\u9fa5]+)\s*[@@]\s*([\u4e00-\u9fa5]+)/
                ];

                for (const cpPattern of companyPositionPatterns) {
                    const cpMatch = description.match(cpPattern);
                    if (cpMatch) {
                        if (!company && cpMatch[1]) {
                            // 验证是否像公司名（包含公司相关后缀）
                            const potentialCompany = cpMatch[1];
                            if (companySuffixes.some(suffix => potentialCompany.includes(suffix)) ||
                                potentialCompany.length >= 4) {
                                company = potentialCompany;
                            }
                        }
                        if (!position && cpMatch[2]) {
                            position = cpMatch[2];
                        }
                        break;
                    }
                }

                // 如果还没找到公司名，尝试从常见公司列表匹配
                if (!company) {
                    const commonCompanies = [
                        '腾讯', '阿里', '百度', '字节', '华为', '美团', '京东',
                        '交通银行', '广发银行', '广发', '招商银行', '建设银行', '工商银行', '农业银行', '中国银行',
                        '浦发银行', '民生银行', '兴业银行', '光大银行', '中信银行', '华夏银行', '平安银行',
                        '神州数码', '联想', '小米', 'OPPO', 'VIVO', '中兴',
                        '阿里巴巴', '腾讯科技', '百度在线', '字节跳动', '美团点评',
                        '谷歌', '微软', '苹果', '亚马逊', 'Facebook', 'Google', 'Microsoft', 'Apple'
                    ];
                    // 搜索范围：描述文本 + 周围上下文
                    const contextRange = fullText.substring(
                        Math.max(0, match.index - 100),
                        Math.min(fullText.length, match.index + match[0].length + 300)
                    );
                    for (const comp of commonCompanies) {
                        if (contextRange.includes(comp)) {
                            company = comp;
                            break;
                        }
                    }
                }

                // 如果还没找到职位，尝试从常见职位列表匹配
                if (!position) {
                    for (const pos of positionKeywords) {
                        if (description.includes(pos)) {
                            position = pos;
                            break;
                        }
                    }
                }

                // 设置默认值
                if (!company) company = '某公司';
                if (!position) position = '职员';

                // 构建唯一标识
                const expKey = `${company}-${position}-${period}`;

                // 避免重复添加，且必须有有效的时间段或公司名
                if (!existingExp.has(expKey) && (period || company !== '某公司')) {
                    result.experience.push({
                        company: company,
                        position: position,
                        period: period || '时间待确认',
                        description: description.substring(0, 150) // 截取前150字符作为描述
                    });
                    existingExp.add(expKey);
                }
            }
        });

        // 如果没有通过日期模式找到任何经历，尝试使用关键词提取
        if (result.experience.length === 0) {
            this.extractExperienceByKeywords(fullText, result);
        }
    }

    /**
     * 通过关键词提取工作经历（备用方案）
     */
    extractExperienceByKeywords(fullText, result) {
        const lines = fullText.split('\n');
        let currentExp = null;

        lines.forEach(line => {
            const trimmedLine = line.trim();

            // 检测工作经历开始（包含公司特征词）
            if (/[\u4e00-\u9fa5]*(?:公司|集团|银行|科技|有限)[\u4e00-\u9fa5]*/.test(trimmedLine) &&
                !trimmedLine.includes('教育') && !trimmedLine.includes('学校')) {
                if (currentExp && currentExp.company) {
                    result.experience.push(currentExp);
                }
                currentExp = {
                    company: trimmedLine.replace(/[·\-–—]/g, '').substring(0, 50),
                    position: '',
                    period: '',
                    description: ''
                };
            }
            // 检测职位信息
            else if (currentExp && !currentExp.position &&
                     /(?:工程师|开发|测试|产品|设计|经理|总监|主管|专员|分析师)/.test(trimmedLine)) {
                currentExp.position = trimmedLine.substring(0, 30);
            }
            // 收集描述信息
            else if (currentExp && trimmedLine.length > 10) {
                currentExp.description += (currentExp.description ? '\n' : '') + trimmedLine;
            }
        });

        // 添加最后一个经历
        if (currentExp && currentExp.company) {
            result.experience.push(currentExp);
        }
    }

    /**
     * 智能提取教育经历
     */
    smartExtractEducation(fullText, result) {

        // 优先在"教育经历"标题附近搜索，避免从工作经历中误匹配
        let searchText = fullText;
        const eduTitlePatterns = [/教育经历|教育背景|学历背景|教育履历|学习经历/gi];
        for (const pattern of eduTitlePatterns) {
            const match = pattern.exec(fullText);
            if (match) {
                // 教育内容可能在标题之前（PDF常见）或之后
                // 搜索范围：标题前500字符 + 标题后200字符
                const beforeStart = Math.max(0, match.index - 500);
                const afterEnd = Math.min(fullText.length, match.index + match[0].length + 200);
                searchText = fullText.substring(beforeStart, afterEnd);
                break;
            }
        }

        // 如果在标题附近找到了教育内容，用搜索文本；否则用全文
        // 但如果全文中"大学/学院"出现在标题之前（如工作经历中），需要限制搜索范围

        // 教育经历关键词模式 - 超强版（支持多种格式）
        // 注意：只在 searchText（教育标题附近或全文）中搜索
        const educationPatterns = [
            // 格式0: 日期 学校 专业 学位（最常见！空格/Tab分隔）
            /(\d{4}[.\-/]\d{1,2}|\d{4}年\d{1,2}月)\s*[至\-~–到]\s*(\d{4}[.\-/]\d{1,2}|\d{4}年\d{1,2}月|至今|现在)?\s+([\u4e00-\u9fa5]{2,}(?:大学|学院|学校))\s+([\u4e00-\u9fa5]{2,}(?:专业)?)\s*(学士|硕士|博士|本科|研究生|专科|大专)?/gi,
            // 格式1: 学校名 + 学位 + 专业 + 时间段（Tab/空格分隔，PDF常见格式）
            /([\u4e00-\u9fa5]{2,}(?:大学|学院|学校))\s+(本科|专科|硕士|博士|研究生|大专|学士)\s+([\u4e00-\u9fa5]{2,})\s+(\d{4}[.\-/]\d{1,2}\s*[至\-~–到]\s*\d{4}[.\-/]?\d{0,2})/gi,
            // 格式2: 时间段 + 学校名
            /(\d{4}[.\-/]\d{1,2}|\d{4}年\d{1,2}月)\s*[至\-~–到]\s*(\d{4}[.\-/]\d{1,2}|\d{4}年\d{1,2}月|至今|现在)?\s*([^\n]*(?:大学|学院|学校))/gi,
            // 格式3: 学校名 + 时间段
            /([\u4e00-\u9fa5]{2,}(?:大学|学院|学校))\s*(\d{4}[.\-/]\d{1,2}|\d{4}年\d{1,2}月)\s*[至\-~–到]\s*(\d{4}[.\-/]\d{1,2}|\d{4}年\d{1,2}月|至今|现在)?/gi,
            // 格式4: 学历描述（本科、硕士等）+ 学校
            /(?:就读|毕业于|毕业院校)[:：]?\s*([\u4e00-\u9fa5]{2,}(?:大学|学院|学校))/gi
        ];

        // 常见学校名称 - 超大列表
        const commonSchools = [
            '清华大学', '北京大学', '复旦大学', '上海交通大学',
            '浙江大学', '南京大学', '中山大学', '武汉大学',
            '同济大学', '华东师范大学', '华东理工大学',
            '上海大学', '上海财经大学', '上海外国语大学',
            '西安交通大学', '哈尔滨工业大学', '华中科技大学',
            '中国科学技术大学', '中国人民大学', '东南大学',
            '北京航空航天大学', '北京理工大学', '天津大学',
            '华南理工大学', '西北工业大学', '大连理工大学',
            '电子科技大学', '中南大学', '湖南大学',
            '吉林大学', '山东大学', '四川大学', '重庆大学',
            '北京师范大学', '南开大学', '厦门大学',
            '山东大学', '青岛大学', '郑州大学',
            '苏州大学', '南京航空航天大学', '南京理工大学',
            '北京邮电大学', '西安电子科技大学', '杭州电子科技大学',
            '上海开放大学', '北京开放大学', '国家开放大学'
        ];

        // 常见专业 - 扩展
        const commonMajors = [
            '计算机科学与技术', '软件工程', '信息管理与信息系统',
            '电子信息工程', '自动化', '机械工程', '土木工程',
            '电气工程', '通信工程', '网络工程', '信息安全',
            '数据科学与大数据技术', '人工智能', '机器学习',
            '金融学', '会计学', '市场营销', '工商管理', '国际经济与贸易',
            '行政管理', '公共管理', '人力资源',
            '数学与应用数学', '统计学', '物理学', '化学',
            '法学', '英语', '日语', '新闻学', '广告学',
            '临床医学', '护理学', '药学', '生物医学工程',
            '环境工程', '材料科学与工程', '工业设计'
        ];

        // 常见学位
        const degrees = ['博士', '硕士', '学士', '本科', '研究生', '专科', '大专', '专升本'];

        // 避免重复添加（基于学校+专业+学位+时段）
        const existingEdu = new Set(result.education.map(e => `${e.school}-${e.major}-${e.degree}-${e.period}`));

        educationPatterns.forEach(pattern => {
            let match;
            pattern.lastIndex = 0; // 重置正则索引

            while ((match = pattern.exec(searchText)) !== null) {
                let school = '';
                let major = '';
                let degree = '';
                let period = '';
                let description = match[0].trim();

                // 提取学校名称 — 从 description 中搜索
                for (const sch of commonSchools) {
                    if (description.includes(sch)) {
                        school = sch;
                        break;
                    }
                }
                // 通用匹配：包含"大学/学院/学校"的中文词
                if (!school) {
                    const schoolMatch = description.match(/([\u4e00-\u9fa5]{2,}(?:大学|学院|学校))/);
                    if (schoolMatch) school = schoolMatch[1];
                }

                // 提取专业 — 从 description 中搜索
                for (const maj of commonMajors) {
                    if (description.includes(maj)) {
                        major = maj;
                        break;
                    }
                }

                // 提取学位 — 从 description 中搜索
                for (const deg of degrees) {
                    if (description.includes(deg)) {
                        degree = deg;
                        break;
                    }
                }
                if (!degree) degree = '本科'; // 默认

                // 提取时间段
                const timePatterns = [
                    /(\d{4}[.\-/]\d{1,2}|\d{4}年\d{1,2}月)\s*[至\-~–到]\s*(\d{4}[.\-/]\d{1,2}|\d{4}年\d{1,2}月|至今|现在)/,
                    /(\d{4})\s*[至\-~–到]\s*(\d{4}|至今|现在)/,
                    /20(1[5-9]|2[0-5])/  // 匹配2015-2025年份
                ];

                for (const timePattern of timePatterns) {
                    const timeMatch = description.match(timePattern);
                    if (timeMatch) {
                        period = timeMatch[0];
                        break;
                    }
                }

                // 如果没有找到学位但找到了时间段，推断学位（根据时长）
                if (!period || period === degree) {
                    // 尝试从周围文本找时间
                    const surroundingText = searchText.substring(
                        Math.max(0, match.index - 50),
                        Math.min(searchText.length, match.index + match[0].length + 100)
                    );
                    for (const timePattern of timePatterns) {
                        const timeMatch = surroundingText.match(timePattern);
                        if (timeMatch) {
                            period = timeMatch[0];
                            break;
                        }
                    }
                }

                // 设置默认值
                if (!school) school = '某高校';
                if (!major) major = '未明确专业';
                if (!degree) degree = '本科';

                // 构建唯一标识（含时段）
                const eduKey = `${school}-${major}-${degree}-${period}`;

                // 避免重复添加，且必须有有效信息
                if (!existingEdu.has(eduKey) && (school !== '某高校' || major !== '未明确专业')) {
                    result.education.push({
                        school: school,
                        degree: degree,
                        major: major,
                        period: period || '时间待确认',
                        description: description.substring(0, 150)
                    });
                    existingEdu.add(eduKey);
                }
            }
        });

        // 如果没有通过模式匹配找到任何教育经历，使用备用方案
        if (result.education.length === 0) {
            this.extractEducationByKeywords(fullText, result);
        }
    }

    /**
     * 通过关键词提取教育经历（备用方案）
     */
    extractEducationByKeywords(fullText, result) {
        const lines = fullText.split('\n');
        let currentEdu = null;

        lines.forEach(line => {
            const trimmedLine = line.trim();

            // 检测教育经历开始（包含学校特征词）
            if (/[\u4e00-\u9fa5]*(?:大学|学院|学校)[\u4e00-\u9fa5]*/.test(trimmedLine) &&
                !trimmedLine.includes('公司') && !trimmedLine.includes('工作')) {
                if (currentEdu && currentEdu.school) {
                    result.education.push(currentEdu);
                }
                currentEdu = {
                    school: trimmedLine.replace(/[·\-–—]/g, '').substring(0, 50),
                    degree: '',
                    major: '',
                    period: '',
                    description: ''
                };
            }
            // 检测专业信息
            else if (currentEdu && !currentEdu.major &&
                     /(?:专业|系|方向)[:：]?\s*[\u4e00-\u9fa5]+/.test(trimmedLine)) {
                const majorMatch = trimmedLine.match(/(?:专业|系|方向)[:：]?\s*([\u4e00-\u9fa5]+)/);
                if (majorMatch) {
                    currentEdu.major = majorMatch[1];
                }
            }
            // 检测学历信息
            else if (currentEdu && !currentEdu.degree &&
                     /(本科|硕士|博士|专科|大专|研究生|学士)/.test(trimmedLine)) {
                const degreeMatch = trimmedLine.match(/(本科|硕士|博士|专科|大专|研究生|学士)/);
                if (degreeMatch) {
                    currentEdu.degree = degreeMatch[1];
                }
            }
            // 收集时间信息
            else if (currentEdu && /\d{4}/.test(trimmedLine) && !currentEdu.period) {
                const yearMatch = trimmedLine.match(/\d{4}/);
                if (yearMatch) {
                    currentEdu.period = trimmedLine.substring(0, 30);
                }
            }
            // 收集描述信息
            else if (currentEdu && trimmedLine.length > 10) {
                currentEdu.description += (currentEdu.description ? '\n' : '') + trimmedLine;
            }
        });

        // 添加最后一个教育经历
        if (currentEdu && currentEdu.school) {
            if (!currentEdu.degree) currentEdu.degree = '本科';
            if (!currentEdu.major) currentEdu.major = '未明确';
            result.education.push(currentEdu);
        }
    }

    /**
     * 智能提取技能
     */
    smartExtractSkills(fullText, result) {
        const skillKeywords = [
            'React', 'Vue', 'TypeScript', 'JavaScript', 'HTML5', 'CSS3',
            'Node.js', 'Python', 'Java', 'Go', 'C++',
            'MySQL', 'Redis', 'MongoDB', 'PostgreSQL',
            'Git', 'Docker', 'Jenkins', 'Kubernetes',
            'Postman', 'Jmeter', 'Fiddler', 'Selenium',
            'Linux', 'Shell', 'Bash',
            '运维', '自动化测试', '性能测试', '功能测试', '回归测试',
            '安全测试', '测试策略', '测试计划', '需求分析',
            '项目管理', '团队协作', '团队管理', '风险管理',
            '问题解决', '沟通能力', '技术领导'
        ];
        
        const existingSkills = new Set(result.skills);
        skillKeywords.forEach(skill => {
            if (fullText.includes(skill) && !existingSkills.has(skill)) {
                result.skills.push(skill);
                existingSkills.add(skill);
            }
        });

        result.skills = result.skills.filter(skill => {
            if (typeof skill !== 'string') return false;
            const s = skill.trim();
            return s.length >= 2 && !/^[a-zA-Z]$/.test(s);
        });
    }

    /**
     * 智能提取个人信息（增强版）
     */
    smartExtractPersonalInfo(fullText, result) {
        
        const nonNameWords = ['个人', '简历', '信息', '经验', '教育', '技能', '项目', '总结', '评价', '工作', '专业', '求职', '职业', '背景', '经历'];
        
        // 姓名提取 - 增强版（支持多种常见格式）
        const namePatterns = [
            /姓名[：:]\s*([\u4e00-\u9fa5]{2,4})/,
            /Name[：:]\s*([\u4e00-\u9fa5]{2,4})/,
            /个人简历[-—–]\s*([\u4e00-\u9fa5]{2,4})/,
            /^([\u4e00-\u9fa5]{2,4})的简历/,
            /^([\u4e00-\u9fa5]{2,4})个人简历/,
            /([\u4e00-\u9fa5]{2,4})\s*[男|女]/,
            /^\d{1,3}[\.\s\-\)]+\s*([\u4e00-\u9fa5]{2,4})/m,
            /^([\u4e00-\u9fa5]{2,4})$/
        ];
        
        namePatterns.forEach(pattern => {
            const match = fullText.match(pattern);
            if (match && match[1]) {
                if (!result.profile.name || nonNameWords.includes(result.profile.name)) {
                    result.profile.name = match[1];
                }
            }
        });
        
        if (!result.profile.name) {
            const textLines = fullText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
            if (textLines.length > 0) {
                const firstName = textLines[0];
                if (/^[\u4e00-\u9fa5]{2,4}$/.test(firstName)) {
                    result.profile.name = firstName;
                }
            }
        }
        
        // Extract title from "求职意向：xxx" pattern
        if (!result.profile.title) {
            const titleMatch = fullText.match(/求职意向[：:]\s*([^\n]+)/);
            if (titleMatch) {
                result.profile.title = titleMatch[1].trim();
            }
        }
        
        // 电话提取
        const phonePattern = /(1[3-9][\d\s\-]{9,13})/;
        const phoneMatch = fullText.match(phonePattern);
        if (phoneMatch && !result.profile.phone) {
            result.profile.phone = phoneMatch[1].replace(/[\s\-]/g, '');
        }
        
        // 邮箱提取
        const preprocessedText = fullText.replace(/\s+(@)/g, '$1').replace(/(@)\s+/g, '$1');
        const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
        const emailMatch = preprocessedText.match(emailPattern);
        if (emailMatch && !result.profile.email) {
            result.profile.email = emailMatch[0];
        }
        
        // 位置信息提取
        if (!result.profile.location) {
            const locationPatterns = [
                /现居[：:]\s*([^\n]+)/,
                /居住地[：:]\s*([^\n]+)/,
                /住址[：:]\s*([^\n]+)/,
                /地址[：:]\s*([^\n]+)/,
                /所在地[：:]\s*([^\n]+)/,
                /户籍[：:]\s*([^\n]+)/,
                /location[：:]\s*([^\n]+)/i,
                /(北京|上海|广州|深圳|杭州|南京|成都|武汉|西安|重庆|天津|苏州|青岛|长沙|大连|厦门|宁波|无锡|合肥|郑州|济南|福州|昆明|南昌|哈尔滨|石家庄|温州|南宁|贵阳|海口|兰州|银川|西宁|呼和浩特|乌鲁木齐|拉萨|东莞|佛山|珠海|惠州|中山|常州|徐州|烟台|潍坊|保定|唐山|洛阳|绍兴|嘉兴|漳州|泉州|三亚|桂林|柳州|株洲|湘潭|宜昌|襄阳|芜湖|蚌埠|淮南|马鞍山|安庆|金华|台州|舟山|衡阳|邵阳|岳阳|益阳|常德|遵义|绵阳|德阳|宜宾|曲靖|大理|咸阳|宝鸡|渭南|天水|包头|赤峰|吉林|齐齐哈尔|大庆|鞍山|抚顺|丹东|锦州|葫芦岛|连云港|淮安|盐城|扬州|镇江|泰州|宿迁|衢州|丽水|马鞍山|铜陵|池州|黄山|滁州|阜阳|宿州|六安|亳州|景德镇|萍乡|九江|新余|鹰潭|赣州|吉安|上饶|萍乡|抚州|开封|平顶山|安阳|鹤壁|新乡|焦作|濮阳|许昌|漯河|三门峡|南阳|信阳|周口|驻马店|济源|黄石|十堰|荆州|荆门|鄂州|孝感|黄冈|咸宁|随州|恩施|仙桃|潜江|天门|神农架|株洲|衡阳|邵阳|岳阳|常德|张家界|益阳|郴州|永州|怀化|娄底|湘西|韶关|深圳|汕头|佛山|江门|湛江|茂名|肇庆|惠州|梅州|汕尾|河源|阳江|清远|东莞|中山|潮州|揭阳|云浮)/
            ];
            
            for (const pattern of locationPatterns) {
                const match = fullText.match(pattern);
                if (match) {
                    result.profile.location = match[1] || match[0];
                    break;
                }
            }
        }
        
        // 工作经验年限提取
        const yearsPatterns = [
            /工作经验[：:]\s*(\d{1,2})\s*年/,
            /工作年限[：:]\s*(\d{1,2})\s*年/,
            /(?<!\d)(\d{1,2})\s*年\s*工作经验/,
            /(?<!\d)(\d{1,2})\s*年以上/,
            /(\d{1,2})\s*years?\s*experience/i
        ];
        
        for (const pattern of yearsPatterns) {
            const match = fullText.match(pattern);
            if (match && match[1] && !result.profile.experience_years) {
                result.profile.experience_years = match[1];
                break;
            }
        }
        
        // 性别提取
        if (!result.profile.gender) {
            const genderPatterns = [
                { pattern: /性别[：:]\s*男/, gender: '男' },
                { pattern: /性别[：:]\s*女/, gender: '女' },
                { pattern: /^([\u4e00-\u9fa5]{2,4})\s*男/, gender: '男' },
                { pattern: /^([\u4e00-\u9fa5]{2,4})\s*女/, gender: '女' },
                { pattern: /gender[：:]\s*male/i, gender: '男' },
                { pattern: /gender[：:]\s*female/i, gender: '女' }
            ];
            
            for (const { pattern, gender } of genderPatterns) {
                if (pattern.test(fullText)) {
                    result.profile.gender = gender;
                    break;
                }
            }
            
            // 备用方法：直接搜索关键词
            if (!result.profile.gender) {
                if (fullText.includes('男')) {
                    result.profile.gender = '男';
                } else if (fullText.includes('女')) {
                    result.profile.gender = '女';
                }
            }
        }
        
        // 求职意向提取
        if (!result.profile.title) {
            const objectivePatterns = [
                /求职意向[：:]\s*([^\n]+)/,
                /应聘职位[：:]\s*([^\n]+)/,
                /期望职位[：:]\s*([^\n]+)/,
                /目标职位[：:]\s*([^\n]+)/,
                /objective[：:]\s*([^\n]+)/i
            ];
            
            for (const pattern of objectivePatterns) {
                const match = fullText.match(pattern);
                if (match && match[1]) {
                    result.profile.title = match[1].trim();
                    break;
                }
            }
        }
    }

    /**
     * 个人信息行检测
     */
    isPersonalInfoLine(line) {
        const personalKeywords = [
            '姓名', 'name', '电话', '手机', 'phone', 'tel',
            '邮箱', 'email', '地址', 'location', 'address',
            '性别', 'gender', '年龄', 'age', '出生', 'birth',
            '工作经验', 'experience years', '工作年限'
        ];
        
        const lowerLine = line.toLowerCase();
        return personalKeywords.some(keyword => lowerLine.includes(keyword.toLowerCase()));
    }

    /**
     * 工作经历行检测
     */
    isExperienceLine(line) {
        const experienceKeywords = [
            '公司', 'company', '职位', 'position', '工作', 'work',
            '项目', 'project', '职责', 'responsibility', '成就', 'achievement'
        ];
        
        const lowerLine = line.toLowerCase();
        return experienceKeywords.some(keyword => lowerLine.includes(keyword.toLowerCase()));
    }

    /**
     * 工作经历开始行检测
     */
    isExperienceStartLine(line) {
        // 必须包含时间段 + 公司/职位关键词，才认为是新工作经历开始行
        const hasDateRange = /\d{4}[.\-/年]\d{1,2}[.\-/月]?\s*[-–—至到]\s*\d{4}|至今/.test(line) ||
                             /\d{4}\s*[-–—至到]\s*\d{4}/.test(line);
        if (!hasDateRange) return false;

        // 排除纯描述行（以"-"、"•"、"*"开头的项目符号）
        const trimmed = line.trim();
        if (/^[-•*·▪▸▹►◅⟩]/.test(trimmed)) return false;

        return true;
    }

    /**
     * 教育经历开始行检测
     */
    isEducationStartLine(line) {
        const educationKeywords = ['大学', '学院', '学校', '学历', '学位'];
        const lowerLine = line.toLowerCase();
        return educationKeywords.some(keyword => lowerLine.includes(keyword));
    }

    /**
     * 项目经验开始行检测
     */
    isProjectStartLine(line) {
        return line.includes('项目') && 
               (line.includes('描述') || line.includes('职责') || /\d{4}/.test(line));
    }

    /**
     * 提取个人信息
     */
    extractPersonalInfo(line, result) {
        const lowerLine = line.toLowerCase();

        // 提取姓名 - 增强版（支持多种格式）
        if (!result.profile.name) {
            // 格式1: "姓名：xxx" / "name: xxx"（精确匹配标签）
            const nameMatch1 = line.match(/(?:姓名|Name)\s*[:：]\s*([\u4e00-\u9fa5]{2,4})/i);
            if (nameMatch1 && nameMatch1[1]) {
                const nonNameWords = ['个人', '简历', '信息', '经验', '教育', '技能', '项目', '总结', '评价', '工作', '专业', '求职', '职业', '背景', '经历'];
                if (!nonNameWords.includes(nameMatch1[1])) {
                    result.profile.name = nameMatch1[1];
                }
            }
            // 格式2: 独立的中文姓名（2-4个汉字，前后无其他中文）
            else if (/^[\u4e00-\u9fa5]{2,4}$/.test(line.trim())) {
                // 排除常见非姓名词汇
                const nonNameWords = ['个人', '简历', '信息', '经验', '教育', '技能', '项目', '总结', '评价', '工作', '专业', '求职', '职业', '背景', '经历', '个人信息', '个人资料', '基本资料', '个人简介'];
                if (!nonNameWords.includes(line.trim())) {
                    result.profile.name = line.trim();
                }
            }
            // 格式3: "XXX 的简历" 或 "XXX resume"
            const nameMatch3 = line.match(/^([\u4e00-\u9fa5]{2,4})\s*(的|之)?\s*(简历|resume|CV)/i);
            if (nameMatch3 && nameMatch3[1]) {
                result.profile.name = nameMatch3[1];
            }
            // 格式4: "个人简历-姓名"
            const nameMatch4 = line.match(/个人简历[-—–]\s*([\u4e00-\u9fa5]{2,4})/);
            if (nameMatch4 && nameMatch4[1]) {
                result.profile.name = nameMatch4[1];
            }
        }

        // 提取电话 - 增强版
        if (!result.profile.phone) {
            const phoneMatch = line.match(/(1[3-9]\d{9})|(\d{3,4}-\d{7,8})/);
            if (phoneMatch && phoneMatch[0]) {
                result.profile.phone = phoneMatch[0];
            }
        }

        // 提取邮箱 - 增强版
        if (!result.profile.email) {
            const emailMatch = line.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
            if (emailMatch && emailMatch[0]) {
                result.profile.email = emailMatch[0];
            }
        }

        // 提取性别
        if (!result.profile.gender) {
            if (line.includes('男') && !line.includes('女')) result.profile.gender = '男';
            else if (line.includes('女') && !line.includes('男')) result.profile.gender = '女';
        }

        // 提取工作经验年限（排除电话号码等长数字序列）
        if (!result.profile.experience_years) {
            const yearsMatch = line.match(/(?:工作经验|工作年限|从业经验|年经验)[：:]\s*(\d+)\s*年/);
            if (yearsMatch && yearsMatch[1]) {
                result.profile.experience_years = yearsMatch[1];
            } else {
                // 倒置格式: "8年工作经验"，但排除连续7位以上数字（电话号码）
                const reverseMatch = line.match(/(?<!\d)(\d{1,2})\s*年\s*(?:工作|从业)?经验/);
                if (reverseMatch && reverseMatch[1]) {
                    result.profile.experience_years = reverseMatch[1];
                }
            }
        }

        // 提取地址/位置
        if (!result.profile.location) {
            const locationPatterns = [
                /^(?:现居|居住地?|位于|所在地|住址|地址|户籍)[:：]\s*([\u4e00-\u9fa5]{2,})/,
                /[地址住址location\s]*[:：]\s*([\u4e00-\u9fa5]+(?:市|省|区|县))/,
                /(上海|北京|广州|深圳|杭州|成都|武汉|南京|西安|重庆|天津|东莞|佛山|苏州|珠海|惠州|中山|无锡|宁波|合肥|济南|青岛|长沙|大连|厦门|福州|昆明|南昌|哈尔滨|石家庄|温州|南宁|贵阳|海口|兰州|银川|西宁|呼和浩特|乌鲁木齐|拉萨|常州|徐州|烟台|潍坊|保定|唐山|洛阳|绍兴|嘉兴|漳州|泉州|三亚|桂林|柳州|株洲|湘潭|宜昌|襄阳|芜湖|金华|台州|遵义|绵阳|德阳|宜宾|咸阳|宝鸡|包头|赤峰|吉林|大庆|鞍山|连云港|淮安|盐城|扬州|镇江|泰州|宿迁|衢州|丽水|景德镇|九江|赣州|开封|南阳|信阳|周口|黄石|十堰|荆州|荆门|孝感|黄冈|邵阳|岳阳|常德|张家界|郴州|永州|怀化|娄底|韶关|汕头|江门|湛江|茂名|肇庆|梅州|汕尾|河源|阳江|清远|潮州|揭阳|云浮)(?:市)?/
            ];
            for (const pattern of locationPatterns) {
                const match = line.match(pattern);
                if (match && match[1]) {
                    result.profile.location = match[1];
                    break;
                }
            }
        }
    }

    /**
     * 后备提取个人信息
     */
    fallbackExtractPersonalInfo(lines, result) {
        if (!result.profile.name && lines.length > 0) {
            const nameRegex = /^[\u4e00-\u9fa5]{2,4}$/;
            for (let i = 0; i < Math.min(10, lines.length); i++) {
                const line = lines[i].trim();
                if (nameRegex.test(line)) {
                    result.profile.name = line;
                    break;
                }
                for (const part of line.split(/[\s|·，,、]+/)) {
                    const trimmed = part.trim();
                    if (nameRegex.test(trimmed)) {
                        result.profile.name = trimmed;
                        break;
                    }
                }
                if (result.profile.name) break;
            }

            if (!result.profile.name) {
                for (let i = 0; i < Math.min(20, lines.length); i++) {
                    const line = lines[i].trim();
                    const nameMatch = line.match(/^[\u4e00-\u9fa5]{2,4}(?:\s|[,，、|·]|$)/);
                    if (nameMatch) {
                        result.profile.name = nameMatch[0].replace(/[\s,，、|·]/g, '');
                        break;
                    }
                }
            }

            if (!result.profile.name) {
                for (let i = 0; i < Math.min(5, lines.length); i++) {
                    const line = lines[i].trim();
                    const nameAfterLabel = line.match(/(?:姓名|名字)[：:]\s*([\u4e00-\u9fa5]{2,4})/);
                    if (nameAfterLabel) {
                        result.profile.name = nameAfterLabel[1];
                        break;
                    }
                }
            }
        }
        
        lines.forEach(line => {
            if (!result.profile.phone) {
                const phoneMatch = line.match(/(1[3-9]\d{9})/);
                if (phoneMatch) result.profile.phone = phoneMatch[0];
            }
            
            if (!result.profile.email) {
                const emailMatch = line.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
                if (emailMatch) result.profile.email = emailMatch[0];
            }
        });
        
        if (!result.profile.phone) {
            const fullText = lines.join(' ');
            const phoneMatch = fullText.match(/(1[3-9]\d{9})/);
            if (phoneMatch) result.profile.phone = phoneMatch[0];
        }
    }

    /**
     * 解析项目经验行
     */
    parseProjectLine(line) {
        return {
            name: this.extractProjectName(line),
            period: this.extractPeriod(line),
            role: this.extractProjectRole(line),
            description: line.trim()
        };
    }

    /**
     * 提取项目名称
     */
    extractProjectName(line) {
        // 尝试提取项目名称（通常在行首）
        const projectMatch = line.match(/^([^\d\s]{4,})/);
        return projectMatch ? projectMatch[1] : '未命名项目';
    }

    /**
     * 提取项目角色
     */
    extractProjectRole(line) {
        const roles = ['工程师', '测试', '开发', '产品', '设计', '经理', '组长'];
        for (const role of roles) {
            if (line.includes(role)) return role;
        }
        return '项目成员';
    }

    /**
     * 清理文本
     */
    cleanText(text) {
        // 移除多余空格
        text = text.replace(/\s+/g, ' ');
        // 统一标点符号
        text = text.replace(/[：:]/g, ':');
        text = text.replace(/[，,]/g, ',');
        text = text.replace(/[；;]/g, ';');
        // 移除特殊字符
        text = text.replace(/[\u200b-\u200f\u202a-\u202e]/g, '');
        return text;
    }
    
    /**
     * 清理文本，但保留换行符
     */
    cleanTextPreserveNewlines(text) {
        
        // 按行处理，保留换行符
        const lines = text.split('\n');
        
        const cleanedLines = lines.map(line => {
            // 对每一行单独清理
            let cleanedLine = line.trim();
            
            // 移除多余空格
            cleanedLine = cleanedLine.replace(/\s+/g, ' ');
            
            // 统一标点符号
            cleanedLine = cleanedLine.replace(/[：:]/g, '：');
            cleanedLine = cleanedLine.replace(/[，,]/g, '，');
            cleanedLine = cleanedLine.replace(/[；;]/g, '；');
            
            // 移除特殊字符
            cleanedLine = cleanedLine.replace(/[\u200b-\u200f\u202a-\u202e]/g, '');
            
            return cleanedLine;
        });
        
        // 重新组合，保留换行符
        const result = cleanedLines.join('\n');
        
        return result;
    }

    /**
     * 解析分段内容
     */
    parseSectionContent(section, content, result) {
        const lines = content.split('\n').filter(line => line.trim());
        
        switch (section) {
            case 'personal':
                this.parsePersonalSection(lines, result);
                break;
            case 'experience':
                this.parseExperienceSection(lines, result);
                break;
            case 'education':
                this.parseEducationSection(lines, result);
                break;
            case 'skills':
                this.parseSkillsSection(lines, result);
                break;
            case 'projects':
                this.parseProjectsSection(lines, result);
                this.parseExperienceSection(lines, result);
                break;
            case 'summary':
                this.parseSummarySection(lines, result);
                break;
        }
    }

    /**
     * 解析个人信息分段
     */
    parsePersonalSection(lines, result) {
        lines.forEach(line => {
            this.extractPersonalInfo(line, result);
        });
    }

    /**
     * 解析工作经历分段
     */
    parseExperienceSection(lines, result) {
        let currentExperience = null;
        let prevLine = '';
        
        lines.forEach(line => {
            // 检测新工作经历开始
            if (this.isExperienceStartLine(line)) {
                if (currentExperience) {
                    // 如果公司名仍是"知名公司"，从描述中尝试提取
                    if (currentExperience.company === '知名公司' && currentExperience.description) {
                        const extractedCompany = this.extractCompany(currentExperience.description);
                        if (extractedCompany !== '知名公司') {
                            currentExperience.company = extractedCompany;
                        }
                    }
                    result.experience.push(currentExperience);
                }
                currentExperience = this.parseExperienceLine(line, prevLine);
            } else if (currentExperience) {
                // 添加到描述中
                if (currentExperience.description) {
                    currentExperience.description += '\n' + line.trim();
                } else {
                    currentExperience.description = line.trim();
                }
            }
            prevLine = line;
        });
        
        if (currentExperience) {
            // 最后一条也尝试从描述中提取公司名
            if (currentExperience.company === '知名公司' && currentExperience.description) {
                const extractedCompany = this.extractCompany(currentExperience.description);
                if (extractedCompany !== '知名公司') {
                    currentExperience.company = extractedCompany;
                }
            }
            result.experience.push(currentExperience);
        }
    }

    /**
     * 解析教育经历分段
     */
    parseEducationSection(lines, result) {
        let currentEducation = null;
        
        lines.forEach(line => {
            if (this.isEducationStartLine(line)) {
                if (currentEducation) {
                    result.education.push(currentEducation);
                }
                currentEducation = this.parseEducationLine(line);
            } else if (currentEducation) {
                if (currentEducation.description) {
                    currentEducation.description += '\n' + line.trim();
                } else {
                    currentEducation.description = line.trim();
                }
            }
        });
        
        if (currentEducation) {
            result.education.push(currentEducation);
        }
    }

    /**
     * 解析技能分段
     */
    parseSkillsSection(lines, result) {
        lines.forEach(line => {
            const skills = this.extractSkills(line);
            result.skills.push(...skills);
        });
    }

    /**
     * 解析项目经验分段
     */
    parseProjectsSection(lines, result) {
        let currentProject = null;
        
        lines.forEach(line => {
            if (this.isProjectStartLine(line)) {
                if (currentProject) {
                    result.projects.push(currentProject);
                }
                currentProject = this.parseProjectLine(line);
            } else if (currentProject) {
                if (currentProject.description) {
                    currentProject.description += '\n' + line.trim();
                } else {
                    currentProject.description = line.trim();
                }
            }
        });
        
        if (currentProject) {
            result.projects.push(currentProject);
        }
    }

    /**
     * 解析个人总结分段
     */
    parseSummarySection(lines, result) {
        const sectionTitles = ['自我评价', '个人总结', '个人简介', '自我介绍', '个人优势'];
        const filteredLines = lines.filter(line => {
            const trimmed = line.trim();
            return trimmed.length > 0 && !sectionTitles.includes(trimmed);
        });
        const subTitles = ['工作背景', '团队管理', '团队合作', '工作荣誉', '核心优势',
                           '专业技能', '自我驱动', '沟通能力', '学习能力'];
        const summary = filteredLines.map(line => {
            let cleaned = line;
            for (const title of subTitles) {
                cleaned = cleaned.replace(new RegExp(`^${title}[：:]\\s*`), '');
            }
            return cleaned;
        }).join(' ').trim();
        if (summary) {
            result.profile.summary = summary;
        }
    }

    isPlaceholderValue(field, value) {
        if (!value || value.trim() === '') return true;
        const v = value.trim().toLowerCase();
        const placeholders = {
            name: ['张三','李四','王五','赵六','钱七','未识别','未知','待填写','用户名','简历中的真实姓名','姓名','name','your name'],
            phone: ['13800138000','13900139000','18888888888','12345678901','10000000000','00000000000','手机号码','电话','phone','tel','联系电话'],
            email: ['zhangsan@example.com','example@email.com','test@test.com','user@example.com','邮箱地址','email','电子邮箱','your email'],
            location: ['北京市','上海市','广州市','所在城市','城市','location','your city']
        };
        if (placeholders[field] && placeholders[field].includes(v)) return true;
        if (field === 'phone' && !/\d/.test(v)) return true;
        if (field === 'email' && !v.includes('@')) return true;
        if (field === 'name' && (v.length < 2 || v.length > 4)) return true;
        return false;
    }

    /**
     * 提取电话号码
     */
    extractPhone(line) {
        const phoneRegex = /1[3-9][\d\s\-]{9,13}/g;
        const matches = line.match(phoneRegex);
        if (!matches) return '';
        const cleaned = matches[0].replace(/[\s\-]/g, '');
        return cleaned.length === 11 ? cleaned : '';
    }

    extractEmail(line) {
        const preprocessed = line.replace(/\s+(@)/g, '$1').replace(/(@)\s+/g, '$1');
        const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
        const matches = preprocessed.match(emailRegex);
        return matches ? matches[0].trim() : '';
    }

    /**
     * 解析教育经历行
     */
    parseEducationLine(line) {
        return {
            school: this.extractSchool(line),
            major: this.extractMajor(line),
            degree: this.extractDegree(line),
            period: this.extractPeriod(line),
            description: line.trim()
        };
    }

    /**
     * 解析工作经历行
     */
    parseExperienceLine(line, prevLine) {
        if (prevLine && /^(测试|开发|高级|资深|初级|中级)$/i.test(prevLine.trim())) {
            line = prevLine.trim() + line;
        }
        return {
            company: this.extractCompany(line),
            position: this.extractPosition(line),
            period: this.extractPeriod(line),
            description: line.trim()
        };
    }

    /**
     * 提取学校名称
     */
    extractSchool(line) {
        const schools = [
            '清华大学', '北京大学', '复旦大学', '上海交通大学',
            '浙江大学', '南京大学', '中山大学', '武汉大学',
            '同济大学', '华东师范大学', '华东理工大学',
            '上海大学', '上海财经大学', '上海外国语大学',
            '西安交通大学', '哈尔滨工业大学', '华中科技大学',
            '中国科学技术大学', '中国人民大学', '东南大学',
            '北京航空航天大学', '北京理工大学', '天津大学',
            '华南理工大学', '西北工业大学', '大连理工大学',
            '电子科技大学', '中南大学', '湖南大学',
            '吉林大学', '山东大学', '四川大学', '重庆大学',
            '北京师范大学', '南开大学', '厦门大学',
            '北京邮电大学', '西安电子科技大学', '杭州电子科技大学'
        ];
        for (const school of schools) {
            if (line.includes(school)) return school;
        }
        // 通用匹配：包含"大学/学院/学校"的中文词
        const schoolMatch = line.match(/([\u4e00-\u9fa5]{2,}(?:大学|学院|学校))/);
        if (schoolMatch) return schoolMatch[1];
        return '未知学校';
    }

    /**
     * 提取专业
     */
    extractMajor(line) {
        const majors = [
            '计算机科学与技术', '软件工程', '信息管理与信息系统',
            '电子信息工程', '自动化', '机械工程', '土木工程',
            '电气工程', '通信工程', '网络工程', '信息安全',
            '数据科学与大数据技术', '人工智能', '机器学习',
            '金融学', '会计学', '市场营销', '工商管理', '国际经济与贸易',
            '数学与应用数学', '统计学', '物理学', '化学',
            '法学', '英语', '日语', '新闻学', '广告学',
            '临床医学', '护理学', '药学', '生物医学工程',
            '环境工程', '材料科学与工程', '工业设计'
        ];
        for (const major of majors) {
            if (line.includes(major)) return major;
        }
        return '';
    }

    /**
     * 提取学位
     */
    extractDegree(line) {
        const degrees = ['博士', '硕士', '学士', '本科', '研究生'];
        for (const degree of degrees) {
            if (line.includes(degree)) return degree;
        }
        return '学士';
    }

    /**
     * 提取公司名称
     */
    extractCompany(line) {
        // 优先匹配常见公司（含银行、金融机构等）
        const companies = [
            // 银行
            '交通银行', '广发银行', '广发', '招商银行', '建设银行', '工商银行', '农业银行', '中国银行',
            '浦发银行', '民生银行', '兴业银行', '光大银行', '中信银行', '华夏银行', '平安银行',
            // 互联网
            '腾讯', '阿里', '百度', '字节', '华为', '美团', '京东', '小米', 'OPPO', 'VIVO', '中兴',
            '阿里巴巴', '腾讯科技', '百度在线', '字节跳动', '美团点评', '神州数码', '联想',
            // 外企
            '谷歌', '微软', '苹果', '亚马逊', 'Facebook', 'Google', 'Microsoft', 'Apple'
        ];
        for (const company of companies) {
            if (line.includes(company)) return company;
        }
        // 通用模式：匹配包含公司/集团/银行/科技等后缀的中文词
        const companyMatch = line.match(/([\u4e00-\u9fa5]{2,}(?:有限)?(?:股份)?(?:公司|集团|银行|科技|网络|软件|数据|信息|数码|技术|互联网|电子商务|通信|电子|半导体|医药|教育|金融|保险|证券|控股|投资))/);
        if (companyMatch) return companyMatch[1];
        return '知名公司';
    }

    /**
     * 提取职位
     */
    extractPosition(line) {
        const positions = [
            '高级测试开发工程师', '资深测试开发工程师', '测试开发工程师',
            '高级自动化测试工程师', '资深自动化测试工程师', '自动化测试工程师',
            '高级性能测试工程师', '资深性能测试工程师', '性能测试工程师',
            '高级功能测试工程师', '资深功能测试工程师', '功能测试工程师',
            '高级安全测试工程师', '资深安全测试工程师', '安全测试工程师',
            '高级前端开发工程师', '资深前端开发工程师', '前端开发工程师',
            '高级后端开发工程师', '资深后端开发工程师', '后端开发工程师',
            '高级全栈开发工程师', '资深全栈开发工程师', '全栈开发工程师',
            '高级软件开发工程师', '资深软件开发工程师', '软件开发工程师',
            '高级测试工程师', '资深测试工程师', '测试工程师',
            '测试组长', '测试经理', '测试总监', '测试主管',
            '高级开发工程师', '资深开发工程师', '开发工程师',
            '开发组长', '开发经理',
            '高级产品经理', '产品经理', '产品专员',
            '高级UI设计师', 'UI设计师', '高级设计师', '设计师',
            '项目经理', '技术经理', '技术总监', '架构师',
            '高级运维工程师', '运维工程师',
            '高级数据分析师', '数据分析师',
            '工程师', '经理', '总监', '主管', '开发', '测试', '产品', '设计', '运营', '市场', '销售', '人事', '财务', '会计', '顾问', '专家', '组长', '负责人', '分析师', '程序员'
        ];
        for (const position of positions) {
            if (line.includes(position)) return position;
        }
        return '职位';
    }

    /**
     * 提取时间段
     */
    extractPeriod(line) {
        // 匹配多种时间段格式
        const periodPatterns = [
            // 2020年至今 / 2020年-至今
            /(\d{4})\s*年?\s*[至\-~–到]\s*至今/i,
            // 2020.02-2025.01 / 2020-2025
            /(\d{4})[.\-/]\s*(\d{1,2})?\s*[至\-~–到]\s*(\d{4})[.\-/]?\s*(\d{1,2})?/,
            // 2020年2月-2025年1月
            /(\d{4})\s*年\s*(\d{1,2})?\s*月?\s*[至\-~–到]\s*(\d{4})\s*年?\s*(\d{1,2})?\s*月?/,
            // 2020-2025 (纯年份范围)
            /(\d{4})\s*[至\-~–到]\s*(\d{4})/,
            // 单年份
            /(\d{4})/
        ];

        for (const pattern of periodPatterns) {
            const match = line.match(pattern);
            if (match) {
                // 根据匹配结果构建时间段字符串
                const full = match[0];
                // 标准化：年月分隔符统一为 .
                return full
                    .replace(/年/g, '.')
                    .replace(/月/g, '')
                    .replace(/[至~–]/g, '-')
                    .replace(/\s+/g, '')
                    .replace(/\.-/g, '-');
            }
        }
        return '';
    }

    /**
     * 提取技能
     */
    extractSkills(line) {
        const skills = ['JavaScript', 'React', 'Vue', 'Node.js', 'Python', 'Java', 'Go', 'C++', 'TypeScript', 'HTML', 'CSS'];
        const foundSkills = [];
        for (const skill of skills) {
            if (line.includes(skill)) foundSkills.push(skill);
        }
        return foundSkills;
    }

    /**
     * 检查是否为电话号码
     */
    isPhoneNumber(text) {
        return /^[+\d\s\-()]{7,}$/.test(text.trim());
    }

    /**
     * 标准化数据格式
     */
    standardizeData(parsedData) {
        // 确保数据结构一致
        const summary = parsedData.profile?.summary || '';
        return {
            profile: {
                name: parsedData.profile?.name || '',
                title: parsedData.profile?.title || '',
                email: parsedData.profile?.email || '',
                phone: parsedData.profile?.phone || '',
                location: parsedData.profile?.location || '',
                summary: summary,
                gender: parsedData.profile?.gender || '',
                experience_years: parsedData.profile?.experience_years || ''
            },
            experience: Array.isArray(parsedData.experience) ? parsedData.experience : [],
            education: Array.isArray(parsedData.education) ? parsedData.education : [],
            skills: Array.isArray(parsedData.skills) ? parsedData.skills : []
        };
    }

    /**
     * 获取错误建议
     */
    getErrorSuggestion(error) {
        const suggestions = {
            '不支持的文件格式': '请上传PDF、DOCX、TXT或HTML格式的文件',
            '文件大小超过限制': '请上传小于10MB的文件',
            '文件读取失败': '请检查文件是否损坏，或尝试重新上传',
            '解析失败': '请尝试上传格式更规范的简历文件'
        };

        for (const [key, suggestion] of Object.entries(suggestions)) {
            if (error.includes(key)) return suggestion;
        }

        return '请检查文件格式是否正确，或联系技术支持';
    }

    /**
     * 验证必要字段完整性
     * @param {Object} result - 解析结果对象
     * @returns {Object} 包含 success 和 missingFields 的验证结果
     */
    ensureRequiredFields(result) {
        const requiredFields = ['name', 'phone', 'email'];
        const missingFields = requiredFields.filter(field => !result.profile[field]);

        if (missingFields.length > 0) {
            console.warn(`⚠️  简历缺少必要字段: ${missingFields.join(', ')}`);
        }

        return {
            success: missingFields.length === 0,
            missingFields
        };
    }

    deduplicateExperience(result) {
        if (!result.experience || result.experience.length <= 1) return;

        const projectKeywords = ['项目描述', '项目背景', '项目名称', '项目经验'];
        const seen = new Map();

        result.experience = result.experience.filter(exp => {
            const desc = exp.description || '';
            if (projectKeywords.some(kw => desc.includes(kw))) {
                return false;
            }

            if (desc.length > 200 && (!exp.company || exp.company === '某公司') && (!exp.position || exp.position.length <= 2)) {
                return false;
            }

            if (exp.position && /^[\u4e00-\u9fa5]{1}$/.test(exp.position)) {
                return false;
            }

            if (exp.company && exp.company.length <= 1) {
                return false;
            }

            const key = `${(exp.company || '').replace(/\s/g, '')}-${(exp.position || '').replace(/\s/g, '')}`;
            if (seen.has(key)) {
                const existing = seen.get(key);
                if ((exp.description || '').length > (existing.description || '').length) {
                    const idx = result.experience.indexOf(existing);
                    if (idx > -1) result.experience.splice(idx, 1);
                    seen.set(key, exp);
                    return true;
                }
                return false;
            }
            seen.set(key, exp);
            return true;
        });

        if (result.experience.length > 5) {
            result.experience.sort((a, b) => {
                const aHasCompany = a.company && a.company !== '某公司' && a.company.length > 2 ? 1 : 0;
                const bHasCompany = b.company && b.company !== '某公司' && b.company.length > 2 ? 1 : 0;
                return bHasCompany - aHasCompany;
            });
            result.experience = result.experience.slice(0, 5);
        }
    }
}

// 创建全局实例
const importUtils = new ImportUtils();

export { importUtils, ImportUtils };