/**
 * research.js 测试文件
 * Tests the Deep Research Agent Module
 */
import { jest, describe, test, expect, beforeAll, beforeEach, afterEach } from '@jest/globals';
import { TextEncoder, TextDecoder } from 'util';
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// jsdom doesn't provide AbortSignal.timeout
if (!AbortSignal.timeout) {
    AbortSignal.timeout = (ms) => {
        const ctrl = new AbortController();
        setTimeout(() => ctrl.abort(), ms);
        return ctrl.signal;
    };
}

jest.unstable_mockModule('../../js/utils.js', () => ({
    showToast: jest.fn(),
    escapeHtml: jest.fn(s => s)
}));

let mod;
let RES;
let DEPTH;
let $, $$, sleep;
let generateSubtopics, synthesizeReport, formatReportContent, generateFullTextReport;
let fetchWikipedia, fetchWikipediaSearch, fetchWikipediaContent, fetchDuckDuckGo;
let initResearchPage;
let __setFetch;

beforeAll(async () => {
    mod = await import('../../js/research.js');
    $ = mod.$;
    $$ = mod.$$;
    sleep = mod.sleep;
    generateSubtopics = mod.generateSubtopics;
    synthesizeReport = mod.synthesizeReport;
    formatReportContent = mod.formatReportContent;
    generateFullTextReport = mod.generateFullTextReport;
    fetchWikipedia = mod.fetchWikipedia;
    fetchWikipediaSearch = mod.fetchWikipediaSearch;
    fetchWikipediaContent = mod.fetchWikipediaContent;
    fetchDuckDuckGo = mod.fetchDuckDuckGo;
    initResearchPage = mod.initResearchPage;
    __setFetch = mod.__setFetch;
    RES = mod.RESEARCH_CATEGORIES;
    DEPTH = mod.DEPTH_LEVELS;
});

beforeEach(() => {
    jest.clearAllMocks();
});

// Fake timers are only used in the sleep test block below

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

describe('RESEARCH_CATEGORIES', () => {
    test('should have 7 predefined categories', () => {
        expect(RES).toHaveLength(7);
    });

    test('each category should have id, label, icon', () => {
        RES.forEach(cat => {
            expect(cat).toHaveProperty('id');
            expect(cat).toHaveProperty('label');
            expect(cat).toHaveProperty('icon');
        });
    });

    test('should include general, technology, science', () => {
        const ids = RES.map(c => c.id);
        expect(ids).toContain('general');
        expect(ids).toContain('technology');
        expect(ids).toContain('science');
    });
});

describe('DEPTH_LEVELS', () => {
    test('should have 3 levels: quick, standard, deep', () => {
        expect(DEPTH).toHaveLength(3);
        expect(DEPTH[0].id).toBe('quick');
        expect(DEPTH[1].id).toBe('standard');
        expect(DEPTH[2].id).toBe('deep');
    });

    test('each level should have id, label, desc, icon, steps', () => {
        DEPTH.forEach(d => {
            expect(d).toHaveProperty('id');
            expect(d).toHaveProperty('label');
            expect(d).toHaveProperty('desc');
            expect(d).toHaveProperty('icon');
            expect(typeof d.steps).toBe('number');
        });
    });

    test('steps should increase with depth', () => {
        expect(DEPTH[0].steps).toBeLessThan(DEPTH[1].steps);
        expect(DEPTH[1].steps).toBeLessThan(DEPTH[2].steps);
    });
});

// ---------------------------------------------------------------------------
// sleep
// ---------------------------------------------------------------------------

describe('sleep', () => {
    test('should return a promise', () => {
        const p = sleep(100);
        expect(p).toBeInstanceOf(Promise);
    });

    test('should resolve after given ms', async () => {
        jest.useFakeTimers();
        const p = sleep(100);
        jest.advanceTimersByTime(100);
        await expect(p).resolves.toBeUndefined();
        jest.useRealTimers();
    });
});

// ---------------------------------------------------------------------------
// generateSubtopics
// ---------------------------------------------------------------------------

describe('generateSubtopics', () => {
    test('should return array of subtopics for general category', () => {
        const result = generateSubtopics('AI', 'general');
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThan(0);
        // Each item should contain the topic
        result.forEach(sub => {
            expect(sub).toContain('AI');
        });
    });

    test('should return 6 subtopics for general', () => {
        const result = generateSubtopics('AI', 'general');
        expect(result).toHaveLength(6);
        expect(result[0]).toBe('AI overview');
        expect(result[1]).toBe('AI history');
    });

    test('should return technology-specific subtopics', () => {
        const result = generateSubtopics('React', 'technology');
        expect(result).toContain('React architecture');
        expect(result).toContain('React history');
        expect(result).toContain('React applications');
    });

    test('should fall back to general for unknown category', () => {
        const result = generateSubtopics('X', 'unknown');
        expect(result).toContain('X overview');
        expect(result).toContain('X history');
    });

    test('should handle empty topic', () => {
        const result = generateSubtopics('', 'general');
        expect(result).toContain(' overview');
    });
});

