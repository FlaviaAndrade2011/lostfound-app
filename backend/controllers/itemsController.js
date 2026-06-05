const multer = require('multer');
const path = require('path');
const itemModel = require('../models/itemModel');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '..', 'uploads'));
    },
    filename: function (req, file, cb) {
        const uniqueName = `${Date.now()}-${file.originalname}`.replace(/\s+/g, '-');
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage
});

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

        const imageUrl = `/uploads/${req.file.filename}`;
        const itemId = await itemModel.createItem({
            title,
            description,
            location,
            dateLost,
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
            description,
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

        const imageUrl = req.file ? `/uploads/${req.file.filename}` : undefined;
        const itemId = await itemModel.createItem({
            title: 'Publicação de Aluno',
            description,
            location: '',
            dateLost: '',
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

        const imageUrl = req.file ? `/uploads/${req.file.filename}` : undefined;

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
    deleteItem
};