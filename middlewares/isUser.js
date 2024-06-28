const isUser =  (req,res,next) => {
    try {
        if(req.session.User){
            next()
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