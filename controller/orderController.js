const Cart = require('../model/cartModel');
const Address = require('../model/addressModel');
const Order = require('../model/orderModel');
const User = require('../model/userModel');
const Product = require("../model/productModel");
const Coupon = require('../model/couponModel');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Wallet = require('../model/walletModel');
const Transaction = require('../model/transactionModel');
const { generateInvoicePDF } = require('../utils/pdfGenerator');


const checkout = async (req, res) => {
    try {
        const userId = req.session.User._id;
        const addresses = await Address.find({ userId });
        const cart = await Cart.findOne({ userId }).populate('cartItems.product_id');
        const coupons = await Coupon.find({}).lean();


        const availableCoupons = coupons.filter(coupon =>
            !coupon.users.some(user => user.equals(userId))
        );

        req.session.checkoutData = {
            totalPrice: cart.totalPrice,
            items: cart.items,
            coupon: null
        };

        cart.cartItems.forEach((data) => {
            if (data.product_id.stock < data.quantity) {
                data.quantity = data.product_id.stock;
            }
        });
        await cart.save();

        res.render('user/checkoutPage', { addresses, cart, user: req.session.User, userId, availableCoupons, checkoutData: req.session.checkoutData });
    } catch (error) {
        console.error('Error fetching checkout page:', error);
        res.status(500).send('Internal Server Error');
    }
}


const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});


