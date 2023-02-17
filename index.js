require('dotenv').config();
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

//Requiring post.js in the models folder
const Post = require("./models/post")

// // multer image upload stuff
// const path = require('path');
// const multer = require('multer');
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//    // The Null is where we need to add in error handling.
//     cb(null, 'FakeImageDB')
//   },
//   filename: (req, file, cb) => {
//     console.log(file);
//     cb(null, Date.now() + path.extname(file.originalname))
//   }
// })
// // Multer Upload MiddleWare
// const upload = multer({storage: storage})

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
app.use(express.urlencoded({extended: true}))

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
});

// Sign Up Route
app.get('/signup', (req,res) =>{
  res.render("signup")
});

// Home Route
app.get('/home', (req, res)=>{

 //Read from the posts collection 
// Display using the data coming from the posts
  const posts = [{
    
    title: "Big Green Plant",
    description: "The plant is big and green."
}]
  res.render('home', {posts})
});

// New.ejs route where the the new post form is. 
app.get("/home/new", (req, res)=>{
  let post = {title:"",
              description:""}
  res.render("new", {post: post});
})

// The Show-Post Route
app.get("/home/:id", (req, res)=>{
  res.send("It works!") ;
})




// POST To The Bulletin Board on the HomePage 
//The Create
app.post("/home", (req, res)=>{
  const date = new Date();
  const currentDate = date.toLocaleDateString();

  let thePost = new Post({
      title: req.body.title,
      description: req.body.description,
      date: currentDate
  });
  thePost.save((error, post)=>{
      if(error){
          console.log(error);
          res.render("new", {post: thePost});
      } else {
          console.log(post);
          res.redirect(`/home/${post._id}`);
      }
  });
});

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
    else res.redirect('/home')
  }
  )
})

app.listen(port, () => console.log(`App listening on port ${port}`));