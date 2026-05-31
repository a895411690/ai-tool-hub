/**
 * Deep Research Agent Module
 * Conducts multi-source research, synthesizes findings into structured reports.
 * Uses free public APIs: Wikipedia, DuckDuckGo Instant Answer, Open Library, etc.
 */
import { escapeHtml, showToast } from './utils.js';

// ── Utility ────────────────────────────────────────────────────────────────

function $(sel, ctx = document) { return ctx.querySelector(sel); }

function $$(sel, ctx = document) { return ctx.querySelectorAll(sel); }

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

const RESEARCH_CATEGORIES = [
  { id: 'general', label: '通用研究', icon: 'fa-globe' },
  { id: 'technology', label: '科技', icon: 'fa-microchip' },
  { id: 'science', label: '科学', icon: 'fa-flask' },
  { id: 'business', label: '商业', icon: 'fa-chart-line' },
  { id: 'health', label: '健康/医学', icon: 'fa-heart-pulse' },
  { id: 'history', label: '历史/文化', icon: 'fa-landmark' },
  { id: 'education', label: '教育', icon: 'fa-graduation-cap' },
];

const DEPTH_LEVELS = [
  { id: 'quick', label: '快速', desc: '3-5个要点，快速概览', icon: 'fa-bolt', steps: 2 },
  { id: 'standard', label: '标准', desc: '完整报告，引用来源', icon: 'fa-layer-group', steps: 4 },
  { id: 'deep', label: '深度', desc: '深入分析，多角度研究', icon: 'fa-mountain', steps: 6 },
];

// ── Research state ─────────────────────────────────────────────────────────

const researchState = {
  topic: '',
  category: 'general',
  depth: 'standard',
  isRunning: false,
  currentStep: 0,
  totalSteps: 0,
  results: null,
  error: null,
};

// ── API sources ────────────────────────────────────────────────────────────

/**
 * Fetch Wikipedia summary for a topic
 */
async function fetchWikipedia(topic) {
  try {
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(topic)}`;
    const resp = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!resp.ok) return null;
    const data = await resp.json();
    if (data.type === 'disambiguation') return null;
    return {
      title: data.title,
      extract: data.extract,
      url: data.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(topic)}`,
      thumbnail: data.thumbnail?.source || null,
    };
  } catch {
    return null;
  }
}

/**
 * Fetch Wikipedia search results for broader context
 */
async function fetchWikipediaSearch(query, limit = 5) {
  try {
    const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*&srlimit=${limit}`;
    const resp = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!resp.ok) return [];
    const data = await resp.json();
    return (data.query?.search || []).map(r => ({
      title: r.title,
      snippet: r.snippet.replace(/<\/?[^>]+(>|$)/g, ''),
      pageId: r.pageid,
    }));
  } catch {
    return [];
  }
}

/**
 * Fetch Wikipedia full content for deeper research
 */
async function fetchWikipediaContent(pageTitle) {
  try {
    const url = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exintro&explaintext&titles=${encodeURIComponent(pageTitle)}&format=json&origin=*`;
    const resp = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!resp.ok) return '';
    const data = await resp.json();
    const pages = data.query?.pages || {};
    const page = Object.values(pages)[0];
    return page?.extract || '';
  } catch {
    return '';
  }
}

/**
 * Fetch from DuckDuckGo Instant Answer API
 */
async function fetchDuckDuckGo(query) {
  try {
    const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
    const resp = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!resp.ok) return null;
    const data = await resp.json();
    return {
      abstract: data.AbstractText || null,
      source: data.AbstractSource || null,
      url: data.AbstractURL || null,
      answer: data.Answer || null,
      definition: data.Definition || null,
      infobox: data.Infobox ? data.Infobox.content?.slice(0, 8) : null,
      relatedTopics: (data.RelatedTopics || []).slice(0, 5).map(t => ({
        text: t.Text || t.text || '',
        url: t.FirstURL || t.url || '',
      })),
    };
  } catch {
    return null;
  }
}

/**
 * Generate search-like terms from a topic
 */
