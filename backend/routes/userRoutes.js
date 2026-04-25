import express from 'express';
const router = express.Router();
import {
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
} from '../controllers/userController.js';
import { protect, admin } from '../middleware/authMiddleware.js';
import { loginLimiter, forgotPasswordLimiter } from '../middleware/rateLimitMiddleware.js';
import {
    validate,
    validateRegister,
    validateLogin,
    validateForgotPassword,
    validateResetPassword,
    validateUpdateProfile,
} from '../middleware/validateMiddleware.js';

router.route('/')
    .post(validateRegister, validate, registerUser)
    .get(protect, admin, getUsers);

router.post('/login', loginLimiter, validateLogin, validate, authUser);
router.post('/forgotpassword', forgotPasswordLimiter, validateForgotPassword, validate, forgotPassword);
router.put('/resetpassword/:token', validateResetPassword, validate, resetPassword);

router.route('/profile')
    .get(protect, getUserProfile)
    .put(protect, validateUpdateProfile, validate, updateUserProfile);

router.route('/wishlist')
    .get(protect, getWishlist)
    .post(protect, toggleWishlist);

router.route('/:id')
    .get(protect, admin, getUserById)
    .put(protect, admin, updateUser)
    .delete(protect, admin, deleteUser);

export default router;
