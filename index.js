require('dotenv').config();
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;


//Requiring post.js in the models folder
const Post = require("./models/Post");
const User = require('./models/UserModel');


//Requiring Method-Override so I can Update and Delete where I'm not suppose to.
const methodOverride = require("method-override")
const passport = require('passport');
const LocalStrategy = require('passport-local');
const passportLocalMongoose = require('passport-local-mongoose');


process.env.TZ = "GMT";

//Connect to database
const mongoose = require('mongoose');
mongoose.set('strictQuery', false);
const { DB, URI, ROUTE } = process.env
//URL to connect to DB
let url = `${URI}/${DB}${ROUTE}`;
//options needed to .connect
let options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
};
//connection
mongoose.connect(url, options)
  .then(() => console.log(`connected to ${DB} database`))
  .catch(error => console.log(`error connecting to ${DB} database. Error: ${error}`))


//So you don't have to add .ejs to the routes
app.set("view engine", "ejs");
// So you can see into the public folder
app.use(express.static(__dirname + '/public'));
// So you can use the MethodOverride
app.use(methodOverride("_method"));
//access body parser
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// The Logger
const logger = require('morgan');
const UserModel = require('./models/UserModel');
// Tell the app to use the logger
app.use(logger('dev'));


//user Schema

//Middleware
app.use(require('express-session')({
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: false
}))
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//function/middleware checks to see if a user is logged in and redirects to home page if so
checkLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) { 
      return res.redirect("/home")
    }
  next()
}
//function/middleware for protected routes, will not let user to protected routes if user is not logged in
checkAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) { return next() }
  res.redirect("/landingPage")
}




//Multer And Cloudinary
const imageUpload = require("./config/multer");
const cloudinary = require('./config/cloudinary');
const path = require('path');


// Root Route that redirects to the landingPage.
app.get('/', (req, res) => {
  res.redirect('landingPage')
})
//  The landingPage Route
app.get('/landingPage', (req, res) => {
  res.render("landingPage", { error: ""})
});

// Sign Up Route
app.get('/signup', (req, res) => {
  res.render("signup")
});

// About Route
app.get('/about', (req, res) => {
  res.render("about")
})

// Contact Route
app.get('/contactinfo', (req,res)=>{
  res.render("contactinfo")
})

//create new user in db
app.post('/signup', (req, res) => {
  let { fname, lname, username, email, age, city, state, password } = req.body
  // Build user object
  let user = new UserModel({
    fname,
    lname,
    username,
    email,
    age,
    city,
    state,
  })

  User.register(user, password, (err, result) => {
    if (err) {
      console.log(err)
      //You will need to fix this to give an indicator to the user why it was not successful.
      //Think back to mongodb projects when you had to drill down into the error messages.
      // You can pass it as I did here but will need to pass and empty string on /landingpage  see line 73;
      // Else you will get an ejs error
      res.render("error.ejs", { error: "Signup Not successful. Please make sure you are meeting the user requirements."})
    } else {
      passport.authenticate("local")(req, res, function(){
          res.redirect('/home');
        });
      }
    }
  )
})

// LOGIN ROUTE
app.post('/login', passport.authenticate('local',
  {
    successRedirect: '/home',
    failureRedirect: '/landingPage'
    
  }), function (req, res) {

  });


//LOGOUT ROUTE
app.get('/logout', (req,res) =>{
  req.logout(
    function(){} // need a callback fn for .logout
  );
  //when we logout, Passport destroys all user data in
  //the session. Then we redirect to the home page
  res.redirect('/landingPage')
})


// Home Route
app.get('/home',checkAuthenticated, (req, res) => {
  //Read from the posts collection 
  // Display using the data coming from the posts
  Post.find({}, (error, posts) => {
    if (error) {
      console.log(error);
    } else {
      res.render("home", { posts: posts })
    }
  })
});

// New.ejs route where the the new post form is. 
app.get("/home/new", checkAuthenticated, (req, res) => {
  let post = {
    title: "",
    description: ""
  }
  res.render("new", { post: post });
})

// The Show-Post Route
app.get("/home/showPost/:id",checkAuthenticated, (req, res) => {
  Post.findById(req.params.id, (error, post) => {
    if (error) {
      console.log(error);
      res.send("Ohh No! There Was An Error!")
    } else {
      // console.log(post);
      res.render("showPost", { post: post })
    }
  })
})

// POST To The Bulletin Board on the HomePage 
//The Create
app.post("/home", imageUpload.single('imagePost'), async (req, res) => {
  const date = new Date();
  const currentDate = date.toLocaleDateString();

  try {
    const result = await cloudinary.uploader.upload(req.file.path, { invalidate: true });
    console.log(result);

    let thePost = new Post({
      title: req.body.title,
      description: req.body.description,
      date: currentDate,
      category: req.body.plantCategory,
      imagePost: result.secure_url,
      cloudinary_id: result.public_id
    });

    thePost.save((error, post) => {
      if (error) {
        console.log(error);
        res.render("new", { post: thePost });
      } else {
        //console.log(post);
        res.redirect(`/home/showPost/${post._id}`);
      }

    });


  } catch (err) {
    console.log("Oops something went wrong uploading image: ", err)
  }


}); //Closes route




// Edit Post Route
app.get("/showPost/edit/:id", checkAuthenticated, (req, res) => {
  Post.findById(req.params.id, (error, post) => {
    if (error) {
      console.log(error);
      res.send("Ohh No! There Was An Error!")
    } else {
      res.render("edit", { post: post });
    }
  })
})


// The PUT Route for the Edit Post
app.put("/home/:id", imageUpload.single('imagePost'), async (req, res) => {
  const result = await cloudinary.uploader.upload(req.file.path);
  Post.findByIdAndUpdate({ _id: req.params.id }, {
    title: req.body.title,
    imagePost: result.secure_url,
    cloudinary_id: result.public_id,
    description: req.body.description,
    category: req.body.plantCategory

  }, (error, post) => {
    if (error) {
      console.log(error);
    } else {
      res.redirect(`/home/showPost/${post._id}`)
    }
  })
});

// The Delete Route

app.delete("/showPost/edit/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    // Delete the image from Cloudinary
    await cloudinary.uploader.destroy(post.cloudinary_id);

    // Delete the post from the database
    await post.remove();

    console.log("This post was destroyed: ", post);
    res.redirect('/home');

  } catch (err) {
    console.log("Oops something went wrong deleting post: ", err);
    res.redirect(`/home/showPost/${req.params.id}`);
  }

});



app.listen(port, () => console.log(`App listening on port ${port}`));