function generateSubtopics(topic, category) {
  const prefixes = {
    general: ['overview', 'history', 'key concepts', 'applications', 'criticism', 'future outlook'],
    technology: ['architecture', 'history', 'key technologies', 'applications', 'industry impact', 'future trends'],
    science: ['fundamentals', 'history', 'key discoveries', 'current research', 'applications', 'open questions'],
    business: ['overview', 'history', 'market analysis', 'key players', 'challenges', 'future outlook'],
    health: ['overview', 'causes', 'symptoms', 'treatments', 'prevention', 'research'],
    history: ['origins', 'key events', 'major figures', 'timeline', 'impact', 'legacy'],
    education: ['overview', 'history', 'methodologies', 'key theories', 'applications', 'future trends'],
  };
  const cats = prefixes[category] || prefixes.general;
  return cats.map(p => `${topic} ${p}`);
}

// ── Research engine ────────────────────────────────────────────────────────

async function runResearch(topic, category, depth) {
  const depthConfig = DEPTH_LEVELS.find(d => d.id === depth) || DEPTH_LEVELS[1];
  const subtopics = generateSubtopics(topic, category);
  const numSubtopicSources = Math.min(subtopics.length, depthConfig.steps);
  const selectedSubtopics = subtopics.slice(0, numSubtopicSources);

  const totalSteps = 1 + selectedSubtopics.length + 1; // init + subtopics + synthesis
  researchState.totalSteps = totalSteps;

  const findings = [];
  const sources = new Set();
  let mainSummary = null;

  // Step 1: Fetch main Wikipedia page
  researchState.currentStep = 1;
  updateStepProgress('正在获取百科概述...', 1, totalSteps);
  const wiki = await fetchWikipedia(topic);
  if (wiki) {
    mainSummary = wiki.extract;
    sources.add({ title: wiki.title, url: wiki.url, type: 'Wikipedia' });
  }

  // Also search for the topic
  const searchResults = await fetchWikipediaSearch(topic, 5);
  for (const sr of searchResults.slice(0, 3)) {
    sources.add({ title: sr.title, url: `https://en.wikipedia.org/wiki/${encodeURIComponent(sr.title)}`, type: 'Wikipedia' });
  }

  // Step 2: Fetch DuckDuckGo
  researchState.currentStep = 2;
  updateStepProgress('正在搜索即时信息...', 2, totalSteps);
  const ddg = await fetchDuckDuckGo(topic);
  if (ddg?.abstract) {
    findings.push({ type: 'abstract', content: ddg.abstract, source: ddg.source });
    if (ddg.url) sources.add({ title: ddg.source || topic, url: ddg.url, type: 'DuckDuckGo' });
  }

  // Steps 3-N: Explore subtopics
  for (let i = 0; i < selectedSubtopics.length; i++) {
    const stepNum = 3 + i;
    researchState.currentStep = stepNum;
    updateStepProgress(`正在深入探索: ${selectedSubtopics[i]}...`, stepNum, totalSteps);

    const subWiki = await fetchWikipedia(selectedSubtopics[i]);
    if (subWiki?.extract) {
      findings.push({ type: 'subtopic', subtopic: selectedSubtopics[i], content: subWiki.extract });
      sources.add({ title: subWiki.title, url: subWiki.url, type: 'Wikipedia' });
    } else {
      // Try the Wikipedia search as fallback
      const subSearch = await fetchWikipediaSearch(selectedSubtopics[i], 2);
      for (const sr of subSearch) {
        const content = await fetchWikipediaContent(sr.title);
        if (content) {
          findings.push({ type: 'subtopic', subtopic: selectedSubtopics[i], content: content.slice(0, 1000) });
          sources.add({ title: sr.title, url: `https://en.wikipedia.org/wiki/${encodeURIComponent(sr.title)}`, type: 'Wikipedia' });
        }
      }
    }

    // Small delay to be polite to APIs
    if (i < selectedSubtopics.length - 1) await sleep(300);
  }

  // Step N+1: Synthesize
  researchState.currentStep = totalSteps;
  updateStepProgress('正在综合生成研究报告...', totalSteps, totalSteps);
  await sleep(500); // Simulate processing time

  const report = synthesizeReport(topic, mainSummary, findings, [...sources], ddg);

  return {
    topic,
    category,
    depth,
    report,
    sources: [...sources],
    findings,
    mainSummary,
    timestamp: new Date().toISOString(),
  };
}

