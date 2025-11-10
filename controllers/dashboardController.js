// controllers/dashboardController.js
const pool = require('../config/db');

exports.getStats = async (req, res) => {
  try {
    // Kita jalankan semua query secara paralel agar cepat
    const [parfumCount] = await pool.execute('SELECT COUNT(*) as total FROM parfum');
    const [brandCount] = await pool.execute('SELECT COUNT(*) as total FROM brands');
    const [categoryCount] = await pool.execute('SELECT COUNT(*) as total FROM categories');
    const [noteCount] = await pool.execute('SELECT COUNT(*) as total FROM notes');

    res.json({
      totalParfum: parfumCount[0].total,
      totalBrand: brandCount[0].total,
      totalCategory: categoryCount[0].total,
      totalNotes: noteCount[0].total,
    });

  } catch (err) {
    console.error("Dashboard Stats Error:", err.message);
    res.status(500).send('Server Error');
  }
};