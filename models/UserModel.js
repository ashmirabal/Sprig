const mongoose = require('mongoose');
//Validator for email address
const validator = require('validator');
// the unique validator will check for duplicate database entries
// and report them just like any other validation error
const uniqueValidator = require('mongoose-unique-validator');
const passportLocalMongoose = require('passport-local-mongoose')

//user Schema
let UserSchema = new mongoose.Schema({
    fname:{
        type: String,
        required: [true, "Please enter your first name"],
        minLength: 3
    },
    lname:{
        type: String,
        required: [true, "Please enter your last name"],
        minLength: 3
    },
    username:{
        type: String,
        unique: [true, "This username is already taken"],
        required: [true, "Please enter a username"],
        minLength: [8, "your username must be at least 8 characters long"]
    },
    email:{
        type: String,
        lowercase: true,
        unique: [true, "this email address has already been used."],
        required: [true, "Please enter your email address"],
        validate: [validator.isEmail, "Please enter a valid email address."]
    },
    age:{
        type: Number,
        min: [18, "You are not old enough. Please come back when you are 18"],
        required: [true, "Please enter your age."]
    },
    city:{
        type: String
    },
    state:{
        type: String
    },
    password:{
        type: String,
        minLength: [4, "your password must be at least 4 characters long"]
    },
    dateCreated:{
        type: Date,
        default: Date.now
    }
})

//apply validator to userSchema
UserSchema.plugin(uniqueValidator);
UserSchema.plugin(passportLocalMongoose);


module.exports = mongoose.model('User', UserSchema);