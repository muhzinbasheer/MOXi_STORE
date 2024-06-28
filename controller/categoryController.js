const Category = require('../model/categoryModel')

const categoryPage = async (req, res) => {
    try {
        const category = await Category.find()
        res.render('admin/categories',{category})
    } catch (error) {
        console.log(error.message);
    }
}

const addCategory = async (req, res) => {
    try {
        res.render('admin/addCategory')
    } catch (error) {
        console.log(error.message);
    }
}

const submitAddCategory = async (req, res) => {
    try {
        const { category_name, description } = req.body
        const isExisting = await Category.findOne({ name: category_name })
        if (isExisting) {
            return res.render('admin/addCategory', { message: 'category already exists' })
        }
        const newCategory = new Category({
            name: category_name,
            description: description
        })
        if (newCategory) {
            newCategory.save()
            return res.redirect('/admin/categories')
        }else{
            return res.render('admin/addCategory', { message: 'something went wrong' })
        }
    } catch (error) {
        console.log(error);
    }
}


const listCategory = async (req,res) => {
    try {
        const categoryId = req.body.categoryId
        const isList = await Category.findByIdAndUpdate(categoryId,{
            isBlock:false
        })
        if(isList){
            return res.status(200).json({success:true,message:'category listed'})
        }else{
            return res.json({success:false,message:'something went wrong'})
        }
    } catch (error) {
        console.log(error);
    }
}

const unlistCategory = async (req,res) => {
    try {
        const categoryId = req.body.categoryId
        const isUnlist = await Category.findByIdAndUpdate(categoryId,{
            isBlock:true
        })
        if(isUnlist){
            return res.status(200).json({success:true,message:'category unlisted'})
        }else{
            return res.json({success:false,message:'something went wrong'})
        }
    } catch (error) {
        console.log(error);
    }
}
const editCategoryPage = async(req,res)=>{
    try {
        const categoryData=await Category.find({_id:req.query.id})
        res.render('admin/editCategory',{category:categoryData})
    } catch (error) {
        console.log(error);
    }
}

const submitEditCategory = async (req, res) => {
    try {
        const {name, description } = req.body;
        console.log(name);
        const category_id = req.query.id
        const category = await Category.find()
        const updatedCategory = await Category.findByIdAndUpdate(
            category_id,
            {
                name: name,
                description: description
            },{new:true}
        );
        if (updatedCategory) {
            return res.redirect('/admin/categories');
        } else {
            return res.render('admin/editCategory', { message: 'Category not found', category: [req.body] });
        }
    } catch (error) {
        console.log(error);
        return res.render('admin/editCategory', { message: 'Something went wrong', category: [req.body] });
    }
};


module.exports = {
    categoryPage,
    addCategory,
    submitAddCategory,
    listCategory,
    unlistCategory,
    editCategoryPage,
    submitEditCategory
}

