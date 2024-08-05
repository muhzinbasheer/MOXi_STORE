const ProductOffer = require('../model/productOfferModel');
const CategoryOffer = require('../model/categoryOfferModel');
const Product = require('../model/productModel');
const Category = require('../model/categoryModel');


const offerPage = async (req,res) => {
    try {
        const productOffers = await ProductOffer.find()
        const products = await Product.find()
        console.log(productOffers)
        const CategoryOffers = await CategoryOffer.find()
        const categories = await Category.find()
        res.render('admin/offerMgt',{productOffers,CategoryOffers,products,categories})
    } catch (error) {
        res.status(500).send('Server Error');
    }
}


const createProductOffer = async (req,res) => {
    try {
        const { productId, discount, expirationDate } = req.body;
        const products = await Product.find()
        const productOffers = await ProductOffer.find()
        const CategoryOffers = await CategoryOffer.find()
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        const newOffer = new ProductOffer({
            product: productId,
            discount,
            expirationDate
        });

        await newOffer.save();
        res.status(201).json({ success: true, message: 'Product offer created successfully',products,productOffers,CategoryOffers });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const createCategoryOffer = async(req,res) => {
    try {
        const { categoryId, discount, expirationDate } = req.body;
        const products = await Product.find()
        const productOffers = await ProductOffer.find()
        const CategoryOffers = await CategoryOffer.find()
        const category = await Category.findById(categoryId);
        if (!category) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }

        const newOffer = new CategoryOffer({
            category: categoryId,
            discount,
            expirationDate
        });

        await newOffer.save();
        res.status(201).json({ success: true, message: 'Category offer created successfully',products,CategoryOffers,productOffers});
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const deleteOffer = async(req,res) =>{
    try {
        const { id, type } = req.params;
        const products = await Product.find()
        const productOffers = await ProductOffer.find()
        const CategoryOffers = await CategoryOffer.find()
        if (type === 'product') {
            await ProductOffer.findByIdAndDelete(id);
        } else if (type === 'category') {
            await CategoryOffer.findByIdAndDelete(id);
        } else {
            return res.status(400).json({ success: false, message: 'Invalid offer type' });
        }

        res.status(200).json({ success: true, message: 'Offer deleted successfully',products,productOffers,CategoryOffers });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

module.exports = {
    createProductOffer,
    createCategoryOffer,
    deleteOffer,
    offerPage
}