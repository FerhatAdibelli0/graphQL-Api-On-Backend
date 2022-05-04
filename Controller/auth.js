const { validationResult } = require("express-validator");
const User = require("../Model/user");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

exports.signup = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Validation error check your inputs");
    error.statusCode = 422;
    error.data = errors.array();
    throw error;
  }
  const email = req.body.email;
  const password = req.body.password;
  const name = req.body.name;

  try {
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = new User({
      email: email,
      password: hashedPassword,
      name: name,
    });
    const result = user.save();
    res.status(201).json({
      message: "User is created",
      userId: result._id,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
      err.message = "Hata burada";
    }
    next(err);
  }
};

exports.login = async (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  let checkedUser;
  const user = await User.findOne({ email: email });
  if (!user) {
    const error = new Error("User is not found");
    error.statusCode = 404;
    throw error;
  }
  checkedUser = user;
  try {
    const isEqual = await bcrypt.compare(password, user.password);

    if (!isEqual) {
      const error = new Error("Wrong password");
      error.statusCode = 401;
      throw error;
    }
    const token = jwt.sign(
      {
        email: checkedUser.email,
        userId: checkedUser._id,
      },
      "somesecretlyjsonwebtoken",
      { expiresIn: "1h" }
    );
    res.status(200).json({ token: token, userId: checkedUser._id.toString() });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.getStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      const error = new Error("User is not found");
      error.statusCode = 404;
      throw error;
    }
    res.status(200).json({ status: user.status, message: "Status retrieved" });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.postStatus = async (req, res, next) => {
  const newStatus = req.body.status;
  try {
    const user = await User.findById(req.userId);
    user.status = newStatus;
    await user.save();

    res.status(200).json({
      message: "Status is changed successfully",
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};
