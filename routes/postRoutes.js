const express = require("express");
const Post = require("../models/Post"); // <-- Add this line
const {
  getPostForm,
  createPost,
  getPosts,
  getPostById,
  getEditPostForm,
  updatePost,
  deletePost,
} = require("../controllers/postControllers");
const upload = require("../config/multer");
const { ensureAuthenticated } = require("../middlewares/auth");

const postRoutes = express.Router();

// Temporary GET for convenience
postRoutes.get("/update-comments", async (req, res) => {
  try {
    await Post.updateMany(
      {},
      { $set: { "comments.$[elem].content": "" } },
      { arrayFilters: [{ "elem.content": { $exists: false } }] }
    );
    res.status(200).send("Comments updated successfully");
  } catch (err) {
    res.status(500).send("Error updating comments");
  }
});

//get post form
postRoutes.get("/add", getPostForm);
//post logic
postRoutes.post(
  "/add",
  ensureAuthenticated,
  upload.array("images", 5),
  createPost
);

//get all posts
postRoutes.get("/", getPosts);

//get post by id
postRoutes.get("/:id", async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id).populate("comments.author");
    if (!post)
      return res.status(404).render("error", { message: "Post not found" });
    res.render("postDetails", { post, user: req.user });
  } catch (err) {
    next(err);
  }
});
postRoutes.get("/:id/edit", getEditPostForm);
postRoutes.put(
  "/:id",
  ensureAuthenticated,
  upload.array("images", 5),
  updatePost
);
//delete post
postRoutes.delete("/:id", ensureAuthenticated, deletePost);

// Add comment route
postRoutes.post(
  "/:id/comments",
  ensureAuthenticated,
  async (req, res, next) => {
    if (!req.body.content || !req.body.content.trim()) {
      return res
        .status(400)
        .render("error", { message: "Comment content is required." });
    }
    const comment = {
      content: req.body.content,
      author: req.user._id,
    };
    try {
      const post = await Post.findById(req.params.id);
      if (!post)
        return res.status(404).render("error", { message: "Post not found" });

      post.comments.push(comment);
      await post.save();

      res.redirect(`/posts/${req.params.id}`);
    } catch (err) {
      next(err);
    }
  }
);

module.exports = postRoutes;
