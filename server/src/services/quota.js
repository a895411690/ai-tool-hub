import config from '../config.js';
import { promises as fsp, existsSync, mkdirSync, readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { scryptSync, randomBytes, timingSafeEqual } from 'crypto';

function hashPassword(password) {
    const salt = randomBytes(16);
    const derivedKey = scryptSync(password + config.JWT_SECRET, salt, 64);
    return `${salt.toString('hex')}:${derivedKey.toString('hex')}`;
}

function verifyPasswordHash(password, storedHash) {
    try {
        const [saltHex, keyHex] = storedHash.split(':');
        if (!saltHex || !keyHex) return false;
        const salt = Buffer.from(saltHex, 'hex');
        const derivedKey = scryptSync(password + config.JWT_SECRET, salt, 64);
        return timingSafeEqual(Buffer.from(keyHex, 'hex'), derivedKey);
    } catch {
        return false;
    }
}

const __dirname = dirname(fileURLToPath(import.meta.url));

class QuotaService {
    /**
     * @param {string} [dataPath] - Optional custom data path (for testing)
     */
    constructor(dataPath) {
        this.dataPath = dataPath || join(__dirname, '../../data', 'quota.json');
        this.data = null;
        // Promise chain that serializes all write operations so concurrent
        // mutations (e.g. two incrementUsage calls) never race on the file.
        this._writeQueue = Promise.resolve();
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
                this._enqueueWrite();
            }
        } catch {
            this.data = { users: [], usage: {} };
            this._enqueueWrite();
        }
    }

    /**
     * Enqueue an atomic file write on the serialization promise chain.
     * Async, non-blocking -- the caller does not have to await this.
     * Write errors are logged and silently swallowed since the in-memory
     * state is the source of truth during this server's lifetime.
     */
    /**
     * Await the write queue to flush all pending writes to disk.
     * Used by tests to verify persistence before cleanup.
     */
    async flush() {
        await this._writeQueue;
    }

    _enqueueWrite() {
        const dataPath = this.dataPath;
        const serialized = JSON.stringify(this.data, null, 2);
        this._writeQueue = this._writeQueue.then(async () => {
            const tmpPath = dataPath + '.tmp';
            await fsp.writeFile(tmpPath, serialized, 'utf8');
            await fsp.rename(tmpPath, dataPath);
        });
        this._writeQueue.catch(err => {
            // ENOENT is benign (temp dir cleaned up before async write).
            if (err.code !== 'ENOENT') {
                console.error('[QuotaService] Write error:', err);
            }
        });
    }

    _generateUserId() {
        return Date.now().toString(36) + randomBytes(4).toString('hex');
    }

    _findUser(email) {
        return this.data.users.find(u => u.email === email);
    }

    register(email, password) {
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
        this._enqueueWrite();
        return { user: { id: user.id, email: user.email } };
    }

    verifyPassword(email, password) {
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
        this._enqueueWrite();
        return this.checkQuota(userId);
    }
}

const quotaService = new QuotaService();
export { QuotaService, quotaService };
