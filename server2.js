const express = require("express");
const multer = require("multer");
const app = express();

const fileStorageEngine = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./images2");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "--" + file.originalname);
  },
});
const upload = multer({ storage: fileStorageEngine });
app.post("/single", upload.single("image"), (req, res) => {
  console.log(req.file);
  res.send("single file uploaded successfully");
});

app.post("/multile", upload.array("images", 3), (req, res) => {
  console.log(req.file);
  res.send("single file uploaded successfully");
});

app.listen(5001, () => {
  console.log("connected to 5001");
});
