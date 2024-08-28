const Product = require('../model/productModel')
const Cart = require('../model/cartModel')
const Category = require('../model/categoryModel')
const Order = require('../model/orderModel')
const Offer = require('../model/offerModel')
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { log } = require('console');


const storage = multer.diskStorage({
    destination: path.join(__dirname, '../uploads'),
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
        const { page = 1, limit = 8 } = req.query;
        const skip = (page - 1) * limit;

        const allProduct = await Product.find({ isBlock: false })
            .populate('category')
            .skip(skip)
            .limit(limit);

        const totalProducts = await Product.countDocuments({ isBlock: false });

        const product = allProduct.filter((item) => item.category.isBlock === false);
        const category = await Category.find({ isBlock: false });
        const user = req.session.User;

        res.render('user/product', {
            product,
            user,
            category,
            currentPage: Number(page),
            totalPages: Math.ceil(totalProducts / limit),
            limit
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
}



const productPageAdmin = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;

        const totalProducts = await Product.countDocuments();
        const products = await Product.find().skip(startIndex).limit(limit);

        const pagination = {};
        if (endIndex < totalProducts) {
            pagination.next = {
                page: page + 1,
                limit: limit
            };
        }
        if (startIndex > 0) {
            pagination.prev = {
                page: page - 1,
                limit: limit
            };
        }

        res.render('admin/products', { products, pagination, currentPage: page });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
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
        const product = await Product.findById(productId).populate('category');
        const categoryId = product.category._id
        const off = await Offer.findOne({
            $or: [
                { product: productId },
                { category: categoryId }
            ]
        });

        if (!product) {
            return res.status(404).send('Product not found');
        }
        const relatedProducts = await getRelatedProducts(productId);
        if (req.session.User) {
            const userId = req.session.User._id
            const cart = await Cart.find({ userId });
            const productAdded = cart[0].cartItems.filter((item) => item.product_id == productId);
            res.render('user/productDetails', { off, selectedProduct: product, relatedProducts: relatedProducts, user: req.session.User, productAdded: productAdded });
        } else {

            res.render('user/productDetails', { off, selectedProduct: product, relatedProducts: relatedProducts, user: req.session.User, productAdded: [] });
        }

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

const searchProducts = async (req, res) => {
    const searchTerm = req.query.search;
    try {
        const products = await Product.find({ title: { $regex: searchTerm, $options: 'i' } }).exec();
        res.json({ products });
    } catch (error) {
        console.error('Error searching products:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const sortProducts = async (req, res) => {
    const sortBy = req.query.sort;
    let sortCriteria = {};

    switch (sortBy) {
        case 'popularity':
            sortCriteria = { ordersCount: -1 };
            break;
        case 'averageRating':
            sortCriteria = { averageRating: -1 };
            break;
        case 'newness':
            sortCriteria = { createdAt: -1 };
            break;
        case 'priceAsc':
            sortCriteria = { price: 1 };
            break;
        case 'priceDesc':
            sortCriteria = { price: -1 };
            break;
        default:
            sortCriteria = {};
    }

    try {
        const products = await Product.find().sort(sortCriteria);
        res.json({ products });
    } catch (err) {
        res.status(500).json({ error: 'Server Error' });
    }
};


const filterProducts = async (req, res) => {
    const filterBy = req.query.filter;
    let filterCriteria = {};

    switch (filterBy) {
        case 'featured':
            filterCriteria = { isFeatured: true };
            break;
        case 'outOfStock':
            filterCriteria = { stock: { $eq: 0 } };
            break;
        default:
            filterCriteria = {};
    }

    try {
        const products = await Product.find(filterCriteria);
        res.json({ products });
    } catch (err) {
        res.status(500).json({ error: 'Server Error' });
    }
};

const deleteImage = async (req, res) => {
    const { productId, imageUrl } = req.body;

    try {
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        product.productimg = product.productimg.filter(img => img !== imageUrl);
        await product.save();

        const imagePath = path.join(__dirname, '..', 'uploads', imageUrl);
        fs.unlink(imagePath, (err) => {
            if (err) {
                console.error('Error deleting file:', err);
                return res.status(500).json({ error: 'Error deleting file' });
            }
            res.status(200).json({ message: 'Image deleted successfully' });
        });

    } catch (error) {
        console.error('Error deleting image:', error);
        res.status(500).json({ error: 'Error deleting image' });
    }
};



const modifyImage = async (req, res) => {
    const { productId, oldImageUrl } = req.body;
    const newImageUrl = '/uploads/' + req.file.filename;

    console.log('New image URL:', newImageUrl);

    try {
        const product = await Product.findById(productId);
        if (product) {
            const imageIndex = product.productimg.indexOf(oldImageUrl);
            if (imageIndex !== -1) {
                product.productimg[imageIndex] = newImageUrl;
                await product.save();
                res.status(200).json({ message: 'Image modified successfully' });
            } else {
                res.status(404).json({ message: 'Old image not found in product' });
            }
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const bestProducts = async (req, res) => {
    try {
        const topSellingProducts = await Order.aggregate([
            { $unwind: "$items" },
            {
                $group: {
                    _id: "$items.productId",
                    totalSold: { $sum: "$items.quantity" }
                }
            },
            { $sort: { totalSold: -1 } },
            { $limit: 10 }
        ]);

        const topSellingProductsDetails = await Product.find({
            _id: { $in: topSellingProducts.map(p => p._id) }
        }).lean();

        const productsWithSoldCount = topSellingProducts.map(soldProduct => {
            const product = topSellingProductsDetails.find(p => p._id.equals(soldProduct._id));
            return {
                ...product,
                totalSold: soldProduct.totalSold
            };
        });

        res.render('admin/bestProducts', { topSellingProducts: productsWithSoldCount });
    } catch (error) {
        console.error(error);
        res.status(500).send("Server Error");
    }
};


const bestCategories = async (req, res) => {
    try {
        const topSellingCategories = await Category.aggregate([
            {
                $lookup: {
                    from: 'products',
                    localField: '_id',
                    foreignField: 'category',
                    as: 'products'
                }
            },
            {
                $project: {
                    name: 1,
                    ordersCount: 1,
                    isBlock: 1,
                    productCount: { $size: "$products" },
                    soldQuantity: { $sum: "$products.ordersCount" }
                }
            },
            { $sort: { soldQuantity: -1 } },
            { $limit: 10 }
        ]);

        res.render('admin/bestCategories', { topSellingCategories });
    } catch (error) {
        console.log(error);
        res.status(500).send("Server Error");
    }
};





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
    productByCategory,
    searchProducts,
    sortProducts,
    filterProducts,
    deleteImage,
    modifyImage,
    bestProducts,
    bestCategories
}