// controllers/categoriesController.js
const pool = require('../config/db');
const cuid = require('cuid');
const slugify = require('../utils/slugify');
const { validationResult } = require('express-validator');

// Ambil semua kategori
exports.getAllCategories = async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT id, name, slug FROM categories ORDER BY name ASC');
    res.json(rows);
  } catch (err) {
    res.status(500).send('Server Error');
  }
};

// Buat kategori baru (Admin)
exports.createCategory = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  const { name, description } = req.body;
  const newId = cuid();
  const slug = slugify(name);

  try {
    await pool.execute(
      'INSERT INTO categories (id, name, slug, description) VALUES (?, ?, ?, ?)',
      [newId, name, slug, description || null]
    );
    res.status(201).json({ id: newId, name, slug, description });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ msg: 'Nama kategori atau slug sudah ada.' });
    }
    res.status(500).send('Server Error');
  }
};

// (Tambahkan GET by Slug, Update, Delete nanti jika perlu)