// ── Report synthesis ───────────────────────────────────────────────────────

function synthesizeReport(topic, mainSummary, findings, sources, ddg) {
  const now = new Date();
  const dateStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;

  // Build executive summary
  let execSummary = mainSummary
    ? mainSummary.length > 500
      ? mainSummary.slice(0, 500) + '...'
      : mainSummary
    : `对"${topic}"的全面研究报告。通过分析多个来源，本报告提供了关于该主题的深度洞察和综合分析。`;

  // Build key findings from subtopic research
  const keyFindings = findings
    .filter(f => f.content && f.content.length > 50)
    .slice(0, 8)
    .map((f, i) => {
      const label = f.subtopic || (f.type === 'abstract' ? '概述' : `发现 ${i + 1}`);
      const text = f.content.length > 300 ? f.content.slice(0, 300) + '...' : f.content;
      return { label, text };
    });

  // Build analysis sections
  const sections = [];
  if (mainSummary) {
    sections.push({
      title: '概述',
      icon: 'fa-info-circle',
      content: mainSummary.length > 1500 ? mainSummary.slice(0, 1500) + '...' : mainSummary,
    });
  }

  if (ddg?.infobox) {
    sections.push({
      title: '关键数据',
      icon: 'fa-table',
      content: ddg.infobox.map(i => `**${i.label}**: ${i.value || i.name || ''}`).join('\n'),
    });
  }

  if (findings.some(f => f.type === 'subtopic')) {
    const subSections = findings.filter(f => f.type === 'subtopic' && f.content);
    for (const sub of subSections.slice(0, 4)) {
      sections.push({
        title: sub.subtopic.replace(topic, '').trim() || sub.subtopic,
        icon: 'fa-lightbulb',
        content: sub.content.length > 800 ? sub.content.slice(0, 800) + '...' : sub.content,
      });
    }
  }

  if (keyFindings.length > 0) {
    sections.push({
      title: '综合分析与洞察',
      icon: 'fa-chart-simple',
      content: keyFindings.map((kf, i) =>
        `${i + 1}. **${kf.label}**: ${kf.text}`
      ).join('\n\n'),
    });
  }

  sections.push({
    title: '结论与展望',
    icon: 'fa-flag-checkered',
    content: `通过对"${topic}"的多维度研究，本报告汇集了来自Wikipedia、DuckDuckGo Instant Answer等多个公开知识来源的信息。` +
      `研究发现${topic}涉及多个关键领域和子主题，以上分析提供了该主题的基础框架和核心洞察。` +
      `建议结合更多专业资料（学术论文、行业报告、权威出版物）进行深入研究和验证。`,
  });

  return { execSummary, keyFindings, sections, dateStr };
}

// ── UI Rendering ──────────────────────────────────────────────────────────

