const mongoose = require('mongoose')

const adressSchema = new mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        required:true,
        ref:'User'
    },

    address:[{
        houseName:{
            type:String,
            required:true
        },
        street:{
            type:String,
            required:true
        },
        state:{
            type:String,
            required:true
        },
        Pincode:{
            type:Number,
            required:true
        }
    }]
},{
    timestamps:true
})

module.exports=mongoose.model('Address',adressSchema)