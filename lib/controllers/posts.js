const { Router } = require('express');
const authenticate = require('../middleware/authenticate.js');
const Post = require('../models/Post.js');

module.exports = Router()
  .get('/', authenticate, async (req, res) => {
    const posts = await Post.getAll();
    res.json(posts);
  })
  .post('/', authenticate, async (req, res) => {
    const { text } = req.body;
    const userId = req.user.id;
    const post = await Post.insert({ userId, text });
    res.json(post);
  });
