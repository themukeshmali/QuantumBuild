import express from 'express';
const router = express.Router();
import {
    getCoupons,
    createCoupon,
    updateCoupon,
    deleteCoupon,
    validateCoupon,
} from '../controllers/couponController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

router.route('/')
    .get(protect, admin, getCoupons)
    .post(protect, admin, createCoupon);

router.route('/validate')
    .post(protect, validateCoupon);

router.route('/:id')
    .put(protect, admin, updateCoupon)
    .delete(protect, admin, deleteCoupon);

export default router;
