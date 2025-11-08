// controllers/parfumController.js
const pool = require('../config/db');
const cuid = require('cuid');
const slugify = require('../utils/slugify');
const { validationResult } = require('express-validator');

// CREATE Parfum (Admin)
exports.createParfum = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, description, launchYear, brandId, categoryId } = req.body;
  const newId = cuid();
  const slug = slugify(name);
  const now = new Date();

  try {
    await pool.execute(
      'INSERT INTO parfum (id, name, slug, description, launchYear, brandId, categoryId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [newId, name, slug, description || null, launchYear || null, brandId || null, categoryId || null, now, now]
    );
    res.status(201).json({ id: newId, msg: 'Parfum berhasil dibuat.' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ msg: 'Nama parfum atau slug sudah ada.' });
    }
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// --- API UNTUK SEO & FRONTEND ---

// GET All Parfum (dengan Filter, Search, Paginasi)
exports.getAllParfum = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, brand, category, note } = req.query;
    const offset = (page - 1) * limit;

    let sql = `SELECT p.id, p.name, p.slug, p.imageUrl, 
                      b.name as brandName, b.slug as brandSlug,
                      c.name as categoryName, c.slug as categorySlug
               FROM parfum p
               LEFT JOIN brands b ON p.brandId = b.id
               LEFT JOIN categories c ON p.categoryId = c.id
               WHERE 1=1`;
    
    const params = [];

    if (search) {
      sql += ' AND p.name LIKE ?';
      params.push(`%${search}%`);
    }
    if (brand) {
      sql += ' AND b.slug = ?';
      params.push(brand);
    }
    if (category) {
      sql += ' AND c.slug = ?';
      params.push(category);
    }
    
    // (Query untuk 'note' lebih kompleks karena tabel parfum_notes, 
    //  bisa ditambahkan nanti)

    sql += ' ORDER BY p.name ASC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [parfums] = await pool.execute(sql, params);
    
    // Dapatkan total count untuk paginasi
    const [[{ total }]] = await pool.execute('SELECT COUNT(*) as total FROM parfum');

    res.json({
      data: parfums,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalItems: total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// GET Single Parfum (Halaman Detail)
exports.getParfumBySlug = async (req, res) => {
  try {
    // 1. Ambil data parfum utama
    const [parfumRows] = await pool.execute(
      `SELECT p.*, 
              b.name as brandName, b.slug as brandSlug,
              c.name as categoryName, c.slug as categorySlug
       FROM parfum p
       LEFT JOIN brands b ON p.brandId = b.id
       LEFT JOIN categories c ON p.categoryId = c.id
       WHERE p.slug = ?`,
      [req.params.slug]
    );

    if (parfumRows.length === 0) {
      return res.status(404).json({ msg: 'Parfum tidak ditemukan' });
    }
    const parfum = parfumRows[0];

    // 2. Ambil semua notes untuk parfum ini
    const [notes] = await pool.execute(
      `SELECT n.name, n.slug, pn.noteType
       FROM parfum_notes pn
       JOIN notes n ON pn.noteId = n.id
       WHERE pn.parfumId = ?
       ORDER BY FIELD(pn.noteType, 'TOP', 'MIDDLE', 'BASE')`,
      [parfum.id]
    );

    // 3. Kelompokkan notes
    const pyramid = {
      top: notes.filter(n => n.noteType === 'TOP'),
      middle: notes.filter(n => n.noteType === 'MIDDLE'),
      base: notes.filter(n => n.noteType === 'BASE'),
    };

    // 4. Kirim response lengkap
    res.json({ ...parfum, pyramid });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.updateParfum = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.params;
  const { name, description, launchYear, brandId, categoryId } = req.body;
  
  // Buat slug baru jika nama berubah
  const slug = slugify(name);
  const now = new Date();

  try {
    const [result] = await pool.execute(
      'UPDATE parfum SET name = ?, slug = ?, description = ?, launchYear = ?, brandId = ?, categoryId = ?, updatedAt = ? WHERE id = ?',
      [name, slug, description || null, launchYear || null, brandId || null, categoryId || null, now, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ msg: 'Parfum tidak ditemukan' });
    }
    
    res.json({ msg: 'Parfum berhasil diperbarui.' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ msg: 'Nama parfum atau slug sudah ada.' });
    }
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.uploadParfumImage = async (req, res) => {
  try {
    const { id } = req.params; // Ambil ID parfum dari URL

    // 'req.file' dibuat oleh 'multer'. Ini berisi info file
    if (!req.file) {
      return res.status(400).json({ msg: 'Tidak ada file yang di-upload.' });
    }

    // 1. Ambil nama file yang sudah unik
    const filename = req.file.filename;

    // 2. Buat URL publik yang akan disimpan di DB
    // (Ini adalah URL yang akan dibaca oleh frontend)
    const imageUrl = `/public/uploads/${filename}`;

    // 3. Update database
    const [result] = await pool.execute(
      'UPDATE parfum SET imageUrl = ? WHERE id = ?',
      [imageUrl, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ msg: 'Parfum tidak ditemukan' });
    }

    // 4. Kirim kembali URL-nya
    res.json({
      msg: 'Gambar berhasil di-upload.',
      imageUrl: imageUrl
    });

  } catch (err) {
    console.error("Upload Image Error:", err.message);
    res.status(500).send('Server Error');
  }
};
// (Tambahkan Delete di sini)