import crypto from 'crypto';
import config from '../config.js';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

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
                this._save();
            }
        } catch {
            this.data = { users: [], usage: {} };
            this._save();
        }
    }

    _save() {
        writeFileSync(this.dataPath, JSON.stringify(this.data, null, 2), 'utf8');
    }

    _findUser(email) {
        return this.data.users.find(u => u.email === email);
    }

    _hashPassword(password) {
        return crypto.createHash('sha256').update(password + config.JWT_SECRET).digest('hex');
    }

    async register(email, password) {
        if (this._findUser(email)) {
            return { error: '该邮箱已注册' };
        }

        const hashedPassword = crypto.createHash('sha256').update(password + config.JWT_SECRET).digest('hex');

        const user = {
            id: this.data.users.length + 1,
            email,
            password: hashedPassword,
            createdAt: new Date().toISOString()
        };
        this.data.users.push(user);
        this._save();
        return { user: { id: user.id, email: user.email } };
    }

    async verifyPassword(email, password) {
        const user = this._findUser(email);
        if (!user) return null;

        const hashedPassword = crypto.createHash('sha256').update(password + config.JWT_SECRET).digest('hex');

        return hashedPassword === user.password ? user : null;
    }

    getUserById(id) {
        return this.data.users.find(u => u.id === id);
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
        this._save();
        return this.checkQuota(userId);
    }
}

const quotaService = new QuotaService();
export { QuotaService, quotaService };