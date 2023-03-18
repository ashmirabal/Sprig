require('dotenv').config();
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;


//Requiring post.js in the models folder
const Post = require("./models/Post");
//require userSchema model
const User = require('./models/UserModel');
//require Commment DB model
const Comment = require("./models/Comment")


//Requiring Method-Override so I can Update and Delete where I'm not suppose to.
const methodOverride = require("method-override")
//packages required for authentication (logging in/logging out)
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
// const UserModel = require('./models/UserModel');
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

//function/middleware checks to see if a user is 
//logged in and redirects to home page if so
checkLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) { 
      return res.redirect("/home")
    }
  next()
}
//function/middleware for protected routes,
// will not let user to protected routes if user is not logged in
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
app.get('/landingPage', checkLoggedIn, (req, res) => {
  res.render("landingPage", { error: ""})
});

// Sign Up Route
app.get('/signup', (req, res) => {
  res.render("signup")
});

// Error route for easy testing, but not needed
// app.get('/error', checkLoggin, (req, res) => {
//   res.render("error")
// });

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
  let user = new User({
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
      res.render("error.ejs", { error: "Account creation was not successful. You may not be meeting the requirements or that username may already be taken."})
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
      //using the sort() and reverse() method to 
      //display posts by descending order
      //otherwise posts automatically sort by ascending order
      posts.sort().reverse()
      // console.log(posts)
      res.render("home", { posts: posts })
    }
  })  
  // Needed to tie a user and be able to drill down into the username.
  .populate('postedBy')
    
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
  // Needed to tie a user and be able to drill down into the username.
  .populate('postedBy')
  //needed to tie comment to post
  .populate('comments')
})

// POST To The Bulletin Board on the HomePage 
//The Create
app.post("/home", checkAuthenticated, imageUpload.single('imagePost'), async (req, res) => {
  //We bring in our muler middleware function to handle the image coming in from the post
  const date = new Date();
  const currentDate = date.toLocaleDateString();
  //if there is an image
  // optional chaining will allow the function to move to the else block
  // if the path does not exist. it short circuits to undefined = falsy value
  if(req.file?.path){
    //Checks to see if an image is there to upload
    try {
      const result = await cloudinary.uploader.upload(req.file.path, { invalidate: true });
      //console.log(result);
      let thePost = new Post({
        postedBy: req.user,
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
          res.redirect(`/home/showPost/${post._id}`);
        }
      });
    } catch (err) {
      console.log("Oops something went wrong uploading image: ", err)
    }
  
    //There is not an image - we need to just make a normal post
  } else {
    let thePost = new Post({
      postedBy: req.user,
      title: req.body.title,
      description: req.body.description,
      date: currentDate,
      category: req.body.plantCategory,
      imagePost: "",
      cloudinary_id: ""
    });
    thePost.save((error, post) => {
      if (error) {
        console.log(error);
        res.render("new", { post: thePost });
      } else {
        res.redirect(`/home/showPost/${post._id}`);
      }
    });
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
  // Needed to tie a user and be able to drill down into the username.
  .populate('postedBy')
})


// The PUT Route for the Edit Post
app.put("/home/:id", imageUpload.single('imagePost'), async (req, res) => {


  // const result = await cloudinary.uploader.upload(req.file.path);
  // Post.findByIdAndUpdate({ _id: req.params.id }, {
  //   title: req.body.title,
  //   imagePost: result.secure_url,
  //   cloudinary_id: result.public_id,
  //   description: req.body.description,
  //   category: req.body.plantCategory

  // }, (error, post) => {
  //   if (error) {
  //     console.log(error);
  //   } else {
  //     res.redirect(`/home/showPost/${post._id}`)
  //   }
  // })

  //using optional chaining so that if there is an image,
  //we will update all data including image data
  if(req.file?.path){
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
  //if not, we will short circuit and update data and leave image data fields empty.
} else {
  Post.findByIdAndUpdate({ _id: req.params.id }, {
    title: req.body.title,
    imagePost:"",
    cloudinary_id: "",
    description: req.body.description,
    category: req.body.plantCategory

  }, (error, post) => {
    if (error) {
      console.log(error);
    } else {
      res.redirect(`/home/showPost/${post._id}`)
    }
  })
}

});

// The Delete Route

