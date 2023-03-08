require('dotenv').config();
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
//Requiring post.js in the models folder
const Post = require("./models/Post");
//Requiring Method-Override so I can Update and Delete where I'm not suppose to.
const methodOverride = require("method-override");

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
// Tell the app to use the logger
app.use(logger('dev'));


//user Schema
const { UserModel } = require('./models/UserModel')




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
  res.render("landingPage")
});

// Sign Up Route
app.get('/signup', (req, res) => {
  res.render("signup")
});

app.get('/about', (req, res) => {
  res.render("about")
})

//create new user in db
app.post('/signup', (req, res) => {
  let { fname, lname, username, email, age, city, state, password } = req.body
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
  UserModel.create(user, (err, result) => {
    if (err) res.redirect("/")
    else res.redirect('/home')
  }
  )
})

// Home Route
app.get('/home', (req, res) => {
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
app.get("/home/new", (req, res) => {
  let post = {
    title: "",
    description: ""
  }
  res.render("new", { post: post });
})

// The Show-Post Route
app.get("/home/showPost/:id", (req, res) => {
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
app.get("/showPost/edit/:id", (req, res) => {
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