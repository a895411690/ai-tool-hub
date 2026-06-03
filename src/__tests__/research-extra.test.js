/**
 * research.js 补充测试
 * Covers: generateSubtopics, synthesizeReport, formatReportContent,
 * generateFullTextReport, fetchWikipedia, fetchWikipediaSearch,
 * fetchDuckDuckGo, edge cases
 */
import { jest, describe, test, expect, beforeAll, beforeEach } from '@jest/globals';
import { TextEncoder, TextDecoder } from 'util';
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

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
let generateSubtopics, synthesizeReport, formatReportContent, generateFullTextReport;
let fetchWikipedia, fetchWikipediaSearch, fetchDuckDuckGo;
let RESEARCH_CATEGORIES, DEPTH_LEVELS;

beforeAll(async () => {
    mod = await import('../../js/research.js');
    generateSubtopics = mod.generateSubtopics;
    synthesizeReport = mod.synthesizeReport;
    formatReportContent = mod.formatReportContent;
    generateFullTextReport = mod.generateFullTextReport;
    fetchWikipedia = mod.fetchWikipedia;
    fetchWikipediaSearch = mod.fetchWikipediaSearch;
    fetchDuckDuckGo = mod.fetchDuckDuckGo;
    RESEARCH_CATEGORIES = mod.RESEARCH_CATEGORIES;
    DEPTH_LEVELS = mod.DEPTH_LEVELS;
});

// ── generateSubtopics ─────────────────────────────────────────

describe('generateSubtopics', () => {
    test('returns subtopics for general category', () => {
        const result = generateSubtopics('Artificial Intelligence', 'general');
        expect(result.length).toBeGreaterThan(0);
        expect(result[0]).toContain('Artificial Intelligence');
    });

    test('returns subtopics for technology category', () => {
        const result = generateSubtopics('Machine Learning', 'technology');
        expect(result.length).toBeGreaterThan(0);
    });

    test('falls back to general for unknown category', () => {
        const result = generateSubtopics('Test', 'nonexistent');
        expect(result.length).toBeGreaterThan(0);
    });

    test('handles empty topic', () => {
        const result = generateSubtopics('', 'general');
        expect(Array.isArray(result)).toBe(true);
    });
});

// ── formatReportContent ───────────────────────────────────────

describe('formatReportContent', () => {
    test('converts **bold** to <strong>', () => {
        expect(formatReportContent('Hello **world**')).toBe('Hello <strong>world</strong>');
    });

    test('converts newlines to <br>', () => {
        expect(formatReportContent('Line1\nLine2')).toBe('Line1<br>Line2');
    });

    test('returns empty string for null/undefined', () => {
        expect(formatReportContent(null)).toBe('');
        expect(formatReportContent(undefined)).toBe('');
    });
});

// ── generateFullTextReport ────────────────────────────────────

describe('generateFullTextReport', () => {
    test('generates report with all sections', () => {
        const result = {
            topic: 'AI',
            depth: 'standard',
            report: {
                dateStr: '2025-01-01',
                execSummary: 'Summary here',
                keyFindings: [
                    { label: 'Finding 1', text: 'Text 1' }
                ],
                sections: [
                    { title: 'Section 1', content: 'Content **bold**' }
                ]
            },
            sources: [
                { title: 'Wikipedia', url: 'https://wiki.com', type: 'Wikipedia' }
            ]
        };
        const text = generateFullTextReport(result);
        expect(text).toContain('AI');
        expect(text).toContain('Summary here');
        expect(text).toContain('Finding 1');
        expect(text).toContain('Section 1');
        expect(text).toContain('Wikipedia');
    });
});

// ── synthesizeReport ──────────────────────────────────────────

