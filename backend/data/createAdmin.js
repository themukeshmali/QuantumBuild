/**
 * One-time script: Creates the admin user in MongoDB
 * Run with: node data/createAdmin.js
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'dns';
import bcrypt from 'bcryptjs';
import User from '../models/userModel.js';

dotenv.config();

// Windows DNS fix (same as server.js)
dns.setDefaultResultOrder('ipv4first');

const MONGO_URI = process.env.MONGO_URI;

try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ MongoDB Connected');

    // Check if admin already exists
    const existing = await User.findOne({ email: 'admin@quantumbuild.com' });
    if (existing) {
        console.log('ℹ️  Admin user already exists. Updating isAdmin flag...');
        existing.isAdmin = true;
        await existing.save();
        console.log('✅ Admin flag confirmed for:', existing.email);
    } else {
        const hashed = await bcrypt.hash('admin123', 10);
        const admin = await User.create({
            name: 'Admin User',
            email: 'admin@quantumbuild.com',
            password: hashed,
            isAdmin: true,
        });
        console.log('✅ Admin user created:', admin.email);
    }

    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
} catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
}
