// controllers/authController.js
const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cuid = require('cuid'); 

// 1. REGISTRASI ADMIN BARU
exports.register = async (req, res) => {
  try {
    const { email, password, name } = req.body;
    const [userExists] = await pool.execute(
      'SELECT email FROM users WHERE email = ?', [email]
    );

    if (userExists.length > 0) {
      return res.status(400).json({ msg: 'Email sudah terdaftar.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newId = cuid(); 

    await pool.execute(
      'INSERT INTO users (id, email, password, name) VALUES (?, ?, ?, ?)',
      [newId, email, hashedPassword, name] 
    );

    res.status(201).json({ msg: 'Admin berhasil didaftarkan.' });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// 2. LOGIN ADMIN
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const [users] = await pool.execute(
      'SELECT * FROM users WHERE email = ?', [email]
    );

    if (users.length === 0) {
      return res.status(400).json({ msg: 'Email atau password salah.' });
    }
    const user = users[0];

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Email atau password salah.' });
    }

    const payload = {
      user: {
        id: user.id,
        email: user.email
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '8h' },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};