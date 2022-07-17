const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema ({
    firstName: {
        type: String,
        required: [true, 'Por favor introduce tu nombre'],
        minlength: 4,
        trim: true,
    },
    lastName: {
        type: String,
        required: [true, 'Por favor introduce tus apellidos'],
        minlength: 4,
        trim: true,
    },
    email: {
        type: String,
        match: [
          /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
          'Por favor introduce una dirección de correo válida.',
        ],
        required: [true, 'Por favor introduce una dirección de correo.'],
        unique: true,
        minlength: 5,
        lowercase: true,
      }, 
    password: {
        type: String,
        minlength: 6,
        required: true,
    }
});

module.exports = mongoose.model('users', UserSchema);