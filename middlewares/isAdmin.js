const isAdminAuth = (req, res, next) => {
    try {
        if (req.session.admin) {
            return res.redirect('/admin/home')
        } else {
            next()
        }
    } catch (error) {
        console.log(error);
    }
}

const isAdmin = (req, res, next) => {
    try {
        if (req.session.admin) {
            next()
        } else {
            res.redirect('/admin')
        }
    } catch (error) {
        console.log(error);
    }
}


module.exports = {
    isAdminAuth,
    isAdmin
}