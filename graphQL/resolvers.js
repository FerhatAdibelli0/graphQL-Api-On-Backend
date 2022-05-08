const User = require("../Model/user");
const Post = require("../Model/post");
const bcrypt = require("bcrypt");
const validator = require("validator");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");
const res = require("express/lib/response");

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
      throw err;
      // check this handler
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

  post: async function ({ postId }, req) {
    if (!req.isAuth) {
      const error = new Error("Unauthenticated");
      error.statusCode = 403;
      throw error;
    }
    const post = await Post.findById(postId).populate("creator", "name");
    if (!post) {
      const error = new Error("Post is not found");
      error.statusCode = 404;
      throw error;
    }
    return {
      ...post._doc,
      _id: post._id.toString(),
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
    };
  },

  posts: async function ({ page }, req) {
    if (!req.isAuth) {
      const error = new Error("Unauthenticated");
      error.statusCode = 403;
      throw error;
    }
    if (!page) {
      page = 1;
    }
    const per_page = 2;
    const totalItems = await Post.find().countDocuments();
    const posts = await Post.find()
      .skip((page - 1) * per_page)
      .limit(per_page)
      .sort({ createdAt: -1 })
      .populate("creator");

    return {
      posts: posts.map((post) => {
        return {
          ...post._doc,
          _id: post._id.toString(),
          createdAt: post.createdAt.toISOString(),
          updatedAt: post.updatedAt.toISOString(),
        };
      }),
      totalItems: totalItems,
    };
  },

  updatePost: async function ({ id, postInput }, req) {
    if (!req.isAuth) {
      const error = new Error("Unauthenticated");
      error.statusCode = 403;
      throw error;
    }
    const post = await Post.findById(id).populate("creator");
    if (!post) {
      const error = new Error("Post is not found");
      error.statusCode = 404;
      throw error;
    }
    if (post.creator._id.toString() !== req.userId.toString()) {
      const error = new Error("Unauthorized");
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
    post.title = postInput.title;
    post.content = postInput.content;
    if (postInput.imageUrl !== "undefined") {
      post.imageUrl = postInput.imageUrl;
    }
    const updatedPost = await post.save();
    return {
      ...updatedPost._doc,
      _id: updatedPost._id.toString(),
      createdAt: updatedPost.createdAt.toISOString(),
      updatedAt: updatedPost.updatedAt.toISOString(),
    };
  },

  deletePost: async function ({ id }, req) {
    if (!req.isAuth) {
      const error = new Error("Unauthenticated");
      error.statusCode = 403;
      throw error;
    }
    const deletedPost = await Post.findById(id).populate("creator");
    if (deletedPost.creator._id.toString() !== req.userId.toString()) {
      const error = new Error("Unauthorized");
      error.statusCode = 403;
      throw error;
    }
    clearImage(deletedPost.imageUrl);
    await Post.findByIdAndRemove(id);
    const user = await User.findById(deletedPost.creator._id).populate("posts");
    user.posts.pull(id);
    const updatedUser = await user.save();
    return {
      ...updatedUser._doc,
      _id: updatedUser._id.toString(),
    };
  },
};

const clearImage = (pathName) => {
  const fileDir = path.join(__dirname, "..", pathName);
  fs.unlink(fileDir, (err) => console.log(err));
};

// For Getting Data

//   ferhat() {
//     return {
//       text: "Ferhat is best software engineer",
//       number: 4452639,
//     };
//   },
