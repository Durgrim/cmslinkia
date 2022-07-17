// Dependencies
const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const User = require('../models/User');
const CryptoJS = require("crypto-js");
const passport = require("passport");
const session = require('express-session');

// Admin route
router.all('/*', (req, res, next)=>{
    req.app.locals.layout = 'admin';
    next();
});

router.get('/', checkAuthenticated, (req, res)=>{
    res.render('./admin/index');
});

// Show posts
router.get('/showPosts', checkAuthenticated, (req, res)=>{
    // If user = admin show all posts
    if(req.session.passport.user.email == "admin@admin.com"){
        Post.find({}).sort({"datetime" : "descending"}).lean().then(posts=>{
            res.render('./admin/showPosts', {posts: posts, helpers: {
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
    });
    }else{
        Post.find({user: req.session.passport.user.firstName + " " + req.session.passport.user.lastName}).sort({"datetime" : "descending"}).lean().then(posts=>{
            res.render('./admin/showPosts', {posts: posts, helpers: {
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
    });
}});

// Create posts
router.get('/createPost', checkAuthenticated, (req, res)=>{
    res.render('./admin/createPost');
});

router.post('/createPost', checkAuthenticated,(req, res)=>{
    // Server error handling
    let errors = [];
    if(!req.body.title) {errors.push({message: 'Por favor, introduce un titulo'});};
    if(!req.body.content) {errors.push({message: 'Por favor, introduce contenido'});};
    if(!req.body.visibility) {errors.push({message: 'Por favor, incluye parametro de visibilidad'});} 
    else if(!(req.body.visibility == 'publico' || req.body.visibility == 'privado')){errors.push({message: 'Por favor, selecciona una visibilidad correcta'});};
    if(errors.length > 0){
        res.render('./admin/createPost', {
            errors: errors
        });
    } else {
        const newPost = new Post({
            title: req.body.title,
            content: req.body.content,
            datetime: new Date().getTime(),
            visibility : req.body.visibility,
            user : req.session.passport.user.firstName + " " + req.session.passport.user.lastName,
            });
        // Post saving and sending petition
        newPost.save().then(savedPost=>{
            req.flash('successMessage', `El post ${savedPost.title} se ha creado con éxito`);
            res.redirect('/admin/showPosts');
        }) // Exception handling
        .catch(err=>console.log("Error al crear el usuario. Error: " + err.message));
    };
});

// Edit posts
router.get('/editPosts/:id', checkAuthenticated, (req, res)=>{
    // If user = admin, can edit all posts
    if(req.session.passport.user.email == "admin@admin.com"){
        Post.findOne({_id: req.params.id}).lean().then(selectedPost=> {
            res.render('./admin/editPost', {singlePost: selectedPost, helpers: {
                selected: function (value, options) {
                    return options.fn(this).replace(new RegExp(' value=\"'+ value + '\"'), '$&selected="selected"');
                }
            }})
        // Exceptions handling (GET search and id not existing)
        }).catch(err=>res.status(404).send("Error al editar. No existe ningun post con ese ID"));
    } else{
    Post.findOne({user: req.session.passport.user.firstName + " " + req.session.passport.user.lastName,_id: req.params.id}).lean().then(selectedPost=> {
        res.render('./admin/editPost', {singlePost: selectedPost, helpers: {
            selected: function (value, options) {
                return options.fn(this).replace(new RegExp(' value=\"'+ value + '\"'), '$&selected="selected"');
            }
        }})
    // Exceptions handling (GET search and id not existing)
    }).catch(err=>res.status(404).send("Error al editar. No existe ningun post con ese ID"));
}});

router.post('/editPosts/:id', checkAuthenticated, (req, res)=>{ // PUT request method doesn't work corrctly due express
    // Server error handling 
    let errors = [];
    if(!req.body.title) {errors.push({message: 'Por favor, introduce un titulo'});};
    if(!req.body.content) {errors.push({message: 'Por favor, introduce contenido'});};
    if(!req.body.visibility) {errors.push({message: 'Por favor, incluye parametro de visibilidad'});} 
    else if(!(req.body.visibility == 'publico' || req.body.visibility == 'privado')){errors.push({message: 'Por favor, selecciona una visibilidad correcta'});};
    if(errors.length > 0){
        res.render('/editPosts/:id', {
            errors: errors
        })
    } else if (req.session.passport.user.email == "admin@admin.com") {
        Post.findOneAndUpdate({_id: req.params.id}, {
            title: req.body.title, 
            content: req.body.content, 
            datetime: req.body.datetime, 
            visibility: req.body.visibility,
        }, {new: true})
       .then(modifiedPost=>{
            req.flash('successMessage', `El post ${modifiedPost.title} se ha editado con éxito`);
            res.redirect('/admin/showPosts');
        // Exception handling 
        }).catch(err=>console.log('Post no modificado. Error: ' + err.message));
    }else {
        Post.findOneAndUpdate({user : req.session.passport.user.firstName + " " + req.session.passport.user.lastName, _id: req.params.id}, {
            title: req.body.title, 
            content: req.body.content, 
            datetime: req.body.datetime, 
            visibility: req.body.visibility,
        }, {new: true})
    .then(modifiedPost=>{
            req.flash('successMessage', `El post ${modifiedPost.title} se ha editado con éxito`);
            res.redirect('/admin/showPosts');
        // Exception handling 
        }).catch(err=>console.log('Post no modificado. Error: ' + err.message));
}});

// Delete posts
router.get('/deletePosts/:id', checkAuthenticated, (req, res)=>{
    // if logged user = admin can delete any posts
    if (req.session.passport.user.email == "admin@admin.com") {
        Post.findOne({_id: req.params.id}).lean().then(post=>{
            res.render('./admin/deletePost', {singlePost: post})
        // Exceptions handling (GET search and id not existing)
        })
        .catch(err=>res.status(404).send("Error al borrar. No existe ningun post con ese ID"));
    } else {
        Post.findOne({user : req.session.passport.user.firstName + " " + req.session.passport.user.lastName,_id: req.params.id}).lean().then(post=>{
            res.render('./admin/deletePost', {singlePost: post})
        // Exceptions handling (GET search and id not existing)
        })
        .catch(err=>res.status(404).send("Error al borrar. No existe ningun post con ese ID"));
    }
});

router.post('/deletePosts/:id', checkAuthenticated, (req, res)=>{ // DELETE request method doesn't work corrctly due express
    // if logged user = admin can delete any post
    if (req.session.passport.user.email == "admin@admin.com") {
        Post.findOneAndDelete({_id: req.params.id})
        .then(deletedPost=>{
                req.flash('successMessage', `El post ${deletedPost.title} se ha borrado con éxito`);
                res.redirect('/admin/showPosts');
            })
            .catch(err=>console.log('Post no eliminado. Error: ' + err.message));
    } else{
        Post.findOneAndDelete({user : req.session.passport.user.firstName + " " + req.session.passport.user.lastName, _id: req.params.id})
    .then(deletedPost=>{
            req.flash('successMessage', `El post ${deletedPost.title} se ha borrado con éxito`);
            res.redirect('/admin/showPosts');
        })
        .catch(err=>console.log('Post no eliminado. Error: ' + err.message));
    }
});

// Select Users
router.get('/showUsers', checkAuthenticated, (req, res)=>{
    // If admin, show all users
    if (req.session.passport.user.email == "admin@admin.com") {
        User.find({}).lean().then(users=>{
            res.render('./admin/showUsers', {users: users});
        });
    } else {
        User.find({email : req.session.passport.user.email}).lean().then(users=>{
            res.render('./admin/showUsers', {users: users});
        });
    }
});

// Create user
router.get('/createUser', checkAuthenticated, (req, res)=>{
    res.render('./admin/createUser');
});


router.post('/createUser', checkAuthenticated, (req, res)=>{
    // Server error handling
    let errors = [];
    if(!req.body.firstName || req.body.firstName.length < 4) {errors.push({message: 'Por favor, introduce un nombre'});};
    if(!req.body.lastName || req.body.lastName.length < 4) {errors.push({message: 'Por favor, introduce apellidos'});};
    if(!req.body.email) {errors.push({message: 'Por favor, introduce un email valido'});};
    if (req.body.password !== req.body.confirmPassword) {errors.push({message: 'Las contraseñas no coinciden.'});};
    if(errors.length > 0){
        res.render('./admin/createUser', {errors: errors})
    } else {
        User.findOne({email: req.body.email}).then(user=>{
            if(user){
                errors.push({message: 'Ya existe un usuario con ese email.'});
                res.render('./admin/createUser', {errors: errors});
            } else {
                // Hash password SHA3
                var hash = CryptoJS.SHA3(req.body.password);
                // Add user
                const newUser = new User({
                    firstName: req.body.firstName,
                    lastName: req.body.lastName,
                    email: req.body.email,
                    password: hash.toString(),
                });
                // Send the request
                newUser.save().then(savedUser=>{
                    req.flash('successMessage', `El usuario ${savedUser.firstName} ${savedUser.lastName} se ha creado con éxito`);
                    res.redirect('./showUsers');
                }).catch(err=>res.send('Usuario no creado. Motivo: ' + err.message));
            };
        });
    };
});

// Edit user
router.get('/editUser/:id', checkAuthenticated, (req, res)=>{
    // If admin can see to edit any user
    if (req.session.passport.user.email == "admin@admin.com") {
        User.findOne({_id: req.params.id}).lean().then(selectedUser=> {
            res.render('./admin/editUser', {selectedUser: selectedUser})
        // Exceptions handling (GET search and id not existing)
        }).catch(err=>res.status(404).send("Error al editar. No existe ningun usuario con ese ID"));
    } else {
        User.findOne({email : req.session.passport.user.email, _id: req.params.id}).lean().then(selectedUser=> {
            res.render('./admin/editUser', {selectedUser: selectedUser})
        // Exceptions handling (GET search and id not existing)
        }).catch(err=>res.status(404).send("Error al editar. No existe ningun usuario con ese ID"));
    }
});

router.post('/editUser/:id', checkAuthenticated, (req, res)=>{ // PUT request method doesn't work correctly due express
    // Server error handling
    let errors = [];
    if(!req.body.firstName) {errors.push({message: 'Por favor, introduce un nombre'});};
    if(!req.body.lastName) {errors.push({message: 'Por favor, introduce apellido'});};
    if(!req.body.email) {errors.push({message: 'Por favor, incluye un email'});} 
    if(errors.length > 0){
        res.render('./admin/showUsers', {
            errors: errors
        });
    // admin cannot be modifyied
    } else if ( req.params.id == "6288a71182e5340e914b0b8b") {
        req.flash('errorMessage', `El usuario no se puede editar, ya que es el usuario administrador`);
        res.redirect('/admin/showUsers');
    // if admin can edit any user
    } else if (req.session.passport.user.email == "admin@admin.com") {
        User.findOneAndUpdate({_id: req.params.id}, {
            firstName: req.body.firstName, 
            lastName: req.body.lastName, 
            email: req.body.email,
        }, {new: true})
        .then(modifiedPost=>{
            req.flash('successMessage', `El usuario ${modifiedPost.title} se ha editado con éxito`);
            res.redirect('/admin/showUsers');
        // Exception handling
        }).catch(err=>console.log('Usuario no modificado. Error: ' + err.message));
    } else {
        User.findOneAndUpdate({email : req.session.passport.user.email, _id: req.params.id}, {
            firstName: req.body.firstName, 
            lastName: req.body.lastName, 
            email: req.body.email,
        }, {new: true})
        .then(modifiedPost=>{
            req.flash('successMessage', `El usuario ${modifiedPost.title} se ha editado con éxito`);
            res.redirect('/admin/showUsers');
        // Exception handling
        }).catch(err=>console.log('Usuario no modificado. Error: ' + err.message));
    }
   
});

// Delete users
router.get('/deleteUser/:id', checkAuthenticated, (req, res)=>{
    // if user = admin, can see to delete any user 
    if (req.session.passport.user.email == "admin@admin.com") {
        User.findOne({_id: req.params.id}).lean().then(singleUser=>{
        res.render('./admin/deleteUser', {singleUser: singleUser})
        // Exceptions handling (GET search and id not existing)
        })
        .catch(err=>res.status(404).send("Error al borrar. No existe ningun usuario con ese ID"));
    } else {
        User.findOne({email : req.session.passport.user.email, _id: req.params.id}).lean().then(singleUser=>{
        res.render('./admin/deleteUser', {singleUser: singleUser})
        // Exceptions handling (GET search and id not existing)
        })
        .catch(err=>res.status(404).send("Error al borrar. No existe ningun usuario con ese ID"));
    }
});

router.post('/deleteUser/:id', checkAuthenticated, (req, res)=>{ // DELETE request method doesn't work corrctly due express
    // admin user cannot be deleted
    if ( req.params.id == "6288a71182e5340e914b0b8b") {
        req.flash('errorMessage', `El usuario no se puede editar, ya que es el usuario administrador`);
        res.redirect('/admin/showUsers');
    }
    // active user cannot be deleted
    else if(req.session.passport.user._id == req.params.id){
        req.flash('errorMessage', `El usuario no se puede borrar, ya que es el usuario activo`);
        res.redirect('/admin/showUsers');
    }
    // admin can see delete all users
    else if (req.session.passport.user.email == "admin@admin.com") {
        User.findOneAndDelete({_id: req.params.id})
        .then(deletedUser=>{
             req.flash('successMessage', `El usuario se ha borrado con éxito`);
             res.redirect('/admin/showUsers');
         })
         .catch(err=>console.log('Usuario no eliminado. Error: ' + err.message));
    } else {
        User.findOneAndDelete({email : req.session.passport.user.email,_id: req.params.id})
        .then(deletedUser=>{
             req.flash('successMessage', `El usuario ${deletedUser.firstName} se ha borrado con éxito`);
             res.redirect('/admin/showUsers');
         })
         .catch(err=>console.log('Usuario no eliminado. Error: ' + err.message));
        }
});

// Logout
router.get('/logout', checkAuthenticated, (req, res) => {
    req.flash('successMessage', `El usuario ${req.user.email} ha cerrado sesión con éxito`);
    req.logout();
    res.redirect('/');
  });


// Export router
module.exports = router;