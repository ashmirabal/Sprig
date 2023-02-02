const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

//So you don't have to add .ejs to the routes
app.set("view engine", "ejs");

// app.use(express.static(__dirname + '/public'));

// The Logger
const logger = require('morgan');
// Tell the app to use the logger
app.use(logger('dev'));

app.get('/', (req,res) =>{
  res.send('Root route is working')
})

app.listen(port, () => console.log(`App listening on port ${port}`));