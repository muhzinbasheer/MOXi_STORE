const express = require('express')
const admin_Router = express.Router()
const multer = require('multer');
const upload = multer({ dest: 'public/uploads/' });


//controllers
const adminController = require('../controller/adminController')
const productController = require('../controller/productController')
const categoryController = require('../controller/categoryController')
const orderController = require('../controller/orderController')
const couponController = require('../controller/couponController')
const offerController = require('../controller/offerController')
const { isAdmin, isAdminAuth } = require('../middlewares/isAdmin')

//adminController
admin_Router.get('/home',isAdmin,adminController.adminPage)
admin_Router.get('/',isAdminAuth, adminController.adminLogin)
admin_Router.post('/loginpost', adminController.loginPost)
admin_Router.get('/user',isAdmin,adminController.userPage)
admin_Router.post('/blockUser',adminController.blockUser)
admin_Router.post('/unblockUser',adminController.unblockUser)
admin_Router.get('/logout',isAdmin,adminController.logOut)

//productController
admin_Router.get('/products',isAdmin,productController.productPageAdmin)
admin_Router.get('/addProduct',isAdmin,productController.addProduct)
admin_Router.post('/submitAddProduct',productController.submitAddProduct)
admin_Router.get('/unPublish',isAdmin,productController.unPublish)
admin_Router.get('/publish',isAdmin,productController.publish)
admin_Router.get('/editProductPage',isAdmin,productController.editProductPage)
admin_Router.post('/submitEditProduct',productController.submitEditProduct)
admin_Router.post('/deleteImage', isAdmin, productController.deleteImage);
admin_Router.post('/modifyImage', isAdmin, upload.single('newImage'), productController.modifyImage);

//categoryController
admin_Router.get('/categories',isAdmin,categoryController.categoryPage)
admin_Router.get('/addCategory',isAdmin,categoryController.addCategory)
admin_Router.post('/submitAddCategory',categoryController.submitAddCategory)
admin_Router.post('/listCategory',isAdmin,categoryController.listCategory)
admin_Router.post('/unlistCategory',isAdmin,categoryController.unlistCategory)
admin_Router.get('/categoriesEdit',isAdmin,categoryController.editCategoryPage)
admin_Router.post('/submitEditCategory',categoryController.submitEditCategory)

//orderController
admin_Router.get('/orders',isAdmin,orderController.orders)
admin_Router.get('/orders/:orderId',isAdmin,orderController.adminViewOrder)
admin_Router.post('/orders/:orderId/items/:itemId/status',isAdmin,orderController.updateItemStatus)
admin_Router.post('/latest-orders',isAdmin,orderController.latest)
admin_Router.post('/report',isAdmin,orderController.report)

//couponController
admin_Router.get('/couponMgt',isAdmin,couponController.coupons)
admin_Router.post('/createCoupon',isAdmin,couponController.createCoupon)
admin_Router.post('/deleteCoupon',isAdmin,couponController.deleteCoupon)

//offerController
admin_Router.get('/offerMgt',isAdmin,offerController.offerPage)
admin_Router.post('/createProductOffer',isAdmin,offerController.createProductOffer)
admin_Router.post('/createCategoryOffer',isAdmin,offerController.createCategoryOffer)
admin_Router.delete('/deleteOffer/:id/:type',isAdmin,offerController.deleteOffer)

module.exports = admin_Router
