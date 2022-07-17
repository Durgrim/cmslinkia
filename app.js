// Dependencies
const express = require('express');
const app = express();
const handlebars = require('express-handlebars');
const passport = require("passport");
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');
const flash = require('connect-flash');
const path = require('path');
const mongoose = require('mongoose');
const User = require('./models/User');
const CryptoJS = require("crypto-js");

// Listener
const port = process.env.PORT || 8080;
app.listen(port, ()=>{
    console.log(`Listening port: ${port}`);
});

// Handlebars engine
app.engine('handlebars', handlebars.engine({defaultLayout: 'home'}));
app.set('view engine', 'handlebars');
app.set("views", "./views");

// Static definition
app.use(express.static(path.join(__dirname, 'public')));

// Body parser
app.use(express.json());
app.use(express.urlencoded({extended: true}));

// Sessions 
app.use(session({
    secret: 'random',
    resave: true,
    saveUninitialized: true
}));

// Flash messages
app.use(flash());
app.use((req, res, next)=>{
    res.locals.session = req.session;
    res.locals.errorMessage = req.flash('errorMessage');
    res.locals.successMessage = req.flash('successMessage');
    res.locals.error = req.flash('error');
    res.locals.success = req.flash('success');
    next();
});

// Passport sessions
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy({usernameField: 'email'}, (email, password, done)=>{
    User.findOne({email: email}).then(user=>{
        password = CryptoJS.SHA3(password).toString();
        if(!user) return done(null, false, {message: 'No hay registrado un usuario con ese email'});
        if(user.password === password){
            return done(null, user, {message : `Bienvenido ${user.email}`});
        } else {
            return done(null, false, {message: 'Contraseña incorrecta'});
        };
    });
}));

passport.serializeUser((user, done) => {
    done(null, user);
  });

passport.deserializeUser((user, done) => {
    done (null, user )
});

// Authentication
checkAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    req.flash('error', `Por favor, inicia sesión`);
    res.redirect("/login");
  }


// Routes
const main = require('./routes/routeMain');
const admin = require('./routes/routeAdmin');
app.use('/', main);
app.use('/admin', admin);

// Schemas
mongoose.Promise = global.Promise;

// DDBB connection // Check address for deployment
mongoose.connect("mongodb+srv://user:address/?retryWrites=true&w=majority", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    authSource:"admin",
    ssl: true,
}, (err) => {
    if (err) {
        console.log(err);
    } else {
        console.log("Successful");
    }
});

var MongoStore = require('connect-mongo');
app.use(session({
    secret: 'foo',
    store: MongoStore.create({ mongoUrl: "mongodb+srv://user:address/?retryWrites=true&w=majority"})
}));

// DDBB connected
mongoose.connection.on('connected', () => {  
    console.log('Database connected');
}); 
// DDBB Error on the connection
mongoose.connection.on('error', (err) => {  
    console.log('Database connection error');
}); 
  // DDBB Connection disconnected
mongoose.connection.on('disconnected', function () {  
    console.log('Database connection disconnected'); 
});