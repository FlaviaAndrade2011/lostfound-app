const multer = require('multer');
const path = require('path');
const fs = require('fs');
const itemModel = require('../models/itemModel');

const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        const uniqueName = `${Date.now()}-${file.originalname}`.replace(/\s+/g, '-');
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage
});

function validateDateLost(dateLost) {
    if (!dateLost || !dateLost.trim()) return null;

    const date = new Date(dateLost);
    if (isNaN(date.getTime())) {
        return { error: 'Data inválida.' };
    }

    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    oneYearAgo.setHours(0, 0, 0, 0);

    if (date > today) {
        return { error: 'A data não pode ser no futuro.' };
    }

    if (date < oneYearAgo) {
        return { error: 'A data não pode ser superior a 1 ano no passado.' };
    }

    return null;
}

async function getItems(req, res) {
    try {
        const items = await itemModel.getAllItems();
        res.json(items);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Could not load items.'
        });
    }
}

async function addItem(req, res) {
    try {
        const {
            title,
            description,
            location,
            dateLost,
            status
        } = req.body;
        if (!req.file) {
            return res.status(400).json({
                message: 'Image upload is required.'
            });
        }

        const dateError = validateDateLost(dateLost);
        if (dateError) {
            return res.status(400).json({ message: dateError.error });
        }

        const imageUrl = `/uploads/${req.file.filename}`;
        const itemId = await itemModel.createItem({
            title,
            description: description || null,
            location: location || null,
            dateLost: dateLost || null,
            imageUrl,
            status: status || 'Achado'
        });

        res.status(201).json({
            message: 'Item added.',
            itemId
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Could not add item.'
        });
    }
}

async function addPublicItem(req, res) {
    try {
        const {
            title,
            description,
            location,
            dateLost,
            studentMatricula,
            status
        } = req.body;

        if (!studentMatricula || !studentMatricula.trim()) {
            return res.status(400).json({
                message: 'Matrícula do aluno não encontrada. Faça login novamente antes de publicar.'
            });
        }

        if (!description || !description.trim()) {
            return res.status(400).json({
                message: 'A descrição é obrigatória.'
            });
        }

        const dateError = validateDateLost(dateLost);
        if (dateError) {
            return res.status(400).json({ message: dateError.error });
        }

        const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
        const itemId = await itemModel.createItem({
            title: title && title.trim() ? title.trim() : 'Publicação de Aluno',
            description,
            location: location && location.trim() ? location.trim() : null,
            dateLost: dateLost && dateLost.trim() ? dateLost.trim() : null,
            imageUrl,
            studentMatricula,
            status: status || 'Perdido'
        });

        res.status(201).json({
            message: 'Publicação adicionada com sucesso.',
            itemId
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Could not add public item.'
        });
    }
}

async function updateItem(req, res) {
    try {
        const itemId = parseInt(req.params.id, 10);
        if (Number.isNaN(itemId)) {
            return res.status(400).json({
                message: 'Invalid item ID.'
            });
        }

        const {
            title,
            description,
            location,
            dateLost,
            status
        } = req.body;

        const dateError = validateDateLost(dateLost);
        if (dateError) {
            return res.status(400).json({ message: dateError.error });
        }

        const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

        const updated = await itemModel.updateItem(itemId, {
            title,
            description,
            location,
            dateLost,
            imageUrl,
            status
        });

        if (!updated) {
            return res.status(404).json({
                message: 'Item not found.'
            });
        }

        res.json({
            message: 'Item updated.'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Could not update item.'
        });
    }
}

async function getStudentItems(req, res) {
    try {
        const matricula = req.student?.studentMatricula;
        if (!matricula) {
            return res.status(401).json({
                message: 'Token de aluno inválido.'
            });
        }

        const items = await itemModel.getItemsByStudentMatricula(matricula);
        res.json(items);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Não foi possível carregar as publicações do aluno.'
        });
    }
}

async function updateStudentItem(req, res) {
    try {
        const itemId = parseInt(req.params.id, 10);
        if (Number.isNaN(itemId)) {
            return res.status(400).json({
                message: 'Invalid item ID.'
            });
        }

        const matricula = req.student?.studentMatricula;
        if (!matricula) {
            return res.status(401).json({
                message: 'Token de aluno inválido.'
            });
        }

        const existing = await itemModel.getItemById(itemId);
        if (!existing) {
            return res.status(404).json({
                message: 'Item not found.'
            });
        }

        if (String(existing.studentMatricula || '') !== String(matricula)) {
            return res.status(403).json({
                message: 'Você só pode editar os seus próprios itens.'
            });
        }

        const {
            description,
            status
        } = req.body;
        if (!description || !description.trim()) {
            return res.status(400).json({
                message: 'A descrição é obrigatória.'
            });
        }

        const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
        const updated = await itemModel.updateItem(itemId, {
            description: description.trim(),
            status: status || existing.status || 'Perdido',
            imageUrl
        });

        if (!updated) {
            return res.status(404).json({
                message: 'Item not found.'
            });
        }

        res.json({
            message: 'Publicação atualizada com sucesso.'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Could not update item.'
        });
    }
}

async function deleteStudentItem(req, res) {
    try {
        const itemId = parseInt(req.params.id, 10);
        if (Number.isNaN(itemId)) {
            return res.status(400).json({
                message: 'Invalid item ID.'
            });
        }

        const matricula = req.student?.studentMatricula;
        if (!matricula) {
            return res.status(401).json({
                message: 'Token de aluno inválido.'
            });
        }

        const existing = await itemModel.getItemById(itemId);
        if (!existing) {
            return res.status(404).json({
                message: 'Item not found.'
            });
        }

        if (String(existing.studentMatricula || '') !== String(matricula)) {
            return res.status(403).json({
                message: 'Você só pode excluir os seus próprios itens.'
            });
        }

        const deleted = await itemModel.deleteItem(itemId);
        if (!deleted) {
            return res.status(404).json({
                message: 'Item not found.'
            });
        }

        res.json({
            message: 'Publicação excluída com sucesso.'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Could not delete item.'
        });
    }
}

async function deleteItem(req, res) {
    try {
        const itemId = parseInt(req.params.id, 10);
        if (Number.isNaN(itemId)) {
            return res.status(400).json({
                message: 'Invalid item ID.'
            });
        }

        const deleted = await itemModel.deleteItem(itemId);
        if (!deleted) {
            return res.status(404).json({
                message: 'Item not found.'
            });
        }

        res.json({
            message: 'Item deleted.'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Could not delete item.'
        });
    }
}

module.exports = {
    upload,
    getItems,
    addItem,
    addPublicItem,
    updateItem,
    deleteItem,
    getStudentItems,
    updateStudentItem,
    deleteStudentItem
};