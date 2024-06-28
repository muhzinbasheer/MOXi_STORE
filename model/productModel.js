const mongoose = require('mongoose')

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
        type: String,
        required: true
    },
    category: {
        type:mongoose.Schema.Types.ObjectId,
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
    }
},{
    timestamps: true
})

module.exports =mongoose.model("Product",productSchema)