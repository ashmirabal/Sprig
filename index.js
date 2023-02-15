const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

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

//So you don't have to add .ejs to the routes
app.set("view engine", "ejs");

app.use(express.static(__dirname + '/public'));

// The Logger
const logger = require('morgan');
// Tell the app to use the logger
app.use(logger('dev'));

// Root Route
app.get('/', (req,res) =>{
  res.redirect('landingPage')
});

// Landing Page Route
app.get('/landingPage', (req,res) =>{
  res.render("landingPage")
});

// Sign Up Route
app.get('/signup', (req,res) =>{
  res.render("signup")
});

// Home Route
app.get('/home', (req, res)=>{
  res.render('home')
});

// POST To The Bulletin Board on the HomePage 
//The Create
app.post("/home", (req, res)=>{
  let thePost = new Post({
      title: req.body.title,
      description: req.body.description
      
  });
  thePost.save((error, post)=>{
      if(error){
          console.log(error);
          res.render("new.ejs", {post: thePost});
      } else {
          console.log(post);
          res.redirect(`/home/${post._id}`);
      }
  });
});

app.listen(port, () => console.log(`App listening on port ${port}`));