describe('synthesizeReport', () => {
    test('produces report with all required fields', () => {
        const report = synthesizeReport(
            'AI',
            'AI is the simulation of human intelligence.',
            [
                { type: 'abstract', content: 'AI has many applications.', source: 'Wiki' }
            ],
            [{ title: 'Wiki', url: 'https://wiki.com', type: 'Wikipedia' }],
            { abstract: 'DuckDuckGo result' }
        );
        expect(report).toHaveProperty('execSummary');
        expect(report).toHaveProperty('keyFindings');
        expect(report).toHaveProperty('sections');
        expect(report).toHaveProperty('dateStr');
        expect(report.execSummary).toBeTruthy();
    });

    test('produces report with no main summary', () => {
        const report = synthesizeReport('AI', null, [], [], null);
        expect(report).toHaveProperty('execSummary');
        expect(report.execSummary).toBeTruthy();
    });

    test('handles subtopic findings', () => {
        const report = synthesizeReport('AI', null, [
            { type: 'subtopic', subtopic: 'History of AI', content: 'The history of artificial intelligence spans many decades, from early theoretical work in the 1950s to modern deep learning breakthroughs.' }
        ], [], null);
        expect(report.keyFindings.length).toBeGreaterThan(0);
        expect(report.sections.length).toBeGreaterThan(0);
    });
});

// ── fetchWikipedia ────────────────────────────────────────────

describe('fetchWikipedia', () => {
    test('returns null on fetch failure', async () => {
        mod.__setFetch(() => Promise.reject(new Error('Network error')));
        const result = await fetchWikipedia('Test');
        expect(result).toBeNull();
    });

    test('returns null on non-ok response', async () => {
        mod.__setFetch(() => Promise.resolve({ ok: false }));
        const result = await fetchWikipedia('Test');
        expect(result).toBeNull();
    });

    test('returns null on disambiguation', async () => {
        mod.__setFetch(() => Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ type: 'disambiguation' })
        }));
        const result = await fetchWikipedia('Test');
        expect(result).toBeNull();
    });

    test('parses valid response', async () => {
        mod.__setFetch(() => Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
                title: 'Test Topic',
                extract: 'Test extract',
                content_urls: { desktop: { page: 'https://wiki.com/Test' } },
                thumbnail: { source: 'https://wiki.com/img.jpg' }
            })
        }));
        const result = await fetchWikipedia('Test');
        expect(result.title).toBe('Test Topic');
        expect(result.extract).toBe('Test extract');
    });
});

// ── fetchWikipediaSearch ──────────────────────────────────────

describe('fetchWikipediaSearch', () => {
    test('returns empty array on fetch failure', async () => {
        mod.__setFetch(() => Promise.reject(new Error('Network error')));
        const result = await fetchWikipediaSearch('Test');
        expect(result).toEqual([]);
    });

    test('parses search results', async () => {
        mod.__setFetch(() => Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
                query: {
                    search: [
                        { title: 'Result 1', snippet: 'Snippet 1', pageid: 1 },
                        { title: 'Result 2', snippet: 'Snippet 2', pageid: 2 }
                    ]
                }
            })
        }));
        const result = await fetchWikipediaSearch('Test');
        expect(result).toHaveLength(2);
        expect(result[0].title).toBe('Result 1');
        expect(result[0].snippet).toBe('Snippet 1');
    });
});

// ── fetchDuckDuckGo ───────────────────────────────────────────

describe('fetchDuckDuckGo', () => {
    test('returns null on fetch failure', async () => {
        mod.__setFetch(() => Promise.reject(new Error('Network error')));
        const result = await fetchDuckDuckGo('Test');
        expect(result).toBeNull();
    });

    test('parses response with abstract', async () => {
        mod.__setFetch(() => Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
                AbstractText: 'Abstract text',
                AbstractSource: 'Wiki',
                AbstractURL: 'https://wiki.com',
                Answer: '42',
                Definition: 'Definition',
                Infobox: { content: [{ label: 'Field', value: 'Value' }] },
                RelatedTopics: [{ Text: 'Related', FirstURL: 'https://wiki.com/rel' }]
            })
        }));
        const result = await fetchDuckDuckGo('Test');
        expect(result.abstract).toBe('Abstract text');
        expect(result.source).toBe('Wiki');
        expect(result.url).toBe('https://wiki.com');
        expect(result.answer).toBe('42');
        expect(result.relatedTopics).toHaveLength(1);
    });

    test('handles empty response', async () => {
        mod.__setFetch(() => Promise.resolve({
            ok: true,
            json: () => Promise.resolve({})
        }));
        const result = await fetchDuckDuckGo('Test');
        expect(result.abstract).toBeNull();
    });
});
