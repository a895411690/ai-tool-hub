import { Router } from 'express';
import { generateToken, authMiddleware } from '../middleware/auth.js';
import { quotaService } from '../services/quota.js';
import config from '../config.js';
import logger from '../utils/logger.js';

const router = Router();

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN = 8;
const PASSWORD_STRENGTH_REGEX = /^(?=.*[A-Za-z])(?=.*\d)/;

router.post('/register', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: '邮箱和密码不能为空' });
        }

        if (!EMAIL_REGEX.test(email)) {
            return res.status(400).json({ error: '邮箱格式不正确' });
        }

        if (password.length < PASSWORD_MIN) {
            return res.status(400).json({ error: `密码至少${PASSWORD_MIN}位` });
        }

        if (!PASSWORD_STRENGTH_REGEX.test(password)) {
            return res.status(400).json({ error: '密码必须包含至少一个字母和一个数字' });
        }

        const result = await quotaService.register(email, password);
        if (result.error) {
            return res.status(409).json({ error: result.error });
        }

        const user = result.user;
        const token = generateToken({ id: user.id, email: user.email });
        const quota = quotaService.checkQuota(user.id);

        logger.info(`User registered: ${email}`);
        res.status(201).json({
            token,
            user,
            quota
        });
    } catch (error) {
        logger.error('Register error:', error);
        res.status(500).json({ error: '注册失败，请稍后重试' });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: '邮箱和密码不能为空' });
        }

        const user = await quotaService.verifyPassword(email, password);
        if (!user) {
            logger.warn(`Failed login attempt for: ${email}`);
            return res.status(401).json({ error: '邮箱或密码不正确' });
        }

        const token = generateToken({ id: user.id, email: user.email });
        const quota = quotaService.checkQuota(user.id);

        logger.info(`User logged in: ${email}`);
        res.json({
            token,
            user: { id: user.id, email: user.email },
            quota
        });
    } catch (error) {
        logger.error('Login error:', error);
        res.status(500).json({ error: '登录失败，请稍后重试' });
    }
});

router.get('/me', authMiddleware, (req, res) => {
    try {
        const user = quotaService.getUserById(req.user.id);
        if (!user) {
            return res.status(404).json({ error: '用户不存在' });
        }

        const quota = quotaService.checkQuota(user.id);
        res.json({
            user: { id: user.id, email: user.email, createdAt: user.createdAt },
            quota
        });
    } catch (error) {
        logger.error('Get user info error:', error);
        res.status(500).json({ error: '获取用户信息失败' });
    }
});

export default router;
