import multer from 'multer';
import path from 'path';

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, 'uploads/'),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

function imageFilter(_req, file, cb) {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed.'), false);
  }
}

export const uploadPhotos = multer({
  storage: process.env.PHOTO_STORAGE === 'mongodb' ? multer.memoryStorage() : storage,
  fileFilter: imageFilter,
  limits: { files: 5, fileSize: 5 * 1024 * 1024 }, // 5MB per file
});
