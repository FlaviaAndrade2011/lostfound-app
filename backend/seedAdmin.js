const bcrypt = require('bcrypt');
const pool = require('./models/db');

async function createAdmin() {
    const username = process.argv[2] || 'admin';
    const password = process.argv[3] || 'admin123';
    const hash = await bcrypt.hash(password, 10);
    const [result] = await pool.execute('INSERT INTO admins (username, password) VALUES (?, ?)', [username, hash]);
    console.log(`Admin created: ${username} (id=${result.insertId})`);
    process.exit(0);
}

createAdmin().catch(err => {
    console.error(err);
    process.exit(1);
});