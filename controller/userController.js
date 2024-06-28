const nodemailer = require('nodemailer')
const User = require('../model/userModel')
const bcrypt = require('bcryptjs')
const Product = require('../model/productModel')

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
        const product = await Product.find({}).sort({createdAt:-1}).limit(6);
        res.render('user/home', { user,product })
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
            console.log(req.session.otp);
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
            const userInfo = await userData.save()
            return res.status(200).redirect('/')
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
        const email = req.body.email
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
            ;
            return res.render('user/otp', { email })
        });
    } catch (error) {
        console.log(error);
    }
}

const login = async (req, res) => {
    try {
        const { email, password } = req.body
        const userData = await User.findOne({ email: email })
        if(userData.isBlock==false){
            req.session.User = userData
        if (userData) {
            const isVal = await bcrypt.compare(password, userData.password);
            console.log(isVal);

            if (isVal) {
                const user = req.session.User
                const product = await Product.find({}).sort({createdAt:-1}).limit(6)
                res.render('user/home',{user,product})
            } else {
                res.render('user/login', { message: 'email or password incorrect' })
            }
        } else {
            res.render('user/login', { message: 'this user not exist' })
        }
      }else{
        res.render('user/login',{message: "you are temporarly blocked"})
      }
        
    } catch (error) {
        console.log(error);
    }
}




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

module.exports = {
    homePage,
    loginPage,
    signUp,
    submitSignup,
    verifyOtp,
    login,
    resendOtp,
    logOut,
    checkEmail
};