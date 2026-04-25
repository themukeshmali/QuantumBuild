import asyncHandler from 'express-async-handler';
import crypto from 'crypto';
import User from '../models/userModel.js';
import generateToken from '../utils/generateToken.js';
import { sendPasswordResetEmail } from '../utils/sendEmail.js';

// @desc    Auth user & get token
// @route   POST /api/users/login
// @access  Public
const authUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            isAdmin: user.isAdmin,
            token: generateToken(user._id),
        });
    } else {
        res.status(401);
        throw new Error('Invalid email or password');
    }
});

// @desc    Register a new user
// @route   POST /api/users
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;

    const userExists = await User.findOne({ email });

    if (userExists) {
        res.status(400);
        throw new Error('User already exists');
    }

    const user = await User.create({ name, email, password });

    if (user) {
        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            isAdmin: user.isAdmin,
            token: generateToken(user._id),
        });
    } else {
        res.status(400);
        throw new Error('Invalid user data');
    }
});

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            isAdmin: user.isAdmin,
            deliveryAddress: user.deliveryAddress || '',
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
        user.name = req.body.name || user.name;

        // Guard against duplicate email clash
        if (req.body.email && req.body.email !== user.email) {
            const emailInUse = await User.findOne({ email: req.body.email });
            if (emailInUse) {
                res.status(400);
                throw new Error('Email address is already in use by another account');
            }
            user.email = req.body.email;
        }

        if (req.body.password) {
            user.password = req.body.password;
        }

        if (req.body.deliveryAddress !== undefined) {
            user.deliveryAddress = req.body.deliveryAddress;
        }

        const updatedUser = await user.save();

        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            isAdmin: updatedUser.isAdmin,
            deliveryAddress: updatedUser.deliveryAddress || '',
            token: generateToken(updatedUser._id),
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
const getUsers = asyncHandler(async (req, res) => {
    const users = await User.find({}).select('-password');
    res.json(users);
});

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);

    if (user) {
        // Prevent deleting admin users
        if (user.isAdmin) {
            res.status(400);
            throw new Error('Cannot delete an admin user');
        }
        
        // Cascade delete orders to fulfill "All data removed permanently" promise
        const Order = (await import('../models/orderModel.js')).default;
        await Order.deleteMany({ user: user._id });

        await User.deleteOne({ _id: user._id });
        res.json({ message: 'User and associated data removed' });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private/Admin
const getUserById = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id).select('-password');

    if (user) {
        res.json(user);
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Update user (admin)
// @route   PUT /api/users/:id
// @access  Private/Admin
const updateUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);

    if (user) {
        user.name = req.body.name || user.name;
        user.email = req.body.email || user.email;
        user.isAdmin = req.body.isAdmin ?? user.isAdmin;

        const updatedUser = await user.save();

        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            isAdmin: updatedUser.isAdmin,
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Forgot password — send reset email
// @route   POST /api/users/forgotpassword
// @access  Public
const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
        // Don't reveal whether email exists — security best practice
        res.json({ message: 'If that email exists, a reset link has been sent.' });
        return;
    }

    // Generate reset token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = new Date(Date.now() + 15 * 60 * 1000); // 15 min
    await user.save({ validateBeforeSave: false });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5000';
    const resetUrl = `${frontendUrl}/frontend/reset-password.html?token=${rawToken}`;

    try {
        await sendPasswordResetEmail(user.email, user.name, resetUrl);
        res.json({ 
            message: 'Password reset email sent.',
            ...(process.env.NODE_ENV === 'development' && { resetUrl })
        });
    } catch (emailErr) {
        // Clean up token if email fails
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save({ validateBeforeSave: false });
        console.error('Email send error:', emailErr.message);
        res.status(500);
        throw new Error('Email could not be sent. Please try again later.');
    }
});

// @desc    Reset password using token
// @route   PUT /api/users/resetpassword/:token
// @access  Public
const resetPassword = asyncHandler(async (req, res) => {
    const rawToken = req.params.token;
    const { password } = req.body;

    if (!password || password.length < 8) {
        res.status(400);
        throw new Error('Password must be at least 8 characters');
    }

    // Hash the raw token to compare with stored hashed token
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    const user = await User.findOne({
        resetPasswordToken: hashedToken,
        resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
        res.status(400);
        throw new Error('Invalid or expired password reset link');
    }

    // Update password and clear reset token
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        token: generateToken(user._id),
    });
});

// @desc    Toggle product in wishlist
// @route   POST /api/users/wishlist
// @access  Private
const toggleWishlist = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    const productId = req.body.productId;

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    const index = user.wishlist.indexOf(productId);
    let added = false;

    if (index === -1) {
        user.wishlist.push(productId);
        added = true;
    } else {
        user.wishlist.splice(index, 1);
    }

    await user.save();
    res.json({ message: added ? 'Added to wishlist' : 'Removed from wishlist', added });
});

// @desc    Get user wishlist
// @route   GET /api/users/wishlist
// @access  Private
const getWishlist = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).populate('wishlist', 'name price image brand originalPrice');

    if (user) {
        res.json(user.wishlist);
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

export {
    authUser,
    registerUser,
    getUserProfile,
    updateUserProfile,
    getUsers,
    deleteUser,
    getUserById,
    updateUser,
    forgotPassword,
    resetPassword,
    toggleWishlist,
    getWishlist,
};

