const db = require('./db');
const fs = require('fs/promises');
const path = require('path');

const itemsFile = path.join(__dirname, '..', 'data', 'items.json');

async function readFallbackItems() {
    try {
        const content = await fs.readFile(itemsFile, 'utf8');
        return JSON.parse(content || '[]');
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
        const [rows] = await db.query('SELECT id, title, description, location, date_lost, image_url, created_at FROM items ORDER BY created_at DESC');
        return rows;
    } catch (error) {
        console.warn('DB unavailable, using fallback items storage:', error.message || error);
        return readFallbackItems();
    }
}

async function createItem(item) {
    try {
        const [result] = await db.execute(
            'INSERT INTO items (title, description, location, date_lost, image_url) VALUES (?, ?, ?, ?, ?)',
            [item.title, item.description, item.location, item.dateLost, item.imageUrl]
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
    createItem,
    updateItem,
    deleteItem
};