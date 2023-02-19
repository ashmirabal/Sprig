require('dotenv').config();
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

//Connect to database
const mongoose = require('mongoose');
mongoose.set('strictQuery', false);
const {DB,URI,ROUTE} = process.env
//URL to connect to DB
let url = `${URI}/${DB}${ROUTE}`;
//options needed to .connect
let options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
};
//connection
mongoose.connect(url, options)
  .then(()=>console.log(`connected to ${DB} database`))
  .catch(error=>console.log(`error connecting to ${DB} database. Error: ${error}`))

//So you don't have to add .ejs to the routes
app.set("view engine", "ejs");

app.use(express.static(__dirname + '/public'));

//access body parser
app.use(express.json())
app.use(express.urlencoded({extended: false}))

// The Logger
const logger = require('morgan');
// Tell the app to use the logger
app.use(logger('dev'));

//user Schema
const {UserModel} = require('./models/UserModel')

app.get('/', (req,res) =>{
  res.redirect('landingPage')
})

app.get('/landingPage', (req,res) =>{
  res.render("landingPage")
})

app.get('/signup', (req,res) =>{
  res.render("signup")
})

app.get('/about', (req,res) =>{
  res.render("about")
})

//create new user in db
app.post('/signup', (req,res)=>{
  let {fname, lname, username, email, age, city, state, password} = req.body
// Build user object
  let user = {
    fname,
    lname,
    username,
    email,
    age,
    city,
    state,
    password
  }

  console.log(user)
  UserModel.create(user, (err, result)=>{
    if(err) res.redirect("/")
    else res.redirect('/signup')
  }
  )
})

app.listen(port, () => console.log(`App listening on port ${port}`));