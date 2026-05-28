const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const adminModel = require('../models/adminModel');

function defaultAdminCredentials() {
    return {
        username: process.env.DEFAULT_ADMIN_USER || 'sa',
        password: process.env.DEFAULT_ADMIN_PASS || '1234'
    };
}

function tokenForAdmin(username, adminId = null) {
    return jwt.sign({
        adminId,
        username
    }, process.env.JWT_SECRET || 'lostfound-secret', {
        expiresIn: '8h'
    });
}

function isDefaultAdmin(username, password) {
    const defaultAdmin = defaultAdminCredentials();
    return username === defaultAdmin.username && password === defaultAdmin.password;
}

async function login(req, res) {
    try {
        const {
            username,
            password
        } = req.body;
        if (!username || !password) {
            return res.status(400).json({
                message: 'Username and password are required.'
            });
        }

        const admin = await adminModel.findAdminByUsername(username);
        if (!admin) {
            if (isDefaultAdmin(username, password)) {
                return res.json({
                    token: tokenForAdmin(username, 0),
                    username
                });
            }

            return res.status(401).json({
                message: 'Invalid credentials.'
            });
        }

        const valid = await bcrypt.compare(password, admin.password);
        if (!valid) {
            return res.status(401).json({
                message: 'Invalid credentials.'
            });
        }

        const token = tokenForAdmin(admin.username, admin.id);

        res.json({
            token,
            username: admin.username
        });
    } catch (error) {
        console.error(error);
        const {
            username,
            password
        } = req.body;
        if (isDefaultAdmin(username, password)) {
            return res.json({
                token: tokenForAdmin(username, 0),
                username
            });
        }
        res.status(500).json({
            message: 'Login failed.'
        });
    }
}

module.exports = {
    login
};