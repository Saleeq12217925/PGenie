import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { UploadedPhoto } from '../models/UploadedPhoto.js';

export const usesMongoPhotos = () => process.env.PHOTO_STORAGE === 'mongodb';

export async function removePhoto(filename) {
  if (usesMongoPhotos()) {
    await UploadedPhoto.deleteOne({ filename });
  } else {
    // Never allow a stored name to escape the upload directory.
    await fs.unlink(path.join(process.cwd(), 'uploads', path.basename(filename)))
      .catch((error) => { if (error.code !== 'ENOENT') throw error; });
  }
}

export async function savePhotos(files) {
  if (!usesMongoPhotos()) return files.map((file) => file.filename);
  const saved = [];
  try {
    for (const file of files) {
      const filename = `${randomUUID()}${path.extname(file.originalname).toLowerCase()}`;
      await UploadedPhoto.create({ filename, contentType: file.mimetype, data: file.buffer });
      saved.push(filename);
    }
    return saved;
  } catch (error) {
    await Promise.allSettled(saved.map(removePhoto));
    throw error;
  }
}

export async function servePhoto(req, res, next) {
  try {
    const photo = await UploadedPhoto.findOne({ filename: req.params.filename });
    if (!photo) return res.status(404).json({ success: false, message: 'Photo not found.' });
    res.set('Content-Type', photo.contentType);
    res.set('Cache-Control', 'public, max-age=86400');
    res.send(photo.data);
  } catch (error) {
    next(error);
  }
}
