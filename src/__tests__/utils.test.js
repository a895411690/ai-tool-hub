// utils.js 测试文件
import { debounce, throttle, crypto, storage } from '../js/utils.js';

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
