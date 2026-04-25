// ============================================================
// QUANTUM BUILD — Image Upload Route (Cloudinary)
// POST /api/upload/image  — upload product image (admin only)
// ============================================================

import express from 'express';
import multer from 'multer';
import asyncHandler from 'express-async-handler';
import { protect, admin } from '../middleware/authMiddleware.js';
import { uploadBuffer, isCloudinaryConfigured } from '../utils/cloudinary.js';

const router = express.Router();

// Multer — in-memory storage (no disk writes)
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },     // 5 MB hard limit
    fileFilter: (_req, file, cb) => {
        const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (allowed.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only JPG, PNG, or WebP images are allowed'));
        }
    },
});

// @desc    Upload product image to Cloudinary
// @route   POST /api/upload/image
// @access  Private/Admin
router.post(
    '/image',
    protect,
    admin,
    upload.single('image'),
    asyncHandler(async (req, res) => {
        if (!req.file) {
            res.status(400);
            throw new Error('No image file provided');
        }

        if (!isCloudinaryConfigured()) {
            res.status(503);
            throw new Error(
                'Image upload not configured. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, ' +
                'and CLOUDINARY_API_SECRET to your .env file.'
            );
        }

        const result = await uploadBuffer(req.file.buffer, {
            folder: 'quantumbuild/products',
            transformation: [
                { width: 800, height: 800, crop: 'limit' },
                { quality: 'auto', fetch_format: 'auto' },
            ],
        });

        res.json({
            imageUrl: result.secure_url,
            publicId: result.public_id,
            width: result.width,
            height: result.height,
            format: result.format,
        });
    })
);

// @desc    Upload multiple product images to Cloudinary (max 6)
// @route   POST /api/upload/images
// @access  Private/Admin
const uploadMultiple = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024, files: 6 },
    fileFilter: (_req, file, cb) => {
        const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (allowed.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only JPG, PNG, or WebP images are allowed'));
        }
    },
});

router.post(
    '/images',
    protect,
    admin,
    uploadMultiple.array('images', 6),
    asyncHandler(async (req, res) => {
        if (!req.files || req.files.length === 0) {
            res.status(400);
            throw new Error('No image files provided');
        }

        if (!isCloudinaryConfigured()) {
            res.status(503);
            throw new Error('Image upload not configured.');
        }

        const uploadOpts = {
            folder: 'quantumbuild/products',
            transformation: [
                { width: 800, height: 800, crop: 'limit' },
                { quality: 'auto', fetch_format: 'auto' },
            ],
        };

        // Upload all files concurrently
        const results = await Promise.all(
            req.files.map(f => uploadBuffer(f.buffer, uploadOpts))
        );

        res.json({
            images: results.map(r => ({
                imageUrl: r.secure_url,
                publicId: r.public_id,
                width: r.width,
                height: r.height,
                format: r.format,
            })),
        });
    })
);

export default router;

