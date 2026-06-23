const db = require('./db');
const fs = require('fs/promises');
const path = require('path');

const itemsFile = path.join(__dirname, '..', 'data', 'items.json');

async function readFallbackItems() {
    try {
        const items = JSON.parse(await fs.readFile(itemsFile, 'utf8') || '[]');
        return items.map(item => ({
            ...item,
            studentMatricula: item.studentMatricula || item.student_matricula,
            status: item.status || (item.studentMatricula || item.student_matricula ? 'Perdido' : 'Achado')
        }));
    } catch (error) {
        if (error.code === 'ENOENT') {
            await fs.writeFile(itemsFile, '[]', 'utf8');
            return [];
        }
        throw error;
    }
}

async function writeFallbackItems(items) {
    await fs.writeFile(itemsFile, JSON.stringify(items, null, 2), 'utf8');
}

async function getAllItems() {
    try {
        const [rows] = await db.query('SELECT id, title, description, location, date_lost, image_url, created_at, student_matricula AS studentMatricula, status FROM items ORDER BY created_at DESC');
        return rows;
    } catch (error) {
        console.warn('DB unavailable, using fallback items storage:', error.message || error);
        return readFallbackItems();
    }
}

async function getItemsByStudentMatricula(matricula) {
    try {
        const [rows] = await db.query(
            'SELECT id, title, description, location, date_lost, image_url, created_at, student_matricula AS studentMatricula, status FROM items WHERE student_matricula = ? ORDER BY created_at DESC',
            [matricula]
        );
        return rows;
    } catch (error) {
        console.warn('DB unavailable, filtering fallback items by student:', error.message || error);
        const items = await readFallbackItems();
        return items.filter(item => String(item.studentMatricula || item.student_matricula || '') === String(matricula));
    }
}

async function getItemById(itemId) {
    try {
        const [rows] = await db.query(
            'SELECT id, title, description, location, date_lost, image_url, created_at, student_matricula AS studentMatricula, status FROM items WHERE id = ? LIMIT 1',
            [itemId]
        );
        return rows[0] || null;
    } catch (error) {
        console.warn('DB unavailable, using fallback item lookup:', error.message || error);
        const items = await readFallbackItems();
        const found = items.find(item => Number(item.id) === Number(itemId));
        return found || null;
    }
}

async function createItem(item) {
    try {
        const [result] = await db.execute(
            'INSERT INTO items (title, description, location, date_lost, image_url, student_matricula, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [item.title, item.description ?? null, item.location ?? null, item.dateLost ?? null, item.imageUrl ?? null, item.studentMatricula ?? null, item.status || (item.studentMatricula ? 'Perdido' : 'Achado')]
        );
        return result.insertId;
    } catch (error) {
        console.warn('DB unavailable, saving item to fallback storage:', error.message || error);
        const items = await readFallbackItems();
        const nextId = items.length ? Math.max(...items.map(i => i.id || 0)) + 1 : 1;
        const fallbackItem = {
            id: nextId,
            title: item.title,
            description: item.description,
            location: item.location,
            date_lost: item.dateLost,
            image_url: item.imageUrl,
            studentMatricula: item.studentMatricula,
            status: item.status || (item.studentMatricula ? 'Perdido' : 'Achado'),
            created_at: new Date().toISOString()
        };
        items.unshift(fallbackItem);
        await writeFallbackItems(items);
        return nextId;
    }
}

async function updateItem(itemId, updates) {
    try {
        const fields = [];
        const values = [];

        if (updates.title !== undefined) {
            fields.push('title = ?');
            values.push(updates.title);
        }
        if (updates.description !== undefined) {
            fields.push('description = ?');
            values.push(updates.description);
        }
        if (updates.location !== undefined) {
            fields.push('location = ?');
            values.push(updates.location);
        }
        if (updates.dateLost !== undefined) {
            fields.push('date_lost = ?');
            values.push(updates.dateLost);
        }
        if (updates.imageUrl !== undefined) {
            fields.push('image_url = ?');
            values.push(updates.imageUrl);
        }
        if (updates.status !== undefined) {
            fields.push('status = ?');
            values.push(updates.status);
        }

        if (fields.length === 0) return true;

        values.push(itemId);
        const query = `UPDATE items SET ${fields.join(', ')} WHERE id = ?`;
        const [result] = await db.execute(query, values);
        return result.affectedRows > 0;
    } catch (error) {
        console.warn('DB unavailable, updating fallback storage:', error.message || error);
        try {
            const items = await readFallbackItems();
            const itemIdNum = Number(itemId);
            const itemIndex = items.findIndex(item => Number(item.id) === itemIdNum);
            if (itemIndex === -1) return false;

            if (updates.title !== undefined) items[itemIndex].title = updates.title;
            if (updates.description !== undefined) items[itemIndex].description = updates.description;
            if (updates.location !== undefined) items[itemIndex].location = updates.location;
            if (updates.dateLost !== undefined) items[itemIndex].date_lost = updates.dateLost;
            if (updates.imageUrl !== undefined) items[itemIndex].image_url = updates.imageUrl;
            if (updates.status !== undefined) items[itemIndex].status = updates.status;

            await writeFallbackItems(items);
            return true;
        } catch (fallbackError) {
            console.error('Failed to update fallback storage:', fallbackError.message || fallbackError);
            return false;
        }
    }
}

async function deleteItem(itemId) {
    try {
        const [result] = await db.execute('DELETE FROM items WHERE id = ?', [itemId]);
        if (result.affectedRows > 0) {
            return true;
        }
        return false;
    } catch (error) {
        console.warn('DB unavailable, deleting from fallback storage:', error.message || error);
        try {
            const items = await readFallbackItems();
            const itemIdNum = Number(itemId);
            const filtered = items.filter(item => Number(item.id) !== itemIdNum);
            if (filtered.length === items.length) {
                return false;
            }
            await writeFallbackItems(filtered);
            return true;
        } catch (fallbackError) {
            console.error('Failed to delete from fallback storage:', fallbackError.message || fallbackError);
            return false;
        }
    }
}

module.exports = {
    getAllItems,
    getItemsByStudentMatricula,
    getItemById,
    createItem,
    updateItem,
    deleteItem
};