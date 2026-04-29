import fs from 'fs';
import path from 'path';
import { PGListing } from '../models/PGListing.js';

// GET /api/pgs — search & filter
export async function listPGs(req, res) {
  try {
    const { city, roomType, minRent, maxRent, amenities, page = 1, limit = 12 } = req.query;
    const filter = { isActive: true };

    if (city) filter.city = new RegExp(`^${city.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
    if (roomType) filter.roomType = roomType;
    if (minRent || maxRent) {
      filter.rent = {};
      if (minRent) filter.rent.$gte = Number(minRent);
      if (maxRent) filter.rent.$lte = Number(maxRent);
    }
    if (amenities) {
      const list = amenities.split(',').map((a) => a.trim()).filter(Boolean);
      if (list.length) filter.amenities = { $all: list };
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [listings, total] = await Promise.all([
      PGListing.find(filter)
        .populate('owner', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      PGListing.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: listings,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// GET /api/pgs/:id
export async function getPG(req, res) {
  try {
    const listing = await PGListing.findOne({ _id: req.params.id, isActive: true }).populate('owner', 'name email');
    if (!listing) return res.status(404).json({ success: false, message: 'Listing not found.' });
    res.json({ success: true, data: listing });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// POST /api/pgs — owner only
export async function createPG(req, res) {
  try {
    const { title, description, address, city, locality, roomType, rent, deposit, amenities, totalBeds, rules, lat, lng } =
      req.body;

    const listing = await PGListing.create({
      owner: req.user.id,
      title,
      description,
      address,
      city,
      locality,
      roomType,
      rent: Number(rent),
      deposit: Number(deposit || 0),
      amenities: amenities || [],
      totalBeds: Number(totalBeds),
      rules,
      lat: lat ? Number(lat) : undefined,
      lng: lng ? Number(lng) : undefined,
    });

    res.status(201).json({ success: true, data: listing });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

// PUT /api/pgs/:id — owner only
export async function updatePG(req, res) {
  try {
    const listing = await PGListing.findOne({ _id: req.params.id, owner: req.user.id });
    if (!listing) return res.status(404).json({ success: false, message: 'Listing not found.' });

    // Guard: can't reduce totalBeds below current occupancy
    if (req.body.totalBeds !== undefined) {
      const newTotalBeds = Number(req.body.totalBeds);
      if (newTotalBeds < listing.occupiedBeds) {
        return res.status(400).json({ success: false, message: `Cannot reduce total beds below current occupancy (${listing.occupiedBeds}).` });
      }
    }

    const fields = ['title', 'description', 'address', 'city', 'locality', 'roomType', 'rent', 'deposit', 'amenities', 'totalBeds', 'rules', 'isActive', 'lat', 'lng'];
    fields.forEach((f) => { if (req.body[f] !== undefined) listing[f] = req.body[f]; });

    await listing.save();
    res.json({ success: true, data: listing });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

// DELETE /api/pgs/:id — soft delete
export async function deletePG(req, res) {
  try {
    const listing = await PGListing.findOne({ _id: req.params.id, owner: req.user.id });
    if (!listing) return res.status(404).json({ success: false, message: 'Listing not found.' });

    listing.isActive = false;
    await listing.save();
    res.json({ success: true, message: 'Listing deactivated.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// POST /api/pgs/:id/photos — upload photos
export async function uploadPhotos(req, res) {
  try {
    const listing = await PGListing.findOne({ _id: req.params.id, owner: req.user.id });
    if (!listing) return res.status(404).json({ success: false, message: 'Listing not found.' });
    if (!req.files?.length) return res.status(400).json({ success: false, message: 'No files uploaded.' });

    const available = 5 - listing.photos.length;
    if (available <= 0) return res.status(400).json({ success: false, message: 'Maximum 5 photos per listing.' });
    const filenames = req.files.slice(0, available).map((f) => f.filename);
    listing.photos.push(...filenames);
    await listing.save();
    res.json({ success: true, photos: listing.photos });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// DELETE /api/pgs/:id/photos/:filename — remove one photo
export async function deletePhoto(req, res) {
  try {
    const listing = await PGListing.findOne({ _id: req.params.id, owner: req.user.id });
    if (!listing) return res.status(404).json({ success: false, message: 'Listing not found.' });

    const { filename } = req.params;
    if (!listing.photos.includes(filename)) {
      return res.status(404).json({ success: false, message: 'Photo not found.' });
    }

    listing.photos = listing.photos.filter((p) => p !== filename);
    await listing.save();

    const filePath = path.join(process.cwd(), 'uploads', filename);
    fs.unlink(filePath, () => {});

    res.json({ success: true, photos: listing.photos });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// GET /api/pgs/owner/mine — listings for current owner
export async function getMyListings(req, res) {
  try {
    const listings = await PGListing.find({ owner: req.user.id }).sort({ createdAt: -1 });
    res.json({ success: true, data: listings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}
