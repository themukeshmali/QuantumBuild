import asyncHandler from 'express-async-handler';
import Coupon from '../models/couponModel.js';

// @desc    Get all coupons
// @route   GET /api/coupons
// @access  Private/Admin
const getCoupons = asyncHandler(async (req, res) => {
    const coupons = await Coupon.find({});
    res.json(coupons);
});

// @desc    Create a new coupon
// @route   POST /api/coupons
// @access  Private/Admin
const createCoupon = asyncHandler(async (req, res) => {
    const { code, discount, label } = req.body;

    const couponExists = await Coupon.findOne({ code: code.toUpperCase() });

    if (couponExists) {
        res.status(400);
        throw new Error('Coupon code already exists');
    }

    const coupon = new Coupon({
        code: code.toUpperCase(),
        discount,
        label,
    });

    const createdCoupon = await coupon.save();
    res.status(201).json(createdCoupon);
});

// @desc    Update a coupon
// @route   PUT /api/coupons/:id
// @access  Private/Admin
const updateCoupon = asyncHandler(async (req, res) => {
    const { code, discount, label, isActive } = req.body;

    const coupon = await Coupon.findById(req.params.id);

    if (coupon) {
        coupon.code = code ? code.toUpperCase() : coupon.code;
        coupon.discount = discount || coupon.discount;
        coupon.label = label || coupon.label;
        if (isActive !== undefined) {
            coupon.isActive = isActive;
        }

        const updatedCoupon = await coupon.save();
        res.json(updatedCoupon);
    } else {
        res.status(404);
        throw new Error('Coupon not found');
    }
});

// @desc    Delete a coupon
// @route   DELETE /api/coupons/:id
// @access  Private/Admin
const deleteCoupon = asyncHandler(async (req, res) => {
    const coupon = await Coupon.findById(req.params.id);

    if (coupon) {
        await Coupon.deleteOne({ _id: coupon._id });
        res.json({ message: 'Coupon removed' });
    } else {
        res.status(404);
        throw new Error('Coupon not found');
    }
});

// @desc    Validate a coupon code
// @route   POST /api/coupons/validate
// @access  Private
const validateCoupon = asyncHandler(async (req, res) => {
    const { code } = req.body;

    const coupon = await Coupon.findOne({ code: code.toUpperCase() });

    if (coupon && coupon.isActive) {
        res.json({
            code: coupon.code,
            discount: coupon.discount,
            label: coupon.label
        });
    } else if (coupon && !coupon.isActive) {
        res.status(400);
        throw new Error('This coupon is no longer active');
    } else {
        res.status(404);
        throw new Error('Invalid coupon code');
    }
});

export {
    getCoupons,
    createCoupon,
    updateCoupon,
    deleteCoupon,
    validateCoupon,
};
