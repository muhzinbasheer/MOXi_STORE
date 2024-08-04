const Razorpay = require('razorpay');
const shortid = require('shortid');
const Wallet = require('../model/walletModel');
const Transaction = require('../model/transactionModel');

const getWalletPage = async (req, res) => {
    const userId = req.session.User._id;
    const page = parseInt(req.query.page) || 1; 
    const limit = 10; 
    const skip = (page - 1) * limit; 

    try {
        const wallet = await Wallet.findOne({ userId });
        const transactions = await Transaction.find({ userId })
            .sort({ date: -1 })
            .skip(skip)
            .limit(limit);

        const totalTransactions = await Transaction.countDocuments({ userId });

        if (!wallet) {
            return res.render('user/walletPage', {
                user: req.session.User,
                wallet: { balance: 0 },
                transactions: [],
                currentPage: page,
                totalPages: Math.ceil(totalTransactions / limit)
            });
        }

        res.render('user/walletPage', {
            user: req.session.User,
            wallet,
            transactions,
            currentPage: page,
            totalPages: Math.ceil(totalTransactions / limit)
        });
    } catch (error) {
        console.error('Error fetching wallet details:', error);
        res.status(500).send('Server error');
    }
};

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

const createOrder = async (req, res) => {
    const { amount } = req.body;

    const payment_capture = 1;
    const currency = 'INR';
    const options = {
        amount: amount * 100, 
        currency,
        receipt: shortid.generate(),
        payment_capture
    };

    try {
        const response = await razorpay.orders.create(options);
        res.json({
            id: response.id,
            currency: response.currency,
            amount: response.amount
        });
    } catch (error) {
        console.log(error);
        res.status(500).send('Server error');
    }
};

const updateBalance = async (req, res) => {
    const { payment_id, order_id, amount } = req.body;
    try {
        const payment = await razorpay.payments.fetch(payment_id);
        if (payment.status === 'captured') {
            let wallet = await Wallet.findOne({ userId: req.session.User._id });
            if (!wallet) {
                wallet = new Wallet({
                    userId: req.session.User._id,
                    balance: 0
                });
            }
            wallet.balance += parseFloat(amount);
            await wallet.save();
            const transaction = new Transaction({
                userId: req.session.User._id,
                date: new Date(),
                description: 'Added to Wallet',
                amount: parseFloat(amount),
                type: 'credit' 
            });
            await transaction.save();

            res.status(200).send('Wallet balance updated successfully!');
        } else {
            res.status(400).send('Payment not captured');
        }
    } catch (error) {
        console.log(error);
        res.status(500).send('Server error');
    }
};


module.exports = {
    getWalletPage,
    createOrder,
    updateBalance
};
