const Cart = require('../model/cartModel');
const Product = require('../model/productModel');

const cartPage = async (req, res) => {
    try {
        const userId = req.session.User._id;
        const cart = await Cart.findOne({ userId }).populate('cartItems.product_id');
        res.render('user/cartPage', { cart, user: req.session.User });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'internal server error' });
    }
};

const addtoCart = async (req, res) => {
    try {
        const userId = req.session.User._id;
        const productId = req.params.id;
        const quantity = 1;

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found', success: false });
        }

        let cart = await Cart.findOne({ userId });
        const itemIndex = cart.cartItems.findIndex(item => item.product_id.toString() === productId);
        if (itemIndex > -1) {
            cart.cartItems[itemIndex].quantity += quantity;
        } else {
            cart.cartItems.push({ product_id: productId, quantity: quantity, price: product.price });
        }
        cart.totalPrice = cart.cartItems.reduce((total, item) => total + item.quantity * item.price, 0);
        await cart.save();
        res.status(200).json({ message: 'Product added to cart successfully', success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'internal server error' });
    }
};

const itemRemove = async (req, res) => {
    try {
        const userId = req.session.User._id;
        const productId = req.params.id;

        let cart = await Cart.findOne({ userId });
        if (!cart) {
            console.error('Cart not found');
            return res.status(404).json({ message: 'Cart not found', success: false });
        }

        const itemIndex = cart.cartItems.findIndex(item => item.product_id.toString() === productId);
        if (itemIndex > -1) {
            cart.cartItems.splice(itemIndex, 1);
            cart.totalPrice = cart.cartItems.reduce((total, item) => total + item.quantity * item.price, 0);
            await cart.save();
            return res.status(200).json({ message: 'Item removed from cart successfully', success: true });
        } else {
            console.error('Item not found in cart');
            return res.status(404).json({ message: 'Item not found in cart', success: false });
        }
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ message: 'Internal server error', success: false });
    }
};

const updateCartQuantity = async (req, res) => {
    try {
        const userId = req.session.User._id;
        const productId = req.params.id;
        const newQuantity = req.body.quantity;
        let limit = 10

        if(newQuantity>limit){
            return res.json({ message: 'Your limit has exceeded for this product', success: false,stock:limit})
        }

        const product = await Product.findOne({ _id: productId })
        if (product.stock < newQuantity) {
            return res.json({ message: 'Item has limited stock', success: false ,stock:product.stock});
        }

        let cart = await Cart.findOne({ userId });
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found', success: false });
        }
        const itemIndex = cart.cartItems.findIndex(item => item.product_id.toString() === productId);
        if (itemIndex > -1) {
            cart.cartItems[itemIndex].quantity = newQuantity;
            cart.totalPrice = cart.cartItems.reduce((total, item) => total + item.quantity * item.price, 0);
            await cart.save();
            return res.status(200).json({ message: 'Item quantity updated successfully', success: true, cart });
        } else {
            return res.status(404).json({ message: 'Item not found in cart', success: false });
        }
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ message: 'Internal server error', success: false });
    }
};


module.exports = {
    cartPage,
    addtoCart,
    itemRemove,
    updateCartQuantity
};
