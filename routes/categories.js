// routes/categories.js
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const categoriesController = require('../controllers/categoriesController');
const authMiddleware = require('../middleware/authMiddleware');

// === Rute Publik ===
router.get('/', categoriesController.getAllCategories);
// (Tambahkan GET by Slug nanti)

// === Rute Admin (TERPROTEKSI) ===
const categoryValidation = [
  body('name', 'Nama kategori wajib diisi').notEmpty().trim(),
  body('description').optional().trim()
];

router.post('/', authMiddleware, categoryValidation, categoriesController.createCategory);

module.exports = router;