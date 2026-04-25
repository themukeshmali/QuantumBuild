#!/usr/bin/env node
// Seeds products into MongoDB using CJS so DNS is set synchronously first
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['1.1.1.1', '8.8.8.8']);

const path = require('path');
const fs = require('fs');

// Load .env manually
const envPath = path.join(__dirname, '../.env');
if (fs.existsSync(envPath)) {
    fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx > -1) {
            const k = trimmed.slice(0, eqIdx);
            const v = trimmed.slice(eqIdx + 1);
            process.env[k] = v;
        }
    });
}

import('mongoose').then(async ({ default: mongoose }) => {
    const MONGO_URI = process.env.MONGO_URI;
    if (!MONGO_URI) { console.error('❌ MONGO_URI not found'); process.exit(1); }

    // Minimal product schema for seeding
    const productSchema = new mongoose.Schema({
        name: String, brand: String, category: String, partCategory: String,
        price: Number, originalPrice: Number, countInStock: Number,
        description: String, image: String, badge: String,
        rating: Number, numReviews: Number, user: mongoose.Schema.Types.ObjectId,
    }, { timestamps: true });

    const userSchema = new mongoose.Schema({ name: String, email: String, password: String, isAdmin: Boolean }, { timestamps: true });
    const Product = mongoose.models.Product || mongoose.model('Product', productSchema);
    const User = mongoose.models.User || mongoose.model('User', userSchema);

    try {
        await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 15000 });
        console.log('✅ MongoDB Connected');

        const admin = await User.findOne({ email: 'admin@quantumbuild.com' });
        if (!admin) { console.error('❌ Admin user not found. Run createAdmin.cjs first.'); process.exit(1); }

        // Check if products already exist
        const existing = await Product.countDocuments();
        if (existing > 0) {
            console.log(`ℹ️  ${existing} products already in DB. Skipping seed. Use -f to force.`);
            if (process.argv[2] !== '-f') { await mongoose.disconnect(); process.exit(0); }
            console.log('🗑  Force mode: deleting existing products...');
            await Product.deleteMany();
        }

        // Dynamically import the products data
        const { default: products } = await import('../data/products.js');
        
        const seeded = products.map(p => ({ ...p, user: admin._id }));
        await Product.insertMany(seeded);
        console.log(`✅ Seeded ${seeded.length} products into MongoDB!`);

        await mongoose.disconnect();
        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
}).catch(err => { console.error('❌ Import error:', err.message); process.exit(1); });
