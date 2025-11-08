const multer = require('multer');
const path = require('path'); 
const cuid = require('cuid'); 

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = cuid();
    const extension = path.extname(file.originalname); 
    cb(null, uniqueSuffix + extension);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif/;
  const isMimeTypeAllowed = allowedTypes.test(file.mimetype);
  const isExtensionAllowed = allowedTypes.test(path.extname(file.originalname).toLowerCase());

  if (isMimeTypeAllowed && isExtensionAllowed) {
    cb(null, true);
  } else {
    cb(new Error('Hanya file gambar (JPEG, PNG, GIF) yang diizinkan!'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // Batasi ukuran file 5 MB
  }
});

module.exports = upload;