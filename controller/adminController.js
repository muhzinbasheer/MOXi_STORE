const AdminModel = require('../model/adminModel')
const User=require('../model/userModel')


const adminPage = (req, res) => {
    try {
        res.render('admin/adminhome')
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'internal server error' })
    }
}

const adminLogin = (req, res) => {
    try {
        res.render('admin/adminlogin')
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'internal server error' })
    }
}

const loginPost = async (req, res) => {
    try {
        const { email, password } = req.body
        const adminData = await AdminModel.findOne({ email: email })
        if (email === adminData.email && password === adminData.password) {
            req.session.admin=adminData.email
            
            return res.json({ message:'successfull' })
        } else {
            return res.json({ success: false ,message:'email or pasword incorrect'})
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'internal server error' })
    }
}

const userPage = async(req,res)=>{
    try {
        const user=await User.find()
        res.render('admin/userList',{user})
    } catch (error) {
        console.log(error.message);
    }
}

const blockUser = async (req,res)=>{
    try {
       const userId= req.body.userId 
       const isblock =  await User.findByIdAndUpdate(userId,{
          isBlock:true
       })
       if(isblock){
        return res.status(200).json({success:true,message:'User Blocked'})
       }else{
        return res.json({success:false,message:'something went wrong'})
       }
       
    } catch (error) {
        console.log(error);
    }
}

const unblockUser = async (req,res)=>{
    try { 
        const userId = req.body.userId
        const isUnblock = await User.findByIdAndUpdate(userId,{
            isBlock:false
        })
        if(isUnblock){
            return res.status(200).json({success:true,message:'User Unblocked'})
        }else{
            return res.json({success:false,message:'something went wrong'})
        }
    } catch (error) {
        console.log(error);
    }
}

 const logOut=async(req,res)=>{
    try {
        req.session.admin=undefined
        return res.redirect('/admin')
        
    } catch (error) {
        console.log(error);
    }
 }



module.exports = {
    adminPage,
    adminLogin,
    loginPost,
    userPage,
    blockUser,
    unblockUser,
    logOut
}