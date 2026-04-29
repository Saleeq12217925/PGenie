import '../config/env.js';
import bcrypt from 'bcryptjs';
import speakeasy from 'speakeasy';
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { connectDB } from '../config/db.js';
import { encrypt } from '../utils/crypto.js';
import { User } from '../models/User.js';
import { PGListing } from '../models/PGListing.js';
import { Booking } from '../models/Booking.js';
import { Message } from '../models/Message.js';
import { AuditLog } from '../models/AuditLog.js';

const PASS = 'PGenie@1234';

// Fixed MFA secret for all seed users (easier testing)
const SHARED_MFA_BASE32 = 'JBSWY3DPEHPK3PXP';

async function hashPassword(p) {
  return bcrypt.hash(p, 12);
}

function encryptMfaSecret(base32) {
  return encrypt(base32);
}

async function seed() {
  await connectDB();
  console.log('🌱 Seeding database...\n');

  // Drop existing data
  await Promise.all([
    User.deleteMany({}),
    PGListing.deleteMany({}),
    Booking.deleteMany({}),
    Message.deleteMany({}),
    AuditLog.deleteMany({}),
  ]);
  console.log('✓ Cleared existing data');

  const passwordHash = await hashPassword(PASS);
  const encryptedMfa = encryptMfaSecret(SHARED_MFA_BASE32);

  const commonMfa = {
    mfaSecret: encryptedMfa,
    mfaEnabled: true,
    isVerified: true,
    passwordHash,
  };

  // ── Users ────────────────────────────────────────────────
  const admin = await User.create({ name: 'Super Admin', email: 'admin@pgenie.com', role: 'admin', ...commonMfa });

  const [owner1, owner2, owner3] = await User.create([
    { name: 'Rajesh Kumar', email: 'owner1@pgenie.com', role: 'owner', ...commonMfa },
    { name: 'Priya Sharma', email: 'owner2@pgenie.com', role: 'owner', ...commonMfa },
    { name: 'Amit Patel', email: 'owner3@pgenie.com', role: 'owner', ...commonMfa },
  ]);

  const [t1, t2, t3, t4, t5] = await User.create([
    { name: 'Arjun Mehta', email: 'tenant1@pgenie.com', role: 'tenant', ...commonMfa },
    { name: 'Sneha Rao', email: 'tenant2@pgenie.com', role: 'tenant', ...commonMfa },
    { name: 'Vikram Singh', email: 'tenant3@pgenie.com', role: 'tenant', ...commonMfa },
    { name: 'Kavya Nair', email: 'tenant4@pgenie.com', role: 'tenant', ...commonMfa },
    { name: 'Rohan Das', email: 'tenant5@pgenie.com', role: 'tenant', ...commonMfa },
  ]);
  console.log('✓ Created 9 users (1 admin, 3 owners, 5 tenants)');

  // ── PG Listings ─────────────────────────────────────────
  const listings = await PGListing.create([
    // Bangalore — Owner 1 (4 listings)
    {
      owner: owner1._id,
      title: 'Koramangala Premium PG',
      description: 'Fully furnished PG in the heart of Koramangala with all modern amenities.',
      address: '12th Main, Koramangala 6th Block',
      city: 'bangalore',
      locality: 'Koramangala',
      roomType: 'single',
      rent: 12000,
      deposit: 24000,
      amenities: ['wifi', 'ac', 'meals', 'laundry', 'parking'],
      totalBeds: 10,
      occupiedBeds: 8,
      avgRating: 4.5,
      reviewCount: 22,
    },
    {
      owner: owner1._id,
      title: 'Indiranagar Co-Living Space',
      description: 'Modern co-living PG near metro station. Great for IT professionals.',
      address: '100 Feet Road, Indiranagar',
      city: 'bangalore',
      locality: 'Indiranagar',
      roomType: 'double',
      rent: 8500,
      deposit: 17000,
      amenities: ['wifi', 'meals', 'gym', 'laundry'],
      totalBeds: 20,
      occupiedBeds: 14,
      avgRating: 4.2,
      reviewCount: 35,
    },
    {
      owner: owner1._id,
      title: 'HSR Layout Budget PG',
      description: 'Affordable PG accommodation with basic amenities in HSR Layout.',
      address: 'Sector 2, HSR Layout',
      city: 'bangalore',
      locality: 'HSR Layout',
      roomType: 'triple',
      rent: 5500,
      deposit: 11000,
      amenities: ['wifi', 'meals'],
      totalBeds: 15,
      occupiedBeds: 9,
      avgRating: 3.8,
      reviewCount: 18,
    },
    {
      owner: owner1._id,
      title: 'Whitefield Tech PG',
      description: 'Ideal for IT park employees. Walking distance from EPIP Zone.',
      address: 'ITPL Main Road, Whitefield',
      city: 'bangalore',
      locality: 'Whitefield',
      roomType: 'double',
      rent: 9000,
      deposit: 18000,
      amenities: ['wifi', 'ac', 'parking', 'gym'],
      totalBeds: 12,
      occupiedBeds: 7,
      avgRating: 4.0,
      reviewCount: 14,
    },
    // Mumbai — Owner 2 (3 listings)
    {
      owner: owner2._id,
      title: 'Andheri West Luxury PG',
      description: 'Premium PG with all amenities near Andheri station.',
      address: 'Versova Road, Andheri West',
      city: 'mumbai',
      locality: 'Andheri',
      roomType: 'single',
      rent: 18000,
      deposit: 36000,
      amenities: ['wifi', 'ac', 'meals', 'laundry', 'gym', 'parking'],
      totalBeds: 8,
      occupiedBeds: 7,
      avgRating: 4.7,
      reviewCount: 41,
    },
    {
      owner: owner2._id,
      title: 'Powai Working Professionals PG',
      description: 'Comfortable stay near Hiranandani Gardens. Ideal for corporate workers.',
      address: 'Hiranandani Gardens, Powai',
      city: 'mumbai',
      locality: 'Powai',
      roomType: 'double',
      rent: 14000,
      deposit: 28000,
      amenities: ['wifi', 'ac', 'meals', 'laundry'],
      totalBeds: 16,
      occupiedBeds: 12,
      avgRating: 4.3,
      reviewCount: 28,
    },
    {
      owner: owner2._id,
      title: 'Dadar Affordable Stay',
      description: 'Budget-friendly PG with good connectivity. Near Dadar railway station.',
      address: 'Gokhale Road, Dadar',
      city: 'mumbai',
      locality: 'Dadar',
      roomType: 'dormitory',
      rent: 7000,
      deposit: 14000,
      amenities: ['wifi', 'meals'],
      totalBeds: 24,
      occupiedBeds: 16,
      avgRating: 3.5,
      reviewCount: 52,
    },
    // Pune — Owner 3 (3 listings)
    {
      owner: owner3._id,
      title: 'Hinjewadi IT Park PG',
      description: 'Spacious PG for IT professionals. 5 min from Phase 1.',
      address: 'Phase 1, Hinjewadi',
      city: 'pune',
      locality: 'Hinjewadi',
      roomType: 'single',
      rent: 10000,
      deposit: 20000,
      amenities: ['wifi', 'ac', 'meals', 'gym', 'parking'],
      totalBeds: 10,
      occupiedBeds: 8,
      avgRating: 4.4,
      reviewCount: 19,
    },
    {
      owner: owner3._id,
      title: 'Kothrud Student PG',
      description: 'Best PG for students near Pune University and MIT College.',
      address: 'Paud Road, Kothrud',
      city: 'pune',
      locality: 'Kothrud',
      roomType: 'double',
      rent: 6500,
      deposit: 13000,
      amenities: ['wifi', 'meals', 'laundry'],
      totalBeds: 20,
      occupiedBeds: 13,
      avgRating: 4.0,
      reviewCount: 33,
    },
    {
      owner: owner3._id,
      title: 'Viman Nagar Premium Stay',
      description: 'Upscale PG near airport and EON IT Park. Fully furnished rooms.',
      address: 'Dhole Patil Road, Viman Nagar',
      city: 'pune',
      locality: 'Viman Nagar',
      roomType: 'single',
      rent: 13500,
      deposit: 27000,
      amenities: ['wifi', 'ac', 'meals', 'laundry', 'gym', 'parking'],
      totalBeds: 8,
      occupiedBeds: 6,
      avgRating: 4.6,
      reviewCount: 12,
    },
  ]);
  console.log(`✓ Created ${listings.length} PG listings across Bangalore, Mumbai, Pune`);

  const [l0, l1, l2, l3, l4, l5, l6, l7, l8, l9] = listings;

  // ── Bookings ─────────────────────────────────────────────
  const now = new Date();
  const addDays = (d, n) => new Date(d.getTime() + n * 86400000);

  const bookings = await Booking.create([
    // 2 pending
    {
      tenant: t1._id, listing: l0._id, owner: owner1._id,
      checkIn: addDays(now, 5), checkOut: addDays(now, 35),
      status: 'pending', totalAmount: 12000, paymentStatus: 'unpaid',
      note: 'Looking forward to joining.',
    },
    {
      tenant: t2._id, listing: l4._id, owner: owner2._id,
      checkIn: addDays(now, 10), checkOut: addDays(now, 40),
      status: 'pending', totalAmount: 18000, paymentStatus: 'unpaid',
    },
    // 3 approved (2 paid)
    {
      tenant: t3._id, listing: l1._id, owner: owner1._id,
      checkIn: addDays(now, -5), checkOut: addDays(now, 25),
      status: 'approved', totalAmount: 8500, paymentStatus: 'paid',
      paymentId: 'order_simulated001',
    },
    {
      tenant: t4._id, listing: l7._id, owner: owner3._id,
      checkIn: addDays(now, 2), checkOut: addDays(now, 32),
      status: 'approved', totalAmount: 10000, paymentStatus: 'paid',
      paymentId: 'order_simulated002',
    },
    {
      tenant: t5._id, listing: l5._id, owner: owner2._id,
      checkIn: addDays(now, 7), checkOut: addDays(now, 37),
      status: 'approved', totalAmount: 14000, paymentStatus: 'unpaid',
    },
    // 2 completed
    {
      tenant: t1._id, listing: l8._id, owner: owner3._id,
      checkIn: addDays(now, -60), checkOut: addDays(now, -30),
      status: 'completed', totalAmount: 6500, paymentStatus: 'paid',
      paymentId: 'order_simulated003',
    },
    {
      tenant: t2._id, listing: l2._id, owner: owner1._id,
      checkIn: addDays(now, -90), checkOut: addDays(now, -60),
      status: 'completed', totalAmount: 5500, paymentStatus: 'paid',
      paymentId: 'order_simulated004',
    },
    // 1 rejected
    {
      tenant: t3._id, listing: l9._id, owner: owner3._id,
      checkIn: addDays(now, 15), checkOut: addDays(now, 45),
      status: 'rejected', totalAmount: 13500, paymentStatus: 'unpaid',
    },
  ]);
  console.log(`✓ Created ${bookings.length} bookings (2 pending, 3 approved, 2 completed, 1 rejected)`);

  // ── Messages (chat for 2 approved bookings) ────────────────
  const b2 = bookings[2]; // t3 ↔ owner1 (approved, paid)
  const b3 = bookings[3]; // t4 ↔ owner3 (approved, paid)

  await Message.create([
    { booking: b2._id, sender: t3._id, role: 'tenant', content: 'Hi, I wanted to confirm my check-in time.' },
    { booking: b2._id, sender: owner1._id, role: 'owner', content: 'Welcome! You can check in anytime after 10 AM.' },
    { booking: b2._id, sender: t3._id, role: 'tenant', content: 'Great, thanks! What documents do I need?' },
    { booking: b2._id, sender: owner1._id, role: 'owner', content: 'Just bring your Aadhaar and one passport photo.' },
    { booking: b3._id, sender: t4._id, role: 'tenant', content: 'Is there a gym timing I should be aware of?' },
    { booking: b3._id, sender: owner3._id, role: 'owner', content: 'Gym is open from 5 AM to 10 PM daily.' },
    { booking: b3._id, sender: t4._id, role: 'tenant', content: 'Perfect, see you on the check-in day!' },
  ]);
  console.log('✓ Created 7 messages across 2 booking threads');

  // ── Summary ──────────────────────────────────────────────
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('SEED COMPLETE — Login credentials:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Password for ALL users:', PASS);
  console.log('MFA TOTP base32 secret:', SHARED_MFA_BASE32);
  console.log('(Use this in Google Authenticator or: node -e "import(\'speakeasy\').then(s=>console.log(s.default.totp({secret:\'JBSWY3DPEHPK3PXP\',encoding:\'base32\'})))")');
  console.log('\nUsers:');
  console.log('  admin@pgenie.com    (admin)');
  console.log('  owner1@pgenie.com   (owner) — Rajesh Kumar');
  console.log('  owner2@pgenie.com   (owner) — Priya Sharma');
  console.log('  owner3@pgenie.com   (owner) — Amit Patel');
  console.log('  tenant1@pgenie.com  (tenant) — Arjun Mehta');
  console.log('  tenant2@pgenie.com  (tenant) — Sneha Rao');
  console.log('  tenant3@pgenie.com  (tenant) — Vikram Singh');
  console.log('  tenant4@pgenie.com  (tenant) — Kavya Nair');
  console.log('  tenant5@pgenie.com  (tenant) — Rohan Das');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
