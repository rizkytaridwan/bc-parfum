const mysql = require('mysql2/promise');
require('dotenv').config(); // Memuat .env

// Connection Pool adalah cara profesional untuk mengelola koneksi DB
// Ini lebih cepat dan lebih aman daripada membuat koneksi baru setiap saat
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Tes koneksi
pool.getConnection()
  .then(connection => {
    console.log('Koneksi MySQL berhasil!');
    connection.release();
  })
  .catch(error => {
    console.error('Error koneksi MySQL:', error.message);
  });

module.exports = pool;