// controllers/notesController.js
const pool = require('../config/db');
const cuid = require('cuid');
const slugify = require('../utils/slugify');
const { validationResult } = require('express-validator');
const fs = require('fs');
const path = require('path');


exports.getAllNotes = async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT id, name, slug FROM notes ORDER BY name ASC');
    res.json(rows);
  } catch (err) {
    res.status(500).send('Server Error');
  }
};

exports.getNoteBySlug = async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM notes WHERE slug = ?', [req.params.slug]);
    if (rows.length === 0) {
      return res.status(404).json({ msg: 'Note tidak ditemukan' });
    }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).send('Server Error');
  }
};

exports.createNote = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  const { name, description } = req.body;
  const newId = cuid();
  const slug = slugify(name);
  let imageUrl = null;
  
  if (req.file) {
      imageUrl = `/public/uploads/${req.file.filename}`;
  }

  try {
    await pool.execute(
      'INSERT INTO notes (id, name, slug, description, imageUrl) VALUES (?, ?, ?, ?, ?)',
      [newId, name, slug, description || null, imageUrl]
    );
    res.status(201).json({ id: newId, name, slug, description, imageUrl });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ msg: 'Nama note atau slug sudah ada.' });
    }
    res.status(500).send('Server Error');
  }
};

exports.updateNote = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.params;
  const { name, description } = req.body;
  const slug = slugify(name);

  try {
    let sql = 'UPDATE notes SET name = ?, slug = ?, description = ?';
    const params = [name, slug, description || null];

    if (req.file) {
      const newImageUrl = `/public/uploads/${req.file.filename}`;
      sql += ', imageUrl = ?';
      params.push(newImageUrl);
    }

    sql += ' WHERE id = ?';
    params.push(id);

    const [result] = await pool.execute(sql, params);

    if (result.affectedRows === 0) {
      return res.status(404).json({ msg: 'Note tidak ditemukan' });
    }
    res.json({ msg: 'Note berhasil diperbarui.' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ msg: 'Nama note atau slug sudah ada.' });
    }
    res.status(500).send('Server Error');
  }
};

exports.deleteNote = async (req, res) => {
  const { id } = req.params;
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [rows] = await connection.execute('SELECT imageUrl FROM notes WHERE id = ?', [id]);
    if (rows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ msg: 'Note tidak ditemukan' });
    }

    const imageUrl = rows[0].imageUrl;
    await connection.execute('DELETE FROM notes WHERE id = ?', [id]);
    
    if (imageUrl) {
      const filename = path.basename(imageUrl); 
      const filePath = path.join('public', 'uploads', filename);
      fs.unlink(filePath, (err) => {
        if (err) console.error("Gagal hapus file note:", err.message);
        else console.log("File note dihapus:", filePath);
      });
    }

    await connection.commit();
    res.json({ msg: 'Note berhasil dihapus.' });
  } catch (err) {
    if (connection) await connection.rollback();
    res.status(500).send('Server Error');
  } finally {
    if (connection) connection.release();
  }
};