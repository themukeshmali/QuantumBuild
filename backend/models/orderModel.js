import mongoose from 'mongoose';

const orderSchema = mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        orderItems: [
            {
                name: { type: String, required: true },
                qty: { type: Number, required: true },
                image: { type: String, default: '/assets/images/placeholder.png' },
                price: { type: Number, required: true },
                product: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Product',
                    required: false, // false to support static/local-data items
                },
            },
        ],
        shippingAddress: {
            fullName:   { type: String },
            address:    { type: String, required: true },
            city:       { type: String, required: true },
            state:      { type: String },
            postalCode: { type: String, required: true },
            phone:      { type: String },
            country:    { type: String, required: true },
        },
        paymentMethod: {
            type: String,
            required: true,
        },
        paymentResult: {
            id: { type: String },
            status: { type: String },
            update_time: { type: String },
            email_address: { type: String },
        },
        taxPrice: {
            type: Number,
            required: true,
            default: 0.0,
        },
        shippingPrice: {
            type: Number,
            required: true,
            default: 0.0,
        },
        totalPrice: {
            type: Number,
            required: true,
            default: 0.0,
        },
        couponApplied: {
            code: { type: String },
            discountAmount: { type: Number }
        },
        isPaid: {
            type: Boolean,
            required: true,
            default: false,
        },
        paidAt: {
            type: Date,
        },
        isDelivered: {
            type: Boolean,
            required: true,
            default: false,
        },
        deliveredAt: {
            type: Date,
        },
        isCancelled: {
            type: Boolean,
            required: true,
            default: false,
        },
        cancelledAt: {
            type: Date,
        },
        orderStatus: {
            type: String,
            required: true,
            enum: ['Pending', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'],
            default: 'Pending',
        },
        statusHistory: [
            {
                status: { type: String, required: true },
                timestamp: { type: Date, default: Date.now },
            }
        ],
    },
    {
        timestamps: true,
    }
);

const Order = mongoose.model('Order', orderSchema);

export default Order;
