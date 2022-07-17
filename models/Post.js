const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PostsSchema = new Schema ({
    // user
    title: {
        type: String,
        required: [true, 'Por favor, introduce un titulo'],
    },
    content: {
        type: String,
        required: true,
    }, 
    datetime: {
        type: String,
        required: true,
    },
    visibility:{
        type: String,
        default: 'Público',
    },
    user: {
        type: String,
        default: 'Administrador',
    }
});

module.exports = mongoose.model('posts', PostsSchema);