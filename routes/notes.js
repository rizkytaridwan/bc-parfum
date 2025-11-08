// routes/notes.js
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const notesController = require('../controllers/notesController');
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// === Rute Publik (SEO) ===
router.get('/', notesController.getAllNotes);
router.get('/:slug', notesController.getNoteBySlug);

// === Rute Admin (TERPROTEKSI) ===
const noteValidation = [
  body('name', 'Nama note wajib diisi').notEmpty().trim(),
  body('description').optional().trim()
];

router.use(authMiddleware);

router.post(
  '/', 
  upload.single('noteImage'), 
  noteValidation, 
  notesController.createNote
);

router.put(
  '/:id', 
  upload.single('noteImage'), 
  noteValidation, 
  notesController.updateNote
);

router.delete(
  '/:id', 
  notesController.deleteNote
);

module.exports = router;