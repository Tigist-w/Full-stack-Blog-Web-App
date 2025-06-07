const express = require("express");
const Comment = require("../models/Comment");
const Post = require("../models/Post");
const { ensureAuthenticated } = require("../middlewares/auth");

const router = express.Router();

router.post('/posts/:id/comments', ensureAuthenticated, async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).send('Post not found');

    const comment = {
      content: req.body.content,
      author: req.user._id // ✅ Correct
    };

    post.comments.push(comment);
    await post.save();

    res.redirect(`/posts/${post._id}`);
  } catch (err) {
    next(err);
  }
});

router.get('/comments/:id/edit', ensureAuthenticated, async (req, res, next) => {
  try {
    const post = await Post.findOne({ "comments._id": req.params.id });
    if (!post) return res.status(404).render("error", { message: "Comment not found" });

    const comment = post.comments.id(req.params.id);
    if (!comment) return res.status(404).render("error", { message: "Comment not found" });

    // Optional: check if the user is the comment author
    if (!comment.author.equals(req.user._id)) {
      return res.status(403).render("error", { message: "Unauthorized" });
    }

    res.render("editComment", { post, comment, user: req.user });
  } catch (err) {
    next(err);
  }
});

router.put('/comments/:id', ensureAuthenticated, async (req, res, next) => {
  try {
    const post = await Post.findOne({ "comments._id": req.params.id });
    if (!post) return res.status(404).render("error", { message: "Comment not found" });

    const comment = post.comments.id(req.params.id);
    if (!comment) return res.status(404).render("error", { message: "Comment not found" });

    // Optional: check if the user is the comment author
    if (!comment.author.equals(req.user._id)) {
      return res.status(403).render("error", { message: "Unauthorized" });
    }

    comment.content = req.body.content;
    await post.save();

    res.redirect(`/posts/${post._id}`);
  } catch (err) {
    next(err);
  }
});

router.delete('/comments/:id', ensureAuthenticated, async (req, res, next) => {
  try {
    const post = await Post.findOne({ "comments._id": req.params.id });
    if (!post) return res.status(404).render("error", { message: "Comment not found" });

    const comment = post.comments.id(req.params.id);
    if (!comment) return res.status(404).render("error", { message: "Comment not found" });

    // Optional: check if the user is the comment author
    if (!comment.author.equals(req.user._id)) {
      return res.status(403).render("error", { message: "Unauthorized" });
    }

    comment.deleteOne(); // <-- This is the correct way for subdocs

    await post.save();

    res.redirect(`/posts/${post._id}`);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
