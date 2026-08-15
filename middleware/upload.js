const path = require('path');
const multer = require('multer');

const storage = multer.diskStorage({
  destination(req, file, cb) {
    const target = file.fieldname === 'reportFile' ? 'uploads/reports' : 'uploads/profiles';
    cb(null, target);
  },
  filename(req, file, cb) {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${Date.now()}-${safeName}`);
  }
});

function fileFilter(req, file, cb) {
  const allowed = ['.jpg', '.jpeg', '.png', '.pdf', '.doc', '.docx'];
  cb(null, allowed.includes(path.extname(file.originalname).toLowerCase()));
}

module.exports = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });
