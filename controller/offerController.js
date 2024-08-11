const Offer = require('../model/offerModel');
const Product = require('../model/productModel');
const Category = require('../model/categoryModel')

const listOffers = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;

        const offers = await Offer.find()
            .populate('product', 'title')
            .populate('category', 'name')
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const totalOffers = await Offer.countDocuments();
        const totalPages = Math.ceil(totalOffers / limit);
        
        res.render('admin/offerMgt', {
            offers,
            currentPage: parseInt(page),
            totalPages,
            limit: parseInt(limit),
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Server Error");
    }
};


const blockOffer = async (req, res) => {
    try {
        const { offerId } = req.body;
        const offer = await Offer.findById(offerId).populate('product');
        console.log(offer)
        const productId = offer.product._id
        // await Product.findByIdAndUpdate({_id:productId},{$unset:{discountedPrice: "" }})
        if (!offer) {
            return res.status(404).json({ success: false, message: "Offer not found" });
        }

        const off = await Offer.findOneAndUpdate({_id:offerId},{$set:{isActive:false}},{new:true})

        // offer.isActive = false;
        // await offer.save();
        console.log(off)

        res.status(200).json({ success: true, message: "Offer blocked successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

const unblockOffer = async (req, res) => {
    try {
        const { offerId } = req.body;
        const offer = await Offer.findById(offerId);

        if (!offer) {
            return res.status(404).json({ success: false, message: "Offer not found" });
        }

        offer.isActive = true;
        await offer.save();

        res.status(200).json({ success: true, message: "Offer unblocked successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

const addOffer = async (req, res) => {
    try {
        const products = await Product.find();
        const categories = await Category.find();
        res.render('admin/addOffer', { products, categories });
    } catch (err) {
        res.status(500).send('Server Error');
    }
};

const submitAddOffer = async (req, res) => {
    try {
        const { name, discountType, discountValue, discountOn, productId, categoryId } = req.body;

        const newOffer = new Offer({
            name,
            discountType,
            discountValue,
            discountOn,
            product: discountOn === 'product' ? productId : null,
            category: discountOn === 'category' ? categoryId : null
        });

        await newOffer.save();

        if (discountOn === 'product') {
            await applyOfferToProduct(newOffer._id, productId);
        } else if (discountOn === 'category') {
            const products = await Product.find({ category: categoryId });
            for (const product of products) {
                await applyOfferToProduct(newOffer._id, product._id);
            }
        }
        console.log(productId);
        

        res.redirect('/admin/offerMgt');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

const applyOfferToProduct = async (offerId, productId) => {
    const offer = await Offer.findById(offerId);
    const product = await Product.findById(productId);

    if (offer && product) {
        let discountedPrice = product.price;

        if (offer.discountType === 'percentage') {
            discountedPrice = product.price - (product.price * offer.discountValue / 100);
        } else if (offer.discountType === 'flat') {
            discountedPrice = product.price - offer.discountValue;
        }

        product.discountedPrice = discountedPrice;
        product.offerId = offerId;

        await product.save();

        console.log(`Applied offer to product: ${product.title}, new discounted price: ${product.discountedPrice}`);
    }
};

const reset = async(req,res) =>{
    try {
        await Product.updateMany(
            { discountedPrice: { $exists: true } },
            { $unset: { discountedPrice: "" } }
        );
        res.json({ success: true, message: "Discounted prices reset successfully." });
    } catch (error) {
        console.error("Error resetting discounted prices:", error);
        res.json({ success: false, message: "Failed to reset discounted prices." });
    }
}



module.exports = {
    listOffers,
    blockOffer,
    unblockOffer,
    addOffer,
    submitAddOffer,
    applyOfferToProduct,
    reset
};