app.delete("/showPost/edit/:id", async (req, res) => {
  // try {
  //   const post = await Post.findById(req.params.id);

  //   // Delete the image from Cloudinary
  //   await cloudinary.uploader.destroy(post.cloudinary_id);

  //   // Delete the post from the database
  //   await post.remove();

  //   console.log("This post was destroyed: ", post);
  //   res.redirect('/home');

  // } catch (err) {
  //   console.log("Oops something went wrong deleting post: ", err);
  //   res.redirect(`/home/showPost/${req.params.id}`);
  // }

  try {
    const post = await Post.findById(req.params.id);
    //If there is not cloudinary_id (image id) then delete normally
    if(!post.cloudinary_id){
      await post.remove();

      console.log("This post was destroyed: ", post);
      res.redirect('/home');
    } else {

      // Delete the image from Cloudinary
      await cloudinary.uploader.destroy(post.cloudinary_id);
      
      // Delete the post from the database
      await post.remove();
      
      console.log("This post was destroyed: ", post);
      res.redirect('/home');
    }
      
    } catch (err) {
      console.log("Oops something went wrong deleting post: ", err);
      res.redirect(`/home/showPost/${req.params.id}`);
    }
    

});


//Comment route
app.post("/showPost/comment/:id",checkAuthenticated, (req,res) => {

  // console.log(req.params.id);
  // console.log(req.body.comment);
  // console.log(req.user.username);

  //creating variable for new comment object with author and comment information
  const comment = new Comment({
    author: req.user.username,
    comment: req.body.comment
  });
  //using save method to save comment object to database
  comment.save((err, result) => {
    if(err){
      console.log(err)
    } else {
      //using findById function to target specific post
      //then we will push comment to data array and save it
      Post.findById(req.params.id, (err, post) => {
        if(err){
          console.log(err)
        } else {
          post.comments.push(result);
          post.save()

          // console.log("====comments===")
          // console.log(post.comments)
          //redirecting to showPost route for specified post to display newly added comment
          res.redirect(`/home/showPost/${req.params.id}`)
        }
      })
    }
  })
});

//Delete comment route
// need to know both the postId and the commentId to be able to delete the comment from posts collection
// You can delete a comment from posts using the findByIdAndUpdate method and $pull operator.
// also need to delete comment from comment collection
app.delete("/showPost/comment/:postId/:commentId", async function (req, res) {
  try {
    //update the post we are deleting comment from by using req.param values
    const post = await Post.findByIdAndUpdate(
      req.params.postId,
      {
        // The $pull operator removes from an existing array 
        //all instances of a value or values that match a specified condition.
        //pulling comment id using req.params
        $pull: { comments: req.params.commentId },
      },
      // this will return the object after delete update is applied and not as it was before (default behavior)
      { new: true }
    );
      //if post does not exist
    if (!post) {
      return res.status(400).send("Post not found");
    }
    //using findByIdAndDelete method to remove comment from post database
    //targeting comment with value from req.params
    await Comment.findByIdAndDelete(req.params.commentId);

    //will redirect to same page but with updated comments
    res.redirect(`/home/showPost/${req.params.postId}`);
  } catch (err) {
    console.log(err);
    res.status(500).send("Something went wrong");
  }
});

//View Profile Route
app.get('/viewProfile', checkAuthenticated, (req, res)=>{
  //find the currently logged in user
  User.findById(req.user, (error, user)=>{
    if(error){
      // console.log(error);
      res.render("error.ejs", {error: "unable to view profile"})
    } else {
      console.log(user)
      // populate user info to viewProfile page
      res.render("viewProfile.ejs", { user: user })
    }
  })
})

//Edit Profile Route
app.get('/editProfile', checkAuthenticated, (req, res)=>{
  //find the currently logged in user
  User.findById(req.user, (error, user)=>{
    if(error){
      // console.log(error);
      res.render("error.ejs", {error: "unable to edit profile"})
    } else {
      console.log(user)
      // populate user info to viewProfile page
      res.render("editProfile.ejs", { user: user })
    }
  })
})

// Edit user profile user in db
app.post('/editProfile', checkAuthenticated, (req, res) => {
  let { fname, lname, username, email, age, city, state} = req.body
  // update user object
  User.findByIdAndUpdate(req.user.id, {
    fname, 
    lname,
    username,
    email,
    age,
    city, 
    state,
  }, (error) => {
    if(error){
      console.log("Error updating profile", error)
    } else {
      res.redirect("/home")
    }
  })
})


app.listen(port, () => console.log(`App listening on port ${port}`));