const mongoose = require("mongoose");

// const date = new Date();
// const currentDate = date.toLocaleDateString();

const postSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    // Cloudinary requires you to put both the imagePost and the Id to work.
    imagePost: {
        type: String
    },
    cloudinary_id: {
        type: String
    },
    description: {
        type: String,
        required: true
    },
    date: {
        type: String,
        required: true
    },
    category:{
        type: String,
        
    }

  
});

module.exports = mongoose.model("Post", postSchema);