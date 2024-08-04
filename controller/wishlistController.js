const Cart = require('../model/cartModel');
const Wishlist = require('../model/wishlistModel');
const Products = require('../model/productModel');

const favourite = async (req, res) => {
    try {
        const userId = req.session.User._id;
        const userCart = await Cart.findOne({ userId }).populate('cartItems.product_id');
        const wishlist = await Wishlist.findOne({ userId }).populate('products'); 

        const cartLength = userCart ? userCart.cartItems.length : 0;

        return res.render('user/wishList', {
            wishlist: wishlist ? wishlist.products : [], 
            cartLength,
            userCart,
            user: req.session.User,
        });
    } catch (error) {
        console.error('Error fetching userCart:', error);
        res.status(500).send('Internal Server Error');
    }
};


const addToWishList = async (req, res) => {
    const { userId, productId } = req.body;
    try {
        let wishlist = await Wishlist.findOne({ userId });
        if (!wishlist) {
            wishlist = new Wishlist({ userId, products: [] });
        }
        if (!wishlist.products.includes(productId)) {
            wishlist.products.push(productId);
        }
        await wishlist.save();

        res.status(200).json({ message: 'Product added to wishlist' });
    } catch (error) {
        console.error('Error adding to wishlist:', error);
        res.status(500).json({ message: 'Server error' });
    }
};


const deleteWishList = async (req, res) => {
    try {
        const userId = req.session.User._id;
        const productId = req.params.id; 
        const userWishList = await Wishlist.findOne({ userId });
        
        if (userWishList) {
            userWishList.products = userWishList.products.filter((id) => id.toString() !== productId);
            await userWishList.save();
            res.json({ success: true });
        } else {
            res.status(404).json({ message: 'Wishlist not found' });
        }
    } catch (error) {
        console.error('Error removing from wishlist:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    favourite,
    addToWishList,
    deleteWishList
};
