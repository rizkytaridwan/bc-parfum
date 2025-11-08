// routes/brands.js
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const brandController = require('../controllers/brandController');
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware'); 

// === Rute Publik (Untuk Frontend SEO) ===
router.get('/', brandController.getAllBrands);
router.get('/:slug', brandController.getBrandBySlug);

// === Rute Admin (TERPROTEKSI) ===
const brandValidation = [
  body('name', 'Nama brand wajib diisi').notEmpty().trim(),
  body('description').optional().trim()
];

// Terapkan proteksi admin untuk rute di bawah
router.use(authMiddleware);

router.post(
  '/', 
  upload.single('brandImage'), 
  brandValidation, 
  brandController.createBrand
);

router.put(
  '/:id', 
  upload.single('brandImage'), 
  brandValidation, 
  brandController.updateBrand
);

router.delete(
  '/:id', 
  brandController.deleteBrand
);

module.exports = router;