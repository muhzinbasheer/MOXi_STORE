const Coupon = require('../model/couponModel');
const Order = require('../model/orderModel');

const coupons = async (req, res) => { 
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10; 
        const skip = (page - 1) * limit;
        
        const coupons = await Coupon.find().skip(skip).limit(limit);
        const totalCoupons = await Coupon.countDocuments(); 

        res.render('admin/couponMgt', { 
            coupons, 
            currentPage: page, 
            totalPages: Math.ceil(totalCoupons / limit),
            limit
        });
    } catch (error) {
        res.status(500).send('Server Error');
    }
}



const createCoupon = async (req, res) => {
    const { code, discount, expirationDate } = req.body;
    try {
        const newCoupon = new Coupon({
            code,
            discount,
            expirationDate
        });
        await newCoupon.save();
        res.json({ success: true, message: 'Coupon created successfully' })
    } catch (error) {
        if (error.code === 11000) {
            res.json({ success: false, message: 'Coupon code already exists' });
        } else {
            res.json({ success: false, message: 'Failed to create coupon' });
        }
    }
}


const deleteCoupon = async (req, res) => {
    const { couponId } = req.body;
    try {
        await Coupon.findByIdAndDelete(couponId);
        res.json({ success: true, message: 'Coupon deleted successfully' })
    } catch (error) {
        res.json({ success: false, message: 'Failed to delete coupon' });
    }
}


const applyCoupon = async (req, res) => {
    const { coupon } = req.body;
    const userId = req.session.User._id;

    try {
        const couponData = await Coupon.findOne({ code: coupon });
        if (!couponData) {
            return res.json({ success: false, message: 'Invalid coupon code.' });
        }

        if (req.session.checkoutData && req.session.checkoutData.coupon) {
            return res.json({ success: false, message: 'A coupon is already applied. Remove it to apply a new one.' });
        }

        if (couponData.users.includes(userId)) {
            return res.json({ success: false, message: 'Coupon already used.' });
        }

        const checkoutData = req.session.checkoutData || {};
        const originalTotalPrice = checkoutData.originalTotalPrice || checkoutData.totalPrice || 0;

        if (originalTotalPrice === 0) {
            return res.json({ success: false, message: 'No items in checkout.' });
        }

        const discountAmount = (originalTotalPrice * couponData.discount) / 100;
        checkoutData.discountAmount= discountAmount;
        checkoutData.totalPrice = originalTotalPrice - discountAmount;
        checkoutData.originalTotalPrice = originalTotalPrice;
        checkoutData.coupon = couponData.code;  
        req.session.checkoutData = checkoutData;

        couponData.users.push(userId);
        await couponData.save();

        res.json({ success: true, checkoutData });
    } catch (error) {
        console.error('Error applying coupon:', error);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};


const removeCoupon = async (req, res) => {
    const userId = req.session.User._id;

    try {
        const checkoutData = req.session.checkoutData || {};

        if (!checkoutData.coupon) {
            return res.json({ success: false, message: 'No coupon applied.' });
        }

        const couponData = await Coupon.findOne({ code: checkoutData.coupon });
        if (!couponData) {
            return res.json({ success: false, message: 'Invalid coupon.' });
        }

        const originalTotalPrice = checkoutData.originalTotalPrice || checkoutData.totalPrice || 0;

        checkoutData.totalPrice = originalTotalPrice;
        checkoutData.coupon = null;
        req.session.checkoutData = checkoutData;

        couponData.users = couponData.users.filter(user => !user.equals(userId));
        await couponData.save();

        res.json({ success: true, checkoutData });
    } catch (error) {
        console.error('Error removing coupon:', error);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};


module.exports = {
    coupons,
    createCoupon,
    deleteCoupon,
    applyCoupon,
    removeCoupon
};