import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '.env') });

// ── DNS: MUST be configured BEFORE connectDB() ───────────────
// On Windows, MongoDB Atlas SRV lookups default to IPv6 → ECONNREFUSED.
// ipv4first + Cloudflare/Google DNS resolves Atlas hostnames correctly.
import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['1.1.1.1', '8.8.8.8']);

import express from 'express';
import colors from 'colors';
import cors from 'cors';
import { connectDB } from './config/db.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';
import { apiLimiter } from './middleware/rateLimitMiddleware.js';
import {
    helmetMiddleware,
    xssSanitizer,
    mongoSanitizeMiddleware,
    logSecurityConfig,
} from './middleware/securityMiddleware.js';

import productRoutes from './routes/productRoutes.js';
import userRoutes from './routes/userRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import contactRoutes from './routes/contactRoutes.js';
import couponRoutes from './routes/couponRoutes.js';

connectDB();

const app = express();

// ── Security Headers (helmet — must be first) ────────────────
app.use(helmetMiddleware);

// ── CORS — allow frontend origin ────────────────────────────
const allowedOrigins = [process.env.FRONTEND_URL, process.env.DASHBOARD_URL].filter(Boolean);
app.use(cors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : '*',
    credentials: true,
}));

// ── Body Parser ──────────────────────────────────────────────
app.use(express.json({ limit: '10kb' })); // Limit body size (10kb max)

// ── Input Sanitization (after body parse, before routes) ─────
app.use(xssSanitizer);           // Strip <script> tags from all inputs
app.use(mongoSanitizeMiddleware); // Prevent { $gt: '' } NoSQL injection

// ── Rate Limiting ─────────────────────────────────────────────
app.use('/api/', apiLimiter);

// API Routes
app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/coupons', couponRoutes);
// Serve frontend and dashboard as static files
const frontendPath = path.join(__dirname, '..', 'frontend');
const dashboardPath = path.join(__dirname, '..', 'dashboard');

app.use('/frontend', express.static(frontendPath));
app.use('/dashboard', express.static(dashboardPath));

if (process.env.NODE_ENV === 'production') {
    // Serve index.html for root
    app.get('/', (req, res) =>
        res.sendFile(path.resolve(frontendPath, 'index.html'))
    );
    // SEO files at root-level paths
    app.get('/robots.txt', (req, res) =>
        res.sendFile(path.resolve(frontendPath, 'robots.txt'))
    );
    app.get('/sitemap.xml', (req, res) =>
        res.sendFile(path.resolve(frontendPath, 'sitemap.xml'))
    );
} else {
    app.get('/', (req, res) => {
        res.send(`
            <div style="font-family: sans-serif; padding: 2rem;">
                <h2>QuantumBuild Server is running!</h2>
                <ul>
                    <li><a href="/frontend/index.html">Visit Store Frontend</a></li>
                    <li><a href="/dashboard/index.html">Visit Admin Dashboard</a></li>
                </ul>
            </div>
        `);
    });
}

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(
        `Server running in ${process.env.NODE_ENV} mode on port ${PORT}`.yellow.bold
    );
    logSecurityConfig();
});
