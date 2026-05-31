// utils.js 测试文件 — tests the active js/utils.js module
import { jest } from '@jest/globals';

// Polyfill for TextEncoder/TextDecoder in jsdom environment
import { TextEncoder, TextDecoder } from 'util';
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

import {
    escapeHtml,
    escapeAttr,
    isValidUrl,
    generateTagsHtml,
    generatePlatformBadgesHtml,
    generateStatusBadgeHtml,
    RATING_LABELS,
    MAX_SEARCH_HISTORY,
    TOAST_DISPLAY_TIME,
    SEARCH_DEBOUNCE_TIME
} from '../../js/utils.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

describe('constants', () => {
    test('MAX_SEARCH_HISTORY should be 10', () => {
        expect(MAX_SEARCH_HISTORY).toBe(10);
    });

    test('TOAST_DISPLAY_TIME should be 2000', () => {
        expect(TOAST_DISPLAY_TIME).toBe(2000);
    });

    test('SEARCH_DEBOUNCE_TIME should be 300', () => {
        expect(SEARCH_DEBOUNCE_TIME).toBe(300);
    });

    test('RATING_LABELS should have 6 entries', () => {
        expect(RATING_LABELS).toEqual(['', '很差', '较差', '一般', '很好', '极好']);
    });
});

// ---------------------------------------------------------------------------
// escapeHtml
// ---------------------------------------------------------------------------

describe('escapeHtml', () => {
    test('should escape HTML special characters', () => {
        expect(escapeHtml('<script>alert("xss")</script>')).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
        expect(escapeHtml('<div>test</div>')).toBe('&lt;div&gt;test&lt;/div&gt;');
    });

    test('should escape ampersands', () => {
        expect(escapeHtml('Tom & Jerry')).toBe('Tom &amp; Jerry');
    });

    test('should handle empty string', () => {
        expect(escapeHtml('')).toBe('');
    });

    test('should handle normal text without special characters', () => {
        expect(escapeHtml('Hello World')).toBe('Hello World');
    });

    test('should escape single quotes', () => {
        expect(escapeHtml("it's")).toBe('it&#39;s');
    });

    test('should return empty string for non-string input', () => {
        expect(escapeHtml(null)).toBe('');
        expect(escapeHtml(undefined)).toBe('');
        expect(escapeHtml(123)).toBe('');
    });
});

// ---------------------------------------------------------------------------
// escapeAttr
// ---------------------------------------------------------------------------

describe('escapeAttr', () => {
    test('should escape double quotes in attributes', () => {
        expect(escapeAttr('value"onclick="alert(1)')).toBe('value&quot;onclick=&quot;alert(1)');
    });

    test('should escape single quotes', () => {
        expect(escapeAttr("value'onclick'")).toBe('value&#39;onclick&#39;');
    });

    test('should escape angle brackets', () => {
        expect(escapeAttr('<script>')).toBe('&lt;script&gt;');
    });

    test('should escape ampersands', () => {
        expect(escapeAttr('a & b')).toBe('a &amp; b');
    });

    test('should return empty string for non-string input', () => {
        expect(escapeAttr(null)).toBe('');
        expect(escapeAttr(undefined)).toBe('');
        expect(escapeAttr(123)).toBe('');
    });
});

// ---------------------------------------------------------------------------
// isValidUrl
// ---------------------------------------------------------------------------

