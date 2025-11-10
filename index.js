const express = require('express');
const cors = require('cors');
require('dotenv').config();


// --- KEAMANAN EKSTRA ---
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
// -----------------------

// Inisialisasi Aplikasi Express
const app = express();

app.use(helmet()); 
app.use(cors()); 
app.use(express.json());

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 10, // Batasi 10 request per 15 menit per IP
  message: { msg: 'Terlalu banyak percobaan login, coba lagi dalam 15 menit.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware untuk menyajikan file statis (gambar)
app.use('/public', express.static('public'));

// Koneksi DB (hanya untuk log)
require('./config/db');

// Definisi Rute (Routes)
app.get('/api', (req, res) => {
  res.send('API Backend VILLA PARFUM Berjalan!');
});

// Terapkan limiter HANYA ke rute login
app.use('/api/auth/login', loginLimiter); 

// Rute lainnya
app.use('/api/auth', require('./routes/auth'));
app.use('/api/parfum', require('./routes/parfum'));
app.use('/api/brands', require('./routes/brands'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/notes', require('./routes/notes'));
app.use('/api/dashboard', require('./routes/dashboard'));

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Sesuatu error di server!');
});

// Jalankan Server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Server berjalan di port ${PORT}`));