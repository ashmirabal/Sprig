// Requiring Multer. Multer is a node.js middleware for handling multipart/form-data, which is primarily used for uploading files.
const multer = require('multer');
const path = require('path')

// Multer Config
module.exports = multer({
    storage: multer.diskStorage({}),
    fileFilter:(req, file, callBack) => {
        let ext = path.extname(file.originalname);
        if(ext !== ".jpg" && ext !== ".jpeg" && ext !== ".png" ){
            callBack(new Error("File type is not supported"), false);
            return;
        }
        callBack(null, true);
    },

})