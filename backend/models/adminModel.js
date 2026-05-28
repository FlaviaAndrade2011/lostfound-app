const db = require('./db');

async function findAdminByUsername(username) {
    const [rows] = await db.query('SELECT id, username, password FROM admins WHERE username = ?', [username]);
    return rows[0];
}

async function getAdminCount() {
    const [rows] = await db.query('SELECT COUNT(*) AS count FROM admins');
    return rows[0].count;
}

async function createAdmin(username, passwordHash) {
    const [result] = await db.execute('INSERT INTO admins (username, password) VALUES (?, ?)', [username, passwordHash]);
    return result.insertId;
}

module.exports = {
    findAdminByUsername,
    getAdminCount,
    createAdmin
};