function renderResearchPage() {
  const content = document.getElementById('mainContent');
  if (!content) return;
  researchState.isRunning = false;
  researchState.results = null;

  content.innerHTML = `
    <div class="research-page" style="max-width:900px;margin:0 auto;padding:20px 16px 80px;">
      <div class="research-header" style="text-align:center;margin-bottom:28px;position:relative;">
        <button id="researchBackBtn" style="position:absolute;left:0;top:0;padding:6px 12px;border-radius:6px;border:1px solid var(--border-color);background:var(--bg-container);color:var(--text-secondary);font-size:12px;cursor:pointer;display:flex;align-items:center;gap:4px;transition:all .2s;" onmouseover="this.style.borderColor='var(--color-primary)';this.style.color='var(--color-primary)'" onmouseout="this.style.borderColor='var(--border-color)';this.style.color='var(--text-secondary)'">
          <i class="fas fa-arrow-left"></i> 返回首页
        </button>
        <div style="font-size:40px;margin-bottom:8px;">
          <i class="fas fa-microscope" style="color:var(--color-primary);"></i>
        </div>
        <h1 style="font-size:24px;font-weight:700;margin:0 0 4px;color:var(--text-primary);">
          Deep Research Agent
        </h1>
        <p style="margin:0;font-size:14px;color:var(--text-tertiary);">
          多源智能深度研究助手 — 输入主题，自动获取百科信息和网络资料，生成结构化研究报告
        </p>
      </div>

      <!-- Input section -->
      <div class="research-input-section" style="background:var(--bg-container);border:1px solid var(--border-color);border-radius:12px;padding:24px;margin-bottom:20px;">
        <div style="margin-bottom:16px;">
          <label style="display:block;font-size:14px;font-weight:500;margin-bottom:6px;color:var(--text-secondary);">
            研究主题 <span style="color:var(--color-error);">*</span>
          </label>
          <div style="position:relative;">
            <input id="researchTopicInput" type="text" placeholder="输入您想研究的话题，例如：Quantum Computing, CRISPR, 气候变化..." 
              style="width:100%;padding:12px 16px;border-radius:8px;border:1px solid var(--input-border);background:var(--input-bg);color:var(--text-primary);font-size:15px;outline:none;box-sizing:border-box;"
              onfocus="this.style.borderColor='var(--color-primary)';this.style.boxShadow='var(--input-focus-shadow)'"
              onblur="this.style.borderColor='var(--input-border)';this.style.boxShadow='none'"
            >
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">
          <div>
            <label style="display:block;font-size:13px;font-weight:500;margin-bottom:4px;color:var(--text-secondary);">研究类别</label>
            <select id="researchCategorySelect" style="width:100%;padding:10px 12px;border-radius:8px;border:1px solid var(--input-border);background:var(--input-bg);color:var(--text-primary);font-size:14px;outline:none;cursor:pointer;">
              ${RESEARCH_CATEGORIES.map(c =>
                `<option value="${c.id}">${c.label}</option>`
              ).join('')}
            </select>
          </div>
          <div>
            <label style="display:block;font-size:13px;font-weight:500;margin-bottom:4px;color:var(--text-secondary);">研究深度</label>
            <select id="researchDepthSelect" style="width:100%;padding:10px 12px;border-radius:8px;border:1px solid var(--input-border);background:var(--input-bg);color:var(--text-primary);font-size:14px;outline:none;cursor:pointer;">
              ${DEPTH_LEVELS.map(d =>
                `<option value="${d.id}" ${d.id === 'standard' ? 'selected' : ''}>${d.label} — ${d.desc}</option>`
              ).join('')}
            </select>
          </div>
        </div>

        <div style="display:flex;gap:10px;">
          <button id="researchStartBtn" style="flex:1;padding:12px 20px;border:none;border-radius:8px;background:var(--color-primary);color:#fff;font-size:15px;font-weight:500;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;transition:all .2s;"
            onmouseover="this.style.opacity='0.9'" onmouseout="this.style.opacity='1'">
            <i class="fas fa-flask"></i> 开始研究
          </button>
          <button id="researchClearBtn" style="padding:12px 20px;border-radius:8px;border:1px solid var(--border-color);background:var(--bg-container);color:var(--text-secondary);font-size:14px;cursor:pointer;transition:all .2s;"
            onmouseover="this.style.borderColor='var(--color-primary)'" onmouseout="this.style.borderColor='var(--border-color)'">
            <i class="fas fa-eraser"></i>
          </button>
        </div>
      </div>

      <!-- Progress section (hidden by default) -->
      <div id="researchProgress" style="display:none;background:var(--bg-container);border:1px solid var(--border-color);border-radius:12px;padding:24px;margin-bottom:20px;">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
          <div id="researchProgressSpinner" style="width:20px;height:20px;border:2px solid var(--border-color);border-top-color:var(--color-primary);border-radius:50%;animation:research-spin 0.8s linear infinite;"></div>
          <div>
            <div style="font-size:14px;font-weight:500;color:var(--text-primary);" id="researchProgressLabel">正在初始化...</div>
            <div style="font-size:12px;color:var(--text-tertiary);" id="researchProgressStep">步骤 0/0</div>
          </div>
        </div>
        <div style="height:6px;background:var(--border-color);border-radius:3px;overflow:hidden;">
          <div id="researchProgressBar" style="height:100%;width:0%;background:linear-gradient(90deg,var(--color-primary),var(--color-primary-hover));border-radius:3px;transition:width .4s ease;"></div>
        </div>
      </div>

      <!-- Results section (hidden by default) -->
      <div id="researchResults" style="display:none;"></div>

      <!-- Error section (hidden by default) -->
      <div id="researchError" style="display:none;background:var(--bg-container);border:1px solid #ff4d4f;border-radius:12px;padding:24px;text-align:center;">
        <i class="fas fa-exclamation-triangle" style="font-size:32px;color:var(--color-error);margin-bottom:8px;"></i>
        <div id="researchErrorMessage" style="font-size:14px;color:var(--text-secondary);"></div>
      </div>

      <!-- Examples / Tips -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:8px;margin-top:12px;">
        ${['Artificial Intelligence', 'Climate Change', 'CRISPR Gene Editing', 'Quantum Computing', 'Renaissance Art', 'Blockchain'].map(ex =>
          `<button class="research-example-btn" data-topic="${escapeHtml(ex)}" style="padding:8px 14px;border-radius:20px;border:1px solid var(--border-color);background:var(--bg-container);color:var(--text-tertiary);font-size:12px;cursor:pointer;transition:all .2s;text-align:left;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;"
            onmouseover="this.style.borderColor='var(--color-primary)';this.style.color='var(--color-primary)'"
            onmouseout="this.style.borderColor='var(--border-color)';this.style.color='var(--text-tertiary)'">
            <i class="fas fa-magnifying-glass" style="margin-right:4px;"></i> ${ex}
          </button>`
        ).join('')}
      </div>
    </div>

    <style>
      @keyframes research-spin { to { transform: rotate(360deg); } }
      .research-page input:focus, .research-page select:focus { border-color:var(--color-primary); box-shadow:var(--input-focus-shadow); }
    </style>
  `;

  // Bind event handlers
  const startBtn = document.getElementById('researchStartBtn');
  const clearBtn = document.getElementById('researchClearBtn');
  const topicInput = document.getElementById('researchTopicInput');

  startBtn?.addEventListener('click', () => startResearch());
  // Back to home
  const backBtn = document.getElementById('researchBackBtn');
  backBtn?.addEventListener('click', () => {
    window.location.reload();
  });
  clearBtn?.addEventListener('click', () => {
    if (researchState.isRunning) return;
    topicInput.value = '';
    const err = document.getElementById('researchError');
    if (err) err.style.display = 'none';
    const results = document.getElementById('researchResults');
    if (results) results.style.display = 'none';
    const progress = document.getElementById('researchProgress');
    if (progress) progress.style.display = 'none';
  });
  topicInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') startResearch();
  });

  // Example buttons
  $$('.research-example-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (researchState.isRunning) return;
      const topic = btn.dataset.topic;
      if (topicInput) topicInput.value = topic;
      startResearch();
    });
  });
}

