#!/usr/bin/env node
// CJS wrapper so DNS is set synchronously before ESM imports resolve
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['1.1.1.1', '8.8.8.8']);

// Now dynamically import the ESM admin creation logic
import('mongoose').then(async ({ default: mongoose }) => {
    const path = require('path');
    const fs = require('fs');
    
    // Load .env manually
    const envPath = path.join(__dirname, '../.env');
    if (fs.existsSync(envPath)) {
        fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
            const [k, ...v] = line.trim().split('=');
            if (k && v.length) process.env[k] = v.join('=');
        });
    }

    const MONGO_URI = process.env.MONGO_URI;
    if (!MONGO_URI) { console.error('❌ MONGO_URI not found in .env'); process.exit(1); }

    const bcrypt = require('bcryptjs');

    const userSchema = new mongoose.Schema({
        name: String,
        email: { type: String, unique: true },
        password: String,
        isAdmin: { type: Boolean, default: false },
    }, { timestamps: true, collection: 'users' });

    const User = mongoose.models.User || mongoose.model('User', userSchema);

    try {
        await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 15000 });
        console.log('✅ MongoDB Connected');

        const existing = await User.findOne({ email: 'admin@quantumbuild.com' });
        if (existing) {
            existing.isAdmin = true;
            await existing.save({ validateBeforeSave: false });
            console.log('✅ Existing user promoted to admin:', existing.email);
        } else {
            const hashed = await bcrypt.hash('admin123', 10);
            await User.create({ name: 'Admin User', email: 'admin@quantumbuild.com', password: hashed, isAdmin: true });
            console.log('✅ Admin user CREATED: admin@quantumbuild.com / admin123');
        }

        await mongoose.disconnect();
        console.log('Done!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
}).catch(err => { console.error('Failed:', err.message); process.exit(1); });
