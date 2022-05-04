const express = require("express");
const route = express.Router();
const { body } = require("express-validator");
const authController = require("../Controller/auth");
const User = require("../Model/user");
const isAuth = require("../middleware/is-auth");


route.put(
  "/signup",
  [
    body("email")
      .isEmail()
      .withMessage("Invalid email")
      .custom((value, { req }) => {
        return User.findOne({ email: value }).then((userDoc) => {
          if (userDoc) {
            return Promise.reject("Email adress already exist"); // or throw new Error("") both re caught by errorHandler
          }
        });
      })
      .normalizeEmail(),
    body("password", "Invalid Password Input").trim().isLength({ min: 5 }),
    body("name", "Invalid Name Input").trim().not().isEmpty(),
  ],
  authController.signup
);

route.post("/login", authController.login);


route.get("/status", isAuth, authController.getStatus);

route.patch("/status", isAuth, authController.postStatus);

module.exports = route;
