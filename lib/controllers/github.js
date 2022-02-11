const { Router } = require('express');
const jwt = require('jsonwebtoken');
const authenticate = require('../middleware/authenticate');
const GithubUser = require('../models/GithubUser');
const { exchangeCodeForToken, getGithubProfile } = require('../utils/GithubOAuth.js');

const ONE_DAY_IN_MS = 1000 * 60 * 60 * 24;

module.exports = Router()
  .get('/login', async (req, res) => {
    res.redirect(
      `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&redirect_uri=${process.env.GITHUB_REDIRECT_URI}&scope=user`
    );
  })
  .get('/login/callback', async (req, res, next) => {
    try {
      const token = await exchangeCodeForToken(req.query.code);
      const { login, email, avatar_url } = await getGithubProfile(token);

      let user = await GithubUser.findByUsername(login);
      if (!user) {
        user = await GithubUser.insert({ username: login, email, avatar: avatar_url });
      }

      const sessionToken = jwt.sign({ ...user }, process.env.JWT_SECRET, { expiresIn: '24h' });
      res
        .cookie('session', sessionToken, {
          httpOnly: true,
          maxAge: ONE_DAY_IN_MS,
        })
        .redirect('/api/v1/posts');
    } catch (error) {
      next(error);
    }
  })
  .delete('/', authenticate, (req, res) => {
    res
      .clearCookie(process.env.COOKIE_NAME)
      .json({ success: true, message: 'Signed out successfully!' });
  })
  .get('/me', authenticate, (req, res) => {
    res.json(req.user);
  });
