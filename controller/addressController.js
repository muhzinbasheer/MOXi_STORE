const Address = require('../model/addressModel')
const mongoose = require('mongoose');


const addressPage = async(req, res) => {
    try {
        const userId = req.session.User._id
        const address = await Address.findOne({userId})
        return res.render('user/addressPage',{address,user:req.session.User})
    } catch (error) {
        console.log(error);
        return res.status(500).send("Internal Server Error");
    }
}

const addAddress = async (req,res) => {
    try {
        res.render('user/addAddress',{user:req.session.User})
    } catch (error) {
        console.log(error);
        return res.status(500).send("Internal Server Error");
    }
}

const submitAddAddress = async (req, res) => {
    try {
        const { houseName, street, state, pincode } = req.body;
        const userId = req.session.User._id; 
        
        const address = {
            houseName: houseName,
            street: street,
            state: state,
            Pincode: pincode    
        };

        const isExisting = await Address.findOne({ userId });
        if (isExisting) {
            await Address.updateOne({ userId }, { $push: { address } });
        } else {
            const newAddress = new Address({
                userId: userId,
                address: [address]
            });
            await newAddress.save();
        }

        return res.redirect('/addressPage');
    } catch (error) {
        console.log(error);
        return res.render('user/addAddress',{message: 'an error occured',user:req.session.User._id})
    }
};


const getEditAddress = async (req, res) => {
    try {
        const userId = req.session.User._id;
        const addressId = req.query.addressId;


        const userAddresses = await Address.findOne({ userId });
        if (!userAddresses) {
            return res.status(404).send("Address not found");
        }

        const address = userAddresses.address.id(addressId);
        if (!address) {
            return res.status(404).send("Address not found");
        }

        res.render('user/editAddress', { address, user: req.user });
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
};

const updateAddress = async (req, res) => {
    try {
        const { houseName, street, state, pincode } = req.body;
        const addressId = req.body.addressId;
        const updatedAddress = {
            'address.$.houseName': houseName,
            'address.$.street': street,
            'address.$.state': state,
            'address.$.Pincode': pincode
        };

        await Address.updateOne({ 'address._id': addressId }, { $set: updatedAddress });
        res.redirect('/addressPage');
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
};

const deleteAddress = async (req, res) => {
    try {
        const userId = req.session.User._id;
        const addressId = req.params.addressId;

        const userAddresses = await Address.findOne({ userId });
        if (!userAddresses) {
            return res.status(404).send("Address not found");
        }

        const address = userAddresses.address.id(addressId);
        if (!address) {
            return res.status(404).send("Address not found");
        }

        userAddresses.address.pull({ _id: addressId });
        await userAddresses.save();

        res.redirect('/addressPage');

    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
};


module.exports = {
    addressPage,
    addAddress,
    submitAddAddress,
    getEditAddress,
    updateAddress,
    deleteAddress
}