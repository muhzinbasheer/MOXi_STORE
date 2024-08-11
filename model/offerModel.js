const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    discountType: { type: String, enum: ['percentage', 'flat'], required: true },
    discountValue: { type: Number, required: true },
    discountOn: { type: String, enum: ['product', 'category'], required: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' }, 
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'category' },  
    isActive: { type: Boolean, default: true }
}, { timestamps: true });


module.exports = mongoose.model('Offer', offerSchema);
