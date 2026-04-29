/**
 * Test Users Seed Script
 * Creates one user per role (admin, owner, tenant) for development/testing.
 * Skips any user that already exists.
 *
 * Usage:  node scripts/seedTestUsers.js
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';

const MONGO_URI = process.env.MONGO_URI;

const USERS = [
  { name: 'Test Admin',  email: 'admin@pgenie.test',  password: 'Admin@123',  role: 'admin'  },
  { name: 'Test Owner',  email: 'owner@pgenie.test',  password: 'Owner@123',  role: 'owner'  },
  { name: 'Test Tenant', email: 'tenant@pgenie.test', password: 'Tenant@123', role: 'tenant' },
];

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB\n');

    for (const u of USERS) {
      const existing = await User.findOne({ email: u.email });
      if (existing) {
        console.log(`  ⏭  ${u.role.padEnd(6)}  ${u.email}  — already exists`);
        continue;
      }

      const passwordHash = await bcrypt.hash(u.password, 12);
      await User.create({
        name: u.name,
        email: u.email,
        passwordHash,
        role: u.role,
        isVerified: true,
        isActive: true,
      });
      console.log(`  ✓  ${u.role.padEnd(6)}  ${u.email}  — created`);
    }

    console.log('\n── Test Credentials ──────────────────────────');
    console.log('  Admin:   admin@pgenie.test   / Admin@123');
    console.log('  Owner:   owner@pgenie.test   / Owner@123');
    console.log('  Tenant:  tenant@pgenie.test  / Tenant@123');
    console.log('──────────────────────────────────────────────\n');

    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  }
}

seed();
