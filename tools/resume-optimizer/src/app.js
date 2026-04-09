/**
 * AI Resume Optimizer - Main Application
 * Entry point for the resume optimizer tool
 */

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 AI Resume Optimizer initialized');

    // 组件由各自的脚本自动初始化
    // - resumeForm
    // - resumePreview
    // - store（自动从 localStorage 加载）

    setupKeyboardShortcuts();
    setupAutoSaveIndicator();
    showWelcomeMessage();
    
    // 初始化简历导入功能
    setupResumeImport();
});

// 键盘快捷键
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + S 保存
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            store.save();
            showNotification('已保存到本地', 'success');
        }

        // Ctrl/Cmd + P 预览 PDF
        if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
            e.preventDefault();
            pdfGenerator.preview();
        }

        // Esc 关闭 AI 面板
        if (e.key === 'Escape') {
            aiOptimizer.closePanel();
        }
    });
}

// 自动保存指示器
function setupAutoSaveIndicator() {
    const indicator = document.createElement('div');
    indicator.id = 'autoSaveIndicator';
    indicator.className = 'fixed bottom-4 left-4 px-3 py-1.5 bg-gray-800 text-gray-400 text-xs rounded-lg opacity-0 transition-opacity';
    indicator.innerHTML = '<i class="fas fa-check-circle text-green-500 mr-1"></i> 已自动保存';
    document.body.appendChild(indicator);

    let saveTimeout;
    store.subscribe(() => {
        indicator.style.opacity = '1';
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
            indicator.style.opacity = '0';
        }, 2000);
    });
}

// 欢迎消息
function showWelcomeMessage() {
    const hasVisited = localStorage.getItem('resumeOptimizerVisited');
    if (!hasVisited) {
        setTimeout(() => {
            showNotification('欢迎使用 AI 简历优化工具！填写左侧表单，右侧实时预览', 'info');
            localStorage.setItem('resumeOptimizerVisited', 'true');
        }, 1000);
    }
}

// 简历导入功能
function setupResumeImport() {
    // 等待组件加载完成
    setTimeout(() => {
        const importBtn = document.getElementById('importResumeBtn');
        if (!importBtn) {
            console.warn('导入按钮未找到，可能是DOM未完全加载');
            setTimeout(setupResumeImport, 100); // 重试
            return;
        }

        // 初始化导入组件
        importBtn.addEventListener('click', () => {
            openResumeImport();
        });

        console.log('✅ 简历导入功能初始化完成');
    }, 500);
}

// 打开简历导入界面
function openResumeImport() {
    // 动态导入模块
    import('./components/importResume.js')
        .then(({ importResume }) => {
            // 初始化组件
            importResume.init('importResumeContainer');
            importResume.open();
            
            // 监听导入完成事件
            document.addEventListener('resumeImportComplete', handleResumeImportComplete);
        })
        .catch(error => {
            console.error('导入模块加载失败:', error);
            showNotification('简历导入功能加载失败，请刷新页面重试', 'error');
        });
}

// 处理简历导入完成事件
function handleResumeImportComplete(event) {
    const importedData = event.detail;
    
    console.log('📥 简历数据已导入:', importedData);
    
    // 更新简历表单数据
    updateResumeFormWithImportedData(importedData);
    
    // 显示成功消息
    showNotification('简历数据已成功导入！', 'success');
}

// 使用导入数据更新简历表单
function updateResumeFormWithImportedData(data) {
    if (!window.resumeForm || !window.store) {
        console.warn('简历表单或存储模块未初始化');
        return;
    }

    try {
        // 更新个人资料
        if (data.profile) {
            const profileFields = {
                profileName: data.profile.name,
                profileTitle: data.profile.title || '求职者',
                profileEmail: data.profile.email,
                profilePhone: data.profile.phone,
                profileLocation: data.profile.location,
                profileSummary: data.profile.summary
            };

            // 更新表单字段
            Object.entries(profileFields).forEach(([fieldId, value]) => {
                const field = document.getElementById(fieldId);
                if (field && value) {
                    field.value = value;
                    // 触发输入事件以更新状态
                    field.dispatchEvent(new Event('input', { bubbles: true }));
                }
            });
        }

        // 更新工作经历
        if (data.experience && data.experience.length > 0) {
            // 清空现有经历
            const experienceContainer = document.querySelector('[data-section="experience"]');
            if (experienceContainer) {
                experienceContainer.innerHTML = '';
            }

            // 添加新经历
            data.experience.forEach((exp, index) => {
                addExperienceItem(exp);
            });
        }

        // 更新教育经历
        if (data.education && data.education.length > 0) {
            // 清空现有教育经历
            const educationContainer = document.querySelector('[data-section="education"]');
            if (educationContainer) {
                educationContainer.innerHTML = '';
            }

            // 添加新教育经历
            data.education.forEach((edu, index) => {
                addEducationItem(edu);
            });
        }

        // 更新技能
        if (data.skills && data.skills.length > 0) {
            const skillsInput = document.getElementById('profileSkills');
            if (skillsInput) {
                skillsInput.value = data.skills.join(', ');
                skillsInput.dispatchEvent(new Event('input', { bubbles: true }));
            }
        }

        // 触发保存
        setTimeout(() => {
            if (window.store && typeof window.store.save === 'function') {
                window.store.save();
            }
        }, 100);

        console.log('✅ 简历表单已更新');
    } catch (error) {
        console.error('更新简历表单失败:', error);
        showNotification('导入数据更新表单时出错', 'error');
    }
}

// 添加工作经历项
function addExperienceItem(experience) {
    if (!window.resumeForm || typeof window.resumeForm.addExperience !== 'function') {
        console.warn('resumeForm.addExperience 方法不可用');
        return;
    }

    try {
        const expData = {
            company: experience.company || '公司名称',
            position: experience.position || '职位',
            period: experience.period || '2020-至今',
            description: experience.description || '工作描述'
        };

        window.resumeForm.addExperience(expData);
    } catch (error) {
        console.error('添加工作经历失败:', error);
    }
}

// 添加教育经历项
function addEducationItem(education) {
    if (!window.resumeForm || typeof window.resumeForm.addEducation !== 'function') {
        console.warn('resumeForm.addEducation 方法不可用');
        return;
    }

    try {
        const eduData = {
            school: education.school || '学校名称',
            degree: education.degree || '学位',
            period: education.period || '2016-2020',
            description: education.description || '教育描述'
        };

        window.resumeForm.addEducation(eduData);
    } catch (error) {
        console.error('添加教育经历失败:', error);
    }
}

// 显示通知（使用 DOM API + textContent 防止 XSS）
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 fade-in ${
        type === 'success' ? 'bg-green-500' :
        type === 'error' ? 'bg-red-500' : 'bg-indigo-500'
    } text-white`;

    const wrapper = document.createElement('div');
    wrapper.className = 'flex items-center gap-2';

    const icon = document.createElement('i');
    icon.className = `fas ${
        type === 'success' ? 'fa-check-circle' :
        type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'
    }`;
    wrapper.appendChild(icon);

    const textSpan = document.createElement('span');
    textSpan.textContent = message; // 安全：使用 textContent
    wrapper.appendChild(textSpan);

    notification.appendChild(wrapper);
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(10px)';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// 导出为全局访问
window.showNotification = showNotification;
