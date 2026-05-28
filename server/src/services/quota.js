import config from '../config.js';
import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync, unlinkSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { scryptSync, randomBytes, timingSafeEqual } from 'crypto';

function hashPassword(password) {
    const salt = randomBytes(16).toString('hex');
    const derivedKey = scryptSync(password + config.JWT_SECRET, salt, 64);
    return `${salt}:${derivedKey.toString('hex')}`;
}

function verifyPasswordHash(password, storedHash) {
    try {
        const [salt, key] = storedHash.split(':');
        if (!salt || !key) return false;
        const derivedKey = scryptSync(password + config.JWT_SECRET, Buffer.from(salt, 'hex'), 64);
        return timingSafeEqual(Buffer.from(key, 'hex'), derivedKey);
    } catch {
        return false;
    }
}

const __dirname = dirname(fileURLToPath(import.meta.url));

class QuotaService {
    constructor() {
        this.dataPath = join(__dirname, '../../data', 'quota.json');
        this.data = null;
        this._ensureDataDir();
        this._load();
    }

    _ensureDataDir() {
        const dir = dirname(this.dataPath);
        if (!existsSync(dir)) {
            mkdirSync(dir, { recursive: true });
        }
    }

    _load() {
        try {
            if (existsSync(this.dataPath)) {
                this.data = JSON.parse(readFileSync(this.dataPath, 'utf8'));
            } else {
                this.data = { users: [], usage: {} };
                this._atomicSave();
            }
        } catch {
            this.data = { users: [], usage: {} };
            this._atomicSave();
        }
    }

    _atomicSave() {
        const tmpPath = this.dataPath + '.tmp';
        writeFileSync(tmpPath, JSON.stringify(this.data, null, 2), 'utf8');
        renameSync(tmpPath, this.dataPath);
    }

    _generateUserId() {
        return Date.now().toString(36) + randomBytes(4).toString('hex');
    }

    _findUser(email) {
        return this.data.users.find(u => u.email === email);
    }

    async register(email, password) {
        if (this._findUser(email)) {
            return { error: '该邮箱已注册' };
        }

        const hashedPassword = hashPassword(password);

        const user = {
            id: this._generateUserId(),
            email,
            password: hashedPassword,
            createdAt: new Date().toISOString()
        };
        this.data.users.push(user);
        this._atomicSave();
        return { user: { id: user.id, email: user.email } };
    }

    async verifyPassword(email, password) {
        const user = this._findUser(email);
        if (!user) return null;

        const isValid = verifyPasswordHash(password, user.password);

        return isValid ? user : null;
    }

    getUserById(id) {
        const user = this.data.users.find(u => u.id === id);
        if (!user) return null;
        const { password: _, ...safeUser } = user;
        return safeUser;
    }

    checkQuota(userId) {
        const today = new Date().toISOString().split('T')[0];
        const key = `${userId}_${today}`;
        const used = this.data.usage[key] || 0;
        return {
            used,
            remaining: Math.max(0, config.DAILY_QUOTA - used),
            total: config.DAILY_QUOTA,
            resetAt: new Date(new Date().setHours(24, 0, 0, 0)).toISOString()
        };
    }

    incrementUsage(userId) {
        const today = new Date().toISOString().split('T')[0];
        const key = `${userId}_${today}`;
        this.data.usage[key] = (this.data.usage[key] || 0) + 1;
        this._atomicSave();
        return this.checkQuota(userId);
    }
}

const quotaService = new QuotaService();
export { QuotaService, quotaService };
