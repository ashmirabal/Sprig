// Requiring Multer. Multer is a node.js middleware for handling multipart/form-data, which is primarily used for uploading files.
//  path is built in  node.js
const multer = require('multer');
const path = require('path')

// Multer Config
module.exports = multer({
    //takes a config object that specifies the disk storage where the uploaded files will be stored
    storage: multer.diskStorage({}),
    //filter takes 3 objects, the req, file obj, and callback returns error or true if the file is valid
    fileFilter:(req, file, callBack) => {
        //checks the ext up uploade files to ensure only the following formats
        let ext = path.extname(file.originalname);
        if(ext !== ".jpg" && ext !== ".jpeg" && ext !== ".png" ){
            callBack(new Error("File type is not supported"), false);
            return;
        }
        callBack(null, true);
    },

})