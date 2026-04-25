/**
 * Admin creation script with DNS fix as first operation
 * This must use --input-type=module or be a .mjs file
 * Usage: node --dns-result-order=ipv4first data/createAdmin.mjs
 */

// DNS fix MUST be first — before any other imports
import { setDefaultResultOrder } from 'dns';
setDefaultResultOrder('ipv4first');

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

const userSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    password: String,
    isAdmin: { type: Boolean, default: false },
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', userSchema);

try {
    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000 });
    console.log('✅ MongoDB Connected');

    const existing = await User.findOne({ email: 'admin@quantumbuild.com' });
    if (existing) {
        existing.isAdmin = true;
        await existing.save({ validateBeforeSave: false });
        console.log('✅ Admin flag SET for existing user:', existing.email);
    } else {
        const hashed = await bcrypt.hash('admin123', 10);
        await User.create({ name: 'Admin User', email: 'admin@quantumbuild.com', password: hashed, isAdmin: true });
        console.log('✅ Admin user CREATED: admin@quantumbuild.com / admin123');
    }

    await mongoose.disconnect();
    process.exit(0);
} catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
}
