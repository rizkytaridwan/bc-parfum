const multer = require('multer');
const path = require('path'); // Modul bawaan Node.js
const cuid = require('cuid'); // Kita pakai CUID lagi untuk nama file

// 1. Tentukan di mana file akan disimpan
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Simpan ke folder yang kita buat
    cb(null, 'public/uploads/');
  },
  filename: function (req, file, cb) {
    // Buat nama file yang unik agar tidak bentrok
    // Contoh: cmhq123abc.png
    const uniqueSuffix = cuid();
    const extension = path.extname(file.originalname); // Ambil ekstensi file
    cb(null, uniqueSuffix + extension);
  }
});

// 2. Buat filter untuk HANYA menerima gambar
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif/;
  const isMimeTypeAllowed = allowedTypes.test(file.mimetype);
  const isExtensionAllowed = allowedTypes.test(path.extname(file.originalname).toLowerCase());

  if (isMimeTypeAllowed && isExtensionAllowed) {
    // Izinkan file
    cb(null, true);
  } else {
    // Tolak file
    cb(new Error('Hanya file gambar (JPEG, PNG, GIF) yang diizinkan!'), false);
  }
};

// 3. Gabungkan dan ekspor 'upload'
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // Batasi ukuran file 5 MB
  }
});

module.exports = upload;