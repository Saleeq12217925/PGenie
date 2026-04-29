/**
 * Reset Database Script
 * Drops ALL collections in the database and re-seeds test users.
 * ⚠️  DESTRUCTIVE — all data will be permanently deleted.
 *
 * Usage:  node scripts/resetDB.js
 * Force:  node scripts/resetDB.js --force   (skip confirmation)
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import readline from 'readline';
import { User } from '../models/User.js';

const MONGO_URI = process.env.MONGO_URI;
const FORCE = process.argv.includes('--force');

const TEST_USERS = [
  { name: 'Test Admin',  email: 'admin@pgenie.test',  password: 'Admin@123',  role: 'admin'  },
  { name: 'Test Owner',  email: 'owner@pgenie.test',  password: 'Owner@123',  role: 'owner'  },
  { name: 'Test Tenant', email: 'tenant@pgenie.test', password: 'Tenant@123', role: 'tenant' },
];

async function confirm(msg) {
  if (FORCE) return true;
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(msg, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase() === 'y');
    });
  });
}

async function reset() {
  try {
    await mongoose.connect(MONGO_URI);
    const dbName = mongoose.connection.db.databaseName;
    console.log(`Connected to MongoDB — database: ${dbName}\n`);

    const ok = await confirm(`⚠️  This will DELETE ALL DATA in "${dbName}". Continue? (y/N) `);
    if (!ok) {
      console.log('Aborted.');
      process.exit(0);
    }

    // Drop all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    for (const col of collections) {
      await mongoose.connection.db.dropCollection(col.name);
      console.log(`  ✕  Dropped collection: ${col.name}`);
    }
    console.log(`\n  Dropped ${collections.length} collection(s).\n`);

    // Re-seed test users
    console.log('  Seeding test users...');
    for (const u of TEST_USERS) {
      const passwordHash = await bcrypt.hash(u.password, 12);
      await User.create({
        name: u.name,
        email: u.email,
        passwordHash,
        role: u.role,
        isVerified: true,
        isActive: true,
      });
      console.log(`  ✓  ${u.role.padEnd(6)}  ${u.email}`);
    }

    console.log('\n── Test Credentials ──────────────────────────');
    console.log('  Admin:   admin@pgenie.test   / Admin@123');
    console.log('  Owner:   owner@pgenie.test   / Owner@123');
    console.log('  Tenant:  tenant@pgenie.test  / Tenant@123');
    console.log('──────────────────────────────────────────────');
    console.log('\n  Database reset complete.\n');

    process.exit(0);
  } catch (err) {
    console.error('Reset failed:', err.message);
    process.exit(1);
  }
}

reset();
