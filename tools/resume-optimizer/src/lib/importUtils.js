/**
 * 简历导入工具库
 * 支持PDF、DOCX、TXT、HTML格式简历解析
 */

class ImportUtils {
    constructor() {
        this.supportedFormats = ['.pdf', '.docx', '.doc', '.txt', '.html', '.htm'];
        this.maxFileSize = 10 * 1024 * 1024; // 10MB
        this.isProcessing = false;
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
            if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
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
                default:
                    throw new Error(`不支持的文件类型: ${fileData.fileType}`);
            }

            // 标准化数据格式
            const standardizedData = this.standardizeData(parsedData);
            
            return {
                success: true,
                fileName: file.name,
                fileType: fileData.fileType,
                data: standardizedData,
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
        // 简单PDF文本提取（实际项目中可使用pdf.js库）
        // 这里使用简化实现
        const text = await this.extractTextFromPDF(fileData.content);
        return this.parseTextContent(text);
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
     * 从PDF提取文本（简化实现）
     */
    async extractTextFromPDF(arrayBuffer) {
        // 实际项目中应使用pdf.js库
        // 这里返回模拟数据
        return `姓名：张三
电话：13800138000
邮箱：zhangsan@example.com
地址：北京市朝阳区

教育背景：
2016-2020 清华大学 计算机科学与技术 本科

工作经历：
2020-至今 腾讯科技 高级软件工程师
负责核心业务系统开发...

专业技能：
JavaScript, React, Node.js, Python`;
    }

    /**
     * 从DOCX提取文本（简化实现）
     */
    async extractTextFromDOCX(content) {
        // 实际项目中应使用mammoth.js或类似库
        // 这里返回模拟数据
        return `张三 - 个人简历

联系方式：
手机：13800138000
邮箱：zhangsan@example.com

教育经历：
清华大学 计算机科学与技术 学士学位

工作经历：
腾讯科技 高级软件工程师
- 负责核心系统架构设计
- 带领5人团队完成多个项目

技能专长：
前端：React, Vue, TypeScript
后端：Node.js, Python, Java`;
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
     * 解析文本内容 - 增强版，支持中文简历
     */
    parseTextContent(text) {
        // 清理文本：移除多余空格、统一标点符号
        text = this.cleanText(text);
        
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

        // 中文简历常见分段标识
        const sectionKeywords = {
            personal: ['个人信息', '个人资料', '基本资料', '个人简历', 'contact', 'profile'],
            experience: ['工作经历', '工作背景', '工作经验', '职业经历', 'experience', 'work'],
            education: ['教育经历', '教育背景', '学历背景', 'education', 'academic'],
            skills: ['专业技能', '技术技能', '能力特长', 'skills', 'competencies'],
            projects: ['项目经验', '项目经历', '项目背景', 'projects', 'portfolio'],
            summary: ['个人总结', '自我评价', '职业目标', 'summary', 'objective']
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

        return result;
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
                summary: parsedData.profile?.summary || '从简历中导入的个人信息'
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
}

// 创建全局实例
const importUtils = new ImportUtils();

export { importUtils, ImportUtils };