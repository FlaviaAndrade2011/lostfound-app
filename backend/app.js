const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcrypt');
const authRoutes = require('./routes/auth');
const itemsRoutes = require('./routes/items');
const studentRoutes = require('./routes/students');
const adminModel = require('./models/adminModel');
const initDb = require('./models/initDb');

async function ensureDefaultAdmin() {
    const count = await adminModel.getAdminCount();
    if (count === 0) {
        const username = process.env.DEFAULT_ADMIN_USER || 'admin';
        const password = process.env.DEFAULT_ADMIN_PASS || 'admin123';
        const hash = await bcrypt.hash(password, 10);
        await adminModel.createAdmin(username, hash);
        console.log(`Default admin created: ${username}`);
        console.log(`Use username='${username}' and password='${password}' to log in.`);
    }
}

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/items', itemsRoutes);
app.use('/api/students', studentRoutes);

app.get('/', (req, res) => {
    res.send({
        status: 'lostfound backend running'
    });
});

const port = process.env.PORT || 3000;

initDb()
    .then(() => ensureDefaultAdmin())
    .catch((error) => {
        console.warn('Could not initialize database:', error.message || error);
        console.warn('Continuing startup without database. Fallback storage is still available.');
    })
    .finally(() => {
        app.listen(port, () => {
            console.log(`Lost & Found backend listening on port ${port}`);
        });
    });