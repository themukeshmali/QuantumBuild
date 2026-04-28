import asyncHandler from 'express-async-handler';
import crypto from 'crypto';
import User from '../models/userModel.js';
import generateToken from '../utils/generateToken.js';
import { sendOtpEmail } from '../utils/sendEmail.js';

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

// @desc    Forgot password — send OTP to email
// @route   POST /api/users/forgotpassword
// @access  Public
const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
        // Don't reveal whether email exists — security best practice
        res.json({ message: 'If that email exists, an OTP has been sent.' });
        return;
    }

    // Generate 6-digit OTP
    const rawOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = crypto.createHash('sha256').update(rawOtp).digest('hex');

    user.otpCode = hashedOtp;
    user.otpExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 min
    user.otpSession = undefined; // clear any old session
    await user.save({ validateBeforeSave: false });

    try {
        await sendOtpEmail(user.email, user.name, rawOtp);
        res.json({
            message: 'OTP sent to your email address.',
            ...(process.env.NODE_ENV === 'development' && { otp: rawOtp }),
        });
    } catch (emailErr) {
        // Clean up OTP if email fails
        user.otpCode = undefined;
        user.otpExpire = undefined;
        await user.save({ validateBeforeSave: false });
        console.error('Email send error:', emailErr.message);
        res.status(500);
        throw new Error('Email could not be sent. Please try again later.');
    }
});

// @desc    Verify OTP — returns a short-lived session token
// @route   POST /api/users/verifyotp
// @access  Public
const verifyOtp = asyncHandler(async (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        res.status(400);
        throw new Error('Email and OTP are required');
    }

    const hashedOtp = crypto.createHash('sha256').update(otp.trim()).digest('hex');

    const user = await User.findOne({
        email,
        otpCode: hashedOtp,
        otpExpire: { $gt: Date.now() },
    });

    if (!user) {
        res.status(400);
        throw new Error('Invalid or expired OTP');
    }

    // OTP verified — issue a one-time session token for the reset step
    const rawSession = crypto.randomBytes(32).toString('hex');
    const hashedSession = crypto.createHash('sha256').update(rawSession).digest('hex');

    user.otpCode = undefined;
    user.otpExpire = undefined;
    user.otpSession = hashedSession;
    // reuse resetPasswordExpire for session timeout (5 min)
    user.resetPasswordExpire = new Date(Date.now() + 5 * 60 * 1000);
    await user.save({ validateBeforeSave: false });

    res.json({ message: 'OTP verified', sessionToken: rawSession });
});

// @desc    Reset password using OTP session token
// @route   PUT /api/users/resetpassword
// @access  Public
const resetPassword = asyncHandler(async (req, res) => {
    const { sessionToken, password } = req.body;

    if (!sessionToken) {
        res.status(400);
        throw new Error('Session token is required');
    }

    if (!password || password.length < 8) {
        res.status(400);
        throw new Error('Password must be at least 8 characters');
    }

    const hashedSession = crypto.createHash('sha256').update(sessionToken).digest('hex');

    const user = await User.findOne({
        otpSession: hashedSession,
        resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
        res.status(400);
        throw new Error('Session expired. Please start over.');
    }

    // Update password and clear everything
    user.password = password;
    user.otpCode = undefined;
    user.otpExpire = undefined;
    user.otpSession = undefined;
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
    verifyOtp,
    resetPassword,
    toggleWishlist,
    getWishlist,
};

