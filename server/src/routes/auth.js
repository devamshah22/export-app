const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const pool = require('../db/connection');
const authMiddleware = require('../middleware/auth');
const { SECURITY_QUESTIONS, isValidSecurityQuestion } = require('../config/securityQuestions');

const router = express.Router();
const RESET_TTL_MS = 10 * 60 * 1000;
const MAX_RESET_ATTEMPTS = 5;
const resetChallenges = new Map();

function normalizeAnswer(answer) {
    return String(answer || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function validatePassword(password) {
    return typeof password === 'string' && password.length >= 8;
}

function publicUser(user) {
    return {
        id: user.id,
        username: user.username,
        fullName: user.full_name || user.fullName || '',
        securityQuestion: user.security_question || user.securityQuestion || '',
        mustChangePassword: Boolean(user.must_change_password ?? user.mustChangePassword)
    };
}

function signToken(user) {
    return jwt.sign(
        {
            sub: user.id,
            id: user.id,
            username: user.username,
            passwordResetVersion: Number(user.password_reset_version || 0)
        },
        process.env.JWT_SECRET,
        { expiresIn: '12h' }
    );
}

function cleanupChallenges() {
    const now = Date.now();
    for (const [token, challenge] of resetChallenges) {
        if (challenge.expiresAt <= now) resetChallenges.delete(token);
    }
}

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required.' });
        }

        const [users] = await pool.query(
            'SELECT * FROM users WHERE username = ? AND is_active = TRUE',
            [username]
        );
        if (users.length === 0 || !(await bcrypt.compare(password, users[0].password_hash))) {
            return res.status(401).json({ error: 'Invalid credentials.' });
        }

        const user = users[0];
        res.json({ token: signToken(user), user: publicUser(user), securityQuestions: SECURITY_QUESTIONS });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
    try {
        const { username, password, fullName, securityQuestion, securityAnswer } = req.body;
        if (!username || !fullName || !validatePassword(password) ||
            !isValidSecurityQuestion(securityQuestion) || !securityAnswer) {
            return res.status(400).json({
                error: 'Full name, username, password (minimum 8 characters), security question, and answer are required.'
            });
        }

        const [existing] = await pool.query('SELECT id FROM users WHERE username = ?', [username]);
        if (existing.length > 0) return res.status(400).json({ error: 'Username already exists.' });

        const passwordHash = await bcrypt.hash(password, 12);
        const securityAnswerHash = await bcrypt.hash(normalizeAnswer(securityAnswer), 12);
        const [result] = await pool.query(
            `INSERT INTO users
                (username, password_hash, full_name, security_question, security_answer_hash)
             VALUES (?, ?, ?, ?, ?)`,
            [username.trim(), passwordHash, fullName.trim(), securityQuestion.trim(), securityAnswerHash]
        );

        res.status(201).json({ message: 'Account created successfully.', user: {
            id: result.insertId, username: username.trim(), fullName: fullName.trim()
        }});
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// GET /api/auth/security-questions
router.get('/security-questions', (req, res) => {
    res.json({ securityQuestions: SECURITY_QUESTIONS });
});

// GET /api/auth/me
router.get('/me', authMiddleware, (req, res) => {
    res.json({ user: publicUser(req.user), securityQuestions: SECURITY_QUESTIONS });
});

// POST /api/auth/change-password
router.post('/change-password', authMiddleware, async (req, res) => {
    try {
        const { currentPassword, newPassword, confirmPassword, securityQuestion, securityAnswer } = req.body;
        if (!validatePassword(newPassword) || newPassword !== confirmPassword) {
            return res.status(400).json({ error: 'New password must be at least 8 characters and match confirmation.' });
        }
        const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [req.user.id]);
        const user = rows[0];
        if (!user || !(await bcrypt.compare(currentPassword || '', user.password_hash))) {
            return res.status(400).json({ error: 'Current password is incorrect.' });
        }

        const question = String(securityQuestion || user.security_question || '').trim();
        if (!isValidSecurityQuestion(question)) {
            return res.status(400).json({ error: 'Please choose a valid security question.' });
        }
        const answer = normalizeAnswer(securityAnswer);
        const answerHash = securityAnswer
            ? await bcrypt.hash(answer, 12)
            : user.security_answer_hash;
        if (!question || !answerHash) {
            return res.status(400).json({ error: 'Security question and answer are required.' });
        }

        await pool.query(
            `UPDATE users
             SET password_hash = ?, security_question = ?, security_answer_hash = ?,
                 password_reset_version = password_reset_version + 1,
                 must_change_password = FALSE
             WHERE id = ?`,
            [await bcrypt.hash(newPassword, 12), question, answerHash, req.user.id]
        );
        res.json({ message: 'Password changed successfully. Please sign in again.' });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// POST /api/auth/reset/request
router.post('/reset/request', async (req, res) => {
    cleanupChallenges();
    const generic = { message: 'If account exists, password recovery instructions are available.' };
    try {
        const username = String(req.body.username || '').trim();
        if (!username) return res.json(generic);
        const [users] = await pool.query(
            'SELECT id, username, security_question FROM users WHERE username = ? AND is_active = TRUE',
            [username]
        );
        if (users.length === 0 || !users[0].security_question) return res.json(generic);

        const challengeToken = crypto.randomBytes(32).toString('hex');
        resetChallenges.set(challengeToken, {
            userId: users[0].id,
            attempts: 0,
            expiresAt: Date.now() + RESET_TTL_MS
        });
        res.json({ ...generic, challengeToken, securityQuestion: users[0].security_question });
    } catch (error) {
        console.error('Reset request error:', error);
        res.json(generic);
    }
});

// POST /api/auth/reset/complete
router.post('/reset/complete', async (req, res) => {
    cleanupChallenges();
    try {
        const { challengeToken, securityAnswer, newPassword, confirmPassword } = req.body;
        const challenge = resetChallenges.get(challengeToken);
        if (!challenge || challenge.expiresAt <= Date.now()) {
            return res.status(400).json({ error: 'Reset request is invalid or expired.' });
        }
        if (!validatePassword(newPassword) || newPassword !== confirmPassword) {
            return res.status(400).json({ error: 'New password must be at least 8 characters and match confirmation.' });
        }

        const [users] = await pool.query('SELECT * FROM users WHERE id = ? AND is_active = TRUE', [challenge.userId]);
        const user = users[0];
        challenge.attempts += 1;
        if (!user || challenge.attempts > MAX_RESET_ATTEMPTS ||
            !(await bcrypt.compare(normalizeAnswer(securityAnswer), user.security_answer_hash || ''))) {
            if (challenge.attempts >= MAX_RESET_ATTEMPTS) resetChallenges.delete(challengeToken);
            return res.status(400).json({ error: 'Security answer is incorrect or reset request is locked.' });
        }

        await pool.query(
            `UPDATE users SET password_hash = ?, password_reset_version = password_reset_version + 1,
             must_change_password = FALSE WHERE id = ?`,
            [await bcrypt.hash(newPassword, 12), user.id]
        );
        resetChallenges.delete(challengeToken);
        res.json({ message: 'Password reset successfully. Please sign in.' });
    } catch (error) {
        console.error('Reset completion error:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

module.exports = router;
