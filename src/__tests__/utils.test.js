// utils.js 测试文件
import { jest } from '@jest/globals';

// Polyfill for TextEncoder/TextDecoder in jsdom environment
import { TextEncoder, TextDecoder } from 'util';
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

import {
    debounce,
    throttle,
    crypto,
    storage,
    escapeHtml,
    escapeAttr,
    validateUrl,
    safeJsonParse
} from '../js/utils.js';

describe('debounce function', () => {
    jest.useFakeTimers();
    
    test('should debounce function execution', () => {
        const mockFn = jest.fn();
        const debouncedFn = debounce(mockFn, 100);
        
        // 多次调用
        debouncedFn('test');
        debouncedFn('test');
        debouncedFn('test');
        
        // 立即执行，应该还没有调用
        expect(mockFn).not.toHaveBeenCalled();
        
        // 等待 100ms
        jest.advanceTimersByTime(100);
        
        // 应该被调用一次
        expect(mockFn).toHaveBeenCalledTimes(1);
        expect(mockFn).toHaveBeenCalledWith('test');
    });
});

describe('throttle function', () => {
    jest.useFakeTimers();
    
    test('should throttle function execution', () => {
        const mockFn = jest.fn();
        const throttledFn = throttle(mockFn, 100);
        
        // 立即调用
        throttledFn('test');
        expect(mockFn).toHaveBeenCalledTimes(1);
        
        // 立即再次调用，应该被节流
        throttledFn('test');
        expect(mockFn).toHaveBeenCalledTimes(1);
        
        // 等待 100ms 后再次调用
        jest.advanceTimersByTime(100);
        throttledFn('test');
        expect(mockFn).toHaveBeenCalledTimes(2);
    });
});

describe('crypto functions', () => {
    test('should encrypt and decrypt text', () => {
        const testText = 'test secret text';
        const encrypted = crypto.encrypt(testText);
        const decrypted = crypto.decrypt(encrypted);
        
        expect(encrypted).not.toEqual(testText);
        expect(decrypted).toEqual(testText);
    });
    
    test('should handle edge cases', () => {
        expect(crypto.encrypt('')).toEqual('');
        expect(crypto.decrypt('')).toEqual('');
        expect(crypto.decrypt('invalid')).toEqual('invalid');
    });
});

describe('storage functions', () => {
    beforeEach(() => {
        localStorage.clear();
    });
    
    test('should set and get items', () => {
        const testKey = 'test_key';
        const testValue = { name: 'test', value: 123 };
        
        storage.set(testKey, testValue);
        const retrieved = storage.get(testKey);
        
        expect(retrieved).toEqual(testValue);
    });
    
    test('should return null for non-existent items', () => {
        expect(storage.get('non_existent')).toBeNull();
    });
    
    test('should remove items', () => {
        const testKey = 'test_key';
        const testValue = 'test value';

        storage.set(testKey, testValue);
        expect(storage.get(testKey)).toEqual(testValue);

        storage.remove(testKey);
        expect(storage.get(testKey)).toBeNull();
    });
});

describe('escapeHtml function', () => {
    test('should escape HTML special characters', () => {
        expect(escapeHtml('<script>alert("xss")</script>')).toBe('&lt;script&gt;alert("xss")&lt;/script&gt;');
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

    test('should escape multiple special characters', () => {
        expect(escapeHtml('<a href="test">link</a>')).toBe('&lt;a href="test"&gt;link&lt;/a&gt;');
    });
});

describe('escapeAttr function', () => {
    test('should escape quotes in attributes', () => {
        expect(escapeAttr('value"onclick="alert(1)')).toBe('value&quot;onclick=&quot;alert(1)');
    });

    test('should escape single quotes', () => {
        expect(escapeAttr("value'onclick'")).toBe('value&#x27;onclick&#x27;');
    });

    test('should escape less than and greater than', () => {
        expect(escapeAttr('<script>')).toBe('&lt;script&gt;');
    });

    test('should escape ampersands', () => {
        expect(escapeAttr('a & b')).toBe('a &amp; b');
    });

    test('should convert to string', () => {
        expect(escapeAttr(123)).toBe('123');
    });
});

describe('validateUrl function', () => {
    test('should validate valid HTTP URLs', () => {
        const result = validateUrl('http://example.com');
        expect(result.valid).toBe(true);
        expect(result.url).toBe('http://example.com/');
    });

    test('should validate valid HTTPS URLs', () => {
        const result = validateUrl('https://example.com/path?query=1');
        expect(result.valid).toBe(true);
    });

    test('should reject empty URLs', () => {
        const result = validateUrl('');
        expect(result.valid).toBe(false);
        expect(result.error).toContain('不能为空');
    });

    test('should reject null/undefined URLs', () => {
        expect(validateUrl(null).valid).toBe(false);
        expect(validateUrl(undefined).valid).toBe(false);
    });

    test('should reject URLs without protocol', () => {
        const result = validateUrl('example.com');
        expect(result.valid).toBe(false);
        expect(result.error).toContain('http://或https://');
    });

    test('should reject dangerous protocols', () => {
        expect(validateUrl('javascript:alert(1)').valid).toBe(false);
        expect(validateUrl('data:text/html,<script>alert(1)</script>').valid).toBe(false);
        expect(validateUrl('file:///etc/passwd').valid).toBe(false);
    });

    test('should reject localhost', () => {
        expect(validateUrl('http://localhost:3000').valid).toBe(false);
        expect(validateUrl('http://127.0.0.1:8080').valid).toBe(false);
    });

    test('should reject private IP addresses', () => {
        expect(validateUrl('http://192.168.1.1').valid).toBe(false);
        expect(validateUrl('http://10.0.0.1').valid).toBe(false);
        expect(validateUrl('http://172.16.0.1').valid).toBe(false);
    });

    test('should reject URLs that are too long', () => {
        const longUrl = 'https://example.com/' + 'a'.repeat(3000);
        const result = validateUrl(longUrl);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('过长');
    });

    test('should trim whitespace from URLs', () => {
        const result = validateUrl('  https://example.com  ');
        expect(result.valid).toBe(true);
    });
});

describe('safeJsonParse function', () => {
    test('should parse valid JSON', () => {
        const result = safeJsonParse('{"name":"test","value":123}');
        expect(result).toEqual({ name: 'test', value: 123 });
    });

    test('should return default value for invalid JSON', () => {
        const result = safeJsonParse('invalid json', {});
        expect(result).toEqual({});
    });

    test('should return null for invalid JSON without default', () => {
        const result = safeJsonParse('invalid');
        expect(result).toBeNull();
    });

    test('should return default value for non-string input', () => {
        expect(safeJsonParse(null, [])).toEqual([]);
        expect(safeJsonParse(123, {})).toEqual({});
    });

    test('should prevent prototype pollution', () => {
        const malicious = '{"__proto__":{"polluted":true},"constructor":{"prototype":{"evil":true}}}';
        safeJsonParse(malicious);

        // 确保原型没有被污染
        expect(({}).polluted).toBeUndefined();
        expect(({}).evil).toBeUndefined();
    });

    test('should parse arrays', () => {
        const result = safeJsonParse('[1,2,3]');
        expect(result).toEqual([1, 2, 3]);
    });

    test('should handle empty string', () => {
        const result = safeJsonParse('', 'default');
        expect(result).toBe('default');
    });
});
