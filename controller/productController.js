const Product = require('../model/productModel')
const Category = require('../model/categoryModel')
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: './uploads/', 
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 1000000 },
    fileFilter: (req, file, cb) => {
        checkFileType(file, cb);
    }
}).array('images', 10); 


function checkFileType(file, cb) {
    const filetypes = /jpeg|jpg|png/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb('Error: Images Only!');
    }
}

const productPage = async (req, res) => {
    try {
        const allProduct = await Product.find({ isBlock: false }).populate('category')
        const product =  allProduct.filter((item) =>{
            return item.category.isBlock === false
        })
        console.log(product);
        const category = await Category.find({ isBlock: false })
        const user = req.session.User;
        res.render('user/product', { product, user, category })
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'internal server error' })
    }
}

const productPageAdmin = async (req, res) => {
    try {
        const product = await Product.find()
        res.render('admin/products', { product })
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'internal server error' })
    }
}

const addProduct = async (req, res) => {
    try {
        const category = await Category.find()
        res.render('admin/addProduct', { category })
    } catch (error) {
        res.status(500).json({ message: 'internal server error' })
    }
}

const submitAddProduct = async (req, res) => {
    try {
        const category = await Category.find()
        upload(req, res, async (err) => {
            if (err) {
                return res.render('admin/addProduct', { message: err, category });
            } else {
                try {
                    const { productTitle, description, cost, category, stock } = req.body;

                    const existingProduct = await Product.findOne({ title: productTitle });
                    if (existingProduct) {
                        return res.render('admin/addProduct', { message: 'Product already exists', category });
                    }
                    const newProduct = new Product({
                        title: productTitle,
                        productdesc: description,
                        price: cost,
                        category: category, 
                        stock: stock,
                        productimg: req.files.map(file => file.filename)
                    });
                    await newProduct.save();
                    return res.redirect('/admin/products');
                } catch (error) {
                    console.error(error);
                    return res.render('admin/addProduct', { message: 'Something went wrong' });
                }
            }
        });
    } catch (error) {
        console.log(error);
    }
}

const unPublish = async (req, res) => {
    try {
        const id = req.query.id
        await Product.findByIdAndUpdate(id, { isBlock: true })
        return res.status(200).json({ success: true })
    } catch (error) {
        console.error('Error occcur while unpublishing a product', error)
        res.status(500).json({ error: 'Internal server error' })
    }
}

const publish = async (req, res) => {
    try {
        const id = req.query.id
        await Product.findByIdAndUpdate(id, { isBlock: false })
        return res.status(200).json({ success: true })
    } catch (error) {
        console.error('Error occure while publishing a product')
        res.status(500).json({ error: 'Internal server error' })
    }

}

const editProductPage = async (req, res) => {
    try {
        const productData = await Product.find({ _id: req.query.id }).populate('category');
        const category = await Category.find()
        const categoryData = category.filter(data => data.id != productData[0].category._id)
        res.render('admin/editProduct', { product: productData, category: categoryData })
    } catch (error) {
        console.log(error);
    }
}

const submitEditProduct = async (req, res) => {
    try {
        const category = await Category.find()
        upload(req, res, async (err) => {
            const { productTitle, description, cost, category, stock, productId } = req.body;
            const product = await Product.findOne({ _id: productId })
            let images = req.files.map(file => file.filename);
            images = [...product.productimg, ...images]            
            product.title = productTitle
            product.productdesc = description
            product.price = cost
            product.category = category
            product.stock = stock
            product.productimg = images
            await product.save()

            res.redirect('/admin/products')
        });
    } catch (error) {
        console.log(error);
        return res.render('admin/editProduct', { message: 'An error occurred', });
    }
}

const getRelatedProducts = async (productId) => {
    try {
        const product = await Product.findById(productId).populate('category');
        if (!product) throw new Error('Product not found');
        const relatedProducts = await Product.find({
            category: product.category,
            _id: { $ne: productId },
            isBlock: false
        });
        return relatedProducts;
    } catch (err) {
        console.error(err);
        throw new Error('Error fetching related products');
    }
};

const productDetailPage = async (req, res) => {
    try {
        const productId = req.query.id;
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).send('Product not found');
        }
        const relatedProducts = await getRelatedProducts(productId);
        res.render('user/productDetails', { selectedProduct: product, relatedProducts: relatedProducts, user: req.session.User });
    } catch (error) {
        console.log(error);
    }
}
const productByCategory = async (req, res) => {
    try {
        const id = req.query.id;
        const products = await Product.find({ category: id })
        return res.json({ success: true, products })
    } catch (error) {
        console.log(error);
    }
}

module.exports = {
    productPage,
    addProduct,
    submitAddProduct,
    unPublish,
    publish,
    editProductPage,
    submitEditProduct,
    productDetailPage,
    productPageAdmin,
    productByCategory
}