// controllers/parfumNotesController.js
const pool = require('../config/db');
const cuid = require('cuid');
const { validationResult } = require('express-validator');

// Mengganti SELURUH piramida aroma untuk 1 parfum
// Ini adalah operasi yang "profesional" dan aman (transaksional)
exports.updateParfumPyramid = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { parfumId } = req.params;
  const { top, middle, base } = req.body; // Frontend kirim 3 array berisi ID notes

  let connection;
  try {
    // KEAMANAN TINGGI: Gunakan Transaksi Database
    // Ini menjamin SEMUA query berhasil, atau SEMUA gagal.
    // Tidak akan ada data "setengah jadi".
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // 1. Hapus semua notes lama untuk parfum ini
    await connection.execute(
      'DELETE FROM parfum_notes WHERE parfumId = ?',
      [parfumId]
    );

    // 2. Buat "batch" insert baru
    const inserts = [];
    
    // Loop dan siapkan TOP notes
    if (top && top.length > 0) {
      top.forEach(noteId => {
        inserts.push([cuid(), parfumId, noteId, 'TOP']);
      });
    }
    // Loop dan siapkan MIDDLE notes
    if (middle && middle.length > 0) {
      middle.forEach(noteId => {
        inserts.push([cuid(), parfumId, noteId, 'MIDDLE']);
      });
    }
    // Loop dan siapkan BASE notes
    if (base && base.length > 0) {
      base.forEach(noteId => {
        inserts.push([cuid(), parfumId, noteId, 'BASE']);
      });
    }

    // 3. Insert semua notes baru sekaligus (jika ada)
    if (inserts.length > 0) {
      // Query 'Bulk Insert'
      await connection.query(
        'INSERT INTO parfum_notes (id, parfumId, noteId, noteType) VALUES ?',
        [inserts]
      );
    }

    // 4. Jika semua berhasil, 'commit' transaksinya
    await connection.commit();
    res.json({ msg: 'Piramida aroma berhasil diperbarui.' });

  } catch (err) {
    // 5. Jika ada SATU saja error, 'rollback' (batalkan) semua
    if (connection) await connection.rollback();
    console.error("Transaction Error:", err.message);
    res.status(500).send('Server Error');
  } finally {
    // 6. Selalu lepaskan koneksi
    if (connection) connection.release();
  }
};