const placeOrder = async (req, res) => {
    try {
        const userId = req.session.User._id;
        const { addressId, paymentMethod } = req.body;

        const cart = await Cart.findOne({ userId }).populate('cartItems.product_id');

        if (!cart || cart.cartItems.length === 0) {
            return res.status(400).json({ message: 'No items in the cart' });
        }

        const userAddress = await Address.findOne({ userId });
        const selectedAddress = userAddress.address.id(addressId);

        if (!selectedAddress) {
            return res.status(400).json({ message: 'Invalid address' });
        }

        cart.cartItems.forEach((data) => {
            if (data.product_id.stock < data.quantity) {
                data.quantity = data.product_id.stock;
            }
        });

        const checkoutData = req.session.checkoutData || {};
        const totalPrice = checkoutData.totalPrice || cart.totalPrice;
        const discountAmount = checkoutData.discountAmount || 0;
        let razorpayOrderId = null;

        if (paymentMethod === 'Online') {
            const orderOptions = {
                amount: totalPrice * 100,
                currency: 'INR',
                receipt: `receipt_${new Date().getTime()}`,
                payment_capture: 1
            };

            try {
                const razorpayOrder = await razorpay.orders.create(orderOptions);
                razorpayOrderId = razorpayOrder.id;

                return res.status(200).json({
                    razorpayOrderId: razorpayOrderId,
                    totalPrice: totalPrice,
                    message: 'Order initiated, awaiting payment confirmation',
                });
            } catch (error) {
                console.error('Razorpay order creation failed:', error);
                return res.status(500).json({ message: 'Failed to create Razorpay order' });
            }
        }

        if (paymentMethod === 'Wallet') {
            const wallet = await Wallet.findOne({ userId });
            if (wallet && wallet.balance >= totalPrice) {
                wallet.balance -= totalPrice;
                await wallet.save();

                const transaction = new Transaction({
                    userId,
                    date: new Date(),
                    description: 'Order payment using wallet',
                    amount: -totalPrice,
                    type: 'debit'
                });
                await transaction.save();
            } else {
                return res.status(400).json({ message: 'Insufficient wallet balance' });
            }
        }

        const order = new Order({
            userId,
            address: selectedAddress,
            paymentMethod,
            items: cart.cartItems.map(item => {
                const price = item.product_id.discountedAmount > 0 ? item.product_id.discountedAmount : item.product_id.price;

                return {
                    productId: item.product_id._id,
                    quantity: item.quantity,
                    price: price
                };
            }),
            totalPrice: totalPrice,
            discount: discountAmount,
            razorpayOrderId: paymentMethod === 'Online' ? razorpayOrderId : null,
            status: paymentMethod === 'COD' ? 'Pending' : 'Paid'
        });

        await order.save();

        for (let item of cart.cartItems) {
            const productId = item.product_id._id;
            const product = await Product.findById(productId);
            product.stock -= item.quantity;
            await product.save();
        }

        cart.cartItems = [];
        cart.totalPrice = 0;
        await cart.save();

        if (checkoutData.coupon) {
            const couponCode = checkoutData.coupon;
            const coupon = await Coupon.findOne({ code: couponCode });
            if (coupon) {
                coupon.users.push(userId);
                await coupon.save();
            }
        }

        req.session.checkoutData = {};

        res.status(200).json({
            message: 'Order placed successfully',
            orderId: order._id,
            razorpayOrderId: razorpayOrderId,
            totalPrice: totalPrice
        });
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};



const saveOrder = async (req, res) => {
    try {
        const { razorpayPaymentId, razorpayOrderId, razorpaySignature, addressId } = req.body;
        const userId = req.session.User ? req.session.User._id : null;

        if (!userId) {
            return res.status(400).json({ message: 'User not found in session' });
        }

        if (!razorpayOrderId) {
            return res.status(400).json({ message: 'Razorpay order ID is missing' });
        }

        let isPaymentSuccess = true;
        if (razorpaySignature) {
            const generatedSignature = crypto.createHmac('sha256', 'Tft5C9QjcCauH4WzApoC30WT')
                .update(`${razorpayOrderId}|${razorpayPaymentId}`)
                .digest('hex');

            if (generatedSignature !== razorpaySignature) {
                isPaymentSuccess = false;
            }
        } else {
            isPaymentSuccess = false;
        }

        const cart = await Cart.findOne({ userId }).populate('cartItems.product_id');
        const checkoutData = req.session.checkoutData || {};
        const totalPrice = checkoutData.totalPrice || cart.totalPrice;
        const discountAmount = checkoutData.discountAmount || 0;

        const userAddress = await Address.findOne({ userId });
        const selectedAddress = userAddress.address.id(addressId);

        if (!selectedAddress) {
            return res.status(400).json({ message: 'Selected address not found' });
        }

        const order = new Order({
            userId,
            address: selectedAddress,
            paymentMethod: 'Online',
            items: cart.cartItems.map(item => {
                let price = item.product_id.discountedAmount > 0 ? item.product_id.discountedAmount : item.product_id.price;
                return {
                    productId: item.product_id._id,
                    quantity: item.quantity,
                    price: price
                };
            }),
            totalPrice: totalPrice,
            discount: discountAmount,
            razorpayOrderId: razorpayOrderId,
            status: isPaymentSuccess ? 'Paid' : 'Pending'
        });

        await order.save();

        for (let item of cart.cartItems) {
            let productId = item.product_id._id;
            const product = await Product.findById(productId);
            product.stock -= item.quantity;
            await product.save();
        }

        cart.cartItems = [];
        cart.totalPrice = 0;
        await cart.save();

        if (checkoutData.coupon) {
            const couponCode = checkoutData.coupon;
            const coupon = await Coupon.findOne({ code: couponCode });
            if (coupon) {
                coupon.users.push(userId);
                await coupon.save();
            }
        }

        req.session.checkoutData = {};

        res.status(200).json({
            message: 'Order saved successfully',
            orderId: order._id
        });
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};



const retryPayment = async (req, res) => {
    try {
        const { orderId } = req.body;
        const order = await Order.findOne({ _id: orderId, status: 'Pending' });

        if (!order) {
            return res.status(400).json({ message: 'Order not found or payment already completed' });
        }

        const orderOptions = {
            amount: order.totalPrice * 100,
            currency: 'INR',
            receipt: `receipt_${new Date().getTime()}`,
            payment_capture: 1
        };

        const razorpayOrder = await razorpay.orders.create(orderOptions);
        order.razorpayOrderId = razorpayOrder.id;
        await order.save();

        res.status(200).json({
            razorpayOrderId: razorpayOrder.id,
            totalPrice: order.totalPrice,
            message: 'Order retrieved, ready for payment'
        });
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const generateInvoice = async (req, res) => {
    try {
        const orderId = req.params.orderId;
        const order = await Order.findById(orderId).populate('items.productId');

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        generateInvoicePDF(order, res);
    } catch (error) {
        console.error('Error generating invoice:', error);
        res.status(500).json({ message: 'Error generating invoice' });
    }
};

const confirmPayment = async (req, res) => {
    try {
        const { orderId } = req.body;

        const order = await Order.findOne({ _id: orderId });

        if (!order || order.status !== 'Pending') {
            return res.status(400).json({ message: 'Order not found or payment already completed' });
        }

        order.status = 'Paid';
        await order.save();

        res.status(200).json({
            orderId: order._id,
            message: 'Payment successful, order confirmed'
        });
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};


const orderConfirmation = async (req, res) => {
    try {
        const orderId = req.query.orderId;
        const order = await Order.findById(orderId)
        res.render('user/orderConfirmation', { orderId, user: req.session.User })
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
}


const orderDetails = async (req, res) => {
    try {
        const userId = req.session.User._id;
        const user = await User.findById(userId);

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        const totalOrders = await Order.countDocuments({ userId });

        const orders = await Order.find({ userId })
            .populate('items.productId')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .exec();

        const totalPages = Math.ceil(totalOrders / limit);

        res.render('user/orderDetails', { orders, user, page, totalPages });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};


const viewOrder = async (req, res) => {
    try {
        const orderId = req.params.orderId;
        const order = await Order.findById(orderId).populate('items.productId');

        if (!order) {
            return res.status(404).send('Order not found');
        }

        res.render('user/viewOrder', { order, user: req.session.User });
    } catch (error) {
        console.error('Error fetching order details:', error);
        res.status(500).send('Server error');
    }
}

const cancelProduct = async (req, res) => {
    try {
        const { orderId, productId } = req.params;
        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({ message: 'Order not found', success: false });
        }

        const product = order.items.find(item => item.productId.toString() === productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found in the order', success: false });
        }

        product.status = 'cancel';

        order.totalPrice = order.items.reduce((total, item) => {
            if (item.status !== 'cancel') {
                return total + (item.price * item.quantity);
            }
            return total;
        }, 0);

        let itemProduct = await Product.findById(product.productId);
        itemProduct.stock += product.quantity;
        await itemProduct.save();

        await order.save();

        if (order.paymentMethod === 'Wallet') {
            const wallet = await Wallet.findOne({ userId: order.userId });
            if (wallet) {
                console.log("ordersssssss", order)
                wallet.balance += order.items[0].price - order.discount
                await wallet.save();

                const transaction = new Transaction({
                    userId: order.userId,
                    date: new Date(),
                    description: 'Refund for canceled product',
                    amount: order.items[0].price - order.discount,
                    type: 'credit'
                });
                await transaction.save();
            }
        } else if (order.paymentMethod === 'Online') {
            const wallet = await Wallet.findOne({ userId: order.userId });
            if (wallet) {
                wallet.balance += product.price * product.quantity;
                await wallet.save();

                const transaction = new Transaction({
                    userId: order.userId,
                    date: new Date(),
                    description: 'Refund for canceled product via Razorpay',
                    amount: product.price * product.quantity,
                    type: 'credit'
                });
                await transaction.save();
            }
        }

        return res.json({ statusData: 'cancel', success: true });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
};


const returnProduct = async (req, res) => {
    try {
        const { orderId, productId } = req.params;
        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({ message: 'Order not found', success: false });
        }

        const product = order.items.find(item => item.productId.toString() === productId);
        if (!product) {
            return res.status(404).json({ message: 'product not found in the order', success: false });
        }

        product.status = 'return';

        order.totalPrice = order.items.reduce((total, item) => {
            if (item.status !== 'return') {
                return total + (item.price * item.quantity);
            }
            return total;
        }, 0);

        await order.save();
        return res.json({ statusData: 'return', success: true });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
};


const orders = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;

        const totalOrders = await Order.countDocuments();
        const orders = await Order.find().populate('userId').skip(startIndex).limit(limit).sort({ createdAt: -1 });

        const pagination = {};
        if (endIndex < totalOrders) {
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

        res.render('admin/orders', { orders, pagination, currentPage: page });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
};


const adminViewOrder = async (req, res) => {
    try {
        const orderId = req.params.orderId;
        const order = await Order.findById(orderId).populate('userId').populate('items.productId');

        if (!order) {
            return res.status(404).send('Order not found');
        }

        res.render('admin/adminOrderDetails', { order });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
};


const updateItemStatus = async (req, res) => {
    try {
        const { orderId, itemId } = req.params;
        const { status } = req.body;

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).send('Order not found');
        }

        const item = order.items.find(item => item._id.toString() === itemId);
        if (!item) {
            return res.status(404).send('Item not found');
        }

        item.status = status;

        if (status === 'returned') {
            let itemProduct = await Product.findById(item.productId);
            itemProduct.stock += item.quantity;
            await itemProduct.save();

            const wallet = await Wallet.findOne({ userId: order.userId });
            if (wallet) {
                wallet.balance += item.price * item.quantity;
                await wallet.save();

                const transaction = new Transaction({
                    userId: order.userId,
                    date: new Date(),
                    description: 'Refund for returned product',
                    amount: item.price * item.quantity,
                    type: 'credit'
                });
                await transaction.save();
            }

            if (order.paymentMethod === 'Online') {
                try {
                    const paymentId = item.paymentId;
                    const amount = item.price * item.quantity * 100;
                    const refund = await razorpay.payments.refund(paymentId, { amount });
                    if (refund.status === 'processed') {
                        const wallet = await Wallet.findOne({ userId: order.userId });
                        if (wallet) {
                            wallet.balance += item.price * item.quantity;
                            await wallet.save();

                            const transaction = new Transaction({
                                userId: order.userId,
                                date: new Date(),
                                description: 'Refund for returned product via Razorpay',
                                amount: item.price * item.quantity,
                                type: 'credit'
                            });
                            await transaction.save();
                        }
                    }
                } catch (error) {
                    console.error('Error processing refund:', error);
                }
            }
        }

        await order.save();

        res.redirect(`/admin/orders/${orderId}`);
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
};


const latest = async (req, res) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 }).limit(10).populate('userId').populate('items.productId');
        const totalSales = orders.reduce((acc, order) => acc + order.totalPrice, 0);
        res.json({ orders, totalSales });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'An error occurred while fetching the latest orders.' });
    }
}

const report = async (req, res) => {
    try {
        const { startDate, endDate } = req.body;
        const orders = await Order.find({
            createdAt: {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            }
        }).populate('userId').populate('items.productId');

        const totalSales = orders.reduce((acc, order) => acc + order.totalPrice, 0);
        const totalOrders = orders.length;
        const totalItems = orders.reduce((acc, order) => acc + order.items.reduce((itemAcc, item) => itemAcc + item.quantity, 0), 0);
        const totalDiscount = orders.reduce((acc, order) => acc + (order.discount || 0), 0);
        const totalCoupons = orders.reduce((acc, order) => acc + (order.coupons || 0), 0);


        res.json({
            totalSales,
            totalOrders,
            totalItems,
            totalDiscount,
            totalCoupons,
            orders
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'An error occurred while generating the sales report.' });
    }
}

const lineGraph = async (req, res) => {
    try {
        const filter = req.query.filter;
        let startDate;

        if (filter === 'weekly') {
            startDate = new Date();
            startDate.setDate(startDate.getDate() - 7);
        } else if (filter === 'monthly') {
            startDate = new Date();
            startDate.setMonth(startDate.getMonth() - 1);
        } else if (filter === 'yearly') {
            startDate = new Date();
            startDate.setFullYear(startDate.getFullYear() - 1);
        }

        const salesData = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: filter === 'yearly' ? '%Y-%m' : '%Y-%m-%d', date: '$createdAt' } },
                    totalSales: { $sum: '$totalPrice' }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        const labels = salesData.map(item => item._id);
        const sales = salesData.map(item => item.totalSales);

        res.json({ labels, sales });
    } catch (error) {
        console.log(error);

    }
}


const doughnut = async (req, res) => {
    try {
        const paymentMethodData = await Order.aggregate([
            {
                $group: {
                    _id: '$paymentMethod',
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { count: -1 }
            }
        ]);

        const labels = paymentMethodData.map(item => item._id);
        const counts = paymentMethodData.map(item => item.count);

        res.json({ labels, counts });
    } catch (error) {
        console.log(error);

    }
}


module.exports = {
    checkout,
    placeOrder,
    orderConfirmation,
    orderDetails,
    viewOrder,
    cancelProduct,
    returnProduct,
    orders,
    adminViewOrder,
    updateItemStatus,
    report,
    latest,
    lineGraph,
    doughnut,
    saveOrder,
    retryPayment,
    confirmPayment,
    generateInvoice
};