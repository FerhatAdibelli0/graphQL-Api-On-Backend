const { validationResult } = require("express-validator");
const Post = require("../Model/post");
const fs = require("fs");
const path = require("path");
const User = require("../Model/user");
const io = require("../socket");

exports.getFeed = async (req, res, next) => {
  const currentPage = req.query.page || 1;
  const perPage = 2;

  try {
    const amount = await Post.countDocuments();
    const posts = await Post.find()
      .populate("creator")
      .sort({createdAt:-1})
      .skip((currentPage - 1) * perPage)
      .limit(perPage);

    res.status(200).json({
      message: "Successfully fetched",
      posts: posts,
      totalItems: amount,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.createPost = async (req, res, next) => {
  const title = req.body.title;
  const content = req.body.content;
  const imageUrl = req.file.path.replace("\\", "/");

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const err = new Error("Validation failed check your inputs");
    err.statusCode = 422;
    throw err;
  }
  if (!req.file) {
    const error = new Error("No found image");
    error.statusCode = 422;
    throw error;
  }

  const post = new Post({
    title: title,
    content: content,
    imageUrl: imageUrl,
    creator: req.userId,
  });

  try {
    await post.save();
    const user = await User.findById(req.userId);
    user.posts.push(post);
    const newUser = await user.save();
    io.getIO().emit("postsChannel", {
      action: "posting",
      post: { ...post._doc, creator: { _id: req.userId, name: user.name } },
    });
    res.status(201).json({
      message: "Post is successfully",
      post: post,
      creator: { _id: newUser._id, name: newUser.name },
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.getPost = async (req, res, next) => {
  const postId = req.params.postId;
  try {
    const post = await Post.findById(postId);
    if (!post) {
      const error = new Error("Post is not found");
      error.statusCode = 404;
      throw error;
    }
    res.status(200).json({
      message: "Post is fecthed successfully",
      post: post,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.updatePost = async (req, res, next) => {
  const postId = req.params.postId;
  const title = req.body.title;
  const content = req.body.content;
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const err = new Error("Validation failed check your inputs");
    err.statusCode = 422;
    throw err;
  }
  let imageUrl = req.body.image;
  if (req.file) {
    imageUrl = req.file.path.replace("\\", "/");
  }
  if (!imageUrl) {
    const error = new Error("imageUrl is not found");
    error.statusCode = 404;
    throw error;
  }

  try {
    const post = await Post.findById(postId).populate("creator");
    if (!post) {
      const error = new Error("Post is not found");
      error.statusCode = 404;
      throw error;
    }
    if (post.creator._id.toString() !== req.userId) {
      const error = new Error("Unauthorized for editing");
      error.statusCode = 403;
      throw error;
    }
    if (imageUrl !== post.imageUrl) {
      clearImage(post.imageUrl);
    }
    post.title = title;
    post.content = content;
    post.imageUrl = imageUrl;
    const result = await post.save();
    io.getIO().emit("postsChannel", {
      action: "updating",
      post: result,
    });
    res.status(200).json({ message: "Successfully updated", post: result });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.deletePost = async (req, res, next) => {
  const postId = req.params.postId;
  try {
    const post = await Post.findById(postId);
    if (!post) {
      const error = new Error("Post is not found");
      error.statusCode = 404;
      throw error;
    }
    if (post.creator.toString() !== req.userId) {
      const error = new Error("Unauthorized for deleting");
      error.statusCode = 403;
      throw error;
    }
    clearImage(post.imageUrl);
    const postUser = await Post.findByIdAndRemove(postId);
    const user = await User.findById(postUser.creator);
    user.posts.pull(postId); // deleting post via pull
    await user.save();
    io.getIO().emit("postsChannel", {
      action: "deleting",
      post: { _id: postId },
    });
    res.status(200).json({ message: "Successfully deleted" });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

const clearImage = (filePath) => {
  const fileDir = path.join(__dirname, "..", filePath);
  fs.unlink(fileDir, (err) => console.log(err));
};