// ── Research workflow ──────────────────────────────────────────────────────

function updateStepProgress(label, current, total) {
  const labelEl = document.getElementById('researchProgressLabel');
  const stepEl = document.getElementById('researchProgressStep');
  const barEl = document.getElementById('researchProgressBar');
  const progress = document.getElementById('researchProgress');

  if (progress) progress.style.display = 'block';
  if (labelEl) labelEl.textContent = label;
  if (stepEl) stepEl.textContent = `步骤 ${current}/${total}`;
  if (barEl) barEl.style.width = `${Math.round((current / total) * 100)}%`;
}

async function startResearch() {
  if (researchState.isRunning) return;

  const topicInput = document.getElementById('researchTopicInput');
  const categorySelect = document.getElementById('researchCategorySelect');
  const depthSelect = document.getElementById('researchDepthSelect');
  const errorEl = document.getElementById('researchError');
  const errorMsg = document.getElementById('researchErrorMessage');
  const resultsEl = document.getElementById('researchResults');
  const startBtn = document.getElementById('researchStartBtn');

  const topic = topicInput?.value?.trim();
  if (!topic) {
    if (errorEl) errorEl.style.display = 'block';
    if (errorMsg) errorMsg.textContent = '请输入研究主题';
    topicInput?.focus();
    return;
  }

  researchState.isRunning = true;
  researchState.topic = topic;
  researchState.category = categorySelect?.value || 'general';
  researchState.depth = depthSelect?.value || 'standard';
  researchState.results = null;
  researchState.error = null;

  if (errorEl) errorEl.style.display = 'none';
  if (resultsEl) { resultsEl.style.display = 'none'; resultsEl.innerHTML = ''; }

  // Disable controls during research
  if (startBtn) {
    startBtn.disabled = true;
    startBtn.style.opacity = '0.6';
    startBtn.style.cursor = 'not-allowed';
    startBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 研究中...';
  }
  if (topicInput) topicInput.disabled = true;
  if (categorySelect) categorySelect.disabled = true;
  if (depthSelect) depthSelect.disabled = true;

  try {
    const result = await runResearch(topic, researchState.category, researchState.depth);
    researchState.results = result;
    renderResearchResults(result);
  } catch (err) {
    researchState.error = err.message || '研究过程出现异常';
    if (errorEl) errorEl.style.display = 'block';
    if (errorMsg) errorMsg.textContent = researchState.error;
    if (resultsEl) resultsEl.style.display = 'none';
  } finally {
    researchState.isRunning = false;
    // Hide progress
    const progress = document.getElementById('researchProgress');
    if (progress) progress.style.display = 'none';

    // Re-enable controls
    if (startBtn) {
      startBtn.disabled = false;
      startBtn.style.opacity = '1';
      startBtn.style.cursor = 'pointer';
      startBtn.innerHTML = '<i class="fas fa-flask"></i> 开始研究';
    }
    if (topicInput) topicInput.disabled = false;
    if (categorySelect) categorySelect.disabled = false;
    if (depthSelect) depthSelect.disabled = false;
  }
}

