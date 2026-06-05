const db = require('./db');
const fs = require('fs/promises');
const path = require('path');

const studentsFile = path.join(__dirname, '..', 'data', 'students.json');

async function readFallbackStudents() {
    try {
        const content = await fs.readFile(studentsFile, 'utf8');
        const students = JSON.parse(content || '[]');
        return students;
    } catch (error) {
        if (error.code === 'ENOENT') {
            await fs.writeFile(studentsFile, '[]', 'utf8');
            return [];
        }
        throw error;
    }
}

async function writeFallbackStudents(students) {
    await fs.writeFile(studentsFile, JSON.stringify(students, null, 2), 'utf8');
}

async function getAllStudents() {
    try {
        const [rows] = await db.query('SELECT id, matricula, email, course, phone, password_hash AS passwordHash FROM students ORDER BY matricula');
        return rows.map(row => ({
            ...row,
            passwordHash: row.passwordHash
        }));
    } catch (error) {
        console.warn('DB unavailable, using fallback student storage:', error.message || error);
        return readFallbackStudents();
    }
}

async function findStudentByMatricula(matricula) {
    try {
        const [rows] = await db.query('SELECT id, matricula, email, course, phone, password_hash AS passwordHash FROM students WHERE matricula = ?', [matricula]);
        return rows[0];
    } catch (error) {
        console.warn('DB unavailable, using fallback student storage:', error.message || error);
        const students = await readFallbackStudents();
        return students.find(student => student.matricula === matricula);
    }
}

async function createStudent(student) {
    try {
        const [result] = await db.execute(
            'INSERT INTO students (matricula, email, course, phone, password_hash) VALUES (?, ?, ?, ?, ?)',
            [student.matricula, student.email, student.course, student.phone, student.passwordHash]
        );
        return result.insertId;
    } catch (error) {
        console.warn('DB unavailable, saving student to fallback storage:', error.message || error);
        const students = await readFallbackStudents();
        const nextId = students.length ? Math.max(...students.map(s => s.id || 0)) + 1 : 1;
        const fallbackStudent = {
            id: nextId,
            matricula: student.matricula,
            email: student.email,
            course: student.course,
            phone: student.phone,
            passwordHash: student.passwordHash
        };
        students.push(fallbackStudent);
        await writeFallbackStudents(students);
        return nextId;
    }
}

async function updateStudent(matricula, updates) {
    try {
        const fields = [];
        const values = [];
        if (updates.email !== undefined) {
            fields.push('email = ?');
            values.push(updates.email);
        }
        if (updates.course !== undefined) {
            fields.push('course = ?');
            values.push(updates.course);
        }
        if (updates.phone !== undefined) {
            fields.push('phone = ?');
            values.push(updates.phone);
        }
        if (updates.passwordHash !== undefined) {
            fields.push('password_hash = ?');
            values.push(updates.passwordHash);
        }
        if (fields.length === 0) return true;
        values.push(matricula);
        const query = `UPDATE students SET ${fields.join(', ')} WHERE matricula = ?`;
        const [result] = await db.execute(query, values);
        if (result.affectedRows > 0) {
            return true;
        }
        return false;
    } catch (error) {
        console.warn('DB unavailable, updating fallback student storage:', error.message || error);
        const students = await readFallbackStudents();
        const index = students.findIndex(s => s.matricula === matricula);
        if (index === -1) return false;
        const student = students[index];
        if (updates.email !== undefined) student.email = updates.email;
        if (updates.course !== undefined) student.course = updates.course;
        if (updates.phone !== undefined) student.phone = updates.phone;
        if (updates.passwordHash !== undefined) student.passwordHash = updates.passwordHash;
        students[index] = student;
        await writeFallbackStudents(students);
        return true;
    }
}

async function deleteStudent(matricula) {
    try {
        const [result] = await db.execute('DELETE FROM students WHERE matricula = ?', [matricula]);
        return result.affectedRows > 0;
    } catch (error) {
        console.warn('DB unavailable, deleting fallback student from storage:', error.message || error);
        const students = await readFallbackStudents();
        const filtered = students.filter(student => student.matricula !== matricula);
        if (filtered.length === students.length) return false;
        await writeFallbackStudents(filtered);
        return true;
    }
}

module.exports = {
    getAllStudents,
    findStudentByMatricula,
    createStudent,
    updateStudent,
    deleteStudent
};