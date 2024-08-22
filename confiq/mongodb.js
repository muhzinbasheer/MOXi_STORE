const mongoose=require('mongoose')
const mongoDb=mongoose.connect(process.env.MONGO_URL).then(res=>{
    console.log("mongodb connected");
})
.catch(err=>{
    console.log(err);
})
module.exports = mongoDb;
