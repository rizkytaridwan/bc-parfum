// controllers/parfumController.js
const pool = require('../config/db');
const cuid = require('cuid');
const slugify = require('../utils/slugify');
const { validationResult } = require('express-validator');
const fs = require('fs')
const path = require('path')

// CREATE Parfum (Admin)
exports.createParfum = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const { name, description, launchYear, brandId, categoryId } = req.body;
  
  let imageUrl = null;
  if (req.file) {
    imageUrl = `/public/uploads/${req.file.filename}`;
  }

  const newId = cuid();
  const slug = slugify(name);
  const now = new Date();

  try {
    await pool.execute(
      'INSERT INTO parfum (id, name, slug, description, launchYear, brandId, categoryId, imageUrl, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [newId, name, slug, description || null, launchYear || null, brandId || null, categoryId || null, imageUrl, now, now]
    );
    
    res.status(201).json({ 
      id: newId, 
      slug: slug,
      imageUrl: imageUrl,
      msg: 'Parfum berhasil dibuat.' 
    });

  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ msg: 'Nama parfum atau slug sudah ada.' });
    }
    console.error("Create Parfum Error:", err.message);
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
  const slug = slugify(name);
  const now = new Date();

  try {
    let sql = 'UPDATE parfum SET name = ?, slug = ?, description = ?, launchYear = ?, brandId = ?, categoryId = ?, updatedAt = ?';
    const params = [name, slug, description || null, launchYear || null, brandId || null, categoryId || null, now];
    if (req.file) {
      const newImageUrl = `/public/uploads/${req.file.filename}`;
      sql += ', imageUrl = ?';
      params.push(newImageUrl); 
    }
    sql += ' WHERE id = ?';
    params.push(id);
    const [result] = await pool.execute(sql, params);

    if (result.affectedRows === 0) {
      return res.status(404).json({ msg: 'Parfum tidak ditemukan' });
    }
    
    res.json({ msg: 'Parfum berhasil diperbarui.' });

  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ msg: 'Nama parfum atau slug sudah ada.' });
    }
    console.error("Update Parfum Error:", err.message);
    res.status(500).send('Server Error');
  }
};

exports.uploadParfumImage = async (req, res) => {
  try {
    const { id } = req.params; 
    if (!req.file) {
      return res.status(400).json({ msg: 'Tidak ada file yang di-upload.' });
    }

    const filename = req.file.filename;
    const imageUrl = `/public/uploads/${filename}`;
    const [result] = await pool.execute(
      'UPDATE parfum SET imageUrl = ? WHERE id = ?',
      [imageUrl, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ msg: 'Parfum tidak ditemukan' });
    }

    res.json({
      msg: 'Gambar berhasil di-upload.',
      imageUrl: imageUrl
    });

  } catch (err) {
    console.error("Upload Image Error:", err.message);
    res.status(500).send('Server Error');
  }
};

exports.deleteParfum = async (req, res) => {
  const { id } = req.params;

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction(); 

    const [rows] = await connection.execute(
      'SELECT imageUrl FROM parfum WHERE id = ?',
      [id]
    );

    if (rows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ msg: 'Parfum tidak ditemukan' });
    }

    const parfum = rows[0];
    const imageUrl = parfum.imageUrl; 
    await connection.execute(
      'DELETE FROM parfum WHERE id = ?',
      [id]
    );

    if (imageUrl) {
      const filename = path.basename(imageUrl); 
      const filePath = path.join('public', 'uploads', filename);

      fs.unlink(filePath, (err) => {
        if (err) {
          console.error("Gagal menghapus file:", filePath, err.message);
        } else {
          console.log("File berhasil dihapus:", filePath);
        }
      });
    }

    await connection.commit();
    res.json({ msg: 'Parfum berhasil dihapus.' });

  } catch (err) {
    if (connection) await connection.rollback(); 
    console.error("Delete Parfum Error:", err.message);
    res.status(500).send('Server Error');
  } finally {
    if (connection) connection.release();
  }
};

// --- API UNTUK SEO & FRONTEND ---

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
    sql += ' ORDER BY p.name ASC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [parfums] = await pool.execute(sql, params);
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

exports.getParfumBySlug = async (req, res) => {
  try {
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
    const [notes] = await pool.execute(
      `SELECT n.name, n.slug, pn.noteType
       FROM parfum_notes pn
       JOIN notes n ON pn.noteId = n.id
       WHERE pn.parfumId = ?
       ORDER BY FIELD(pn.noteType, 'TOP', 'MIDDLE', 'BASE')`,
      [parfum.id]
    );

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

