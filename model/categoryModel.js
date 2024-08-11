const mongoose = require("mongoose")

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    isBlock: {
        type: Boolean,
        default: false
    },
    offerId: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Offer',
        default: null 
    },
},{
    timestamps: true
})

module.exports = mongoose.model('category',categorySchema)
