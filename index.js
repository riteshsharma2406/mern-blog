const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const User = require('./model/User');
const Post = require('./model/Post')
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser')
const multer = require('multer');
const uploadMiddleWare = multer({dest:'uploads/'});
const fs = require('fs');
const app= express();
const path = require('path')

const salt = bcrypt.genSaltSync(10);
const secret = 'ai452enk45ef4ae55c15e4rg54g5';

app.use(cors({credentials:true, origin:'http://localhost:3000'}));
app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(__dirname + '/uploads'));

//static files
app.use(express.static(path.join(__dirname,'./client/build')))
app.get('*', function(req,res){
    res.sendFile(path.join(__dirname,'./client/build/index.html'))
});

mongoose.connect('mongodb+srv://bloguser:NBqR7IlppHANs4oo@cluster0.honhdex.mongodb.net/?retryWrites=true&w=majority')


app.post('/register', async (req,res)=>{
    const {username,password} = req.body;
    try{
        const userDoc = await User.create({
            username,
            password:bcrypt.hashSync(password,salt),
        });
        res.json(userDoc);
    }catch(e){
        console.log(e);
        res.status(400).json(e);
    } 
    
});

app.post('/login',async (req,res)=>{
    const {username,password} = req.body;
    const userDoc = await User.findOne({username});
    const passOk = bcrypt.compareSync(password, userDoc.password);
    if (passOk){
        //logged in
        jwt.sign({username,id:userDoc._id}, secret, {}, (e,token)=>{
            if(e) throw r;
            res.cookie('token', token).json({
                id:userDoc._id,
                username,
            });
        });
        // res.json();
    } else {
        res.status(400).json('wrong credentials');
    }
});

app.get('/profile', (req,res) => {
    const {token} = req.cookies;
    jwt.verify(token,secret,{}, (e,info) =>{
        if(e) throw e;
        res.json(info);
    });
});

app.post('/logout', (req,res) => {
    res.cookie('token','').json('ok');
});

app.post('/post',uploadMiddleWare.single('file'), async (req,res) => {
    const {originalname,path} = req.file;
    const parts = originalname.split('.');
    const ext = parts[parts.length - 1];
    const newPath = path+'.'+ext;
    fs.renameSync(path,newPath);

    const {token} = req.cookies;
    jwt.verify(token,secret,{}, async (e,info) =>{
        if(e) throw e;
        const {title,summary,content} = req.body;
        const postDoc = await Post.create({
        title,
        summary,
        content,
        cover:newPath,
        author:info.id,
    });
        res.json(postDoc);
    });

});


app.get('/post', async (req,res)=>{
    res.json(
        await Post.find()
        .populate('author',['username'])
        .sort({createdAt: -1})
        .limit(50)
    );
});

app.get('/post/:id', async (req, res) => {
    const {id} = req.params;
    const postDoc = await Post.findById(id).populate('author', ['username']);
    res.json(postDoc);
});

app.listen(4000);
// NBqR7IlppHANs4oo
//mongodb+srv://bloguser:NBqR7IlppHANs4oo@cluster0.honhdex.mongodb.net/?retryWrites=true&w=majority