// ── Results rendering ─────────────────────────────────────────────────────

function renderResearchResults(result) {
  const container = document.getElementById('researchResults');
  if (!container) return;

  const { topic, report, sources, depth, timestamp } = result;
  const sectionTabs = ['report', 'sources'];

  // Escape text for safe HTML
  const esc = (s) => escapeHtml(s || '');

  const sectionsHtml = report.sections.map((s, i) => `
    <div class="research-section" style="margin-bottom:20px;">
      <h3 style="font-size:16px;font-weight:600;margin:0 0 10px;padding:0 0 8px;border-bottom:1px solid var(--border-color);display:flex;align-items:center;gap:8px;color:var(--text-primary);">
        <i class="fas ${s.icon}" style="color:var(--color-primary);font-size:14px;"></i>
        ${esc(s.title)}
      </h3>
      <div style="font-size:14px;line-height:1.7;color:var(--text-secondary);white-space:pre-wrap;">
        ${formatReportContent(s.content)}
      </div>
    </div>
  `).join('');

  const keyFindingsHtml = report.keyFindings.slice(0, 6).map((kf, i) => `
    <div style="display:flex;gap:10px;padding:10px 12px;margin-bottom:8px;background:var(--bg-body);border-radius:8px;border-left:3px solid var(--color-primary);">
      <span style="flex-shrink:0;width:22px;height:22px;display:flex;align-items:center;justify-content:center;border-radius:50%;background:var(--color-primary);color:#fff;font-size:11px;font-weight:600;">${i + 1}</span>
      <div>
        <div style="font-weight:500;font-size:13px;margin-bottom:2px;color:var(--text-primary);">${esc(kf.label)}</div>
        <div style="font-size:13px;color:var(--text-tertiary);line-height:1.5;">${esc(kf.text)}</div>
      </div>
    </div>
  `).join('');

  const sourcesHtml = sources.map(s => `
    <a href="${esc(s.url)}" target="_blank" rel="noopener" style="display:flex;align-items:center;gap:8px;padding:8px 12px;text-decoration:none;border-radius:6px;transition:background .15s;" onmouseover="this.style.background='var(--bg-body)'" onmouseout="this.style.background='transparent'">
      <i class="fas fa-external-link-alt" style="font-size:10px;color:var(--color-primary);flex-shrink:0;"></i>
      <span style="font-size:13px;color:var(--text-link);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(s.title)}</span>
      <span style="font-size:11px;color:var(--text-tertiary);flex-shrink:0;">${esc(s.type)}</span>
    </a>
  `).join('');

  container.innerHTML = `
    <div class="research-results-panel" style="background:var(--bg-container);border:1px solid var(--border-color);border-radius:12px;overflow:hidden;">

      <!-- Report header -->
      <div style="padding:24px 24px 16px;border-bottom:1px solid var(--border-color);">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap;">
          <div style="flex:1;min-width:0;">
            <h2 style="font-size:20px;font-weight:700;margin:0 0 4px;color:var(--text-primary);display:flex;align-items:center;gap:8px;">
              <i class="fas fa-file-lines" style="color:var(--color-primary);font-size:18px;"></i>
              ${esc(topic)}
            </h2>
            <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;font-size:12px;color:var(--text-tertiary);">
              <span><i class="fas fa-calendar"></i> ${report.dateStr}</span>
              <span>·</span>
              <span><i class="fas fa-gauge-high"></i> ${DEPTH_LEVELS.find(d => d.id === depth)?.label || depth}</span>
              <span>·</span>
              <span><i class="fas fa-link"></i> ${sources.length} 个来源</span>
            </div>
          </div>
          <button id="exportResearchBtn" style="padding:8px 16px;border-radius:6px;border:1px solid var(--border-color);background:var(--bg-container);color:var(--text-secondary);font-size:13px;cursor:pointer;display:flex;align-items:center;gap:6px;transition:all .2s;flex-shrink:0;"
            onmouseover="this.style.borderColor='var(--color-primary)';this.style.color='var(--color-primary)'"
            onmouseout="this.style.borderColor='var(--border-color)';this.style.color='var(--text-secondary)'">
            <i class="fas fa-copy"></i> 复制报告
          </button>
        </div>
      </div>

      <!-- Tabs -->
      <div id="researchTabBar" style="display:flex;border-bottom:1px solid var(--border-color);padding:0 16px;">
        <button class="research-tab active" data-tab="report" style="flex:1;padding:12px 8px;border:none;background:none;color:var(--color-primary);font-size:14px;font-weight:500;cursor:pointer;border-bottom:2px solid var(--color-primary);transition:all .2s;">
          <i class="fas fa-file-alt"></i> 研究报告
        </button>
        <button class="research-tab" data-tab="sources" style="flex:1;padding:12px 8px;border:none;background:none;color:var(--text-tertiary);font-size:14px;cursor:pointer;border-bottom:2px solid transparent;transition:all .2s;">
          <i class="fas fa-bookmark"></i> 资料来源 (${sources.length})
        </button>
      </div>

      <!-- Tab content -->
      <div id="researchTabContent" style="padding:20px 24px;">
        <!-- Report tab -->
        <div class="research-tab-panel" data-panel="report">
          <!-- Executive Summary -->
          <div style="margin-bottom:24px;padding:16px;background:linear-gradient(135deg, rgba(22,119,255,0.05), rgba(22,119,255,0.02));border-radius:10px;border:1px solid rgba(22,119,255,0.1);">
            <h3 style="font-size:14px;font-weight:600;margin:0 0 8px;color:var(--color-primary);display:flex;align-items:center;gap:6px;">
              <i class="fas fa-star"></i> 执行摘要
            </h3>
            <p style="font-size:14px;line-height:1.7;margin:0;color:var(--text-secondary);">
              ${esc(report.execSummary)}
            </p>
          </div>

          <!-- Key Findings -->
          <div style="margin-bottom:24px;">
            <h3 style="font-size:15px;font-weight:600;margin:0 0 12px;color:var(--text-primary);display:flex;align-items:center;gap:6px;">
              <i class="fas fa-list-check" style="color:var(--color-primary);"></i> 关键发现
            </h3>
            ${keyFindingsHtml}
          </div>

          <!-- Detailed Sections -->
          <div>
            <h3 style="font-size:15px;font-weight:600;margin:0 0 12px;color:var(--text-primary);display:flex;align-items:center;gap:6px;">
              <i class="fas fa-book-open" style="color:var(--color-primary);"></i> 详细分析
            </h3>
            ${sectionsHtml}
          </div>
        </div>

        <!-- Sources tab -->
        <div class="research-tab-panel" data-panel="sources" style="display:none;">
          <p style="font-size:13px;color:var(--text-tertiary);margin:0 0 12px;">
            以下为本研究引用的资料来源，点击可跳转查看原文。
          </p>
          <div style="display:flex;flex-direction:column;gap:2px;">
            ${sourcesHtml}
          </div>
          <p style="font-size:12px;color:var(--text-tertiary);margin-top:16px;padding-top:12px;border-top:1px solid var(--border-color);">
            <i class="fas fa-info-circle"></i> 数据来源包括 Wikipedia API、DuckDuckGo Instant Answer API 等公开知识接口。
          </p>
        </div>
      </div>

      <!-- Footer actions -->
      <div style="padding:12px 24px;border-top:1px solid var(--border-color);display:flex;gap:8px;justify-content:flex-end;">
        <button class="research-action-btn" data-action="new" style="padding:8px 14px;border-radius:6px;border:1px solid var(--border-color);background:var(--bg-container);color:var(--text-secondary);font-size:12px;cursor:pointer;display:flex;align-items:center;gap:4px;">
          <i class="fas fa-plus"></i> 新研究
        </button>
      </div>
    </div>
  `;

  container.style.display = 'block';

  // --- Bind tab events ---
  $$('.research-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      $$('.research-tab').forEach(t => {
        t.style.color = 'var(--text-tertiary)';
        t.style.borderBottomColor = 'transparent';
      });
      tab.style.color = 'var(--color-primary)';
      tab.style.borderBottomColor = 'var(--color-primary)';

      const panel = tab.dataset.tab;
      $$('.research-tab-panel').forEach(p => {
        p.style.display = p.dataset.panel === panel ? 'block' : 'none';
      });
    });
  });

  // --- Export button ---
  const exportBtn = document.getElementById('exportResearchBtn');
  exportBtn?.addEventListener('click', () => {
    const fullText = generateFullTextReport(result);
    navigator.clipboard.writeText(fullText).then(() => {
      showToast('研究报告已复制到剪贴板 📋');
    }).catch(() => {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = fullText;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      showToast('研究报告已复制到剪贴板 📋');
    });
  });

  // --- New research button ---
  $$('.research-action-btn[data-action="new"]').forEach(btn => {
    btn.addEventListener('click', () => renderResearchPage());
  });
}

