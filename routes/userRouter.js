const express = require('express')
const user_Router = express.Router()
const { isUser, userAuth } = require('../middlewares/isUser')


//=======================controllers=========================
const userController = require('../controller/userController')
const productController = require('../controller/productController')

user_Router.get('/',userController.homePage)
user_Router.get('/login',userAuth ,userController.loginPage)
user_Router.post('/login',userController.login)
//this is for render signupPage
user_Router.get('/signup',userAuth,userController.signUp)
//this is for validate the user and sending otp
user_Router.post('/submit-signup',userController.submitSignup)
//for verifying otp
user_Router.post('/verify-otp',userController.verifyOtp)
user_Router.get('/products',productController.productPage)
user_Router.get('/productDetails',productController.productDetailPage)
user_Router.get('/productByCategory',productController.productByCategory)
user_Router.post('/resend-otp',userController.resendOtp)
user_Router.get('/logout',userController.logOut)
user_Router.post('/check-email',userController.checkEmail)


 
module.exports = user_Router