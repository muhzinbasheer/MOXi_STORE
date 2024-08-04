const mongoose = require('mongoose');
const crypto = require('crypto');

const generateOrderId = () => {
    const timestamp = Date.now();
    const randomComponent = crypto.randomBytes(4).toString('hex').toUpperCase();
    return `ORD-${timestamp}-${randomComponent}`;
};

const orderSchema = new mongoose.Schema({
    orderId: {
        type: String,
        default: generateOrderId,
        unique: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    address: {
        houseName: String,
        street: String,
        state: String,
        Pincode: Number
    },
    paymentMethod: {
        type: String,
        required: true
    },
    items: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product'
        },
        quantity: Number,
        price: Number,
        status: {
            type: String,
            default: 'pending'
        }
    }],
    totalPrice: {
        type: Number,
        required: true
    },
    discount: {
        type: Number
    },
    status: {
        type: String,
        default: 'Pending'
    }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
