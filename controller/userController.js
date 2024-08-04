const nodemailer = require('nodemailer')
const User = require('../model/userModel')
const bcrypt = require('bcryptjs')
const Product = require('../model/productModel')
const Address = require('../model/addressModel');
const Cart = require('../model/cartModel')
const Wallet = require('../model/walletModel')

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD
    }
});

const homePage = async (req, res) => {
    try {
        const user = req.session.User
        const product = await Product.find({}).sort({ createdAt: -1 }).limit(6);
        res.render('user/home', { user, product })
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'internal server error' })
    }
}

const loginPage = (req, res) => {
    try {
        res.render('user/login')
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'internal server error' })
    }
}

const signUp = (req, res) => {
    try {
        res.render('user/signup')
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'internal server error' })
    }
}

const submitSignup = (req, res) => {
    try {
        req.session.User = req.body
        const email = req.body.email;
        const otp = Math.floor(100000 + Math.random() * 900000);
        req.session.otp = otp;
        setTimeout(() => {
            req.session.otp = null
        }, 30000);
        console.log('new otp', otp)
        const mailOptions = {
            from: process.env.EMAIL,
            to: email,
            subject: 'Your OTP Code',
            text: `Your OTP code is ${otp}`
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                return res.status(500).send(error.toString());
            }
            req.session.email = email;

            return res.render('user/otp', { email })
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'internal server error' })
    }
}

const verifyOtp = async (req, res) => {
    try {
        const { otp } = req.body;
        const { username, email, password } = req.session.User

        if (parseInt(otp) === req.session.otp) {

            const userData = new User({
                username: username,
                email: email,
                password: password
            })
            await userData.save()
            const userInfo = await User.findOne({ email: req.session.User.email })
            if (userInfo) {
                req.session.User = userInfo
                const userCart = new Cart({
                    userId: req.session.User._id,
                    cartItems: [],
                    totalPrice: 0
                })
                userCart.save()

                const userAddress = new Address({
                    userId: req.session.User._id,
                    address: []
                })
                userAddress.save()

                const wallet = new Wallet({
                    userId:  req.session.User._id,
                    balance: 0
                });
                wallet.save();
                return res.status(200).redirect('/')
            }
        } else {
            return res.render('user/otp', { message: 'invalid otp', email })
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'internal server error' })
    }
}

const resendOtp = async (req, res) => {
    try {
        const email = req.session.User.email
        console.log(email);
        const otp = Math.floor(100000 + Math.random() * 900000);
        req.session.otp = otp;
        setTimeout(() => {
            req.session.otp = null
        }, 30000)
        console.log('resend otp', otp)
        const mailOptions = {
            from: process.env.EMAIL,
            to: email,
            subject: 'Resend otp',
            text: `Your OTP code is ${otp}`
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                return res.status(500).send(error.toString());
            }
            req.session.email = email;

            return res.render('user/otp', { email })
        });
    } catch (error) {
        console.log(error);
    }
}

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const userData = await User.findOne({ email });

        if (!userData) {
            return res.render('user/login', { message: 'This user does not exist.' });
        }

        if (userData.isBlock) {
            return res.render('user/login', { message: 'You are temporarily blocked.' });
        }

        const isVal = await bcrypt.compare(password, userData.password);
        if (!isVal) {
            return res.render('user/login', { message: 'Email or password incorrect.' });
        }

        req.session.User = userData;
        const user = req.session.User;
        const product = await Product.find({}).sort({ createdAt: -1 }).limit(6);
        return res.render('user/home', { user, product });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error.' });
    }
};


const logOut = async (req, res) => {
    try {
        req.session.User = null
        return res.redirect('/')
    } catch (error) {
        console.log(error);
    }
}

const checkEmail = async (req, res) => {
    try {
        const { email } = req.body
        const existEmail = await User.findOne({ email: email })
        if (existEmail) {
            return res.json({ success: true, message: 'email already had taken' })
        }
    } catch (error) {
        console.log(error);
    }
}


const userProfile = async (req, res) => {
    try {
        const user_id = req.session.User._id;
        const user = await User.findById(user_id);
        if (!user) {
            throw new Error('User not found');
        }
        const addresses = await Address.findOne({ userId: user_id });
        res.render('user/userProfile', { user, addresses: addresses || { address: [] } });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const editProfile = async (req, res) => {
    try {
        const user_id = req.session.User._id;
        const user = await User.findById(user_id);

        res.render('user/editProfile', { user })
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Internal server error' });
    }
}


const updateProfile = async (req, res) => {
    try {
        const { username, email } = req.body;
        const errors = {};

        if (!username || username.trim() === '') {
            errors.username = 'Username is required.';
        } else if (username.includes('_')) {
            errors.username = 'Username should not contain underscores.';
        } else if (/^\d+$/.test(username)) {
            errors.username = 'Username should not be entirely numeric.';
        }

        if (!email || email.trim() === '') {
            errors.email = 'Email is required.';
        } else {
            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailPattern.test(email)) {
                errors.email = 'Please enter a valid email address.';
            }
        }

        if (Object.keys(errors).length > 0) {
            return res.status(400).render('editProfile', { user: req.user, errors });
        }


        const userId = req.session.User._id
        await User.updateOne({ _id: userId }, { $set: { username, email } });
        const user = await User.findOne({ _id: userId })
        return res.redirect('/userProfile')
    } catch (error) {
        console.log(error);
    }
}

const changePassword = async (req, res) => {
    try {
        const user_id = req.session.User._id;
        const user = await User.findById(user_id);
        const message = ''
        res.render('user/changePassword', { user, message })
    } catch (error) {

    }
}

const updatePassword = async (req, res) => {
    try {
        const userId = req.session.User._id
        const { currentPassword, newPassword } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            res.render('user/changePassword', { user, message: 'User not found' })
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            res.render('user/changePassword', { user, message: 'Current password is incorrect.' })
        } else {
            user.password = newPassword;
            await user.save();

            res.redirect('/userProfile');
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error.' });
    }
};



module.exports = {
    homePage,
    loginPage,
    signUp,
    submitSignup,
    verifyOtp,
    login,
    resendOtp,
    logOut,
    checkEmail,
    userProfile,
    editProfile,
    updateProfile,
    changePassword,
    updatePassword
};