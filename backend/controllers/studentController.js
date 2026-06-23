const bcrypt = require('bcrypt');
const studentModel = require('../models/studentModel');

async function listStudents(req, res) {
    try {
        const students = await studentModel.getAllStudents();
        res.json(students.map(({
            passwordHash,
            ...rest
        }) => rest));
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Could not load students.'
        });
    }
}

async function createStudent(req, res) {
    try {
        const {
            matricula,
            email,
            course,
            phone,
            password
        } = req.body;
        if (!matricula || !/^[0-9]{7}$/.test(matricula)) {
            return res.status(400).json({
                message: 'A matrícula deve conter exatamente 7 números.'
            });
        }
        if (!email || !email.trim()) {
            return res.status(400).json({
                message: 'O email do aluno é obrigatório.'
            });
        }
        if (!course || !course.trim()) {
            return res.status(400).json({
                message: 'O curso do aluno é obrigatório.'
            });
        }
        if (!phone || !phone.trim()) {
            return res.status(400).json({
                message: 'O telefone do aluno é obrigatório.'
            });
        }
        const normalizedPhone = phone.replace(/\D/g, '');
        if (!/^\d{11}$/.test(normalizedPhone)) {
            return res.status(400).json({
                message: 'O telefone deve conter DDD (2 dígitos) + número (9 dígitos).'
            });
        }
        if (!password || !password.trim()) {
            return res.status(400).json({
                message: 'A senha do aluno é obrigatória.'
            });
        }

        const existing = await studentModel.findStudentByMatricula(matricula);
        if (existing) {
            return res.status(409).json({
                message: 'Aluno já cadastrado.'
            });
        }

        const passwordHash = await bcrypt.hash(password.trim(), 10);
        await studentModel.createStudent({
            matricula,
            email,
            course,
            phone: normalizedPhone,
            passwordHash
        });
        res.status(201).json({
            message: 'Aluno cadastrado com sucesso.'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Não foi possível cadastrar o aluno.'
        });
    }
}

async function updateStudent(req, res) {
    try {
        const matricula = req.params.matricula;
        const {
            email,
            course,
            phone,
            password
        } = req.body;
        const updates = {};

        if (email !== undefined) updates.email = email;
        if (course !== undefined) updates.course = course;
        if (phone !== undefined) {
            const normalizedPhone = String(phone).replace(/\D/g, '');
            if (!/^\d{11}$/.test(normalizedPhone)) {
                return res.status(400).json({
                    message: 'O telefone deve conter DDD (2 dígitos) + número (9 dígitos).'
                });
            }
            updates.phone = normalizedPhone;
        }
        if (password !== undefined && password.trim()) {
            updates.passwordHash = await bcrypt.hash(password.trim(), 10);
        }

        const updated = await studentModel.updateStudent(matricula, updates);
        if (!updated) {
            return res.status(404).json({
                message: 'Aluno não encontrado.'
            });
        }
        res.json({
            message: 'Aluno atualizado com sucesso.'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Não foi possível atualizar o aluno.'
        });
    }
}

async function getStudent(req, res) {
    try {
        const matricula = req.params.matricula;
        const student = await studentModel.findStudentByMatricula(matricula);
        if (!student) {
            return res.status(404).json({
                message: 'Aluno não encontrado.'
            });
        }
        const {
            passwordHash,
            ...safeStudent
        } = student;
        res.json(safeStudent);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Não foi possível carregar o aluno.'
        });
    }
}

async function deleteStudent(req, res) {
    try {
        const matricula = req.params.matricula;
        const deleted = await studentModel.deleteStudent(matricula);
        if (!deleted) {
            return res.status(404).json({
                message: 'Aluno não encontrado.'
            });
        }
        res.json({
            message: 'Aluno removido com sucesso.'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Não foi possível remover o aluno.'
        });
    }
}

module.exports = {
    listStudents,
    createStudent,
    updateStudent,
    getStudent,
    deleteStudent
};