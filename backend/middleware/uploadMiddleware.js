const multer = require('multer');

// Configure multer to store files in memory
const storage = multer.memoryStorage();

// File filter (optional, to accept only excel and image files)
const fileFilter = (req, file, cb) => {
  // Allow excel files
  if (
    file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    file.mimetype === 'application/vnd.ms-excel' ||
    file.mimetype === 'text/csv'
  ) {
    cb(null, true);
  }
  // Allow image files
  else if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only Excel, CSV and Image files are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB max file size
  },
  fileFilter: fileFilter,
});

module.exports = {
  upload,
};
