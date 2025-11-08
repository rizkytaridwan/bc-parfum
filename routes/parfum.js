// routes/parfum.js
const express = require('express');
const router = express.Router();
const { body, check } = require('express-validator');
const parfumController = require('../controllers/parfumController');
const parfumNotesController = require('../controllers/parfumNotesController');
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// === Rute Publik (Frontend SEO) ===
router.get('/', parfumController.getAllParfum);
router.get('/:slug', parfumController.getParfumBySlug);

// === Rute Admin (TERPROTEKSI) ===

// Validasi untuk parfum baru
const parfumValidation = [
  body('name', 'Nama parfum wajib diisi').notEmpty().trim(),
  body('brandId')
    .optional({ nullable: true })
    .isString().withMessage('brandId harus berupa string jika diisi'),
  body('categoryId')
    .optional({ nullable: true })
    .isString().withMessage('categoryId harus berupa string jika diisi'),
  body('launchYear')
    .optional({ nullable: true })
    .isInt({ min: 1000, max: 2099 }).withMessage('Tahun tidak valid')
];

const notesValidation = [
  body('top').optional().isArray().withMessage('Top notes harus array'),
  body('middle').optional().isArray().withMessage('Middle notes harus array'),
  body('base').optional().isArray().withMessage('Base notes harus array'),
  check(['top.*', 'middle.*', 'base.*']).optional().isString().withMessage('Note ID tidak valid')
];

router.use(authMiddleware);

router.post(
  '/',
  upload.single('parfumImage'),
  parfumValidation,
  parfumController.createParfum  
);

router.put(
  '/:id',
  upload.single('parfumImage'),
  parfumValidation,
  parfumController.updateParfum
);

router.delete(
  '/:id',
  parfumController.deleteParfum
);

// Rute notes tetap terpisah (Ini best practice untuk transaksi)
router.put('/:parfumId/notes', notesValidation, parfumNotesController.updateParfumPyramid);

module.exports = router;