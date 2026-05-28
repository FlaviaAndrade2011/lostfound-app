const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({
            message: 'Authorization header missing.'
        });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({
            message: 'Token missing.'
        });
    }

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET || 'lostfound-secret');
        req.admin = payload;
        next();
    } catch (error) {
        return res.status(401).json({
            message: 'Invalid token.'
        });
    }
}

module.exports = verifyToken;