/**
 * Admin Seed Script
 * Creates a default admin user if one doesn't already exist.
 *
 * Usage:  node scripts/seedAdmin.js
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';

const MONGO_URI = process.env.MONGO_URI;

const ADMIN = {
  name:  'PGenie Admin',
  email: 'admin@pgenie.test',
  password: 'Admin@123',
  role:  'admin',
};

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    const existing = await User.findOne({ email: ADMIN.email });
    if (existing) {
      console.log(`Admin already exists: ${existing.email} (role: ${existing.role})`);
      process.exit(0);
    }

    const passwordHash = await bcrypt.hash(ADMIN.password, 12);
    const user = await User.create({
      name: ADMIN.name,
      email: ADMIN.email,
      passwordHash,
      role: ADMIN.role,
      isVerified: true,
      isActive: true,
    });

    console.log('Admin user created successfully:');
    console.log(`  Name:     ${user.name}`);
    console.log(`  Email:    ${user.email}`);
    console.log(`  Password: ${ADMIN.password}`);
    console.log(`  Role:     ${user.role}`);
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  }
}

seed();