// ---------------------------------------------------------------------------
// fetchWikipedia (mocked)
// ---------------------------------------------------------------------------

describe('fetchWikipedia', () => {
    test('should return null when fetch fails', async () => {
        const mockF = jest.fn().mockRejectedValue(new Error('Network error'));
        __setFetch(mockF);
        const result = await fetchWikipedia('AI');
        expect(result).toBeNull();
    });

    test('should return null when response is not ok', async () => {
        const mockF2 = jest.fn().mockResolvedValue({ ok: false });
        __setFetch(mockF2);
        const result = await fetchWikipedia('AI');
        expect(result).toBeNull();
    });

    test('should return null for disambiguation pages', async () => {
        const mockF3 = jest.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ type: 'disambiguation' })
        });
        __setFetch(mockF3);
        const result = await fetchWikipedia('AI');
        expect(result).toBeNull();
    });

    test('should parse valid Wikipedia response', async () => {
        const mockFetch = jest.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                title: 'Artificial intelligence',
                extract: 'AI is intelligence...',
                content_urls: { desktop: { page: 'https://en.wikipedia.org/wiki/AI' } },
                thumbnail: { source: 'https://example.com/img.jpg' }
            })
        });
        __setFetch(mockFetch);
        const result = await fetchWikipedia('AI');
        // Debug


        expect(result).toEqual({
            title: 'Artificial intelligence',
            extract: 'AI is intelligence...',
            url: 'https://en.wikipedia.org/wiki/AI',
            thumbnail: 'https://example.com/img.jpg'
        });
    });

    test('should provide fallback URL when desktop page URL missing', async () => {
        const mockF4 = jest.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                title: 'AI',
                extract: 'text',
                content_urls: {}
            })
        });
        __setFetch(mockF4);
        const result = await fetchWikipedia('AI');
        expect(result.url).toContain('en.wikipedia.org');
    });

    afterEach(() => {
    });
});

// ---------------------------------------------------------------------------
// fetchWikipediaSearch (mocked)
// ---------------------------------------------------------------------------

describe('fetchWikipediaSearch', () => {
    test('should return empty array on fetch failure', async () => {
        const mockF5 = jest.fn().mockRejectedValue(new Error('fail'));
        __setFetch(mockF5);
        const result = await fetchWikipediaSearch('AI');
        expect(result).toEqual([]);
    });

    test('should parse search results', async () => {
        const mockF6 = jest.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                query: {
                    search: [
                        { title: 'AI', snippet: 'AI is <b>cool</b>', pageid: 1 },
                        { title: 'ML', snippet: 'ML is <b>great</b>', pageid: 2 }
                    ]
                }
            })
        });
        __setFetch(mockF6);
        const results = await fetchWikipediaSearch('AI');
        expect(results).toHaveLength(2);
        expect(results[0].title).toBe('AI');
        expect(results[0].snippet).toBe('AI is cool'); // HTML tags stripped
        expect(results[0].pageId).toBe(1);
    });

    test('should return empty array when no results', async () => {
        const mockF7 = jest.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ query: {} })
        });
        __setFetch(mockF7);
        const results = await fetchWikipediaSearch('xyznotfound');
        expect(results).toEqual([]);
    });

    test('should pass limit parameter to API', async () => {
        const fetchMock = jest.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ query: { search: [] } })
        });
        __setFetch(fetchMock);
        await fetchWikipediaSearch('AI', 3);
        expect(fetchMock.mock.calls[0][0]).toContain('srlimit=3');
    });

    afterEach(() => {
    });
});

// ---------------------------------------------------------------------------
// fetchWikipediaContent (mocked)
// ---------------------------------------------------------------------------

describe('fetchWikipediaContent', () => {
    test('should return empty string on failure', async () => {
        const mockF8 = jest.fn().mockRejectedValue(new Error('fail'));
        __setFetch(mockF8);
        const result = await fetchWikipediaContent('AI');
        expect(result).toBe('');
    });

    test('should extract page content', async () => {
        const mockF9 = jest.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                query: {
                    pages: { '123': { extract: 'Full article text...' } }
                }
            })
        });
        __setFetch(mockF9);
        const result = await fetchWikipediaContent('AI');
        expect(result).toBe('Full article text...');
    });

    test('should return empty string for missing page', async () => {
        const mockF10 = jest.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ query: { pages: {} } })
        });
        __setFetch(mockF10);
        const result = await fetchWikipediaContent('DoesNotExist');
        expect(result).toBe('');
    });

    afterEach(() => {
    });
});

