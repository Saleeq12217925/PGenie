import mongoose from 'mongoose';

// Each upload is capped at 5 MB, below MongoDB's 16 MB document limit.
const schema = new mongoose.Schema({
  filename: { type: String, required: true, unique: true },
  contentType: { type: String, required: true },
  data: { type: Buffer, required: true },
}, { timestamps: true });

export const UploadedPhoto = mongoose.model('UploadedPhoto', schema);
