const jwt = require('jsonwebtoken');


module.exports = function(req, res, next) {
  // Ambil token dari header
  const token = req.header('Authorization'); // React akan kirim: 'Bearer <token>'

  if (!token) {
    return res.status(401).json({ msg: 'Akses ditolak. Tidak ada token.' });
  }

  if (!token.startsWith('Bearer ')) {
    return res.status(401).json({ msg: 'Format token salah.' });
  }

  const actualToken = token.split(' ')[1];

  // Verifikasi token
  try {
    const decoded = jwt.verify(actualToken, process.env.JWT_SECRET);
    req.user = decoded.user;
    next(); 
  } catch (err) {
    res.status(401).json({ msg: 'Token tidak valid.' });
  }
};