// ---------------------------------------------------------------------------
// fetchDuckDuckGo (mocked)
// ---------------------------------------------------------------------------

describe('fetchDuckDuckGo', () => {
    test('should return null on fetch failure', async () => {
        const mockF11 = jest.fn().mockRejectedValue(new Error('fail'));
        __setFetch(mockF11);
        const result = await fetchDuckDuckGo('AI');
        expect(result).toBeNull();
    });

    test('should parse abstract and answer', async () => {
        const mockF12 = jest.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                AbstractText: 'AI is intelligence by machines',
                AbstractSource: 'Wikipedia',
                AbstractURL: 'https://en.wikipedia.org/wiki/AI',
                Answer: 'AI = Artificial Intelligence',
                Definition: 'Study of intelligent agents',
                Infobox: { content: [{ label: 'Type', value: 'Technology' }] },
                RelatedTopics: [
                    { Text: 'Machine Learning', FirstURL: 'https://en.wikipedia.org/wiki/ML' }
                ]
            })
        });
        __setFetch(mockF12);
        const result = await fetchDuckDuckGo('AI');
        expect(result.abstract).toBe('AI is intelligence by machines');
        expect(result.answer).toBe('AI = Artificial Intelligence');
        expect(result.definition).toBe('Study of intelligent agents');
        expect(result.relatedTopics).toHaveLength(1);
        expect(result.relatedTopics[0].text).toBe('Machine Learning');
    });

    test('should return null when response is not ok', async () => {
        const mockF13 = jest.fn().mockResolvedValue({ ok: false });
        __setFetch(mockF13);
        const result = await fetchDuckDuckGo('AI');
        expect(result).toBeNull();
    });

    afterEach(() => {
    });
});

// ---------------------------------------------------------------------------
// synthesizeReport
// ---------------------------------------------------------------------------