describe('isValidUrl', () => {
    test('should accept http URLs', () => {
        expect(isValidUrl('http://example.com')).toBe(true);
    });

    test('should accept https URLs', () => {
        expect(isValidUrl('https://example.com/path?query=1')).toBe(true);
    });

    test('should reject empty string', () => {
        expect(isValidUrl('')).toBe(false);
    });

    test('should reject null/undefined', () => {
        expect(isValidUrl(null)).toBe(false);
        expect(isValidUrl(undefined)).toBe(false);
    });

    test('should reject URLs without protocol', () => {
        expect(isValidUrl('example.com')).toBe(false);
    });

    test('should reject dangerous protocols', () => {
        expect(isValidUrl('javascript:alert(1)')).toBe(false);
        expect(isValidUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
        expect(isValidUrl('file:///etc/passwd')).toBe(false);
    });

    test('should reject ftp protocol', () => {
        expect(isValidUrl('ftp://example.com')).toBe(false);
    });
});

// ---------------------------------------------------------------------------
// generateTagsHtml
// ---------------------------------------------------------------------------

describe('generateTagsHtml', () => {
    test('should generate free tag', () => {
        const html = generateTagsHtml({ tags: ['free'] });
        expect(html).toContain('tag-free');
        expect(html).toContain('免费');
    });

    test('should generate vip tag when free is absent', () => {
        const html = generateTagsHtml({ tags: ['vip'] });
        expect(html).toContain('tag-vip');
        expect(html).toContain('VIP');
    });

    test('should generate new tag', () => {
        const html = generateTagsHtml({ tags: ['new'] });
        expect(html).toContain('tag-new');
        expect(html).toContain('NEW');
    });

    test('should generate hot tag', () => {
        const html = generateTagsHtml({ tags: ['hot'] });
        expect(html).toContain('tag-hot');
        expect(html).toContain('热门');
    });

    test('should generate toolTags (domestic, overseas, open-source, no-login)', () => {
        const tests = [
            { tag: '国产', cls: 'tag-domestic' },
            { tag: '海外', cls: 'tag-overseas' },
            { tag: '开源', cls: 'tag-open-source' },
            { tag: '无需登录', cls: 'tag-no-login' }
        ];
        for (const { tag, cls } of tests) {
            const html = generateTagsHtml({ toolTags: [tag] });
            expect(html).toContain(cls);
        }
    });

    test('should return empty string when no tags exist', () => {
        expect(generateTagsHtml({})).toBe('');
        expect(generateTagsHtml({ tags: [] })).toBe('');
    });

    test('should not generate vip when free tag exists', () => {
        const html = generateTagsHtml({ tags: ['free', 'vip'] });
        expect(html).toContain('tag-free');
        expect(html).not.toContain('tag-vip');
    });
});

// ---------------------------------------------------------------------------
// generatePlatformBadgesHtml
// ---------------------------------------------------------------------------

describe('generatePlatformBadgesHtml', () => {
    test('should generate badges for web platform', () => {
        const html = generatePlatformBadgesHtml(['web']);
        expect(html).toContain('fa-globe');
    });

    test('should generate badges for local platform', () => {
        const html = generatePlatformBadgesHtml(['local']);
        expect(html).toContain('fa-server');
    });

    test('should generate badges for mobile platform', () => {
        const html = generatePlatformBadgesHtml(['mobile']);
        expect(html).toContain('fa-mobile-alt');
    });

    test('should generate badges for desktop platform', () => {
        const html = generatePlatformBadgesHtml(['desktop']);
        expect(html).toContain('fa-desktop');
    });

    test('should handle multiple platforms', () => {
        const html = generatePlatformBadgesHtml(['web', 'mobile']);
        expect(html).toContain('fa-globe');
        expect(html).toContain('fa-mobile-alt');
    });

    test('should return empty string for null/undefined', () => {
        expect(generatePlatformBadgesHtml(null)).toBe('');
        expect(generatePlatformBadgesHtml(undefined)).toBe('');
    });

    test('should return container for empty array', () => {
        const html = generatePlatformBadgesHtml([]);
        expect(html).toContain('platform-badges');
    });

    test('should escape platform name in title attribute', () => {
        const html = generatePlatformBadgesHtml(['web']);
        expect(html).toContain('title="web"');
    });
});

// ---------------------------------------------------------------------------
// generateStatusBadgeHtml
// ---------------------------------------------------------------------------

describe('generateStatusBadgeHtml', () => {
    test('should generate hot badge', () => {
        const html = generateStatusBadgeHtml('hot');
        expect(html).toContain('status-hot');
        expect(html).toContain('fa-fire');
        expect(html).toContain('热门推荐');
    });

    test('should generate stable badge', () => {
        const html = generateStatusBadgeHtml('stable');
        expect(html).toContain('status-stable');
        expect(html).toContain('fa-check-circle');
        expect(html).toContain('稳定可靠');
    });

    test('should return empty string for unknown status', () => {
        expect(generateStatusBadgeHtml('unknown')).toBe('');
        expect(generateStatusBadgeHtml('')).toBe('');
        expect(generateStatusBadgeHtml(null)).toBe('');
    });
});

// ---------------------------------------------------------------------------
// generatePlatformBadgesHtml
// ---------------------------------------------------------------------------

describe('generatePlatformBadgesHtml', () => {
    let generatePlatformBadgesHtml;

    beforeAll(async () => {
        const utils = await import('../../js/utils.js');
        generatePlatformBadgesHtml = utils.generatePlatformBadgesHtml;
    });

    test('should generate HTML for web platform', () => {
        const html = generatePlatformBadgesHtml(['web']);
        expect(html).toContain('fa-globe');
        expect(html).toContain('platform-badges');
    });

    test('should generate HTML for multiple platforms', () => {
        const html = generatePlatformBadgesHtml(['web', 'mobile', 'desktop']);
        expect(html).toContain('fa-globe');
        expect(html).toContain('fa-mobile-alt');
        expect(html).toContain('fa-desktop');
    });

    test('should handle local platform', () => {
        const html = generatePlatformBadgesHtml(['local']);
        expect(html).toContain('fa-server');
    });

    test('should return empty string for undefined', () => {
        expect(generatePlatformBadgesHtml(undefined)).toBe('');
    });

    test('should return empty string for non-array', () => {
        expect(generatePlatformBadgesHtml('web')).toBe('');
    });

    test('should use fallback icon for unknown platform', () => {
        const html = generatePlatformBadgesHtml(['unknown']);
        expect(html).toContain('fa-cog');
    });
});

// ---------------------------------------------------------------------------
// generateStatusBadgeHtml
// ---------------------------------------------------------------------------

describe('generateStatusBadgeHtml', () => {
    let generateStatusBadgeHtml;

    beforeAll(async () => {
        const utils = await import('../../js/utils.js');
        generateStatusBadgeHtml = utils.generateStatusBadgeHtml;
    });

    test('should generate hot status badge', () => {
        const html = generateStatusBadgeHtml('hot');
        expect(html).toContain('热门推荐');
        expect(html).toContain('status-hot');
        expect(html).toContain('fa-fire');
    });

    test('should generate stable status badge', () => {
        const html = generateStatusBadgeHtml('stable');
        expect(html).toContain('稳定可靠');
        expect(html).toContain('status-stable');
        expect(html).toContain('fa-check-circle');
    });

    test('should return empty string for unknown status', () => {
        expect(generateStatusBadgeHtml('unknown')).toBe('');
    });

    test('should return empty string for null/undefined', () => {
        expect(generateStatusBadgeHtml(null)).toBe('');
        expect(generateStatusBadgeHtml(undefined)).toBe('');
    });
});
