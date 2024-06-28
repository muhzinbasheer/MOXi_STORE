const express = require('express')
require('dotenv').config()
const app = express()
const port = process.env.PORT
const user_router = require('./routes/userRouter')
const session = require('express-session')
const mongoDb=require('./confiq/mongodb')
const admin_Router = require('./routes/adminRouter')
const nocache = require('nocache')

app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
  }))

app.use(nocache())
app.use(express.urlencoded({extended:true}))
app.use(express.json())


app.set('view engine','ejs')
app.use('/assets',express.static('public/assets'))
app.use('/admin-assets',express.static('public/admin-assets'))
app.use(express.static('uploads'))

app.use('/',user_router)
app.use('/admin',admin_Router)


app.listen(port,()=>{
    console.log(`server is running http://localhost:${port}`);
})
