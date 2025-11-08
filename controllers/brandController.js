// controllers/brandController.js
const pool = require('../config/db');
const cuid = require('cuid');
const slugify = require('../utils/slugify');
const { validationResult } = require('express-validator');

// Ambil semua brand (untuk publik/frontend)
exports.getAllBrands = async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT id, name, slug FROM brands ORDER BY name ASC');
    res.json(rows);
  } catch (err) {
    res.status(500).send('Server Error');
  }
};

// Ambil satu brand (untuk halaman SEO)
exports.getBrandBySlug = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM brands WHERE slug = ?',
      [req.params.slug]
    );
    if (rows.length === 0) {
      return res.status(404).json({ msg: 'Brand tidak ditemukan' });
    }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).send('Server Error');
  }
};

// Buat brand baru (Admin)
exports.createBrand = async (req, res) => {
  // KEAMANAN: Cek hasil validasi
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  const { name, description } = req.body;
  const newId = cuid();
  const slug = slugify(name); // SEO Otomatis

  try {
    await pool.execute(
      'INSERT INTO brands (id, name, slug, description) VALUES (?, ?, ?, ?)',
      [newId, name, slug, description || null]
    );
    res.status(201).json({ id: newId, name, slug, description });
  } catch (err) {
    // Keamanan: Cek jika nama/slug duplikat
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ msg: 'Nama brand atau slug sudah ada.' });
    }
    res.status(500).send('Server Error');
  }
};

// (Fungsi Update & Delete mirip, perlu `validationResult` juga)