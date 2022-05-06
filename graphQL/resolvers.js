const User = require("../Model/user");
const Post = require("../Model/post");
const bcrypt = require("bcrypt");
const validator = require("validator");
const jwt = require("jsonwebtoken");

module.exports = {
  createUser: async ({ userInput }, req) => {
    const errors = [];
    if (!validator.isEmail(userInput.email)) {
      errors.push({ message: "invalid email adress" });
    }
    if (
      validator.isEmpty(userInput.password) ||
      !validator.isLength(userInput.password, { min: 5 })
    ) {
      errors.push({ message: "invalid password adress" });
    }
    if (errors.length > 0) {
      const err = new Error("Invalid Input !!!!");
      err.data = errors;
      err.statusCode = 422;
      throw err;
    }

    const existingUser = await User.findOne({ email: userInput.email });
    if (existingUser) {
      const error = new Error("User is already existing!");
      throw error;
    }
    const hashedPw = await bcrypt.hash(userInput.password, 12);
    const user = new User({
      email: userInput.email,
      name: userInput.name,
      password: hashedPw,
    });
    const createdUser = await user.save();

    return {
      ...createdUser._doc,
      _id: createdUser._id.toString(),
    };
  },

  createPost: async function ({ postInput }, req) {
    if (!req.isAuth) {
      const error = new Error("Unauthenticated");
      error.statusCode = 403;
      throw error;
    }
    const errors = [];
    if (
      !validator.isLength(postInput.title, { min: 5 }) ||
      validator.isEmpty(postInput.title)
    ) {
      errors.push({ message: "invalid name" });
    }
    if (
      !validator.isLength(postInput.content, { min: 5 }) ||
      validator.isEmpty(postInput.content)
    ) {
      errors.push({ message: "invalid content" });
    }

    if (errors.length > 0) {
      const err = new Error("Invalid Input !!!!");
      err.data = errors;
      err.statusCode = 422;
      throw err;
    }

    try {
      const user = await User.findById(req.userId);
      if (!user) {
        const error = new Error("Invalid User");
        error.statusCode = 401;
        throw error;
      }
      const post = new Post({
        title: postInput.title,
        content: postInput.content,
        imageUrl: postInput.imageUrl,
        creator: user,
      });
      const createdPost = await post.save();
      user.posts.push(createdPost);
      await user.save();
      return {
        ...createdPost._doc,
        _id: createdPost._id.toString(),
        createdAt: createdPost.createdAt.toISOString(),
        updatedAt: createdPost.updatedAt.toISOString(),
      };
    } catch (err) {
      err.statusCode = 500;
      err.message = "Error about creating post";
      return next(err);
    }
  },

  login: async function ({ email, password }) {
    const user = await User.findOne({ email: email });
    if (!user) {
      const error = new Error("User not found!");
      error.statusCode = 401;
      throw error;
    }
    const isEqual = await bcrypt.compare(password, user.password);
    if (!isEqual) {
      const error = new Error("Password is not correct!");
      error.statusCode = 401;
      throw error;
    }
    const token = jwt.sign(
      {
        email: user.email,
        userId: user._id.toString(),
      },
      "supersecretsecret",
      { expiresIn: "1h" }
    );

    return {
      token: token,
      userId: user._id.toString(),
    };
  },
};

// For Getting Data

//   ferhat() {
//     return {
//       text: "Ferhat is best software engineer",
//       number: 4452639,
//     };
//   },
