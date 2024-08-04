const mongoose=require('mongoose')
const mongoDb=mongoose.connect('mongodb://127.0.0.1:27017/HeadphoneZone').then(res=>{
    console.log("mongodb connected");
})
.catch(err=>{
    console.log(err);
})
module.exports = mongoDb;
