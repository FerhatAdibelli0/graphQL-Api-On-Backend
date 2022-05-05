const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const path = require("path");
const multer = require("multer");
const { v4: uuid } = require("uuid");
const { graphqlHTTP } = require("express-graphql");
const graphqlSchema = require("./graphQL/schema");
const graphqlResolver = require("./graphQL/resolvers");

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
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,POST,DELETE,PUT,PATCH,OPTIONS"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  // Giving 405 not found method error
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

app.use(
  "/graphql",
  graphqlHTTP({
    schema: graphqlSchema,
    rootValue: graphqlResolver,
    graphiql: true,
    customFormatErrorFn: (err) => {
      if (!err.originalError) {
        return err;
      }
      const data = err.originalError.data;
      const message = err.originalError.message || "Some error occured!";
      const statusCode = err.originalError.statusCode;

      return {
        data,
        message,
        statusCode,
      };
    },
  })
);

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
    app.listen(8000);
  })
  .catch((err) => console.log(err));
