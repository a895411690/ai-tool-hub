/**
 * Resume Preview Component
 * Renders the resume preview in real-time
 */

class ResumePreview {
    constructor() {
        this.container = document.getElementById('resumePreview');
        this.render();
        
        // Subscribe to store changes
        store.subscribe((state) => {
            this.update(state);
        });
    }

    render() {
        this.container.innerHTML = `
            <div class="resume-preview p-8" id="resumeContent">
                <!-- Header -->
                <header class="resume-header">
                    <h1 class="resume-name" id="previewName">姓名</h1>
                    <p class="resume-title" id="previewTitle">职位头衔</p>
                    <div class="resume-contact" id="previewContact">
                        <span><i class="fas fa-envelope mr-1"></i> <span id="previewEmail"></span></span>
                        <span><i class="fas fa-phone mr-1"></i> <span id="previewPhone"></span></span>
                        <span><i class="fas fa-map-marker-alt mr-1"></i> <span id="previewLocation"></span></span>
                    </div>
                </header>

                <!-- Summary -->
                <section class="resume-section" id="previewSummarySection">
                    <h2 class="resume-section-title">个人简介</h2>
                    <p class="text-gray-700 text-sm leading-relaxed" id="previewSummary"></p>
                </section>

                <!-- Experience -->
                <section class="resume-section" id="previewExperienceSection">
                    <h2 class="resume-section-title">工作经历</h2>
                    <div id="previewExperience"></div>
                </section>

                <!-- Education -->
                <section class="resume-section" id="previewEducationSection">
                    <h2 class="resume-section-title">教育背景</h2>
                    <div id="previewEducation"></div>
                </section>

                <!-- Skills -->
                <section class="resume-section" id="previewSkillsSection">
                    <h2 class="resume-section-title">技能专长</h2>
                    <div class="skills-list" id="previewSkills"></div>
                </section>
            </div>
        `;

        this.update(store.getState());
    }

    update(state) {
        // Update profile
        const nameEl = document.getElementById('previewName');
        const titleEl = document.getElementById('previewTitle');
        const emailEl = document.getElementById('previewEmail');
        const phoneEl = document.getElementById('previewPhone');
        const locationEl = document.getElementById('previewLocation');
        const summaryEl = document.getElementById('previewSummary');
        const summarySection = document.getElementById('previewSummarySection');

        if (nameEl) nameEl.textContent = state.profile.name || '姓名';
        if (titleEl) titleEl.textContent = state.profile.title || '职位头衔';
        if (emailEl) emailEl.textContent = state.profile.email || '';
        if (phoneEl) phoneEl.textContent = state.profile.phone || '';
        if (locationEl) locationEl.textContent = state.profile.location || '';
        if (summaryEl) summaryEl.textContent = state.profile.summary || '';
        if (summarySection) {
            summarySection.style.display = state.profile.summary ? 'block' : 'none';
        }

        // Update experience
        const experienceContainer = document.getElementById('previewExperience');
        const experienceSection = document.getElementById('previewExperienceSection');
        if (experienceContainer && experienceSection) {
            if (state.experience.length > 0) {
                experienceContainer.innerHTML = state.experience.map(exp => `
                    <div class="resume-item">
                        <div class="resume-item-header">
                            <div>
                                <div class="resume-item-title">${exp.position || '职位'}</div>
                                <div class="resume-item-subtitle">${exp.company || '公司'}</div>
                            </div>
                            <div class="resume-item-date">
                                ${exp.startDate || ''} - ${exp.endDate || '至今'}
                            </div>
                        </div>
                        ${exp.description ? `<p class="resume-item-description">${exp.description}</p>` : ''}
                    </div>
                `).join('');
                experienceSection.style.display = 'block';
            } else {
                experienceSection.style.display = 'none';
            }
        }

        // Update education
        const educationContainer = document.getElementById('previewEducation');
        const educationSection = document.getElementById('previewEducationSection');
        if (educationContainer && educationSection) {
            if (state.education.length > 0) {
                educationContainer.innerHTML = state.education.map(edu => `
                    <div class="resume-item">
                        <div class="resume-item-header">
                            <div>
                                <div class="resume-item-title">${edu.school || '学校'}</div>
                                <div class="resume-item-subtitle">${edu.degree || ''}${edu.field ? ` · ${edu.field}` : ''}</div>
                            </div>
                            <div class="resume-item-date">${edu.graduationDate || ''}</div>
                        </div>
                    </div>
                `).join('');
                educationSection.style.display = 'block';
            } else {
                educationSection.style.display = 'none';
            }
        }

        // Update skills
        const skillsContainer = document.getElementById('previewSkills');
        const skillsSection = document.getElementById('previewSkillsSection');
        if (skillsContainer && skillsSection) {
            if (state.skills.length > 0) {
                skillsContainer.innerHTML = state.skills.map(skill => `
                    <span class="skill-tag">${skill}</span>
                `).join('');
                skillsSection.style.display = 'block';
            } else {
                skillsSection.style.display = 'none';
            }
        }
    }
}

// Create global instance
const resumePreview = new ResumePreview();
