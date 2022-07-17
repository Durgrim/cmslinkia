// Dependencies
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Post = require('../models/Post');
const CryptoJS = require("crypto-js");
const passport = require("passport");
var LocalStrategy = require('passport-local').Strategy;

router.all('/*', (req, res, next)=>{
    req.app.locals.layout = 'home';
    next();
});

// Index / posts routes
router.get('/', (req,res)=>{
    Post.find({visibility : 'publico'}).sort({"datetime" : "descending"}).lean().then(posts=>{
        res.render('./home/index', {posts: posts, helpers: {
            date: function (datetime) {
                datetime = parseInt(datetime);
                const monthList = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
                const date = new Date(datetime / 1);
                const year = date.getFullYear();
                const month = monthList[date.getMonth()];
                const day = date.getDate();
                return `${day} de ${month} de ${year}`;
            },
        }});
    });

});

router.get('/posts/:id', (req, res)=>{   
    Post.findOne({visibility : 'publico', _id: req.params.id}).lean().then(singlePost=> {
        // Exceptions handling (GET id exist, but result not public)
        if(!singlePost){
            let errors = [] 
            errors.push({message : `No existe - o no es publico - el post seleccionado.`});
            res.render('./home/posts',  {errors: errors});
        } else {
            res.render('./home/posts', {singlePost: singlePost, helpers: {        
                date: function (datetime) {
                    datetime = parseInt(datetime);
                    const monthList = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
                    const date = new Date(datetime / 1);
                    const year = date.getFullYear();
                    const month = monthList[date.getMonth()];
                    const day = date.getDate();
                    return `${day} de ${month} de ${year}`;
            }
        }});
    // Exceptions handling (GET id not existing)
    }}).catch(err=>res.render('./home/posts', {errorMessage: `No existe - o no es publico - el post seleccionado.`}));
});

// About routes
router.get('/about', (req, res)=>{
    res.render('./home/about');
});

// Login route
router.get('/login', (req, res, next)=>{
    res.render('./home/login');
});

router.post('/login', (req, res, next)=>{
    passport.authenticate('local', {
        successRedirect: '/admin',
        successFlash: true, 
        failureRedirect: '/login',
        failureFlash: true,
    })(req, res, next);
});

// User creation routes
router.get('/createUser', (req, res)=>{
    res.render('./home/createUser');
});

router.post('/createUser', (req, res)=>{
    // Server error handling
    let errors = [];
    if(!req.body.firstName || req.body.firstName.length < 4) {errors.push({message: 'Por favor, introduce un nombre'});};
    if(!req.body.lastName || req.body.lastName.length < 4) {errors.push({message: 'Por favor, introduce apellidos'});};
    if(!req.body.email) {errors.push({message: 'Por favor, introduce un email valido'});};
    if (req.body.password !== req.body.confirmPassword) {errors.push({message: 'Las contraseñas no coinciden.'});};
    if(errors.length > 0){
        res.render('./home/createUser', {errors: errors});
    } else {
        User.findOne({email: req.body.email}).then(user=>{
            if(user){
                errors.push({message: 'Ya existe un usuario con ese email.'});
                res.render('./home/createUser', {errors: errors});
            } else {
                // Hash password SHA3
                var hash = CryptoJS.SHA3(req.body.password);
                // Add user
                const newUser = new User({
                    firstName: req.body.firstName,
                    lastName: req.body.lastName,
                    email: req.body.email,
                    password : req.body.password,
                    password: hash.toString(),
                    });
                // Send the request
                newUser.save().then(savedUser=>{
                    req.flash('successMessage', `El usuario ${savedUser.firstName} ${savedUser.lastName} se ha creado con éxito`);
                    res.redirect('./login');
                }).catch(err=>res.send('Usuario no creado. Motivo: ' + err.message));
            };
        });
    };
});

// Export router
module.exports = router;