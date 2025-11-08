// routes/brands.js
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const brandController = require('../controllers/brandController');
const authMiddleware = require('../middleware/authMiddleware'); // Proteksi Admin

// === Rute Publik (Untuk Frontend SEO) ===
router.get('/', brandController.getAllBrands);
router.get('/:slug', brandController.getBrandBySlug);

// === Rute Admin (TERPROTEKSI) ===
// KEAMANAN: Terapkan validasi input
const brandValidation = [
  body('name', 'Nama brand wajib diisi').notEmpty().trim(),
  body('description').optional().trim()
];

router.post('/', authMiddleware, brandValidation, brandController.createBrand);
// (Tambahkan rute PUT dan DELETE di sini, juga diproteksi)

module.exports = router;