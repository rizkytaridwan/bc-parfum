// utils/slugify.js
const slugify = (str) => {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Hapus karakter aneh
    .replace(/[\s_-]+/g, '-') // Ganti spasi dengan -
    .replace(/^-+|-+$/g, ''); // Hapus - di awal/akhir
};

module.exports = slugify;