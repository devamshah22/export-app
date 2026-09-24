const jwt = require('jsonwebtoken');
const pool = require('../db/connection');

async function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const token = authHeader.slice(7);

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.sub || decoded.id;
        const [users] = await pool.query(
            `SELECT id, username, full_name, security_question,
                    password_reset_version, must_change_password, is_active
             FROM users WHERE id = ? LIMIT 1`,
            [userId]
        );
        const user = users[0];

        if (!user || !user.is_active) {
            return res.status(401).json({ error: 'Invalid or inactive account.' });
        }

        if (decoded.passwordResetVersion !== undefined &&
            Number(decoded.passwordResetVersion) !== Number(user.password_reset_version || 0)) {
            return res.status(401).json({ error: 'Session expired. Please sign in again.' });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid or expired token.' });
    }
}

module.exports = authMiddleware;
