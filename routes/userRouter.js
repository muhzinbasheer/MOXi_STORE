const express = require('express')
const user_Router = express.Router()
const { isUser, userAuth } = require('../middlewares/isUser')

//=======================controllers=========================
const userController = require('../controller/userController')
const productController = require('../controller/productController')
const addressController = require('../controller/addressController')
const cartController = require('../controller/cartController')
const orderController = require('../controller/orderController')
const wishListController = require('../controller/wishlistController')
const couponController = require('../controller/couponController')
const walletController = require('../controller/walletController')

//userController
user_Router.get('/',userController.homePage)
user_Router.get('/login',userController.loginPage)
user_Router.post('/home',userController.login)
user_Router.get('/signup',userController.signUp) 
user_Router.post('/submit-signup',userController.submitSignup)
user_Router.post('/verify-otp',userController.verifyOtp)
user_Router.post('/resend-otp',userController.resendOtp)
user_Router.get('/logout',userController.logOut)
user_Router.post('/check-email',userController.checkEmail)
user_Router.get('/userProfile',isUser,userController.userProfile)
user_Router.get('/editProfile',isUser,userController.editProfile)
user_Router.post('/updateProfile',isUser,userController.updateProfile)
user_Router.get('/changePassword',userController.changePassword)
user_Router.post('/updatePassword',userController.updatePassword)
user_Router.get('/forgot-password',userController.forgetPassword)
user_Router.post('/forgot-password',userController.forgotPassword)
user_Router.get('/reset-password/:token',userController.resetPassword)
user_Router.post('/resetpassword/:token',userController.ResetPassword)

//productController
user_Router.get('/products',productController.productPage)
user_Router.get('/productDetails',productController.productDetailPage)
user_Router.get('/productByCategory',productController.productByCategory)
user_Router.get('/searchProducts',productController.searchProducts)
user_Router.get('/sortProducts',productController.sortProducts)
user_Router.get('/filterProducts',productController.filterProducts)


//addressController
user_Router.get('/addressPage',addressController.addressPage)
user_Router.get('/addAddress',isUser,addressController.addAddress)
user_Router.post('/addAddress',isUser,addressController.submitAddAddress)
user_Router.get('/editAddress',isUser,addressController.getEditAddress);
user_Router.post('/updateAddress',isUser,addressController.updateAddress);
user_Router.post('/address/:addressId',isUser,addressController.deleteAddress);


//cartController
user_Router.get('/cartPage',isUser,cartController.cartPage)
user_Router.put('/addtoCart/:id',isUser,cartController.addtoCart)
user_Router.delete('/itemRemove/:id',isUser,cartController.itemRemove)
user_Router.put('/updateCart/:id', isUser, cartController.updateCartQuantity);


//orderController
user_Router.get('/checkout',isUser,orderController.checkout)
user_Router.post('/placeOrder',isUser,orderController.placeOrder)
user_Router.get('/orderConfirmation',isUser,orderController.orderConfirmation)
user_Router.get('/orderDetails',isUser,orderController.orderDetails)
user_Router.get('/orders/:orderId',isUser,orderController.viewOrder)
user_Router.get('/orders/:orderId/products/:productId/cancel',isUser,orderController.cancelProduct)
user_Router.get('/orders/:orderId/products/:productId/return',isUser,orderController.returnProduct)


//wishlistController
user_Router.get('/wishList', isUser, wishListController.favourite);
user_Router.post('/wishlist/add', isUser, wishListController.addToWishList);
user_Router.delete('/deleteWishList/:id', isUser, wishListController.deleteWishList);

//couponController
user_Router.post('/applyCoupon', isUser, couponController.applyCoupon);
user_Router.delete('/removeCoupon', isUser, couponController.removeCoupon);

//walletController
user_Router.get('/walletPage', isUser, walletController.getWalletPage);
user_Router.post('/create-order', isUser, walletController.createOrder);
user_Router.post('/update-balance', isUser, walletController.updateBalance);


module.exports = user_Router