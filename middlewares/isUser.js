const User = require('../model/userModel')

const isUser = async (req,res,next) => {
    try {
        if(req.session.User){
            const user = await User.findOne({
                email: req.session.User.email
            })
            if(user.isBlock===false){
                next()
            }else{
                res.render('user/login',{message: "you are temporarly blocked"})
            }
            
        }else{
            res.redirect('/login')
        }
    } catch (error) {
        
    }
}

const userAuth = (req,res,next) => {
    try {
        if(req.session.User){
            res.redirect('/')
        }else{
            next()
        }
    } catch (error) {
        
    }
}


module.exports = {
    isUser,
    userAuth
}