const cloudinaryModule = require("cloudinary")
const cloudinary = cloudinaryModule.v2;
cloudinary.config({
  //   cloud_name: process.env.CLOUDINARY_NAME,
  cloud_name: "dulie38kj",
  // api_key: process.env.CLOUDINARY_API_KEY,
  api_key: 679587564331772,
  //   api_secret: process.env.CLOUDINARY_API_SECRET,
  api_secret: "5m1DCkXO4mFrnvHrh2r-gM3ZIYI",
});
module.exports = cloudinary