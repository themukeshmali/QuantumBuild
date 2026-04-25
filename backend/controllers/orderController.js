import asyncHandler from 'express-async-handler';
import Order from '../models/orderModel.js';
import User from '../models/userModel.js';
import Coupon from '../models/couponModel.js';
import { sendOrderConfirmationEmail } from '../utils/sendEmail.js';

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const addOrderItems = asyncHandler(async (req, res) => {
    const {
        orderItems,
        shippingAddress,
        paymentMethod,
        itemsPrice,
        taxPrice,
        shippingPrice,
        couponCode,
    } = req.body;

    if (orderItems && orderItems.length === 0) {
        res.status(400);
        throw new Error('No order items');
    }
    
    let finalTotalPrice = req.body.totalPrice;
    let couponApplied = undefined;
    
    // Secure coupon validation on the backend
    if (couponCode) {
        const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
        if (coupon && coupon.isActive) {
            const subtotal = Number(itemsPrice);
            const discountAmount = (subtotal * coupon.discount) / 100;
            const newTotal = subtotal - discountAmount + Number(taxPrice) + Number(shippingPrice);
            finalTotalPrice = newTotal.toFixed(2);
            
            couponApplied = {
                code: coupon.code,
                discountAmount: discountAmount.toFixed(2)
            };
        } else {
            res.status(400);
            throw new Error('Invalid or inactive coupon code');
        }
    }

    const initialStatus = req.body.isPaid ? 'Processing' : 'Pending';

    const order = new Order({
        orderItems,
        user: req.user._id,
        shippingAddress,
        paymentMethod,
        itemsPrice,
        taxPrice,
        shippingPrice,
        totalPrice: finalTotalPrice,
        couponApplied,
        orderStatus: initialStatus,
        statusHistory: [{ status: initialStatus }],
        ...(req.body.isPaid && {
            isPaid: true,
            paidAt: req.body.paidAt || Date.now(),
            paymentResult: req.body.paymentResult,
        }),
    });

    const createdOrder = await order.save();

    // Send confirmation email (non-blocking — don't fail the order if email fails)
    try {
        const user = await User.findById(req.user._id).select('name email');
        if (user?.email) {
            sendOrderConfirmationEmail(user.email, user.name, createdOrder).catch(
                err => console.error('Order email failed (non-critical):', err.message)
            );
        }
    } catch (e) {
        console.error('Email dispatch error:', e.message);
    }

    res.status(201).json(createdOrder);
});

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id).populate('user', 'name email');

    if (order) {
        res.json(order);
    } else {
        res.status(404);
        throw new Error('Order not found');
    }
});

// @desc    Update order to paid
// @route   PUT /api/orders/:id/pay
// @access  Private
const updateOrderToPaid = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);

    if (order) {
        order.isPaid = true;
        order.paidAt = Date.now();
        order.paymentResult = {
            id: req.body.id,
            status: req.body.status,
            update_time: req.body.update_time,
            email_address: req.body.payer?.email_address,
        };
        
        // Update status to processing if it was pending
        if (order.orderStatus === 'Pending') {
            order.orderStatus = 'Processing';
            order.statusHistory.push({ status: 'Processing' });
        }

        const updatedOrder = await order.save();
        res.json(updatedOrder);
    } else {
        res.status(404);
        throw new Error('Order not found');
    }
});

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
const updateOrderStatus = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);
    const { status } = req.body;

    const validStatuses = ['Pending', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'];

    if (!validStatuses.includes(status)) {
        res.status(400);
        throw new Error('Invalid status');
    }

    if (order) {
        order.orderStatus = status;
        order.statusHistory.push({ status });

        if (status === 'Delivered') {
            order.isDelivered = true;
            order.deliveredAt = Date.now();
        } else if (status === 'Cancelled') {
            order.isCancelled = true;
            order.cancelledAt = Date.now();
        }

        const updatedOrder = await order.save();
        res.json(updatedOrder);
    } else {
        res.status(404);
        throw new Error('Order not found');
    }
});

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
const getMyOrders = asyncHandler(async (req, res) => {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
});

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
const getOrders = asyncHandler(async (req, res) => {
    const orders = await Order.find({})
        .populate('user', 'id name')
        .sort({ createdAt: -1 });
    res.json(orders);
});

// @desc    Cancel order (user-initiated, only if unpaid & not delivered)
// @route   PUT /api/orders/:id/cancel
// @access  Private
const cancelOrder = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);

    if (!order) {
        res.status(404);
        throw new Error('Order not found');
    }

    // Ensure the order belongs to the requesting user (or admin)
    if (order.user.toString() !== req.user._id.toString() && !req.user.isAdmin) {
        res.status(403);
        throw new Error('Not authorized to cancel this order');
    }

    if (order.isPaid) {
        res.status(400);
        throw new Error('Paid orders cannot be cancelled. Please contact support for a refund.');
    }

    if (order.isDelivered) {
        res.status(400);
        throw new Error('Delivered orders cannot be cancelled.');
    }

    if (order.isCancelled) {
        res.status(400);
        throw new Error('Order is already cancelled.');
    }

    order.isCancelled = true;
    order.cancelledAt = Date.now();
    order.orderStatus = 'Cancelled';
    order.statusHistory.push({ status: 'Cancelled' });

    const updatedOrder = await order.save();
    res.json(updatedOrder);
});

export {
    addOrderItems,
    getOrderById,
    updateOrderToPaid,
    updateOrderStatus,
    getMyOrders,
    getOrders,
    cancelOrder,
};
