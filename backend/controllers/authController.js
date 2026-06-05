const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const adminModel = require('../models/adminModel');

function defaultAdminCredentials() {
    return {
        username: process.env.DEFAULT_ADMIN_USER || 'admin',
        password: process.env.DEFAULT_ADMIN_PASS || 'admin123'
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

function normalizeValue(value) {
    return typeof value === 'string' ? value.trim() : value;
}

function isDefaultAdmin(username, password) {
    const defaultAdmin = defaultAdminCredentials();
    return normalizeValue(username) === defaultAdmin.username && normalizeValue(password) === defaultAdmin.password;
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

        if (isDefaultAdmin(username, password)) {
            return res.json({
                token: tokenForAdmin(username, 0),
                username
            });
        }

        const admin = await adminModel.findAdminByUsername(username);
        if (!admin) {
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
        res.status(500).json({
            message: 'Login failed.'
        });
    }
}

function tokenForStudent(matricula) {
    return jwt.sign({
        role: 'student',
        studentMatricula: matricula
    }, process.env.JWT_SECRET || 'lostfound-secret', {
        expiresIn: '8h'
    });
}

async function loginStudent(req, res) {
    try {
        const {
            matricula,
            password
        } = req.body;

        if (!matricula || !/^[0-9]{7,8}$/.test(matricula)) {
            return res.status(400).json({
                message: 'A matrícula deve conter 7 ou 8 números.'
            });
        }

        if (!password || !password.trim()) {
            return res.status(400).json({
                message: 'A senha é obrigatória para o login do aluno.'
            });
        }

        const studentModel = require('../models/studentModel');
        const student = await studentModel.findStudentByMatricula(matricula);
        if (!student) {
            return res.status(404).json({
                message: 'Aluno não encontrado. Peça para um administrador cadastrar você.'
            });
        }

        const valid = await bcrypt.compare(password, student.passwordHash);
        if (!valid) {
            return res.status(401).json({
                message: 'Credenciais inválidas.'
            });
        }

        const token = tokenForStudent(matricula);
        const {
            passwordHash,
            ...safeStudent
        } = student;
        res.json({
            token,
            student: safeStudent
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Falha no login do aluno.'
        });
    }
}

module.exports = {
    login,
    loginStudent
};