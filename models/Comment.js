const mongoose = require('mongoose')

// comment schema

const commentSchema = new mongoose.Schema({
  author: String,
  comment: String
})

module.exports = mongoose.model("Comment", commentSchema);