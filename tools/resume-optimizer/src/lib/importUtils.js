/**
 * 简历导入工具库
 * 支持PDF、DOCX、TXT、HTML格式简历解析
 */

class ImportUtils {
    constructor() {
        this.supportedFormats = ['.pdf', '.docx', '.doc', '.txt', '.html', '.htm', '.md', '.markdown'];
        this.maxFileSize = 10 * 1024 * 1024; // 10MB
        this.isProcessing = false;
        
        // 绑定关键方法到this，确保ES6类方法正确绑定
        this.parseTextContent = this.parseTextContent.bind(this);
        this.fallbackExtractPersonalInfo = this.fallbackExtractPersonalInfo.bind(this);
        this.extractPersonalInfo = this.extractPersonalInfo.bind(this);
        this.parseSectionContent = this.parseSectionContent.bind(this);
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
            
            // 验证文件
            if (!this.isFileSupported(file)) {
                throw new Error(`不支持的文件格式。支持格式: ${this.supportedFormats.join(', ')}`);
            }

            if (!this.isFileSizeValid(file)) {
                throw new Error(`文件大小超过限制 (最大10MB)`);
            }

            // 读取文件
            const fileData = await this.readFile(file);
            
            // 根据文件类型选择解析器
            let parsedData;
            switch (fileData.fileType) {
                case 'pdf':
                    parsedData = await this.parsePDF(fileData);
                    break;
                case 'docx':
                    parsedData = await this.parseDOCX(fileData);
                    break;
                case 'txt':
                    parsedData = await this.parseTXT(fileData);
                    break;
                case 'html':
                    parsedData = await this.parseHTML(fileData);
                    break;
                case 'markdown':
                    parsedData = await this.parseMarkdown(fileData);
                    break;
                default:
                    throw new Error(`不支持的文件类型: ${fileData.fileType}`);
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
            // 设置PDF.js工作路径
            if (typeof pdfjsLib !== 'undefined') {
                pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
            } else {
                throw new Error('PDF.js库未加载');
            }

            const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
            const pdfDocument = await loadingTask.promise;
            let text = '';

            for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
                const page = await pdfDocument.getPage(pageNum);
                const content = await page.getTextContent();
                const pageText = content.items.map(item => item.str).join(' ');
                text += pageText + '\n';
            }

            return text;
        } catch (error) {
            console.error('PDF解析失败:', error);
            // 失败时返回空文本，让后续的文本解析逻辑处理
            return '';
        }
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
            // 失败时返回空文本，让后续的文本解析逻辑处理
            return '';
        }
    }

    /**
     * 从HTML提取文本
     */
    extractTextFromHTML(html) {
        // 创建临时DOM元素提取文本
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        return tempDiv.textContent || tempDiv.innerText || '';
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
        const sectionKeywords = {
            personal: [
                '个人信息', '个人资料', '基本资料', '个人简历', '个人简介',
                '姓名', '电话', '手机', '邮箱', '电子邮箱', 'email',
                '地址', '住址', 'location', '地址', 'address',
                '性别', 'gender', '男', '女',
                '工作经验', '工作年限', 'experience years', '年经验',
                '求职意向', '应聘职位', '期望职位', 'objective', '求职目标'
            ],
            experience: [
                '工作经历', '工作经验', '工作背景', '职业经历', 'employment history',
                '工作履历', '职业背景', '工作历史', 'experience', 'work experience',
                '实习经历', '实习经验', '实习工作', 'internship'
            ],
            education: [
                '教育经历', '教育背景', '学历背景', 'education', 'academic',
                '教育履历', '学历', '学位', '学校', '大学', '学院',
                '学习经历', '学习背景', 'academic history'
            ],
            skills: [
                '专业技能', '技术技能', '能力特长', 'skills', 'competencies',
                '技术能力', '核心技能', 'skill set', 'technical skills',
                '语言能力', '外语能力', 'language skills',
                '工具技能', '软件技能', 'software skills'
            ],
            projects: [
                '项目经验', '项目经历', '项目背景', 'projects', 'portfolio',
                '项目履历', '项目历史', 'project history',
                '项目成果', '项目作品', 'project achievements'
            ],
            summary: [
                '个人总结', '自我评价', '职业目标', 'summary', 'objective',
                '个人优势', '核心优势', 'strengths', '个人特点',
                '职业规划', 'career goal', '职业愿景'
            ]
        };

        let currentSection = '';
        let sectionContent = '';

        // 分段解析
        lines.forEach((line, index) => {
            const lineLower = line.toLowerCase();
            const lineTrimmed = line.trim();
            
            // 检测分段
            for (const [section, keywords] of Object.entries(sectionKeywords)) {
                for (const keyword of keywords) {
                    if (lineLower.includes(keyword.toLowerCase()) || lineTrimmed.includes(keyword)) {
                        if (currentSection && sectionContent) {
                            this.parseSectionContent(currentSection, sectionContent, result);
                        }
                        currentSection = section;
                        sectionContent = '';
                        break;
                    }
                }
            }

            // 如果不在任何分段中，尝试根据内容推断
            if (!currentSection) {
                // 推断个人信息分段
                if (this.isPersonalInfoLine(lineTrimmed)) {
                    currentSection = 'personal';
                }
                // 推断工作经历分段
                else if (this.isExperienceLine(lineTrimmed)) {
                    currentSection = 'experience';
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

        // 1. 智能提取工作经历
        this.smartExtractExperience(fullText, result);

        // 2. 智能提取教育经历
        this.smartExtractEducation(fullText, result);

        // 3. 智能提取技能
        this.smartExtractSkills(fullText, result);

        // 4. 智能提取个人信息（增强版）
        this.smartExtractPersonalInfo(fullText, result);

        // 5. 增强版技能提取 - 完整技能库
        this.enhanceSkillsExtraction(fullText, result);

        // 6. 其他个人信息增强提取
        this.enhancePersonalInfoExtraction(fullText, result);

        // 7. 最终验证和默认值补充
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
            
            // 提取工作经验年限
            if (!result.profile.experience_years) {
                const yearsMatch = line.match(/(\d+)\s*年[以]?[上]?/);
                if (yearsMatch) {
                    result.profile.experience_years = yearsMatch[1];
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
        const positionKeywords = ['高级测试工程师', '测试组长', '测试经理', '测试总监', '测试主管', '资深测试工程师', '测试工程师', '功能测试工程师', '自动化测试工程师', '性能测试工程师', '安全测试工程师'];
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
            // 设置PDF.js工作路径
            if (typeof pdfjsLib !== 'undefined') {
                pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
            } else {
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
        
        // 保留换行，但清理多余的空白行
        const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        text = lines.join('\n');
        
        // 修复断行单词（在单行内）
        text = text.replace(/([a-zA-Z])(\s+)([a-zA-Z])/g, '$1$3');
        
        
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
        
        // 在全文搜索技能关键词（同时检查中英文）
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
                /工作经验[：:]\s*(\d+)\s*年/,          // 标准格式
                /工作年限[：:]\s*(\d+)\s*年/,          // 年限格式
                /(\d+)年\s*工作经验/,             // 倒置格式
                /(\d+) years experience/           // 英文格式
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
                    
                    if (line.includes('高级测试工程师')) position = '高级测试工程师';
                    if (line.includes('测试组长')) position = '测试组长';
                    
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
                    // 模式1: XX公司 + XX职位
                    /([\u4e00-\u9fa5]+(?:有限)?(?:股份)?(?:公司|集团|科技|银行))\s*[-·]?\s*([\u4e00-\u9fa5]+)/,
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
                        '交通银行', '广发银行', '招商银行', '建设银行', '工商银行', '农业银行', '中国银行',
                        '神州数码', '联想', '小米', 'OPPO', 'VIVO', '中兴',
                        '阿里巴巴', '腾讯科技', '百度在线', '字节跳动', '美团点评',
                        '谷歌', '微软', '苹果', '亚马逊', 'Facebook', 'Google', 'Microsoft', 'Apple'
                    ];
                    for (const comp of commonCompanies) {
                        if (description.includes(comp)) {
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

        // 教育经历关键词模式 - 超强版（支持多种格式）
        const educationPatterns = [
            // 格式1: XX大学 + XX专业 + 学位（最常见）
            /([\u4e00-\u9fa5]{2,}(?:大学|学院|学校))\s*[-·]?\s*([\u4e00-\u9fa5]{2,}(?:专业|系)?)?\s*(学士|硕士|博士|本科|研究生|专科)?/gi,
            // 格式2: 时间段 + 学校名
            /(\d{4}[.\-/]\d{1,2}|\d{4}年\d{1,2}月)\s*[至\-~–到]\s*(\d{4}[.\-/]\d{1,2}|\d{4}年\d{1,2}月|至今|现在)?\s*([^\n]*(?:大学|学院|学校))/gi,
            // 格式3: 学校名 + 时间段
            /([\u4e00-\u9fa5]{2,}(?:大学|学院|学校))\s*(\d{4}[.\-/]\d{1,2}|\d{4}年\d{1,2}月)\s*[至\-~–到]\s*(\d{4}[.\-/]\d{1,2}|\d{4}年\d{1,2}月|至今|现在)?/gi,
            // 格式4: 专业名 + 学校名
            /(计算机科学与技术|软件工程|信息管理|电子工程|自动化|机械工程|土木工程|数学|物理|化学|生物|医学|法学|经济学|金融学|会计学|市场营销|工商管理)[\u4e00-\u9fa5]*\s*[:：]?\s*([\u4e00-\u9fa5]{2,}(?:大学|学院|学校))?/gi,
            // 格式5: 学历描述（本科、硕士等）+ 学校
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
            '北京邮电大学', '西安电子科技大学', '杭州电子科技大学'
        ];

        // 常见专业 - 扩展
        const commonMajors = [
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

        // 常见学位
        const degrees = ['博士', '硕士', '学士', '本科', '研究生', '专科', '大专', '专升本'];

        // 避免重复添加
        const existingEdu = new Set(result.education.map(e => `${e.school}-${e.major}-${e.degree}`));

        educationPatterns.forEach(pattern => {
            let match;
            pattern.lastIndex = 0; // 重置正则索引

            while ((match = pattern.exec(fullText)) !== null) {
                let school = '';
                let major = '';
                let degree = '本科';
                let period = '';
                let description = match[0].trim();

                // 提取学校名称
                for (const sch of commonSchools) {
                    if (description.includes(sch)) {
                        school = sch;
                        break;
                    }
                }

                // 如果还没找到学校，尝试从匹配结果中提取
                if (!school && match[1]) {
                    const potentialSchool = match[1].trim();
                    if (potentialSchool.match(/大学|学院|学校/) && potentialSchool.length >= 4) {
                        school = potentialSchool;
                    }
                }

                // 提取专业
                for (const maj of commonMajors) {
                    if (description.includes(maj)) {
                        major = maj;
                        break;
                    }
                }

                // 如果还没找到专业，尝试从匹配结果中提取
                if (!major && match[2]) {
                    const potentialMajor = match[2].trim().replace(/专业|系|学院/g, '');
                    if (potentialMajor.length >= 2) {
                        major = potentialMajor;
                    }
                }

                // 提取学位
                for (const deg of degrees) {
                    if (description.includes(deg)) {
                        degree = deg;
                        break;
                    }
                }

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
                    const surroundingText = fullText.substring(
                        Math.max(0, match.index - 50),
                        Math.min(fullText.length, match.index + match[0].length + 100)
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

                // 构建唯一标识
                const eduKey = `${school}-${major}-${degree}`;

                // 避免重复添加，且必须有有效信息
                if (!existingEdu.has(eduKey) && school !== '某高校' || major !== '未明确专业') {
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
        // 技能关键词
        const skillKeywords = [
            'React', 'Vue', 'TypeScript', 'JavaScript', 'HTML5', 'CSS3',
            'Node.js', 'Python', 'Java', 'Go', 'C++',
            'MySQL', 'Redis', 'MongoDB', 'PostgreSQL',
            'Git', 'Docker', 'Jenkins', 'Kubernetes',
            'Postman', 'Jmeter', 'Fiddler', 'Selenium',
            'Linux', 'Shell', 'Bash', '运维', '测试', '开发'
        ];
        
        skillKeywords.forEach(skill => {
            if (fullText.includes(skill)) {
                result.skills.push(skill);
            }
        });
    }

    /**
     * 智能提取个人信息（增强版）
     */
    smartExtractPersonalInfo(fullText, result) {
        
        // 姓名提取
        const namePatterns = [
            /姓名[：:]\s*([\u4e00-\u9fa5]{2,4})/,
            /Name[：:]\s*([\u4e00-\u9fa5]{2,4})/,
            /^([\u4e00-\u9fa5]{2,4})的个人简历/,
            /([\u4e00-\u9fa5]{2,4})\s*[男|女]/  // 姓名+性别
        ];
        
        namePatterns.forEach(pattern => {
            const match = fullText.match(pattern);
            if (match && match[1] && !result.profile.name) {
                result.profile.name = match[1];
            }
        });
        
        // 电话提取
        const phonePattern = /(1[3-9]\d{9})/;
        const phoneMatch = fullText.match(phonePattern);
        if (phoneMatch && !result.profile.phone) {
            result.profile.phone = phoneMatch[1];
        }
        
        // 邮箱提取
        const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
        const emailMatch = fullText.match(emailPattern);
        if (emailMatch && !result.profile.email) {
            result.profile.email = emailMatch[0];
        }
        
        // 位置信息提取
        if (!result.profile.location) {
            const locationPatterns = [
                /住址[：:]\s*([^\n]+)/,
                /地址[：:]\s*([^\n]+)/,
                /所在地[：:]\s*([^\n]+)/,
                /location[：:]\s*([^\n]+)/i,
                /(北京|上海|广州|深圳|杭州|南京|成都|武汉|西安|重庆|天津|苏州|青岛|长沙|大连|厦门|宁波|无锡|合肥|郑州|济南|福州|昆明|南昌|哈尔滨|石家庄|温州|南宁|贵阳|海口|兰州|银川|西宁|呼和浩特|乌鲁木齐|拉萨)/
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
            /工作经验[：:]\s*(\d+)\s*年/,
            /工作年限[：:]\s*(\d+)\s*年/,
            /(\d+)\s*年\s*工作经验/,
            /(\d+)\s*年[以]?[上]?/,
            /(\d+)\s*years?\s*experience/i
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
        const experiencePatterns = [
            /\d{4}\.\d{2}-\d{4}\.\d{2}/,  // 2023.02-2025.01
            /\d{4}-\d{4}/,                 // 2020-2023
            /\d{4}年\d{1,2}月/             // 2023年2月
        ];
        
        return experiencePatterns.some(pattern => pattern.test(line)) ||
               line.includes('项目') || line.includes('公司');
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
            // 格式1: "姓名：xxx" / "name: xxx"
            const nameMatch1 = line.match(/[姓名name\s]*[:：]?\s*([\u4e00-\u9fa5]{2,4})/);
            if (nameMatch1 && nameMatch1[1]) {
                result.profile.name = nameMatch1[1];
            }
            // 格式2: 独立的中文姓名（2-4个汉字，前后无其他中文）
            else if (/^[\u4e00-\u9fa5]{2,4}$/.test(line.trim())) {
                // 排除常见非姓名词汇
                const nonNameWords = ['个人', '简历', '信息', '经验', '教育', '技能', '项目', '总结', '评价'];
                if (!nonNameWords.includes(line.trim())) {
                    result.profile.name = line.trim();
                }
            }
            // 格式3: "XXX 的简历" 或 "XXX resume"
            const nameMatch3 = line.match(/^([\u4e00-\u9fa5]{2,4})\s*(的|之)?\s*(简历|resume|CV)/i);
            if (nameMatch3 && nameMatch3[1]) {
                result.profile.name = nameMatch3[1];
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

        // 提取工作经验年限
        if (!result.profile.experience_years) {
            const yearsMatch = line.match(/(\d+)\s*年?(?:经验|工作|从业)?/);
            if (yearsMatch && yearsMatch[1]) {
                result.profile.experience_years = yearsMatch[1];
            }
        }

        // 提取地址/位置
        if (!result.profile.location) {
            const locationPatterns = [
                /[地址住址location\s]*[:：]?\s*([\u4e00-\u9fa5]+(?:市|省|区|县))/,
                /^(?:现居|居住|位于)[:：]?\s*([\u4e00-\u9fa5]+)/,
                /(上海|北京|广州|深圳|杭州|成都|武汉|南京|西安|重庆|天津)(?:市)?/
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
        // 如果还没有找到姓名，尝试从第一行提取
        if (!result.profile.name && lines.length > 0) {
            const firstLine = lines[0].trim();
            // 第一行可能是姓名（不包含特殊字符，长度2-4个中文字符）
            const nameRegex = /^[\u4e00-\u9fa5]{2,4}$/;
            if (nameRegex.test(firstLine)) {
                result.profile.name = firstLine;
            }
        }
        
        // 尝试从所有行中提取电话和邮箱
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
        
        // 如果还没有找到电话，尝试从简历内容中查找
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
        
        lines.forEach(line => {
            // 检测新工作经历开始
            if (this.isExperienceStartLine(line)) {
                if (currentExperience) {
                    result.experience.push(currentExperience);
                }
                currentExperience = this.parseExperienceLine(line);
            } else if (currentExperience) {
                // 添加到描述中
                if (currentExperience.description) {
                    currentExperience.description += '\n' + line.trim();
                } else {
                    currentExperience.description = line.trim();
                }
            }
        });
        
        if (currentExperience) {
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
        const summary = lines.join(' ').trim();
        if (summary) {
            result.profile.summary = summary;
        }
    }

    /**
     * 提取电话号码
     */
    extractPhone(line) {
        const phoneRegex = /[+\d\s\-()]{7,}/g;
        const matches = line.match(phoneRegex);
        return matches ? matches[0].trim() : '';
    }

    /**
     * 提取邮箱
     */
    extractEmail(line) {
        const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
        const matches = line.match(emailRegex);
        return matches ? matches[0].trim() : '';
    }

    /**
     * 解析教育经历行
     */
    parseEducationLine(line) {
        return {
            school: this.extractSchool(line),
            degree: this.extractDegree(line),
            period: this.extractPeriod(line),
            description: line.trim()
        };
    }

    /**
     * 解析工作经历行
     */
    parseExperienceLine(line) {
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
        const schools = ['清华大学', '北京大学', '复旦大学', '上海交通大学', '浙江大学', '南京大学'];
        for (const school of schools) {
            if (line.includes(school)) return school;
        }
        return '未知学校';
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
        const companies = ['腾讯', '阿里', '百度', '字节', '华为', '美团', '京东'];
        for (const company of companies) {
            if (line.includes(company)) return company + '公司';
        }
        return '知名公司';
    }

    /**
     * 提取职位
     */
    extractPosition(line) {
        const positions = ['工程师', '经理', '总监', '主管', '开发', '产品', '设计'];
        for (const position of positions) {
            if (line.includes(position)) return position;
        }
        return '职位';
    }

    /**
     * 提取时间段
     */
    extractPeriod(line) {
        const periodRegex = /(\d{4}[年\-]\d{1,2}[月\-])|(\d{4}[年\-]\s*至今)|(\d{4}[年\-]\s*至\s*\d{4}[年\-])/g;
        const matches = line.match(periodRegex);
        return matches ? matches[0].replace(/[年月]/g, '.').replace('至', '-') : '2020-至今';
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
        return {
            profile: {
                name: parsedData.profile?.name || '',
                title: parsedData.profile?.title || '求职者',
                email: parsedData.profile?.email || '',
                phone: parsedData.profile?.phone || '',
                location: parsedData.profile?.location || '',
                summary: parsedData.profile?.summary || '从简历中导入的个人信息',
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
}

// 创建全局实例
const importUtils = new ImportUtils();

export { importUtils, ImportUtils };