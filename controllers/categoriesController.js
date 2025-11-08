// controllers/categoriesController.js
const pool = require('../config/db');
const cuid = require('cuid');
const slugify = require('../utils/slugify');
const { validationResult } = require('express-validator');

exports.getAllCategories = async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT id, name, slug FROM categories ORDER BY name ASC');
    res.json(rows);
  } catch (err) {
    res.status(500).send('Server Error');
  }
};

// --- FUNGSI BARU ---
exports.getCategoryBySlug = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM categories WHERE slug = ?',
      [req.params.slug]
    );
    if (rows.length === 0) {
      return res.status(404).json({ msg: 'Kategori tidak ditemukan' });
    }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).send('Server Error');
  }
};

exports.createCategory = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  const { name, description } = req.body;
  const newId = cuid();
  const slug = slugify(name);

  try {
    // (Kita asumsikan kategori tidak punya gambar, jika punya, tambahkan 'imageUrl' seperti di brand)
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

// --- FUNGSI BARU ---
exports.updateCategory = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.params;
  const { name, description } = req.body;
  const slug = slugify(name);

  try {
    const [result] = await pool.execute(
      'UPDATE categories SET name = ?, slug = ?, description = ? WHERE id = ?',
      [name, slug, description || null, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ msg: 'Kategori tidak ditemukan' });
    }
    res.json({ msg: 'Kategori berhasil diperbarui.' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ msg: 'Nama kategori atau slug sudah ada.' });
    }
    res.status(500).send('Server Error');
  }
};

// --- FUNGSI BARU ---
exports.deleteCategory = async (req, res) => {
  const { id } = req.params;
  try {
    // (Kita asumsikan tidak ada file gambar yang perlu dihapus)
    const [result] = await pool.execute('DELETE FROM categories WHERE id = ?', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ msg: 'Kategori tidak ditemukan' });
    }
    res.json({ msg: 'Kategori berhasil dihapus.' });
  } catch (err) {
    res.status(500).send('Server Error');
  }
};