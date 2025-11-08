// routes/categories.js
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const categoriesController = require('../controllers/categoriesController');
const authMiddleware = require('../middleware/authMiddleware');

// === Rute Publik ===
router.get('/', categoriesController.getAllCategories);
router.get('/:slug', categoriesController.getCategoryBySlug); // <-- TAMBAHAN BARU

// === Rute Admin (TERPROTEKSI) ===
const categoryValidation = [
  body('name', 'Nama kategori wajib diisi').notEmpty().trim(),
  body('description').optional().trim()
];

// Terapkan proteksi admin untuk rute di bawah
router.use(authMiddleware);

router.post('/', categoryValidation, categoriesController.createCategory);
router.put('/:id', categoryValidation, categoriesController.updateCategory); // <-- TAMBAJAH BARU
router.delete('/:id', categoriesController.deleteCategory); // <-- TAMBAHAN BARU

module.exports = router;