describe('synthesizeReport', () => {
    const baseTopic = 'Artificial Intelligence';

    test('should return object with execSummary, keyFindings, sections, dateStr', () => {
        const result = synthesizeReport(baseTopic, '', [], [], null);
        expect(result).toHaveProperty('execSummary');
        expect(result).toHaveProperty('keyFindings');
        expect(result).toHaveProperty('sections');
        expect(result).toHaveProperty('dateStr');
    });

    test('should generate fallback executive summary when no mainSummary', () => {
        const result = synthesizeReport(baseTopic, '', [], [], null);
        expect(result.execSummary).toContain(baseTopic);
    });

    test('should use mainSummary as executive summary when provided', () => {
        const result = synthesizeReport(baseTopic, 'AI is transforming the world.', [], [], null);
        expect(result.execSummary).toBe('AI is transforming the world.');
    });

    test('should truncate long mainSummary to 500 chars', () => {
        const longText = 'A'.repeat(600);
        const result = synthesizeReport(baseTopic, longText, [], [], null);
        expect(result.execSummary.length).toBeLessThanOrEqual(503); // 500 + '...'
        expect(result.execSummary.endsWith('...')).toBe(true);
    });

    test('should generate key findings from subtopic findings', () => {
        const findings = [
            { type: 'subtopic', subtopic: 'History', content: 'A'.repeat(200) },
            { type: 'subtopic', subtopic: 'Applications', content: 'B'.repeat(200) }
        ];
        const result = synthesizeReport(baseTopic, '', findings, [], null);
        expect(result.keyFindings.length).toBeGreaterThanOrEqual(2);
        expect(result.keyFindings[0].label).toBe('History');
        expect(result.keyFindings[1].label).toBe('Applications');
    });

    test('should skip findings with short content', () => {
        const findings = [
            { type: 'subtopic', subtopic: 'Short', content: 'tiny' },
            { type: 'subtopic', subtopic: 'Long', content: 'A'.repeat(100) }
        ];
        const result = synthesizeReport(baseTopic, '', findings, [], null);
        const labels = result.keyFindings.map(kf => kf.label);
        expect(labels).not.toContain('Short');
        expect(labels).toContain('Long');
    });

    test('should include overview section when mainSummary present', () => {
        const result = synthesizeReport(baseTopic, 'Overview text.', [], [], null);
        const titles = result.sections.map(s => s.title);
        expect(titles).toContain('概述');
    });

    test('should include conclusion section', () => {
        const result = synthesizeReport(baseTopic, '', [], [], null);
        const titles = result.sections.map(s => s.title);
        expect(titles).toContain('结论与展望');
    });

    test('should include data section when ddg infobox present', () => {
        const ddg = { infobox: [{ label: 'Founded', value: '1956' }] };
        const result = synthesizeReport(baseTopic, '', [], [], ddg);
        const titles = result.sections.map(s => s.title);
        expect(titles).toContain('关键数据');
    });

    test('should produce a valid date string', () => {
        const result = synthesizeReport(baseTopic, '', [], [], null);
        expect(result.dateStr).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    test('should not add overview section if mainSummary is empty', () => {
        const result = synthesizeReport(baseTopic, '', [], [], null);
        const titles = result.sections.map(s => s.title);
        expect(titles).not.toContain('概述');
    });
});

// ---------------------------------------------------------------------------
// formatReportContent
// ---------------------------------------------------------------------------

describe('formatReportContent', () => {
    test('should return empty string for empty input', () => {
        expect(formatReportContent('')).toBe('');
    });

    test('should convert **bold** to <strong> tags', () => {
        expect(formatReportContent('**hello** world'))
            .toBe('<strong>hello</strong> world');
    });

    test('should convert newlines to <br>', () => {
        expect(formatReportContent('line1\nline2'))
            .toBe('line1<br>line2');
    });

    test('should handle multiple bold sections', () => {
        expect(formatReportContent('**A** and **B**'))
            .toBe('<strong>A</strong> and <strong>B</strong>');
    });

    test('should return null/undefined unchanged', () => {
        expect(formatReportContent(null)).toBe('');
        expect(formatReportContent(undefined)).toBe('');
    });
});

// ---------------------------------------------------------------------------
// generateFullTextReport
// ---------------------------------------------------------------------------

describe('generateFullTextReport', () => {
    const sampleResult = {
        topic: 'AI',
        depth: 'standard',
        report: {
            dateStr: '2026-05-31',
            execSummary: 'AI overview.',
            keyFindings: [
                { label: 'History', text: 'AI started in 1956.' },
                { label: 'Future', text: 'AGI is next.' }
            ],
            sections: [
                { title: 'Detail', content: '**Deep** dive.' }
            ]
        },
        sources: [
            { title: 'Wikipedia', url: 'https://wiki.org/AI', type: 'Wikipedia' }
        ]
    };

    test('should return a non-empty string', () => {
        const text = generateFullTextReport(sampleResult);
        expect(typeof text).toBe('string');
        expect(text.length).toBeGreaterThan(0);
    });

    test('should include topic as heading', () => {
        const text = generateFullTextReport(sampleResult);
        expect(text).toContain('# 研究报告: AI');
    });

    test('should include key findings', () => {
        const text = generateFullTextReport(sampleResult);
        expect(text).toContain('History');
        expect(text).toContain('Future');
    });

    test('should include sources section', () => {
        const text = generateFullTextReport(sampleResult);
        expect(text).toContain('Wikipedia');
        expect(text).toContain('https://wiki.org/AI');
    });

    test('should include footer note about AI generation', () => {
        const text = generateFullTextReport(sampleResult);
        expect(text).toContain('AI Tool Hub Deep Research Agent');
    });

    test('should mark depth label from DEPTH_LEVELS', () => {
        const text = generateFullTextReport(sampleResult);
        expect(text).toContain('标准'); // standard depth label
    });

    test('should handle empty result gracefully', () => {
        const empty = {
            topic: '',
            depth: '',
            report: {
                dateStr: '',
                execSummary: '',
                keyFindings: [],
                sections: []
            },
            sources: []
        };
        const text = generateFullTextReport(empty);
        expect(typeof text).toBe('string');
    });
});

// ---------------------------------------------------------------------------
// initResearchPage (basic DOM test)
// ---------------------------------------------------------------------------

describe('initResearchPage', () => {
    beforeEach(() => {
        document.body.innerHTML = '<div id="mainContent"></div>';
    });

    test('should create research page content in container', () => {
        initResearchPage();
        const container = document.getElementById('mainContent');
        expect(container).toBeTruthy();
        expect(container.innerHTML.length).toBeGreaterThan(0);
    });

    test('should include research header', () => {
        initResearchPage();
        const container = document.getElementById('mainContent');
        expect(container.innerHTML).toContain('深度研究');
    });

    test('should render category options', () => {
        initResearchPage();
        const container = document.getElementById('mainContent');
        // Should contain at least some of the category labels
        expect(container.innerHTML).toContain('通用研究');
        expect(container.innerHTML).toContain('科技');
    });

    test('should render depth options', () => {
        initResearchPage();
        const container = document.getElementById('mainContent');
        expect(container.innerHTML).toContain('快速');
        expect(container.innerHTML).toContain('标准');
        expect(container.innerHTML).toContain('深度');
    });

    test('should include start research button', () => {
        initResearchPage();
        const container = document.getElementById('mainContent');
        expect(container.innerHTML).toContain('开始研究');
    });
});