function formatReportContent(content) {
  if (!content) return '';
  // Convert markdown-style **bold** to <strong>
  return content
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>');
}

function generateFullTextReport(result) {
  const { topic, report, sources, depth } = result;
  const lines = [];
  lines.push(`# 研究报告: ${topic}`);
  lines.push(`日期: ${report.dateStr}  |  深度: ${DEPTH_LEVELS.find(d => d.id === depth)?.label || depth}  |  来源数: ${sources.length}`);
  lines.push('='.repeat(60));
  lines.push('');
  lines.push('## 执行摘要');
  lines.push(report.execSummary);
  lines.push('');
  lines.push('## 关键发现');
  report.keyFindings.forEach((kf, i) => {
    lines.push(`${i + 1}. ${kf.label}: ${kf.text}`);
  });
  lines.push('');
  lines.push('## 详细分析');
  report.sections.forEach(s => {
    lines.push(`\n### ${s.title}`);
    lines.push(s.content.replace(/\*\*(.+?)\*\*/g, '$1'));
  });
  lines.push('');
  lines.push('## 资料来源');
  sources.forEach(s => {
    lines.push(`- ${s.title} (${s.type}): ${s.url}`);
  });
  lines.push('');
  lines.push('---');
  lines.push('报告由 AI Tool Hub Deep Research Agent 自动生成');
  return lines.join('\n');
}

// ── Init (called from main.js when navigating to research page) ───────────

export function initResearchPage() {
  renderResearchPage();
}

export default { initResearchPage };
