const express = require('express')
const admin_Router = express.Router()

//controllers
const adminController = require('../controller/adminController')
const productController = require('../controller/productController')
const categoryController = require('../controller/categoryController')
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

//categoryController
admin_Router.get('/categories',isAdmin,categoryController.categoryPage)
admin_Router.get('/addCategory',isAdmin,categoryController.addCategory)
admin_Router.post('/submitAddCategory',categoryController.submitAddCategory)
admin_Router.post('/listCategory',categoryController.listCategory)
admin_Router.post('/unlistCategory',categoryController.unlistCategory)
admin_Router.get('/categoriesEdit',isAdmin,categoryController.editCategoryPage)
admin_Router.post('/submitEditCategory',categoryController.submitEditCategory)


module.exports = admin_Router
