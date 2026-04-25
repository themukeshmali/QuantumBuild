// ============================================================
// QUANTUM BUILD — Cloudinary Configuration Utility
// Centralizes cloudinary setup so it's imported once
// Used by: routes/uploadRoutes.js and any future upload logic
// ============================================================

import { v2 as cloudinary } from 'cloudinary';

let cloudinaryConfigured = false;
const lazyConfigure = () => {
    if (cloudinaryConfigured) return;
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
        secure: true,
    });
    cloudinaryConfigured = true;
};

// ── Upload Helper ─────────────────────────────────────────
// Uploads a buffer directly to Cloudinary (no disk I/O)
// Returns the Cloudinary upload result object
export const uploadBuffer = (buffer, options = {}) => {
    lazyConfigure();
    return new Promise((resolve, reject) => {
        const defaultOptions = {
            folder: 'quantumbuild/products',
            transformation: [
                { width: 800, height: 800, crop: 'limit' },
                { quality: 'auto', fetch_format: 'auto' },
            ],
            ...options,
        };

        const stream = cloudinary.uploader.upload_stream(
            defaultOptions,
            (error, result) => {
                if (error) reject(new Error(error.message || 'Cloudinary upload failed'));
                else resolve(result);
            }
        );

        stream.end(buffer);
    });
};

// ── Delete Helper ─────────────────────────────────────────
// Deletes an image by its publicId (used when replacing/deleting products)
export const deleteImage = async (publicId) => {
    if (!publicId) return null;
    lazyConfigure();
    return cloudinary.uploader.destroy(publicId);
};

// ── Check Config ──────────────────────────────────────────
export const isCloudinaryConfigured = () =>
    !!(process.env.CLOUDINARY_CLOUD_NAME &&
       process.env.CLOUDINARY_API_KEY &&
       process.env.CLOUDINARY_API_SECRET);

export default cloudinary;
