const mongoose = require("mongoose");

// const date = new Date();
// const currentDate = date.toLocaleDateString();

const postSchema = new mongoose.Schema({
    postedBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
      },
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
        
    },
    // Making comment relation with post
    comments: [{
        type: mongoose.Schema.ObjectId,
        ref: "Comment"
    }]

  
});

module.exports = mongoose.model("Post", postSchema);