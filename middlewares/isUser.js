const User = require('../model/userModel');
const Address = require('../model/addressModel');

const isUser = async (req, res, next) => {
    try {
        if (req.session.User) {
            const userId = req.session.User._id;

            const user = await User.findOne({ _id: userId });
            if (!user) {
                console.log('User not found');
                return res.redirect('/login');
            }

            if (user.isBlock === false) {
                next();
            } else {
                res.render('user/login', { message: "You are temporarily blocked" });
            }
        } else {
            res.redirect('/login');
        }
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
};

const userAuth = (req, res, next) => {
    try {
        if (req.session.User) {
            res.redirect('/');
        } else {
            next();
        }
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
};

module.exports = {
    isUser,
    userAuth
};
