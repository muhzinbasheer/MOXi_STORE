const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    productdesc: {
        type: String,
        required: true
    },
    productimg: [{
        type: String,
        required: true
    }],
    price: {
        type: Number,
        required: true
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "category",
        required: true
    },
    isBlock: {
        type: Boolean,
        default: false
    },
    stock: {
        type: Number,
        required: true
    },
    ordersCount: {
        type: Number,
        default: 0
    },
    averageRating: {
        type: Number,
        default: 0
    },
    isFeatured: {
        type: Boolean,
        default: false
    },
    offerId: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Offer',
        default: null 
    },
    discountedPrice: {
        type: Number,
        default: null
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("Product", productSchema);
