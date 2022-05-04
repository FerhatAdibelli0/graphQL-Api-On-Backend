const express = require("express");
const route = express.Router();
const feedController = require("../Controller/feed");
const { body } = require("express-validator");
const isAuth = require("../middleware/is-auth");

// GET /admin/post
route.get("/posts", isAuth, feedController.getFeed);


// POST /admin/posts
route.post(
  "/post",
  isAuth,
  [
    body("title").trim().isLength({ min: 5 }),
    body("content").trim().isLength({ min: 5 }),
  ],
  feedController.createPost
);

route.get("/post/:postId", isAuth, feedController.getPost);

route.put(
  "/post/:postId",
  isAuth,
  [
    body("title").trim().isLength({ min: 5 }),
    body("content").trim().isLength({ min: 5 }),
  ],
  feedController.updatePost
);

route.delete("/post/:postId", isAuth, feedController.deletePost);

module.exports = route;
