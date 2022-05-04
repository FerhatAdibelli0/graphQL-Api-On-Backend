const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const feedRoute = require("./Routes/feed");
const authRoute = require("./Routes/auth");
const path = require("path");
const multer = require("multer");
const { v4: uuid } = require("uuid");

const MONGO_URI =
  "mongodb+srv://maxpayne35:qGBr7naSXYmEYnw@cluster0.sp51h.mongodb.net/messages?retryWrites=true&w=majority";

// const cors = require("cors");

const app = express();

app.use(bodyParser.json());

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images");
  },
  filename: (req, file, cb) => {
    cb(null, uuid() + "-" + file.originalname);
  },
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg" ||
    file.mimetype === "image/png"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

//STATİC FİLE
app.use("/images", express.static(path.join(__dirname, "images")));

//File Parsing
app.use(
  multer({ storage: fileStorage, fileFilter: fileFilter }).single("image")
);

// app.use(cors());  //Using Cors Library
// Another way to solve Cors
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,DELETE,PUT,PATCH");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  next();
});

app.use("/feed", feedRoute);
app.use("/auth", authRoute);

// ERROR HANDLING
app.use((error, req, res, next) => {
  const status = error.statusCode || 500;
  const message = error.message;
  const data = error.data;
  res.status(status).json({ message: message, data: data });
});

mongoose
  .connect(MONGO_URI)
  .then((result) => {
    const server = app.listen(8000);
    const io = require("./socket").init(server);
    io.on("connection", (socket) => {
      console.log("Client connected");
    });
  })
  .catch((err) => console.log(err));
